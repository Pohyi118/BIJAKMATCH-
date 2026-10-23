"""RunPod serverless handler: GPU speech-to-text for BijakMatch.

Workers often answer the shift interview by voice, in English, Bahasa Malaysia or a mix.
This endpoint transcribes an uploaded audio clip with Whisper on a RunPod GPU. The Node
server (src/server/runpod.mjs) calls it; the browser never sees the RunPod key.

Request:  {"input": {"audio_base64": "...", "format": "webm", "language": "ms" | "en" | null}}
          {"input": {"classify": ["answer text", ...]}} maps answers to task cards with the model
          trained by runpod/train/train.py (needs the saved model in TASKCARD_MODEL_DIR).
          {"input": {"ping": true}} answers without loading a model (for health checks).
Response: {"text", "language", "duration", "segments": [{"start", "end", "text"}]}
          or {"cards": [[{"card", "score"}, ...], ...]}
          or {"error": "..."}
"""

import base64
import binascii
import os
import re
import tempfile

import runpod

MODEL_NAME = os.getenv("WHISPER_MODEL", "large-v3")
MAX_BYTES = 12 * 1024 * 1024
TASKCARD_DIR = os.getenv("TASKCARD_MODEL_DIR", "/runpod-volume/models/taskcards")
_model = None
_classifier = None


def get_model():
    """Load Whisper once per worker, so only the first request after a cold start is slow."""
    global _model
    if _model is None:
        from faster_whisper import WhisperModel

        _model = WhisperModel(MODEL_NAME, device="cuda", compute_type="float16")
    return _model


def get_classifier():
    """Load the task-card classifier saved by train.py, or None if it has not been trained yet."""
    global _classifier
    if _classifier is None:
        import json
        from pathlib import Path

        import torch
        from transformers import AutoModelForSequenceClassification, AutoTokenizer

        folder = Path(TASKCARD_DIR)
        if not (folder / "task_cards.json").exists():
            return None
        meta = json.loads((folder / "task_cards.json").read_text(encoding="utf-8"))
        tok = AutoTokenizer.from_pretrained(folder)
        net = AutoModelForSequenceClassification.from_pretrained(folder).eval().to("cuda" if torch.cuda.is_available() else "cpu")
        _classifier = (tok, net, meta)
    return _classifier


def classify(texts) -> dict:
    import torch

    loaded = get_classifier()
    if loaded is None:
        return {"error": f"no trained task-card model found in {TASKCARD_DIR}; run runpod/train/train.py first"}
    tok, net, meta = loaded
    texts = [str(t)[:1000] for t in texts[:32]]
    enc = tok(texts, truncation=True, max_length=128, padding=True, return_tensors="pt").to(net.device)
    with torch.no_grad():
        probs = torch.sigmoid(net(**enc).logits).cpu().tolist()
    cards = [
        [{"card": n, "score": round(p, 3)} for n, p in zip(meta["names"], row) if p >= meta["threshold"]]
        for row in probs
    ]
    return {"cards": cards}


def handler(job: dict) -> dict:
    data = job.get("input") or {}
    if data.get("ping"):
        return {"ok": True, "model": MODEL_NAME}
    if isinstance(data.get("classify"), list):
        return classify(data["classify"])

    try:
        audio = base64.b64decode(data.get("audio_base64") or "", validate=True)
    except (binascii.Error, ValueError):
        return {"error": "audio_base64 is not valid base64"}
    if not audio:
        return {"error": "no audio received"}
    if len(audio) > MAX_BYTES:
        return {"error": "audio is larger than 12 MB"}

    fmt = str(data.get("format") or "webm")
    if not re.fullmatch(r"[a-z0-9]{2,5}", fmt):
        fmt = "webm"
    language = data.get("language")
    if language not in ("en", "ms"):
        language = None  # let Whisper detect it

    with tempfile.NamedTemporaryFile(suffix=f".{fmt}") as tmp:
        tmp.write(audio)
        tmp.flush()
        segments, info = get_model().transcribe(tmp.name, language=language, vad_filter=True, beam_size=5)
        parts = [{"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip()} for s in segments]

    return {
        "text": " ".join(p["text"] for p in parts).strip(),
        "language": info.language,
        "duration": round(info.duration, 2),
        "segments": parts,
    }


if __name__ == "__main__":
    runpod.serverless.start({"handler": handler})
