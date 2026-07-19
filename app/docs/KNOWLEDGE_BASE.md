# Pure Line AI — Knowledge Base (Local RAG) Guide

The Pure Line chatbot backend is a **local Retrieval-Augmented Generation (RAG)**
assistant. It answers questions **only** from documents you place in a knowledge
base, using a local embedding model for retrieval and a local Ollama LLM for
generation. Nothing leaves the machine, and the assistant refuses to answer when
the knowledge base does not contain the information.

Backend location: `chatbot/backend/`
Knowledge base: `chatbot/backend/data/knowledge-base/`
Vector store: `chatbot/backend/data/chroma_db/` (ChromaDB, persisted)

---

## 1. Adding documents

Just **drop files into `chatbot/backend/data/knowledge-base/`**. That directory
is bind-mounted into the container (see `deployment/docker-compose.yml`), so you
add/edit/remove files from the Windows host with Explorer or any editor.

**Supported formats and how text is extracted:**

| Extension | Extraction method |
|-----------|-------------------|
| `.txt`    | Read directly (UTF-8, tolerant of bad bytes) |
| `.md`     | Read directly, with light Markdown stripping (headings, emphasis, link syntax removed; words kept) |
| `.pdf`    | Text extracted page-by-page with `pypdf` |
| `.docx`   | Paragraph and table-cell text extracted with `python-docx` |

Any other extension is ignored.

**Automatic pickup.** A `watchdog` observer watches the knowledge-base directory
for create/modify/delete/move events. Events are **debounced by 2 seconds**
(`WATCH_DEBOUNCE_SECONDS` in `services/indexing.py`): a burst of file-system
events (e.g. copying a large file) collapses into a **single** re-index pass that
runs ~2 seconds after the last event. So a new file is normally searchable within
a few seconds of finishing the copy — no restart required. A full
scan-and-reconcile pass also runs once on startup, catching anything that changed
while the service was offline.

---

## 2. How indexing works

Implemented in `services/indexing.py` and `services/ingestion.py`.

1. **Ingestion.** The file is read and converted to plain text; metadata is
   recorded: filename, file type, modified time, and a **SHA-256 hash of the raw
   file bytes**.
2. **Chunking.** Text is split on paragraph and sentence boundaries, then packed
   into chunks of **~600 characters with ~100 characters of overlap**
   (`CHUNK_SIZE` / `CHUNK_OVERLAP`). The splitter understands both Latin and
   Arabic sentence terminators. Overlap preserves context across chunk edges.
3. **Embedding.** Each chunk is embedded with the sentence-transformers model
   **`paraphrase-multilingual-MiniLM-L12-v2`** (384-dim, CPU, multilingual —
   handles Arabic **and** English). The model (~470 MB) is **baked into the Docker
   image** at build time, so there is no first-run download.
4. **Storage.** Chunks are stored in a persistent **ChromaDB** collection
   (`pureline_kb`) at `data/chroma_db/`, configured for **cosine** distance. Each
   chunk carries metadata: `source` (filename), `file_type`, `chunk_index`, and
   `file_hash` (hash of the source file).

### Incremental, hash-based rebuild

A manifest at `data/chroma_db/.index_manifest.json` maps
`filename -> {hash, chunk_ids, chunks, ...}`. On every indexing pass:

- **New file** (not in manifest) → ingest, embed, add.
- **Changed file** (hash differs from manifest) → delete its old chunks from
  Chroma (by `where={"source": filename}`), then re-add the new chunks.
- **Deleted file** (in manifest, gone from disk) → purge its chunks from Chroma.
- **Unchanged file** (hash matches) → **skipped** — no re-embedding.

This means editing one file re-embeds only that file, not the whole base. Writes
use Chroma `upsert`, so even if the manifest is lost the index stays consistent.
The manifest lives inside the persisted `chroma_db` volume, so after a container
restart unchanged files are not needlessly re-embedded.

You can trigger a manual pass programmatically via `indexing.run_indexing_pass()`;
the watcher and the FastAPI startup hook both call it.

---

## 3. Retrieval and the refusal rule

Implemented in `services/retrieval.py` and `services/chat.py`.

1. The incoming question is embedded with the **same** model used for indexing.
2. ChromaDB returns the top **k = 5** nearest chunks (cosine distance).
3. Each result's **similarity = 1 − distance** is compared against
   **`MIN_SIMILARITY = 0.30`** (`services/retrieval.py`). Results below the
   threshold are dropped. If nothing survives, retrieval returns an **empty**
   context.
4. **If context is empty**, the chat layer returns the fixed refusal message
   **without calling the LLM at all** — this is what prevents hallucination on
   out-of-scope questions.
