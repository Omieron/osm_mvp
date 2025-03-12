from fastapi import FastAPI, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from geoalchemy2.functions import ST_AsGeoJSON, ST_DWithin, ST_Transform
from shapely.geometry import Point
from geoalchemy2.shape import from_shape
from fastapi.middleware.cors import CORSMiddleware
import json
import requests
from models import Building
from crud import insert_buildings

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500"],  # Gerekirse belirli domainleri ekleyebilirsin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/search/")
def search_osm(lat: float, lon: float, category: str, db: Session = Depends(get_db)):
    overpass_url = "https://overpass-api.de/api/interpreter"
    query = f"""
    [out:json];
    (
      node["{category}"](around:500, {lat}, {lon});
      way["{category}"](around:500, {lat}, {lon});
      relation["{category}"](around:500, {lat}, {lon});
    );
    out geom;
    """
    response = requests.get(overpass_url, params={"data": query})
    
    if response.status_code == 200:
        osm_data = response.json()
        insert_buildings(db, osm_data)  # Veritabanına kaydet
        return osm_data
    else:
        return {"error": "OSM'den veri alınamadı"}
    
@app.get("/buildings/")
def get_buildings(db: Session = Depends(get_db)):
    buildings = db.query(Building.id, Building.name, ST_AsGeoJSON(Building.geom)).all()
    
    geojson_features = []
    for building in buildings:
        geojson_features.append({
            "type": "Feature",
            "geometry": json.loads(building[2]),  # ST_AsGeoJSON dönen veriyi json'a çevir
            "properties": {
                "id": building[0],
                "name": building[1]
            }
        })
    
    return {"type": "FeatureCollection", "features": geojson_features}

@app.get("/building_count/")
def get_building_count(
    lat: float = Query(...),
    lon: float = Query(...),
    radius: int = 1000,
    db: Session = Depends(get_db)
):
    # Kullanıcı noktasını Point olarak tanımla
    point = f"SRID=4326;POINT({lon} {lat})"

    # ST_Transform ile geometrileri EPSG:3857 (metrik sistem) formatına çevir
    count = db.query(Building).filter(
        ST_DWithin(
            ST_Transform(Building.geom, 3857),  # Geometrik veriyi metrik SRID'ye çevir
            ST_Transform(from_shape(Point(lon, lat), srid=4326), 3857),  # Kullanıcı konumunu da metrik sisteme çevir
            radius
        )
    ).count()

    return {"count": count}