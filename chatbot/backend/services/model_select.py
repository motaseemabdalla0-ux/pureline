"""Ollama model selection.

We do NOT probe host hardware (a Linux container can't meaningfully see the
host GPU). Instead we ask Ollama's own ``/api/tags`` endpoint what models are
actually pulled and pick the best one from a fixed priority list. An explicit
``OLLAMA_MODEL`` env var always wins.
"""
from __future__ import annotations

import os

import requests

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")

# Best -> worst. First one present in Ollama wins.
#
# Chosen via a real benchmark on this machine (RTX 3050 6GB) across
# qwen3:8b, gemma3:4b, qwen2.5:3b and llama3.2:3b using identical
# knowledge-base questions (EN accuracy, AR quality, refusal/hallucination
# test). Results:
#   - qwen2.5:3b and llama3.2:3b DISQUALIFIED: both answered "Paris" to an
#     out-of-scope question instead of issuing the required refusal message -
#     a hard hallucination failure, regardless of their speed.
#   - qwen3:8b and gemma3:4b both correctly refused and answered accurately
#     in English and Arabic. gemma3:4b (3.3GB) fits entirely in the 6GB VRAM
#     card (100% GPU, ~0.3-2s generation once warm); qwen3:8b (~6GB) barely
#     fits, forcing a ~30/70 CPU/GPU split (multi-second to 40s+ per reply).
#   -> gemma3:4b is the fastest model that still answers accurately, so it
#      leads the priority list. qwen3:8b remains as a quality-oriented
#      fallback. qwen2.5:3b/llama3.2:3b are intentionally NOT listed here -
#      do not add them back without re-verifying the hallucination issue is
#      fixed (e.g. with a stronger system prompt or fine-tuning).
PRIORITY = ["gemma3:4b", "qwen3:8b", "qwen3:4b", "llama3.1:8b", "qwen2.5:7b", "mistral"]

_cached_model: str | None = None


def _list_installed_models(timeout: float = 5.0) -> list[str]:
    url = OLLAMA_BASE_URL.rstrip("/") + "/api/tags"
    resp = requests.get(url, timeout=timeout)
    resp.raise_for_status()
    data = resp.json()
    names = []
    for m in data.get("models", []):
        name = m.get("name") or m.get("model")
        if name:
            names.append(name)
    return names


def select_model(force_refresh: bool = False) -> str:
    """Return the model name to use. Honours OLLAMA_MODEL if set; otherwise
    picks the best available from PRIORITY; else the first installed model."""
    global _cached_model

    explicit = os.getenv("OLLAMA_MODEL", "").strip()
    if explicit:
        return explicit

    if _cached_model and not force_refresh:
        return _cached_model

    try:
        installed = _list_installed_models()
    except Exception as exc:  # noqa: BLE001
        print(f"[model_select] WARNING: cannot reach Ollama at "
              f"{OLLAMA_BASE_URL}: {exc}. Falling back to 'qwen2.5:7b'.",
              flush=True)
        _cached_model = "qwen2.5:7b"
        return _cached_model

    if not installed:
        print("[model_select] WARNING: Ollama has no models pulled. "
              "Falling back to 'qwen2.5:7b' (chat calls will fail until "
              "a model is available).", flush=True)
        _cached_model = "qwen2.5:7b"
        return _cached_model

    installed_set = set(installed)
    for candidate in PRIORITY:
        if candidate in installed_set:
            _cached_model = candidate
            print(f"[model_select] using '{candidate}' "
                  f"(installed: {installed})", flush=True)
            return candidate

    # None of the priority models present -> use whatever is installed.
    _cached_model = installed[0]
    print(f"[model_select] WARNING: none of {PRIORITY} installed; "
          f"using '{_cached_model}'.", flush=True)
    return _cached_model
