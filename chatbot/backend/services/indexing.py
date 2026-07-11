"""Indexing service: chunk -> embed -> store in ChromaDB, with incremental
hash-based reconciliation and a watchdog file watcher.

Design notes
------------
* Vector store: ChromaDB ``PersistentClient`` at ``data/chroma_db``.
* Embeddings: sentence-transformers ``paraphrase-multilingual-MiniLM-L12-v2``
  (CPU, multilingual - handles Arabic + English). Wrapped in a Chroma
  ``EmbeddingFunction`` so both indexing and retrieval share one model.
* Chunking: sliding window over paragraphs/sentences, ~600 chars/chunk with
  ~100 char overlap.
* Change detection: a manifest at ``data/.index_manifest.json`` maps
  filename -> {hash, chunk_ids}. Only new/changed files are re-embedded;
  deleted files have their chunks purged. We never blindly re-embed all.
* Watcher: watchdog ``Observer`` on ``data/knowledge-base`` with a debounce so
  a burst of FS events triggers a single reconcile pass.
"""
from __future__ import annotations

import json
import os
import re
import threading
import time
from datetime import datetime, timezone

from . import ingestion

# ---------------------------------------------------------------------------
# Paths & configuration
# ---------------------------------------------------------------------------
_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(_BASE_DIR, "data")
KB_DIR = os.path.join(DATA_DIR, "knowledge-base")
CHROMA_DIR = os.path.join(DATA_DIR, "chroma_db")
# Manifest lives inside the persisted chroma_db volume so it survives container
# restarts - this lets us skip re-embedding unchanged files after a restart.
MANIFEST_PATH = os.path.join(CHROMA_DIR, ".index_manifest.json")

COLLECTION_NAME = "pureline_kb"
EMBED_MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"

CHUNK_SIZE = 600          # target characters per chunk
CHUNK_OVERLAP = 100       # character overlap between consecutive chunks
WATCH_DEBOUNCE_SECONDS = 2.0

# In-memory status for /api/kb/status
_STATUS = {
    "indexed_files": 0,
    "chunks": 0,
    "last_index_time": None,
    "files": [],
    "errors": [],
}
_INDEX_LOCK = threading.RLock()

# Lazily-initialised singletons.
_embed_fn = None
_client = None
_collection = None


# ---------------------------------------------------------------------------
# Embedding function (shared by indexing + retrieval)
# ---------------------------------------------------------------------------
def get_embedding_function():
    """Return a cached Chroma-compatible embedding function backed by
    sentence-transformers. The ~470MB model downloads on first use."""
    global _embed_fn
    if _embed_fn is None:
        from chromadb.utils import embedding_functions

        _embed_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=EMBED_MODEL_NAME
        )
    return _embed_fn


