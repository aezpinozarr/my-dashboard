from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from typing import List
from app.db import get_db
from app import schemas

router = APIRouter(
    prefix="/sesiones-fechas",
    tags=["Sesiones - Fechas"]
)

# ===========================
# Crear nueva fecha
# ===========================
@router.post("/", response_model=int)
def create_fecha(data: schemas.SesionFechaCreate, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("""
                SELECT procesos.sp_calendario_sesiones_fechas_gestionar(
                    :accion, NULL, :id_calendario_sesiones, :fecha, :hora, :activo
                ) AS result
            """),
            {
                "accion": "NUEVO",
                "id_calendario_sesiones": data.id_calendario_sesiones,
                "fecha": data.fecha,
                "hora": data.hora.replace(tzinfo=None) if hasattr(data.hora, "tzinfo") else data.hora,
                "activo": data.activo
            }
        ).fetchone()
        db.commit()
        return result.result
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ===========================
# Editar fecha existente
# ===========================
@router.put("/", response_model=int)
def update_fecha(data: schemas.SesionFechaUpdate, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("""
                SELECT procesos.sp_calendario_sesiones_fechas_gestionar(
                    :accion, :id, NULL, :fecha, :hora, true
                ) AS result
            """),
            {
                "accion": "EDITAR",
                "id": data.id,
                "fecha": data.fecha,
                "hora": data.hora.replace(tzinfo=None) if hasattr(data.hora, "tzinfo") else data.hora
            }
        ).fetchone()
        db.commit()
        return result.result
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ===========================
# Eliminar (desactivar) fecha
# ===========================
@router.delete("/{id}", response_model=int)
def delete_fecha(id: int, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("""
                SELECT procesos.sp_calendario_sesiones_fechas_gestionar(
                    :accion, :id, NULL, NULL, NULL, false
                ) AS result
            """),
            {
                "accion": "ELIMINAR",
                "id": id
            }
        ).fetchone()
        db.commit()
        return result.result
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ===========================
# Consultar fechas
# ===========================
@router.get("/", response_model=List[schemas.SesionFechaOut])
def list_fechas(
    id: int = -99,
    id_calendario_sesiones: int = -99,
    db: Session = Depends(get_db)
):
    try:
        result = db.execute(
            text("""
                SELECT * 
                FROM procesos.sp_calendario_sesiones_fechas(:id, :id_calendario_sesiones)
            """),
            {
                "id": id,
                "id_calendario_sesiones": id_calendario_sesiones
            }
        ).fetchall()

        rows = [dict(r) for r in result]
        if id_calendario_sesiones != -99:
            rows = [r for r in rows if r["id_calendario_sesiones"] == id_calendario_sesiones]

        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/by-sesion/{id_calendario_sesiones}")
def list_fechas_by_sesion(id_calendario_sesiones: int, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("""
                SELECT id, id_calendario_sesiones, fecha, hora, activo
                FROM procesos.calendario_sesiones_fechas
                WHERE id_calendario_sesiones = :id_calendario_sesiones
                ORDER BY fecha, hora
            """),
            {"id_calendario_sesiones": id_calendario_sesiones}
        ).mappings().all()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))