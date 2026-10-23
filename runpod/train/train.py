"""Fine-tune a multilingual text classifier that maps a worker's interview answer to BijakMatch task cards.

Run on a RunPod GPU Pod (see README, "Train on RunPod"):
    python runpod/train/train.py --out /workspace/models/taskcards

Data comes from runpod/train/out/ (make it with `node runpod/train/export_dataset.mjs`).
The model is multi-label: one answer can show several task cards, or none.

It is compared with the keyword matcher the app already uses (the `kw` lists in app-data.js), on the
same validation lines, so the result says whether training beats what is already there.
With a few dozen examples the validation score is a smoke test, not evidence of real accuracy.
"""

import argparse
import json
from pathlib import Path

import numpy as np
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer, Trainer, TrainingArguments, set_seed

HERE = Path(__file__).resolve().parent


def read_jsonl(path):
    return [json.loads(line) for line in Path(path).read_text(encoding="utf-8").splitlines() if line.strip()]


def to_matrix(rows, names):
    y = np.zeros((len(rows), len(names)), dtype=np.float32)
    for i, r in enumerate(rows):
        for label in r["labels"]:
            y[i, names.index(label)] = 1.0
    return y


def f1_scores(y_true, y_pred):
    """Micro F1 over every (answer, card) decision, and macro F1 over cards that appear in the truth."""
    tp = (y_true * y_pred).sum(0)
    fp = ((1 - y_true) * y_pred).sum(0)
    fn = (y_true * (1 - y_pred)).sum(0)
    micro = 2 * tp.sum() / max(1.0, 2 * tp.sum() + fp.sum() + fn.sum())
    present = y_true.sum(0) > 0
    per_card = 2 * tp / np.maximum(1.0, 2 * tp + fp + fn)
    macro = float(per_card[present].mean()) if present.any() else 0.0
    return {"micro_f1": round(float(micro), 3), "macro_f1": round(macro, 3)}


def keyword_baseline(rows, cards):
    pred = np.zeros((len(rows), len(cards)), dtype=np.float32)
    for i, r in enumerate(rows):
        text = r["text"].lower()
        for j, card in enumerate(cards):
            if any(k in text for k in card["keywords"]):
                pred[i, j] = 1.0
    return pred


class Data(torch.utils.data.Dataset):
    def __init__(self, rows, names, tok):
        self.enc = tok([r["text"] for r in rows], truncation=True, max_length=128, padding=True)
        self.y = to_matrix(rows, names)

    def __len__(self):
        return len(self.y)

    def __getitem__(self, i):
        item = {k: torch.tensor(v[i]) for k, v in self.enc.items()}
        item["labels"] = torch.tensor(self.y[i])
        return item


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default=str(HERE / "out"))
    ap.add_argument("--out", default="model_out")
    ap.add_argument("--model", default="xlm-roberta-base")  # handles English and Bahasa Malaysia
    ap.add_argument("--epochs", type=int, default=20)
    ap.add_argument("--lr", type=float, default=3e-5)
    ap.add_argument("--batch", type=int, default=8)
    ap.add_argument("--threshold", type=float, default=0.5)
    ap.add_argument("--seed", type=int, default=42)
    args = ap.parse_args()
    set_seed(args.seed)

    cards = json.loads((Path(args.data) / "labels.json").read_text(encoding="utf-8"))
    names = [c["name"] for c in cards]
    train_rows = read_jsonl(Path(args.data) / "train.jsonl")
    val_rows = read_jsonl(Path(args.data) / "val.jsonl")
    print(f"{len(train_rows)} train / {len(val_rows)} validation answers, {len(names)} task cards, device={'cuda' if torch.cuda.is_available() else 'cpu'}")

    tok = AutoTokenizer.from_pretrained(args.model)
    model = AutoModelForSequenceClassification.from_pretrained(
        args.model, num_labels=len(names), problem_type="multi_label_classification",
        id2label=dict(enumerate(names)), label2id={n: i for i, n in enumerate(names)},
    )
    train_ds, val_ds = Data(train_rows, names, tok), Data(val_rows, names, tok)

    def compute_metrics(p):
        probs = 1 / (1 + np.exp(-p.predictions))
        return f1_scores(p.label_ids, (probs >= args.threshold).astype(np.float32))

    trainer = Trainer(
        model=model,
        args=TrainingArguments(
            output_dir=str(Path(args.out) / "checkpoints"), num_train_epochs=args.epochs, learning_rate=args.lr,
            per_device_train_batch_size=args.batch, per_device_eval_batch_size=32, eval_strategy="epoch",
            save_strategy="no", logging_steps=10, fp16=torch.cuda.is_available(), report_to="none", seed=args.seed,
        ),
        train_dataset=train_ds, eval_dataset=val_ds, compute_metrics=compute_metrics,
    )
    trainer.train()

    probs = 1 / (1 + np.exp(-trainer.predict(val_ds).predictions))
    y_val = to_matrix(val_rows, names)
    result = {
        "base_model": args.model,
        "train_answers": len(train_rows),
        "validation_answers": len(val_rows),
        "threshold": args.threshold,
        "trained_model": f1_scores(y_val, (probs >= args.threshold).astype(np.float32)),
        "keyword_baseline": f1_scores(y_val, keyword_baseline(val_rows, cards)),
        "note": "Validation set is tiny; treat as a smoke test until real consented answers are added.",
    }
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(out)
    tok.save_pretrained(out)
    (out / "task_cards.json").write_text(json.dumps({"names": names, "threshold": args.threshold}, indent=2), encoding="utf-8")
    (out / "metrics.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))
    print(f"Saved to {out}")


if __name__ == "__main__":
    main()
