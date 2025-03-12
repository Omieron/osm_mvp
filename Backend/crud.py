from sqlalchemy.orm import Session
from shapely.geometry import Polygon
from geoalchemy2.shape import from_shape
from models import Building  # models.py içindeki Building modelini ekle

def insert_buildings(db: Session, osm_data):
    for element in osm_data["elements"]:
        if element["type"] == "way" and "geometry" in element:
            coordinates = [(node["lon"], node["lat"]) for node in element["geometry"]]
            polygon = Polygon(coordinates)  # Shapely Polygon'a çevir
            geom_wkt = from_shape(polygon, srid=4326)  # GeoAlchemy formatına çevir

            new_building = Building(
                name=element["tags"].get("name", "Bilinmeyen"),
                geom=geom_wkt
            )
            db.add(new_building)
    db.commit()