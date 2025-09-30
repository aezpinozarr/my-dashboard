# app/routers/sesiones.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from app.schemas import EntregableOut
from app.db import get_db
from app import schemas

router = APIRouter(prefix="/sesiones", tags=["sesiones"])


# ===========================
# Crear sesión
# ===========================
@router.post("/", response_model=int)
def create_sesion(sesion: schemas.SesionCreate, db: Session = Depends(get_db)):
    try:
        nuevo_id = db.execute(
            text("""
                SELECT procesos.sp_calendario_sesiones_gestionar(
                    :accion, :p_id, :id_ente, :id_usuario, :oficio_o_acta_numero,
                    :asunto, CAST(:fecha AS date), :id_servidor_publico,
                    CAST(:modo_sesion AS text), CAST(:comite AS text),
                    :id_clasificacion_licitacion, :activo, :creado_en
                ) AS result
            """),
            {
                "accion": "NUEVO",
                "p_id": None,
                "id_ente": sesion.id_ente,
                "id_usuario": sesion.id_usuario,
                "oficio_o_acta_numero": sesion.oficio_o_acta_numero,
                "asunto": sesion.asunto,
                "fecha": sesion.fecha,
                "id_servidor_publico": sesion.id_servidor_publico,
                "modo_sesion": sesion.modo_sesion,
                "comite": sesion.comite,
                "id_clasificacion_licitacion": sesion.id_clasificacion_licitacion,
                "activo": sesion.activo,
                "creado_en": None,
            }
        ).fetchone()
        db.commit()
        return nuevo_id.result
    except Exception as e:
        db.rollback()
        print("❌ Error en create_sesion:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ===========================
# Editar sesión
# ===========================
@router.put("/{sesion_id}", response_model=int)
def update_sesion(sesion_id: int, sesion: schemas.SesionUpdate, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("""
                SELECT procesos.sp_calendario_sesiones_gestionar(
                    :accion, :p_id, :id_ente, :id_usuario, :oficio_o_acta_numero,
                    :asunto, CAST(:fecha AS date), :id_servidor_publico,
                    CAST(:modo_sesion AS text), CAST(:comite AS text),
                    :id_clasificacion_licitacion, :activo, :creado_en
                ) AS result
            """),
            {
                "accion": "EDITAR",
                "p_id": sesion_id,
                "id_ente": sesion.id_ente,
                "id_usuario": sesion.id_usuario,
                "oficio_o_acta_numero": sesion.oficio_o_acta_numero,
                "asunto": sesion.asunto,
                "fecha": sesion.fecha,
                "id_servidor_publico": sesion.id_servidor_publico,
                "modo_sesion": sesion.modo_sesion,
                "comite": sesion.comite,
                "id_clasificacion_licitacion": sesion.id_clasificacion_licitacion,
                "activo": sesion.activo,
                "creado_en": None,
            }
        ).fetchone()
        db.commit()
        if result.result == 0:
            raise HTTPException(status_code=404, detail="Sesión no encontrada")
        return result.result
    except Exception as e:
        db.rollback()
        print("❌ Error en update_sesion:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ===========================
# Eliminar sesión
# ===========================
@router.delete("/{sesion_id}", response_model=int)
def delete_sesion(sesion_id: int, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("""
                SELECT procesos.sp_calendario_sesiones_gestionar(
                    :accion, :p_id, :id_ente, :id_usuario, :oficio_o_acta_numero,
                    :asunto, :fecha, :id_servidor_publico,
                    :modo_sesion, :comite,
                    :id_clasificacion_licitacion, :activo, :creado_en
                ) AS result
            """),
            {
                "accion": "ELIMINAR",
                "p_id": sesion_id,
                "id_ente": None,
                "id_usuario": None,
                "oficio_o_acta_numero": None,
                "asunto": None,
                "fecha": None,
                "id_servidor_publico": None,
                "modo_sesion": None,
                "comite": None,
                "id_clasificacion_licitacion": None,
                "activo": None,
                "creado_en": None,
            }
        ).fetchone()
        db.commit()
        if result.result == 0:
            raise HTTPException(status_code=404, detail="Sesión no encontrada")
        return result.result
    except Exception as e:
        db.rollback()
        print("❌ Error en delete_sesion:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ===========================
# Listar sesiones
# ===========================
@router.get("/", response_model=List[schemas.SesionOut])
def list_sesiones(db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("SELECT * FROM procesos.sp_calendario_sesiones(:p_id, :p_id_ente, :p_id_servidor_publico, :p_id_clasificacion_licitacion, :p_fecha1, :p_fecha2)"),
            {
                "p_id": -99,
                "p_id_ente": "-99",
                "p_id_servidor_publico": -99,
                "p_id_clasificacion_licitacion": -99,
                "p_fecha1": "1900-01-01",
                "p_fecha2": "2100-12-31"
            }
        ).mappings().all()
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===========================
# Listado de entregables por sesión (popular checkboxes)
# ===========================
@router.get("/entregables-popular", response_model=List[EntregableOut])
def get_entregables_popular(
    p_id: Optional[int] = -99,
    p_id_calendario_sesiones: Optional[int] = -99,
    db: Session = Depends(get_db),
):
    try:
        result = db.execute(
            text("""
                SELECT * FROM procesos.sp_calendario_sesiones_listado_entregables_popular(:p_id, :p_id_calendario_sesiones)
            """),
            {"p_id": int(p_id), "p_id_calendario_sesiones": int(p_id_calendario_sesiones)}
        ).mappings().all()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno al obtener entregables")
    

# ===========================
# Obtener una sesión por ID
# ===========================
@router.get("/{sesion_id}", response_model=schemas.SesionOut)
def get_sesion(sesion_id: int, db: Session = Depends(get_db)):
    try:
        result = db.execute(
            text("""
                SELECT * FROM procesos.sp_calendario_sesiones(
                    :p_id, :p_id_ente, :p_id_servidor_publico,
                    :p_id_clasificacion_licitacion, :p_fecha1, :p_fecha2
                )
            """),
            {
                "p_id": sesion_id,
                "p_id_ente": "-99",
                "p_id_servidor_publico": -99,
                "p_id_clasificacion_licitacion": -99,
                "p_fecha1": "1900-01-01",
                "p_fecha2": "2100-12-31"
            }
        ).mappings().first()

        if not result:
            raise HTTPException(status_code=404, detail="Sesión no encontrada")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))