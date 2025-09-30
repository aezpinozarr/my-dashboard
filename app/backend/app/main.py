# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import clientes, catalogos, sesiones, sesiones_fuentes, sesiones_fechas, sesiones_entregables
from app.config import settings

app = FastAPI()

# Configuración de CORS
origins = settings.cors_origins.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas
app.include_router(clientes.router)
app.include_router(catalogos.router)
app.include_router(sesiones.router)
app.include_router(sesiones_fuentes.router)
app.include_router(sesiones_fechas.router)
app.include_router(sesiones_entregables.router)