"""Pure Line AI backend services: RAG knowledge-base assistant.

Modules:
    ingestion  - extract plain text + metadata from TXT/MD/PDF/DOCX files.
    indexing   - chunk, embed (sentence-transformers) and store in ChromaDB;
                 incremental hash-based reindex + watchdog file watcher.
    retrieval  - embed a query and fetch the most relevant chunks from Chroma.
    chat       - RAG orchestration: retrieve -> prompt -> Ollama -> answer.
    model_select - pick the best locally-available Ollama model.
"""
