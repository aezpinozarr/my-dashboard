# app/routers/sesiones_fuentes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from typing import List

from app import schemas
from app.db import get_db

router = APIRouter(
    prefix="/sesiones-fuentes",
    tags=["Sesiones - Fuentes de financiamiento"]
)

# ===========================
# Crear vínculo sesión - fuente financiamiento (usa SP en 'procesos')
# ===========================
@router.post("/", response_model=int)
def add_fuente_to_sesion(fuente: schemas.SesionFuenteCreate, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("""
                SELECT procesos.sp_calendario_sesiones_fuentes_financiamiento_gestionarv2(
                    :accion, :id_calendario_sesiones, :id_fuente_financiamiento
                ) AS result
            """),
            {
                "accion": "NUEVO",
                "id_calendario_sesiones": fuente.id_calendario_sesiones,
                "id_fuente_financiamiento": fuente.id_fuente_financiamiento
            }
        ).fetchone()
        db.commit()
        return result.result
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creando vínculo: {str(e)}")


# ===========================
# Eliminar vínculo sesión - fuente financiamiento (usa SP en 'procesos')
# ===========================
@router.delete("/{id_calendario_sesiones}/{id_fuente_financiamiento}", response_model=int)
def delete_fuente_from_sesion(id_calendario_sesiones: int, id_fuente_financiamiento: int, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("""
                SELECT procesos.sp_calendario_sesiones_fuentes_financiamiento_gestionarv2(
                    :accion, :id_calendario_sesiones, :id_fuente_financiamiento
                ) AS result
            """),
            {
                "accion": "ELIMINAR",
                "id_calendario_sesiones": id_calendario_sesiones,
                "id_fuente_financiamiento": id_fuente_financiamiento
            }
        ).fetchone()
        db.commit()
        return result.result
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error eliminando vínculo: {str(e)}")


# ===========================
# Listar fuentes por sesión (SELECT a tablas)
# ===========================
@router.get("/{id_calendario_sesiones}", response_model=List[schemas.SesionFuenteOut])
def list_fuentes_by_sesion(id_calendario_sesiones: int, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("""
                SELECT 
                    sf.id_calendario_sesiones,
                    sf.id_fuente_financiamiento,
                    f.descripcion AS fuente_descripcion
                FROM procesos.calendario_sesiones_fuentes_financiamiento sf
                JOIN catalogos.cat_fuente_financiamiento f
                  ON sf.id_fuente_financiamiento = f.id
                WHERE sf.id_calendario_sesiones = :id_calendario_sesiones
                ORDER BY sf.id_fuente_financiamiento
            """),
            {"id_calendario_sesiones": id_calendario_sesiones}
        ).mappings().all()

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listando fuentes: {str(e)}")