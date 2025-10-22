# Weather Dashboard (US Cities)

A full-stack weather dashboard application that displays current weather information for US cities and tracks search history using PostgreSQL.

## Features

- **Current Weather Display**: Search for any US city and view current weather conditions
- **Historical Tracking**: Automatically stores and displays the last 10 weather searches
- **Real-time Data**: Uses National Weather Service (weather.gov) API for accurate weather information
- **Clean UI**: Modern, responsive design with gradient styling
- **No API Key Required**: Completely free with no registration needed

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **API**: weather.gov (National Weather Service - no API key required!)

## Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm (comes with Node.js)

## Setup Instructions

### 1. Database Setup

First, create the PostgreSQL database and table:

```bash
# Login to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE weather_db;

# Exit psql
\q
```

Now run the schema file to create the table:

```bash
psql -U postgres -d weather_db -f schema.sql
```

Alternatively, you can manually run the SQL commands from `schema.sql` in your PostgreSQL client.

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit the `.env` file and update your PostgreSQL credentials if needed:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=weather_db
DB_PASSWORD=your_postgres_password
DB_PORT=5432
```

**Note:** No weather API key needed! weather.gov is completely free and doesn't require registration.

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Application

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Usage

**Note: This app works with US cities only, as it uses the National Weather Service API.**

1. Open your browser and navigate to `http://localhost:3000`
2. Enter a US city name in the search box (e.g., "New York", "Los Angeles", "Chicago")
3. Click "Search" or press Enter
4. View the current weather information
5. Check the history table below to see your last 10 searches

## Project Structure

```
weather-dashboard/
├── index.html          # Main HTML file
├── style.css           # Styling
├── script.js           # Frontend JavaScript
├── server.js           # Express backend server
├── schema.sql          # Database schema
├── package.json        # Node.js dependencies
├── .env.example        # Environment variables template
└── README.md           # Documentation
```

## API Endpoints

### GET `/api/weather?city={cityName}`

Fetches current weather for a city and stores the search in the database.

**Response:**
```json
{
  "city": "London",
  "temperature": 15,
  "description": "cloudy",
  "humidity": 65,
  "windSpeed": 5.2
}
```

### GET `/api/history`

Retrieves the last 10 weather searches from the database.

**Response:**
```json
{
  "history": [
    {
      "city": "London",
      "temperature": 15,
      "timestamp": "2025-10-21T10:30:00.000Z"
    }
  ]
}
```

## Database Schema

**Table: searches**

| Column      | Type         | Description                    |
|-------------|--------------|--------------------------------|
| id          | SERIAL       | Primary key (auto-increment)   |
| city        | VARCHAR(255) | City name                      |
| temperature | INTEGER      | Temperature in Celsius         |
| timestamp   | TIMESTAMP    | Time of search (auto-set)      |

## Troubleshooting

### Database Connection Error

- Make sure PostgreSQL is running: `sudo service postgresql start` (Linux) or check Services (Windows)
- Verify database credentials in `.env` file
- Check if the database exists: `psql -U postgres -l`

### Port Already in Use

If port 3000 is already in use, you can change it in `server.js`:

```javascript
const PORT = 3001; // Change to any available port
```

Also update the API URL in `script.js`:

```javascript
const API_URL = 'http://localhost:3001/api';
```

## License

ISC

## Notes

- Temperature is displayed in Fahrenheit (°F)
- Wind speed is displayed in miles per hour (mph)
- weather.gov API is completely free with no registration required
- **US locations only** - weather.gov provides data for United States locations
- Search history is permanent unless manually deleted from the database
- The app uses OpenStreetMap's Nominatim for geocoding US cities
