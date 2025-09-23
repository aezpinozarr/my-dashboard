# backend/app/schemas.py
from typing import Literal, Optional, Dict, List
from pydantic import BaseModel, Field, ConfigDict

class SesionFecha(BaseModel):
    fechaISO: Optional[str] = None
    fecha: str
    hora: str
    estatusChecklist: Dict[str, bool] = Field(default_factory=dict)

    # Ignorar campos extra por si el front manda algo adicional
    model_config = ConfigDict(extra="ignore")

class SesionIn(BaseModel):
    folio: str
    ente: str
    tipoEnte: Optional[str] = None
    tipoEnteNombre: Optional[str] = None
    sector: Optional[str] = None

    noOficio: str
    asunto: str

    # La tienes como dd/mm/aaaa en el front; la guardamos como string tal cual
    fecha: Optional[str] = None

    presidente: str
    tipoLicitacion: Literal["Simplificado", "Pública"]
    clasificacion: Optional[str] = None
    fuentes: List[str] = Field(default_factory=list)

    # Lista de fechas de sesión que armas en el front
    fechasSesiones: List[SesionFecha] = Field(default_factory=list)

    # Estatus global independiente
    estatusGeneral: Dict[str, bool] = Field(default_factory=dict)

    # Lo mandas cuando guardas
    createdAt: Optional[str] = None

    model_config = ConfigDict(extra="ignore")

class SesionOut(SesionIn):
    id: int