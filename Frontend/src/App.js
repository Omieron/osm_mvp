import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import ChatBot from './components/ChatBot';
import './App.css';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const App = () => {
  const [mapCenter, setMapCenter] = useState([41.0082, 28.9784]);
  const [mapZoom, setMapZoom] = useState(14);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [buildingCount, setBuildingCount] = useState(null);
  const [searchRadius, setSearchRadius] = useState(500);

  // Process location from chatbot
  const handleLocationFromChat = async (location) => {
    setSelectedLocation(location);
    setMapCenter([location.lat, location.lon]);
    setMapZoom(16);
    fetchBuildings(location.lat, location.lon);
  };

  // Fetch buildings from backend API
  const fetchBuildings = async (lat, lon) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/search/?lat=${lat}&lon=${lon}&category=building`);
      
      if (response.data && response.data.elements) {
        setBuildings(response.data.elements);
        
        // Also fetch building count
        const countResponse = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/building_count/?lat=${lat}&lon=${lon}&radius=1000`);
        if (countResponse.data && countResponse.data.count !== undefined) {
          setBuildingCount(countResponse.data.count);
        }
      }
    } catch (error) {
      console.error('Error fetching buildings:', error);
    }
  };

  // Handle map click
  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    setSelectedLocation({ lat, lon: lng });
    fetchBuildings(lat, lng);
  };

  // Get color for buildings based on type
  const getBuildingColor = (buildingType) => {
    switch (buildingType) {
      case 'residential': return 'orange';
      case 'school': return 'blue';
      case 'mosque': return 'green';
      case 'hospital': return 'red';
      case 'office': return 'purple';
      default: return 'gray';
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>OSM Map and Chat</h1>
      </header>
      
      <main className="main-content">
        <div className="map-container">
          <MapContainer 
            center={mapCenter} 
            zoom={mapZoom} 
            style={{ height: '100%', width: '100%' }}
            onClick={handleMapClick}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {selectedLocation && (
              <>
                <Marker position={[selectedLocation.lat, selectedLocation.lon]}>
                  <Popup>
                    Selected Location: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lon.toFixed(6)}
                    {selectedLocation.address && <div>Address: {selectedLocation.address}</div>}
                    {buildingCount !== null && <div>Buildings within 1km: {buildingCount}</div>}
                  </Popup>
                </Marker>
                
                <Circle 
                  center={[selectedLocation.lat, selectedLocation.lon]}
                  radius={searchRadius}
                  pathOptions={{ color: 'blue', fillColor: '#add8e6', fillOpacity: 0.1 }}
                />
              </>
            )}
            
            {buildings.map((element, index) => {
              if (element.type === 'way' && element.geometry) {
                const coords = element.geometry.map(p => [p.lat, p.lon]);
                const buildingType = element.tags?.building || 'default';
                const color = getBuildingColor(buildingType);
                
                return (
                  <Polygon 
                    key={`building-${index}`}
                    positions={coords}
                    pathOptions={{ color, fillOpacity: 0.6 }}
                  >
                    <Popup>
                      {element.tags?.name || 'Building'}<br />
                      Type: {buildingType}
                    </Popup>
                  </Polygon>
                );
              }
              return null;
            })}
          </MapContainer>
          
          <div className="info-panel">
            {buildingCount !== null && (
              <div className="building-count">
                Buildings within 1km: {buildingCount}
              </div>
            )}
            
            <div className="legend">
              <h4>Building Types</h4>
              <div><span className="color-block" style={{ backgroundColor: 'orange' }}></span> Residential</div>
              <div><span className="color-block" style={{ backgroundColor: 'blue' }}></span> School</div>
              <div><span className="color-block" style={{ backgroundColor: 'green' }}></span> Mosque</div>
              <div><span className="color-block" style={{ backgroundColor: 'red' }}></span> Hospital</div>
              <div><span className="color-block" style={{ backgroundColor: 'purple' }}></span> Office</div>
              <div><span className="color-block" style={{ backgroundColor: 'gray' }}></span> Other</div>
            </div>
          </div>
        </div>
        
        <div className="chatbot-container">
          <ChatBot onLocationExtracted={handleLocationFromChat} />
        </div>
      </main>
    </div>
  );
};

export default App;