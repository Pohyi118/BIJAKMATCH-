"""Tests for runpod/handler.py without a GPU: the runpod and faster_whisper packages are replaced by stubs."""

import base64
import sys
import types
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def load_handler():
    runpod = types.ModuleType("runpod")
    runpod.serverless = types.SimpleNamespace(start=lambda cfg: None)
    sys.modules["runpod"] = runpod

    class Seg:
        def __init__(self, start, end, text):
            self.start, self.end, self.text = start, end, text

    class FakeWhisper:
        calls = []

        def __init__(self, *a, **k):
            pass

        def transcribe(self, path, **kw):
            FakeWhisper.calls.append(kw)
            info = types.SimpleNamespace(language=kw.get("language") or "en", duration=3.2)
            return iter([Seg(0.0, 1.5, " Saya periksa mesin "), Seg(1.5, 3.2, " dan lock breaker ")]), info

    fw = types.ModuleType("faster_whisper")
    fw.WhisperModel = FakeWhisper
    sys.modules["faster_whisper"] = fw
    sys.path.insert(0, str(ROOT / "runpod"))
    sys.modules.pop("handler", None)
    import handler  # noqa: E402

    return handler, FakeWhisper


class TestHandler(unittest.TestCase):
    def setUp(self):
        self.h, self.fake = load_handler()
        self.fake.calls.clear()

    def run_job(self, data):
        return self.h.handler({"input": data})

    def test_ping_does_not_load_a_model(self):
        self.assertEqual(self.run_job({"ping": True})["ok"], True)
        self.assertIsNone(self.h._model)

    def test_bad_base64_empty_and_oversized_audio_are_rejected(self):
        self.assertIn("not valid base64", self.run_job({"audio_base64": "###"})["error"])
        self.assertIn("no audio", self.run_job({"audio_base64": ""})["error"])
        big = base64.b64encode(b"x" * (self.h.MAX_BYTES + 1)).decode()
        self.assertIn("larger than 12 MB", self.run_job({"audio_base64": big})["error"])

    def test_transcript_has_trimmed_text_segments_and_language(self):
        audio = base64.b64encode(b"fake audio bytes").decode()
        out = self.run_job({"audio_base64": audio, "format": "webm", "language": "ms"})
        self.assertEqual(out["text"], "Saya periksa mesin dan lock breaker")
        self.assertEqual(out["language"], "ms")
        self.assertEqual(out["segments"][1], {"start": 1.5, "end": 3.2, "text": "dan lock breaker"})
        self.assertEqual(self.fake.calls[0]["language"], "ms")

    def test_unknown_language_is_auto_detected_and_odd_format_is_neutralised(self):
        audio = base64.b64encode(b"fake").decode()
        self.run_job({"audio_base64": audio, "format": "../../etc", "language": "fr"})
        self.assertIsNone(self.fake.calls[0]["language"])

    def test_classify_without_a_trained_model_says_so_instead_of_crashing(self):
        torch = types.ModuleType("torch")
        transformers = types.ModuleType("transformers")
        transformers.AutoModelForSequenceClassification = object
        transformers.AutoTokenizer = object
        sys.modules["torch"], sys.modules["transformers"] = torch, transformers
        self.h.TASKCARD_DIR = str(ROOT / "no-such-folder")
        self.h._classifier = None
        out = self.run_job({"classify": ["I lock the breaker"]})
        self.assertIn("no trained task-card model", out["error"])


if __name__ == "__main__":
    unittest.main()