5. **If context exists**, a strict system prompt is built instructing the model
   to answer *only* from the provided passages, never use outside knowledge,
   reply in the same language as the question, and — if the passages don't
   actually contain the answer — reply with the exact refusal sentence.

**Refusal messages (verbatim):**

- English: `This information is not available in the Pure Line knowledge base.`
- Arabic: `هذه المعلومات غير متوفرة في قاعدة معارف بيور لاين.`

**Language detection.** If the request includes `lang` (`"en"` or `"ar"`) it is
used. Otherwise the backend auto-detects: any character in the Arabic Unicode
range (U+0600–U+06FF) ⇒ Arabic, else English.

Answers are returned with a `sources` list — the filenames of the chunks actually
used — for citation and debugging.

---

## 4. Model selection (Ollama)

Implemented in `services/model_select.py`. The backend calls Ollama's HTTP API at
`OLLAMA_BASE_URL` (default `http://host.docker.internal:11434`, i.e. the Ollama
service on the Windows host).

Model choice, at runtime:

1. If the `OLLAMA_MODEL` env var is set, it is used verbatim.
2. Otherwise the backend queries Ollama's `/api/tags` (what's actually pulled)
   and picks the first available from this priority list:
   `["qwen3:8b", "qwen3:4b", "llama3.1:8b", "qwen2.5:7b", "mistral"]`.
3. If none of those are present, it uses the first installed model.
4. If Ollama is unreachable or has no models, it logs a clear warning and falls
   back to `qwen2.5:7b` (chat calls will then fail until a model is available).

**Override the model** by setting `OLLAMA_MODEL` in `deployment/docker-compose.yml`
(or a `.env` file) for the `chatbot-backend` service, e.g. `OLLAMA_MODEL=mistral`,
then `docker compose up -d chatbot-backend`.

---

## 5. API endpoints

- `GET /api/health` — liveness check.
- `GET /api/kb/status` — `{ indexed_files, chunks, last_index_time, files[], errors[] }`.
- `POST /api/chat` — body `{ "message": "...", "lang": "en"|"ar"|null }`; returns
  `{ "reply": "...", "sources": ["file.md", ...] }`.

Behind nginx these are reachable at `http://localhost:8080/api/...`.

---

## 6. Troubleshooting

**Every answer is the refusal message.**
- The index may be empty or the query is genuinely out of scope. Check
  `GET /api/kb/status` — `chunks` should be non-zero and your file listed.
- If files are listed but questions still refuse, the similarity threshold may be
  too strict for your phrasing. Lower `MIN_SIMILARITY` in
  `services/retrieval.py` (e.g. 0.30 → 0.25) and rebuild. Conversely, raise it if
  irrelevant chunks leak in.
- Check `errors[]` in `/api/kb/status` for extraction failures (see below).

**Ollama isn't reachable from the container.**
- Symptom: replies like "Sorry, the local AI model is currently unreachable," or
  logs `[chat] Ollama call failed`.
- Ensure Ollama is running on the host (`ollama list`) and listening on
  `localhost:11434`.
- The compose service sets `extra_hosts: host.docker.internal:host-gateway` —
  required on Linux container engines so the container can resolve the host.
- Test from inside the container: `docker compose exec chatbot-backend python -c
  "import requests;print(requests.get('http://host.docker.internal:11434/api/tags').json())"`.
- On some setups you may need to override `OLLAMA_BASE_URL` (e.g. to the host LAN
  IP) if `host.docker.internal` does not resolve.

**A PDF or DOCX fails to parse.**
- Extraction errors are captured per-file and surfaced in `/api/kb/status`
  `errors[]` (e.g. `mydoc.pdf: no extractable text`).
- Scanned/image-only PDFs have no text layer — `pypdf` returns nothing. Use an
  OCR'd PDF or provide a `.txt`/`.md` version.
- A `.docx` that is actually a renamed `.doc` or a corrupt file will fail; re-save
  it as a real `.docx`.

**Indexing seems stuck / a new file wasn't picked up.**
- The watcher debounces for ~2 seconds after the last event; wait a few seconds,
  then re-check `/api/kb/status` (`chunks` and `last_index_time` should change).
- Make sure the file has a supported extension and is fully written (partial
  copies with a temporary name are ignored).
- Editors that write via atomic-rename may fire a `moved`/`created` event — both
  are handled, but very fast successive saves are collapsed into one pass.
- As a last resort, restart the backend (`docker compose restart chatbot-backend`)
  to force a full startup reconcile pass, or check container logs:
  `docker compose logs -f chatbot-backend`.

**The embedding model download slows the build.**
- It is baked into the image (`RUN python -c "... SentenceTransformer(...)"`).
  The first build downloads ~470 MB; subsequent builds are cached. Do not delete
  that Dockerfile line unless you accept a first-run download inside the running
  container.
