"""PURE LINE AI - chatbot backend (FastAPI).

A local Retrieval-Augmented Generation (RAG) assistant over the Pure Line
knowledge base. Documents dropped into ``data/knowledge-base/`` are ingested,
chunked, embedded (sentence-transformers, multilingual) and stored in ChromaDB.
Incoming questions are answered strictly from retrieved context using a local
Ollama model - with a hard refusal when no relevant context exists.
"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services import chat as chat_service
from services import indexing

app = FastAPI(title="PURE LINE AI", version="2.0.0")

# Allow the website + chat frontend to call this API in dev and behind nginx.
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    lang: str | None = None


class ChatResponse(BaseModel):
    reply: str
    sources: list[str] = []


@app.on_event("startup")
def _startup() -> None:
    """Reconcile the index once (in case files changed while offline) and start
    the file watcher for automatic incremental re-indexing."""
    try:
        status = indexing.run_indexing_pass()
        print(f"[startup] indexed {status['indexed_files']} files, "
              f"{status['chunks']} chunks", flush=True)
    except Exception as exc:  # noqa: BLE001
        print(f"[startup] initial indexing failed: {exc}", flush=True)
    try:
        indexing.start_watcher()
    except Exception as exc:  # noqa: BLE001
        print(f"[startup] watcher failed to start: {exc}", flush=True)


@app.get("/health")
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "pure-line-ai"}


@app.get("/api/kb/status")
def kb_status():
    """Basic knowledge-base / index stats for debugging & verification."""
    return indexing.get_status()


@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    result = chat_service.answer(req.message, req.lang)
    return ChatResponse(reply=result.reply, sources=result.sources)
