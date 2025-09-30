from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db import get_db
from pydantic import BaseModel

router = APIRouter(prefix="/sesiones-entregables", tags=["sesiones-entregables"])

# ===========================
# Schemas
# ===========================
class EntregableIn(BaseModel):
    id_calendario_sesiones: int
    id_listado_entregables: int

# ===========================
# Agregar entregable a sesión
# ===========================
@router.post("/")
def add_entregable(payload: EntregableIn, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("""
                SELECT procesos.sp_calendario_sesiones_listado_entregables_gestionar(
                    :accion, :id_calendario_sesiones, :id_listado_entregables
                ) AS result
            """),
            {
                "accion": "NUEVO",
                "id_calendario_sesiones": payload.id_calendario_sesiones,
                "id_listado_entregables": payload.id_listado_entregables,
            }
        ).fetchone()
        db.commit()
        return {"status": "ok", "result": result.result}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ===========================
# Eliminar entregable de sesión
# ===========================
@router.delete("/")
def delete_entregable(payload: EntregableIn, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("""
                SELECT procesos.sp_calendario_sesiones_listado_entregables_gestionar(
                    :accion, :id_calendario_sesiones, :id_listado_entregables
                ) AS result
            """),
            {
                "accion": "ELIMINAR",
                "id_calendario_sesiones": payload.id_calendario_sesiones,
                "id_listado_entregables": payload.id_listado_entregables,
            }
        ).fetchone()
        db.commit()
        return {"status": "deleted", "result": result.result}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ===========================
# Listar entregables vinculados a una sesión
# ===========================
@router.get("/")
def list_entregables(id_calendario_sesiones: int, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("""
                SELECT csl.id_calendario_sesiones,
                       csl.id_listado_entregables,
                       cle.descripcion
                FROM procesos.calendario_sesiones_listado_entregables csl
                JOIN catalogos.cat_listado_sesiones_entregables cle
                  ON cle.id = csl.id_listado_entregables
                WHERE csl.id_calendario_sesiones = :id_calendario_sesiones
            """),
            {"id_calendario_sesiones": id_calendario_sesiones}
        ).mappings().all()

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))