# backend/app/storage.py
import json
from pathlib import Path
from typing import List, Dict, Any

FILE = Path(__file__).resolve().parent / "data.json"

def read_all() -> List[Dict[str, Any]]:
    if not FILE.exists():
        return []
    with open(FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def write_all(data: List[Dict[str, Any]]) -> None:
    with open(FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def next_id() -> int:
    data = read_all()
    return max((int(item.get("id", 0)) for item in data), default=0) + 1