# app/db.py
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Cadena de conexión a PostgreSQL
DATABASE_URL = f"postgresql://{settings.db_user}:{settings.db_password}@{settings.db_host}:{settings.db_port}/{settings.db_name}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ejecutar_funcion(nombre_funcion: str, params: tuple, db):
    """
    Ejecuta un procedimiento almacenado que devuelve un solo valor (ej. id).
    """
    placeholders = ",".join([f":p{i}" for i in range(len(params))])
    query = text(f"SELECT {nombre_funcion}({placeholders}) AS result")

    result = db.execute(
        query, {f"p{i}": params[i] for i in range(len(params))}
    ).fetchone()

    return result.result

def ejecutar_tabla(nombre_funcion: str, params: tuple, db):
    """
    Ejecuta un procedimiento almacenado que devuelve una tabla (varias filas).
    """
    placeholders = ",".join([f":p{i}" for i in range(len(params))])
    query = text(f"SELECT * FROM {nombre_funcion}({placeholders})")
    result = db.execute(query, {f"p{i}": params[i] for i in range(len(params))}).fetchall()
    return result