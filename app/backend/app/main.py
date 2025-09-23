# backend/app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from pathlib import Path
import json
from datetime import datetime

# -------------------------
# Configuración de la app
# -------------------------
app = FastAPI()

# 👉 Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  #En producción restringe a ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Esquemas Pydantic
# -------------------------
class Sesion(BaseModel):
    fechaISO: str
    fecha: str
    hora: str
    estatusChecklist: Dict[str, bool]

class Registro(BaseModel):
    folio: str
    ente: str
    tipoEnte: Optional[str] = None
    tipoEnteNombre: Optional[str] = None
    sector: Optional[str] = None
    noOficio: str
    asunto: str
    fecha: str
    presidente: str
    tipoLicitacion: Optional[str] = None
    clasificacion: Optional[str] = None
    fuentes: Optional[List[str]] = []
    estatusGeneral: Optional[Dict[str, bool]] = {}
    fechasSesiones: List[Sesion] = []
    createdAt: str = datetime.utcnow().isoformat()

# -------------------------
# Almacenamiento en archivo
# -------------------------
DATA_FILE = Path(__file__).resolve().parent / "data.json"

def read_all():
    if not DATA_FILE.exists():
        return []
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def write_all(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

# -------------------------
# Endpoints
# -------------------------
@app.get("/")
def root():
    return {"message": "✅ FastAPI está corriendo!"}

@app.get("/ping")
def ping():
    return {"status": "ok"}

@app.get("/sesiones")
def get_sesiones():
    return read_all()

@app.post("/sesiones")
def create_sesion(registro: Registro):
    data = read_all()
    data.append(registro.dict())
    write_all(data)
    return {"message": "Sesión guardada con éxito", "folio": registro.folio}