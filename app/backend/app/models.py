# app/models.py
from sqlalchemy import Column, Integer, String, DateTime, func
from app.db import Base

class Cliente(Base):
    __tablename__ = "clientes"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    edad = Column(Integer, nullable=False)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())