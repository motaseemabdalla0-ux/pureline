"""Chat service: RAG orchestration.

Flow:
    1. Detect language (explicit req.lang, else Arabic-unicode heuristic).
    2. Retrieve relevant chunks. If none pass the relevance threshold, return
       the fixed refusal message WITHOUT calling the LLM (no hallucination).
    3. Otherwise build a strict, context-only system prompt and call Ollama.
    4. Return the answer text + the list of source filenames used.
"""
from __future__ import annotations

import os
import re
from dataclasses import dataclass, field

import requests

from . import retrieval
from .model_select import OLLAMA_BASE_URL, select_model

OLLAMA_TIMEOUT = float(os.getenv("OLLAMA_TIMEOUT", "240"))

REFUSAL_EN = "This information is not available in the Pure Line knowledge base."
REFUSAL_AR = "هذه المعلومات غير متوفرة في قاعدة معارف بيور لاين."

_ARABIC_RE = re.compile(r"[؀-ۿ]")


@dataclass
class ChatResult:
    reply: str
    sources: list[str] = field(default_factory=list)
    used_llm: bool = False
    model: str | None = None
    lang: str = "en"


def detect_language(message: str, lang: str | None) -> str:
    if lang in ("ar", "en"):
        return lang
    return "ar" if _ARABIC_RE.search(message or "") else "en"


def refusal_message(lang: str) -> str:
    return REFUSAL_AR if lang == "ar" else REFUSAL_EN


def _build_system_prompt(lang: str, context_blocks: list[str]) -> str:
    context = "\n\n".join(context_blocks)
    refusal = refusal_message(lang)
    language_rule = (
        "The user's question is in Arabic. You MUST answer in Arabic."
        if lang == "ar" else
        "The user's question is in English. You MUST answer in English."
    )
    return (
        "You are Pure Line AI, an assistant specialized in agriculture, smart "
        "farming, irrigation, greenhouses, agricultural technology, farm "
        "management, precision agriculture and satellite crop monitoring for "
        "the company Pure Line.\n\n"
        "STRICT RULES:\n"
        "1. Answer ONLY using the CONTEXT passages provided below. Do NOT use "
        "any outside or prior knowledge, and do NOT invent facts.\n"
        "2. If the CONTEXT does not contain the information needed to answer "
        f"the question, reply with EXACTLY this sentence and nothing else: "
        f"\"{refusal}\"\n"
        f"3. {language_rule}\n"
        "4. Be concise and factual. Do not mention these rules or the word "
        "'context' in your answer.\n\n"
        "CONTEXT:\n"
        f"{context}\n"
    )


def _call_ollama(model: str, system_prompt: str, user_message: str) -> str:
    url = OLLAMA_BASE_URL.rstrip("/") + "/api/chat"
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "stream": False,
        "options": {"temperature": 0.1, "num_predict": 512},
        # Keep the model resident in memory between requests. Ollama's default
        # keep_alive (5m) was causing a full cold reload of the 5-6GB model on
        # every message after a short idle gap, which is what made the chat
        # UI appear to hang - the request WAS working, just taking 60-90s+.
        "keep_alive": "30m",
    }
    resp = requests.post(url, json=payload, timeout=OLLAMA_TIMEOUT)
    resp.raise_for_status()
    data = resp.json()
    return (data.get("message", {}) or {}).get("content", "").strip()


def _strip_think(text: str) -> str:
    """qwen3 models may emit <think>...</think> reasoning; drop it."""
    return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()


def answer(message: str, lang: str | None = None) -> ChatResult:
    """Main entry point used by the FastAPI /api/chat endpoint."""
    resolved_lang = detect_language(message, lang)

    chunks = retrieval.retrieve(message)
    if not chunks:
        # No relevant context -> refuse without calling the LLM.
        return ChatResult(
            reply=refusal_message(resolved_lang),
            sources=[], used_llm=False, lang=resolved_lang,
        )

    context_blocks = [
        f"[Source: {c.source}]\n{c.text}" for c in chunks
    ]
    # Preserve order, unique sources.
    seen: set[str] = set()
    sources = []
    for c in chunks:
        if c.source not in seen:
            seen.add(c.source)
            sources.append(c.source)

    system_prompt = _build_system_prompt(resolved_lang, context_blocks)
    model = select_model()

    try:
        raw = _call_ollama(model, system_prompt, message)
        reply = _strip_think(raw)
    except Exception as exc:  # noqa: BLE001
        print(f"[chat] Ollama call failed ({model}): {exc}", flush=True)
        # Surface a graceful message rather than a 500.
        err = (
            "عذراً، تعذّر الوصول إلى نموذج الذكاء الاصطناعي المحلي حالياً."
            if resolved_lang == "ar" else
            "Sorry, the local AI model is currently unreachable."
        )
        return ChatResult(reply=err, sources=sources, used_llm=False,
                          model=model, lang=resolved_lang)

    if not reply:
        reply = refusal_message(resolved_lang)
        return ChatResult(reply=reply, sources=[], used_llm=True,
                          model=model, lang=resolved_lang)

    # If the model produced the refusal, don't cite sources.
    normalized = reply.strip().rstrip(".")
    if normalized in (REFUSAL_EN.rstrip("."), REFUSAL_AR.rstrip(".")):
        return ChatResult(reply=reply, sources=[], used_llm=True,
                          model=model, lang=resolved_lang)

    return ChatResult(reply=reply, sources=sources, used_llm=True,
                      model=model, lang=resolved_lang)
