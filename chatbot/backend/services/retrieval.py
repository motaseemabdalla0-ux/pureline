"""Retrieval service: embed a query and fetch the most relevant KB chunks.

ChromaDB is configured with cosine distance (``hnsw:space=cosine``), so the
returned ``distance`` is in [0, 2] where 0 == identical. We convert to a
similarity score ``1 - distance`` and drop anything below ``MIN_SIMILARITY``
so that when nothing relevant exists we return an empty context (which lets the
chat layer refuse instead of hallucinating).
"""
from __future__ import annotations

from dataclasses import dataclass

from . import indexing

DEFAULT_TOP_K = 5

# Cosine similarity threshold. Multilingual MiniLM puts loosely-related short
# passages around 0.2-0.35; genuine matches are typically 0.4+. 0.30 keeps real
# hits while rejecting off-topic queries (e.g. "capital of France"). Tune here.
MIN_SIMILARITY = 0.30


@dataclass
class RetrievedChunk:
    text: str
    source: str
    file_type: str
    chunk_index: int
    similarity: float
    distance: float


def retrieve(query: str, top_k: int = DEFAULT_TOP_K,
             min_similarity: float = MIN_SIMILARITY) -> list[RetrievedChunk]:
    """Return relevant chunks (above threshold) ordered by similarity desc.
    Empty list means 'no relevant context found'."""
    query = (query or "").strip()
    if not query:
        return []

    collection = indexing.get_collection()
    try:
        count = collection.count()
    except Exception:  # noqa: BLE001
        count = 0
    if count == 0:
        return []

    n = min(top_k, count)
    res = collection.query(
        query_texts=[query],
        n_results=n,
        include=["documents", "metadatas", "distances"],
    )

    documents = (res.get("documents") or [[]])[0]
    metadatas = (res.get("metadatas") or [[]])[0]
    distances = (res.get("distances") or [[]])[0]

    out: list[RetrievedChunk] = []
    for doc, meta, dist in zip(documents, metadatas, distances):
        meta = meta or {}
        similarity = 1.0 - float(dist)
        if similarity < min_similarity:
            continue
        out.append(RetrievedChunk(
            text=doc,
            source=meta.get("source", "unknown"),
            file_type=meta.get("file_type", ""),
            chunk_index=int(meta.get("chunk_index", 0)),
            similarity=round(similarity, 4),
            distance=round(float(dist), 4),
        ))
    out.sort(key=lambda c: c.similarity, reverse=True)
    return out
