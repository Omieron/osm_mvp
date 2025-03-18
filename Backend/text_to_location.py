from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
from geopy.extra.rate_limiter import RateLimiter

def get_location_coordinates(place_name):
    try:
        geolocator = Nominatim(user_agent="text-to-location", timeout=10)
        geocode = RateLimiter(geolocator.geocode, min_delay_seconds=1)
        location = geocode(place_name)
        if location:
            return location.latitude, location.longitude
        else:
            print("Yer bulunamadı.")
            return None
    except GeocoderTimedOut:
        print("Zaman aşımı hatası.")
        return None
    except GeocoderServiceError:
        print("Servis hatası.")
        return None

if __name__ == "__main__":
    place_name = input("Yer ismi girin: ")
    coordinates = get_location_coordinates(place_name)
    if coordinates:
        print(f"{place_name} koordinatları: Enlem = {coordinates[0]}, Boylam = {coordinates[1]}")