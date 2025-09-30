# app/routers/clientes.py
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
from app import schemas
from app.db import get_db

router = APIRouter(prefix="/clientes", tags=["clientes"])

# ===========================
# Crear cliente (usa sp_clientes_gestionar con acción NUEVO)
# ===========================
@router.post("/", response_model=schemas.ClienteOut)
def create_cliente(cliente: schemas.ClienteCreate, db: Session = Depends(get_db)):
    nuevo_id = db.execute(
        text("""
            SELECT sp_clientes_gestionar(
                :accion,
                NULL,
                :nombre,
                :edad,
                NOW()::timestamp
            )
        """),
        {"accion": "NUEVO", "nombre": cliente.nombre, "edad": cliente.edad},
    ).scalar()
    db.commit()

    result = db.execute(
        text("SELECT * FROM sp_clientes_consultar(:p_id)"),
        {"p_id": nuevo_id}
    ).fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="Cliente no encontrado tras la creación")

    return {
        "id": result.id,
        "nombre": result.nombre,
        "edad": result.edad,
        "fecha_creacion": result.fecha_creacion,
    }


# ===========================
# Listar clientes (con búsqueda opcional)
# ===========================
@router.get("/", response_model=list[schemas.ClienteOut])
def list_clientes(
    db: Session = Depends(get_db),
    search: Optional[str] = Query(None, description="Buscar por id o nombre")
):
    if search:
        try:
            search_id = int(search)
            result = db.execute(
                text("SELECT * FROM sp_clientes_consultar(:p_id)"),
                {"p_id": search_id}
            ).fetchall()
        except ValueError:
            result = db.execute(
                text("""
                    SELECT id, nombre, edad, fecha_creacion
                    FROM clientes
                    WHERE nombre ILIKE :nombre
                    ORDER BY id
                """),
                {"nombre": f"%{search}%"}
            ).fetchall()
    else:
        result = db.execute(
            text("SELECT * FROM sp_clientes_consultar(-99)")
        ).fetchall()

    return [
        {
            "id": row.id,
            "nombre": row.nombre,
            "edad": row.edad,
            "fecha_creacion": row.fecha_creacion,
        }
        for row in result
    ]


# ===========================
# Obtener un cliente específico por ID
# ===========================
@router.get("/{cliente_id}", response_model=schemas.ClienteOut)
def get_cliente(cliente_id: int, db: Session = Depends(get_db)):
    result = db.execute(
        text("SELECT * FROM sp_clientes_consultar(:p_id)"),
        {"p_id": cliente_id}
    ).fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    return {
        "id": result.id,
        "nombre": result.nombre,
        "edad": result.edad,
        "fecha_creacion": result.fecha_creacion,
    }


# ===========================
# Editar cliente (usa sp_clientes_gestionar con acción EDITAR)
# ===========================
@router.put("/{cliente_id}", response_model=schemas.ClienteOut)
def update_cliente(cliente_id: int, cliente: schemas.ClienteCreate, db: Session = Depends(get_db)):
    resultado = db.execute(
        text("""
            SELECT sp_clientes_gestionar(
                :accion,
                :id,
                :nombre,
                :edad,
                NOW()::timestamp
            )
        """),
        {"accion": "EDITAR", "id": cliente_id, "nombre": cliente.nombre, "edad": cliente.edad},
    ).scalar()
    db.commit()

    if resultado != 1:
        raise HTTPException(status_code=404, detail="Cliente no encontrado para edición")

    result = db.execute(
        text("SELECT * FROM sp_clientes_consultar(:p_id)"),
        {"p_id": cliente_id}
    ).fetchone()

    return {
        "id": result.id,
        "nombre": result.nombre,
        "edad": result.edad,
        "fecha_creacion": result.fecha_creacion,
    }


# ===========================
# Eliminar cliente (usa sp_clientes_gestionar con acción ELIMINAR)
# ===========================
@router.delete("/{cliente_id}")
def delete_cliente(cliente_id: int, db: Session = Depends(get_db)):
    resultado = db.execute(
        text("""
            SELECT sp_clientes_gestionar(
                :accion,
                :id,
                NULL,
                NULL,
                NULL
            )
        """),
        {"accion": "ELIMINAR", "id": cliente_id},
    ).scalar()
    db.commit()

    if resultado != 1:
        raise HTTPException(status_code=404, detail="Cliente no encontrado para eliminación")

    return {"message": "Cliente eliminado correctamente"}