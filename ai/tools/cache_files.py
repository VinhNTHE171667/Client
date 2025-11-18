"""Utility script to rebuild cached summaries/embeddings for spa data files."""
from app.agents.rag_agent import KnowledgeAgent


if __name__ == "__main__":
    agent = KnowledgeAgent()
    print("Building file cache (this calls the chat model once per file to summarize)...")
    cache = agent.build_file_cache(force=True)
    print(f"Cached {len(cache)} files. Stored in .cache/file_cache.json")
    for name, entry in cache.items():
        summary = (entry.get("summary") or "")[:120].replace("\n", " ")
        print("-", name, "| summary:", summary)
