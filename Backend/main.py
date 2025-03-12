from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import get_db
from overpass import get_osm_data
from geoalchemy2.functions import ST_AsGeoJSON
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