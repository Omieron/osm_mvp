import requests

def get_osm_data(lat, lon, category):
    query = f"""
    [out:json];
    (
        way["{category}"](around:1000,{lat},{lon});
    );
    out geom;
    """
    
    response = requests.get(f"https://overpass-api.de/api/interpreter?data={query}")

    if response.status_code == 200:
        return response.json()
    print("Overpass API Hatası:", response.text)
    return None