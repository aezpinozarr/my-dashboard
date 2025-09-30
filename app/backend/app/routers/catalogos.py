from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List
from app import schemas
from app.db import get_db
from app.schemas import (
    ClasificacionLicitacionOut,
    EnteOut,
    ServidorPublicoOut,
)

router = APIRouter(prefix="/catalogos", tags=["Catálogos"])

# ===========================
# Clasificación de licitación
# ===========================
@router.get("/clasificacion-licitacion", response_model=List[ClasificacionLicitacionOut])
def get_clasificacion_licitacion(
    p_id: Optional[int] = Query(-99, description="ID de la clasificación (-99 para todos)"),
    db: Session = Depends(get_db),
):
    try:
        rows = db.execute(
            text("SELECT * FROM catalogos.sp_cat_clasificacion_licitacion(:p_id)"),
            {"p_id": int(p_id)}
        ).mappings().all()
        return [ClasificacionLicitacionOut(**row) for row in rows]
    except Exception as e:
        print("❌ Error en /catalogos/clasificacion-licitacion:", repr(e))
        raise HTTPException(status_code=500, detail="Error interno al obtener clasificación de licitación")


# ===========================
# Entes
# ===========================
@router.get("/entes", response_model=List[EnteOut])
def get_entes(
    p_id: Optional[str] = Query("-99", description="ID del ente (-99 para todos)"),
    p_descripcion: Optional[str] = Query("-99", description="Descripción del ente (-99 para todos)"),
    db: Session = Depends(get_db)
):
    try:
        result = db.execute(
            text("SELECT * FROM catalogos.sp_cat_ente(:p_id, :p_descripcion)"),
            {"p_id": p_id, "p_descripcion": p_descripcion}
        ).mappings().all()

        return [EnteOut(**row) for row in result]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en /entes: {str(e)}")


# ===========================
# Servidores públicos
# ===========================
@router.get("/servidores-publicos", response_model=List[ServidorPublicoOut])
def get_servidores_publicos(
    p_id: Optional[int] = Query(-99, description="ID del servidor público (-99 para todos)"),
    db: Session = Depends(get_db)
):
    try:
        result = db.execute(
            text("SELECT * FROM catalogos.sp_cat_servidor_publico(:p_id)"),
            {"p_id": p_id}
        ).mappings().all()
        return [ServidorPublicoOut(**row) for row in result]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en /servidores-publicos: {str(e)}")


# ===========================
# Enums (catálogos fijos desde schema procesos)
# ===========================
@router.get("/comite")
def get_enum_comite(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT * FROM procesos.sp_enum_comite()")).mappings().all()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en /comite: {str(e)}")


@router.get("/modo-sesion")
def get_enum_modo_sesion(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT * FROM procesos.sp_enum_modo_sesion()")).mappings().all()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en /modo-sesion: {str(e)}")


# ===========================
# Fuentes de financiamiento
# ===========================
@router.get("/fuentes-financiamiento", response_model=List[schemas.FuenteFinanciamiento])
def get_fuentes_financiamiento(db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("SELECT id, descripcion FROM catalogos.cat_fuente_financiamiento ORDER BY id")
        ).mappings().all()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en /fuentes-financiamiento: {str(e)}")


# ===========================
# Servidores públicos por ente
# ===========================
@router.get("/servidores-publicos-ente")
def get_servidores_publicos_ente(
    p_id: Optional[int] = Query(-99, description="ID del servidor público (-99 para todos)"),
    p_id_ente: Optional[str] = Query("-99", description="ID del ente (-99 para todos)"),
    db: Session = Depends(get_db),
):
    try:
        p_id_casted = int(p_id) if p_id is not None else -99
        p_id_ente_casted = str(p_id_ente) if p_id_ente not in (None, -99) else "-99"

        sql = text("""
            SELECT *
            FROM catalogos.sp_servidor_publico_ente(
                CAST(:p_id AS smallint),
                CAST(:p_id_ente AS varchar)
            )
        """)

        rows = db.execute(sql, {"p_id": p_id_casted, "p_id_ente": p_id_ente_casted}).mappings().all()
        return [dict(r) for r in rows]

    except Exception as e:
        print("❌ Error en /servidores-publicos-ente:", repr(e))
        raise HTTPException(status_code=500, detail="Error interno al obtener servidores públicos por ente")