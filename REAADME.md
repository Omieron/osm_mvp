# OSM Map and Chat Application

This application combines OpenStreetMap data with a chatbot interface that allows users to search for locations using voice commands. The application shows buildings and other map features around a specified location.

## Features

- Interactive map showing buildings and structures around a location
- Voice-activated chatbot using Whisper AI for speech-to-text conversion
- Location extraction from natural language text
- Building count and type visualization
- Fully containerized with Docker for easy deployment

## Tech Stack

- **Frontend**: React, React Leaflet, Axios
- **Backend**: FastAPI, SQLAlchemy, GeoAlchemy2
- **Database**: PostgreSQL with PostGIS extension
- **AI Components**: OpenAI Whisper for speech-to-text
- **Containerization**: Docker and Docker Compose

## Project Structure

```
.
├── Backend/
│   ├── crud.py               # Database operations
│   ├── database.py           # Database connection
│   ├── Dockerfile            # Backend container definition
│   ├── init_db.py            # Database initialization
│   ├── main.py               # FastAPI endpoints
│   ├── models.py             # SQLAlchemy models
│   ├── overpass.py           # OpenStreetMap API interaction
│   ├── requirements.txt      # Python dependencies
│   └── schemas.py            # Pydantic schemas
├── Frontend/
│   ├── Dockerfile            # Frontend container definition
│   ├── package.json          # NPM dependencies
│   ├── public/               # Static assets
│   └── src/                  # React source code
│       ├── App.js            # Main application component
│       ├── components/       # React components
│       │   └── ChatBot.js    # Chatbot component
│       └── index.js          # React entry point
├── docker-compose.yml        # Multi-container definition
└── README.md                 # Project documentation
```

## Getting Started

### Prerequisites

- Docker and Docker Compose installed on your system

### Running the Application

1. Clone the repository:
   ```
   git clone <repository-url>
   cd osm-map-chat
   ```

2. Start the containers:
   ```
   docker-compose up -d
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Usage

1. Click on the map to select a location or use the chatbot to search for a location
2. For voice search, click the microphone icon and say a location (e.g., "Show me the Eiffel Tower")
3. The map will display buildings around the selected location with color coding based on building type
4. Use the "Show Building Count" button to see how many buildings are within 1km of the selected point

## Development

To modify the application:

1. Make changes to the code
2. Rebuild the containers:
   ```
   docker-compose down
   docker-compose up -d --build
   ```

## License

[MIT](LICENSE)