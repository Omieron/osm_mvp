from sqlalchemy import Column, Integer, String, TIMESTAMP
from geoalchemy2 import Geometry
from database import Base

class Building(Base):
    __tablename__ = "buildings"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    geom = Column(Geometry("POLYGON", srid=4326))

class Shop(Base):
    __tablename__ = "shops"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    category = Column(String)
    geom = Column(Geometry("POINT", srid=4326))

class Road(Base):
    __tablename__ = "roads"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    highway_type = Column(String)
    geom = Column(Geometry("LINESTRING", srid=4326))