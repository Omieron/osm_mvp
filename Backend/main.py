from fastapi import FastAPI, Depends, Query, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database import get_db
from geoalchemy2.functions import ST_AsGeoJSON, ST_DWithin, ST_Transform
from shapely.geometry import Point
from geoalchemy2.shape import from_shape
from fastapi.middleware.cors import CORSMiddleware
import json
import requests
import os
import tempfile
import whisper
import numpy as np
from pydantic import BaseModel
from typing import Optional, List
import geopy
from geopy.geocoders import Nominatim
from models import Building, Base
from crud import insert_buildings
from database import engine

# Initialize the database tables
Base.metadata.create_all(bind=engine)

# Load Whisper model
model = whisper.load_model("base")

app = FastAPI()

# Allow CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LocationQuery(BaseModel):
    text: str

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
        insert_buildings(db, osm_data)  # Save to database
        return osm_data
    else:
        return {"error": "Couldn't get data from OSM"}
    
@app.get("/buildings/")
def get_buildings(db: Session = Depends(get_db)):
    buildings = db.query(Building.id, Building.name, ST_AsGeoJSON(Building.geom)).all()
    
    geojson_features = []
    for building in buildings:
        geojson_features.append({
            "type": "Feature",
            "geometry": json.loads(building[2]),  # Convert ST_AsGeoJSON to json
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
    # Define the user point as a Point
    point = f"SRID=4326;POINT({lon} {lat})"

    # Transform geometries to EPSG:3857 (metric system) with ST_Transform
    count = db.query(Building).filter(
        ST_DWithin(
            ST_Transform(Building.geom, 3857),  # Convert geometry to metric SRID
            ST_Transform(from_shape(Point(lon, lat), srid=4326), 3857),  # Also convert user location to metric system
            radius
        )
    ).count()

    return {"count": count}

@app.post("/speech_to_text/")
async def speech_to_text(file: UploadFile = File(...)):
    try:
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            # Write the audio file to the temporary file
            tmp.write(await file.read())
            tmp_path = tmp.name

        # Transcribe the audio file using Whisper
        result = model.transcribe(tmp_path)
        
        # Clean up the temporary file
        os.unlink(tmp_path)
        
        return {"text": result["text"]}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")

@app.post("/extract_location/")
async def extract_location(query: LocationQuery):
    try:
        # Initialize the geocoder
        geolocator = Nominatim(user_agent="osm-chatbot-app")
        
        # Try to extract location from the text
        location = geolocator.geocode(query.text, exactly_one=True)
        
        if location:
            return {
                "success": True,
                "location": {
                    "lat": location.latitude,
                    "lon": location.longitude,
                    "address": location.address
                }
            }
        else:
            return {
                "success": False,
                "message": "Could not extract location from text"
            }
    
    except Exception as e:
        return {
            "success": False,
            "message": f"Error extracting location: {str(e)}"
        }