def get_collection():
    """Return the persistent Chroma collection, creating it if needed."""
    global _client, _collection
    if _collection is None:
        import chromadb
        from chromadb.config import Settings

        os.makedirs(CHROMA_DIR, exist_ok=True)
        _client = chromadb.PersistentClient(
            path=CHROMA_DIR,
            settings=Settings(anonymized_telemetry=False, allow_reset=True),
        )
        _collection = _client.get_or_create_collection(
            name=COLLECTION_NAME,
            embedding_function=get_embedding_function(),
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------
def chunk_text(text: str, size: int = CHUNK_SIZE,
               overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Sliding window over sentence/paragraph boundaries.

    We first split into paragraph/sentence units, then greedily pack them into
    chunks up to ``size`` chars, carrying ``overlap`` chars of tail context
    into the next chunk. Works for both Arabic and English text.
    """
    text = (text or "").strip()
    if not text:
        return []

    # Split on paragraph breaks first, then on sentence enders (., !, ?, Arabic
    # question mark, newline) so no single unit is enormous.
    units: list[str] = []
    for para in re.split(r"\n{2,}", text):
        para = para.strip()
        if not para:
            continue
        sentences = re.split(r"(?<=[.!?؟۔])\s+", para)
        for s in sentences:
            s = s.strip()
            if s:
                units.append(s)

    if not units:
        units = [text]

    chunks: list[str] = []
    current = ""
    for unit in units:
        if not current:
            current = unit
        elif len(current) + 1 + len(unit) <= size:
            current += " " + unit
        else:
            chunks.append(current)
            # carry overlap tail into the next chunk
            tail = current[-overlap:] if overlap > 0 else ""
            current = (tail + " " + unit).strip() if tail else unit
    if current:
        chunks.append(current)

    # Hard-split any pathologically long unit that still exceeds size.
    final: list[str] = []
    for c in chunks:
        if len(c) <= size * 1.5:
            final.append(c)
        else:
            for i in range(0, len(c), size - overlap):
                final.append(c[i:i + size])
    return [c for c in final if c.strip()]


# ---------------------------------------------------------------------------
# Manifest helpers
# ---------------------------------------------------------------------------
def _load_manifest() -> dict:
    if os.path.exists(MANIFEST_PATH):
        try:
            with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:  # noqa: BLE001 - corrupt manifest -> rebuild
            return {}
    return {}


def _save_manifest(manifest: dict) -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    tmp = MANIFEST_PATH + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    os.replace(tmp, MANIFEST_PATH)


def _chunk_ids_for(filename: str, count: int) -> list[str]:
    return [f"{filename}::chunk::{i}" for i in range(count)]


# ---------------------------------------------------------------------------
# Core indexing operations
# ---------------------------------------------------------------------------
def _remove_file_from_index(filename: str, manifest: dict,
                            collection) -> None:
    """Delete a file's chunks from Chroma (by metadata filter) + manifest."""
    try:
        collection.delete(where={"source": filename})
    except Exception:  # noqa: BLE001
        pass
    manifest.pop(filename, None)


def _add_file_to_index(doc: "ingestion.ExtractedDocument", manifest: dict,
                       collection) -> int:
    """Chunk + embed + add a single file. Returns number of chunks added."""
    chunks = chunk_text(doc.text)
    if not chunks:
        return 0
    ids = _chunk_ids_for(doc.filename, len(chunks))
    metadatas = [
        {
            "source": doc.filename,
            "file_type": doc.file_type,
            "chunk_index": i,
            "file_hash": doc.content_hash,
        }
        for i in range(len(chunks))
    ]
    # upsert (not add) so a restart with a lost manifest is idempotent rather
    # than raising on duplicate IDs.
    collection.upsert(ids=ids, documents=chunks, metadatas=metadatas)
    manifest[doc.filename] = {
        "hash": doc.content_hash,
        "chunk_ids": ids,
        "file_type": doc.file_type,
        "chunks": len(chunks),
        "modified_time": doc.modified_time,
    }
    return len(chunks)


def run_indexing_pass() -> dict:
    """Full scan-and-reconcile pass over the knowledge-base directory.

    * New files      -> ingest + embed + add.
    * Changed files  -> (hash differs) delete old chunks + re-add.
    * Deleted files  -> purge chunks from Chroma + manifest.
    * Unchanged      -> skipped (no re-embedding).

    Returns the current status dict.
    """
    with _INDEX_LOCK:
        os.makedirs(KB_DIR, exist_ok=True)
        collection = get_collection()
        manifest = _load_manifest()
        errors: list[str] = []

        present = {
            name for name in os.listdir(KB_DIR)
            if ingestion.is_supported(os.path.join(KB_DIR, name))
            and os.path.isfile(os.path.join(KB_DIR, name))
        }

        # Deletions: in manifest but no longer on disk.
        for filename in list(manifest.keys()):
            if filename not in present:
                _remove_file_from_index(filename, manifest, collection)

        # Additions / modifications.
        for filename in sorted(present):
            path = os.path.join(KB_DIR, filename)
            try:
                current_hash = ingestion.sha256_of_file(path)
            except Exception as exc:  # noqa: BLE001
                errors.append(f"{filename}: hash failed: {exc}")
                continue

            record = manifest.get(filename)
            if record and record.get("hash") == current_hash:
                continue  # unchanged -> skip

            doc = ingestion.ingest_file(path)
            if doc.error:
                errors.append(f"{filename}: {doc.error}")
                continue
            if not doc.text.strip():
                errors.append(f"{filename}: no extractable text")
                continue

            if record:  # changed -> purge old chunks first
                _remove_file_from_index(filename, manifest, collection)
            _add_file_to_index(doc, manifest, collection)

        _save_manifest(manifest)
        _refresh_status(manifest, errors)
        return dict(_STATUS)


def _refresh_status(manifest: dict, errors: list[str]) -> None:
    total_chunks = sum(rec.get("chunks", 0) for rec in manifest.values())
    _STATUS["indexed_files"] = len(manifest)
    _STATUS["chunks"] = total_chunks
    _STATUS["last_index_time"] = datetime.now(timezone.utc).isoformat()
    _STATUS["files"] = [
        {"filename": name, "chunks": rec.get("chunks", 0),
         "file_type": rec.get("file_type", "")}
        for name, rec in sorted(manifest.items())
    ]
    _STATUS["errors"] = errors


def get_status() -> dict:
    with _INDEX_LOCK:
        return dict(_STATUS)


# ---------------------------------------------------------------------------
# Watchdog file watcher
# ---------------------------------------------------------------------------
_observer = None
_debounce_timer: "threading.Timer | None" = None
_debounce_lock = threading.Lock()


def _debounced_reindex() -> None:
    """Schedule a reconcile pass after a short quiet period so a burst of FS
    events (e.g. a file copy) collapses into one indexing pass."""
    global _debounce_timer
    with _debounce_lock:
        if _debounce_timer is not None:
            _debounce_timer.cancel()

        def _run():
            try:
                run_indexing_pass()
            except Exception as exc:  # noqa: BLE001
                print(f"[indexing] watcher reindex failed: {exc}", flush=True)

        _debounce_timer = threading.Timer(WATCH_DEBOUNCE_SECONDS, _run)
        _debounce_timer.daemon = True
        _debounce_timer.start()


def start_watcher() -> None:
    """Start a background watchdog observer on the knowledge-base directory.
    Idempotent: repeated calls are no-ops once running."""
    global _observer
    if _observer is not None:
        return
    from watchdog.events import FileSystemEventHandler
    # PollingObserver (stat-based) rather than the inotify Observer: inotify
    # events do NOT cross Docker bind mounts on Windows/macOS, so a native
    # Observer would never see files the user drops in from the host. Polling
    # works everywhere at the cost of a periodic directory stat.
    from watchdog.observers.polling import PollingObserver as Observer

    os.makedirs(KB_DIR, exist_ok=True)

    class _Handler(FileSystemEventHandler):
        def _relevant(self, path: str) -> bool:
            return (not path.endswith("~")) and ingestion.is_supported(path)

        def on_created(self, event):
            if not event.is_directory and self._relevant(event.src_path):
                print(f"[indexing] created: {event.src_path}", flush=True)
                _debounced_reindex()

        def on_modified(self, event):
            if not event.is_directory and self._relevant(event.src_path):
                _debounced_reindex()

        def on_deleted(self, event):
            if not event.is_directory:
                print(f"[indexing] deleted: {event.src_path}", flush=True)
                _debounced_reindex()

        def on_moved(self, event):
            _debounced_reindex()

    _observer = Observer()
    _observer.schedule(_Handler(), KB_DIR, recursive=False)
    _observer.daemon = True
    _observer.start()
    print(f"[indexing] watching {KB_DIR}", flush=True)
