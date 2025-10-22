const express = require('express');
const axios = require('axios');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve frontend files

// PostgreSQL connection pool
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'weather_db',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Database connected successfully');
    }
});

// weather.gov API configuration (no API key needed!)
const GEOCODING_API_URL = 'https://nominatim.openstreetmap.org/search';
const WEATHER_GOV_API = 'https://api.weather.gov';

// Helper function to get coordinates for a US city
async function getCityCoordinates(city) {
    try {
        const response = await axios.get(GEOCODING_API_URL, {
            params: {
                q: `${city}, USA`,
                format: 'json',
                limit: 1,
                countrycodes: 'us'
            },
            headers: {
                'User-Agent': 'WeatherDashboardApp/1.0' // Required by Nominatim
            }
        });
        
        if (!response.data || response.data.length === 0) {
            return null;
        }
        
        return {
            latitude: parseFloat(response.data[0].lat),
            longitude: parseFloat(response.data[0].lon),
            displayName: response.data[0].display_name
        };
    } catch (error) {
        console.error('Geocoding error:', error.message);
        return null;
    }
}

// Helper function to get weather forecast URL from weather.gov
async function getWeatherForecastUrl(latitude, longitude) {
    try {
        const pointResponse = await axios.get(`${WEATHER_GOV_API}/points/${latitude},${longitude}`, {
            headers: {
                'User-Agent': 'WeatherDashboardApp/1.0' // Required by weather.gov
            }
        });
        
        return pointResponse.data.properties.observationStations;
    } catch (error) {
        console.error('Error getting forecast URL:', error.message);
        throw error;
    }
}

// Helper function to get nearest observation station
async function getNearestStation(stationsUrl) {
    try {
        const stationsResponse = await axios.get(stationsUrl, {
            headers: {
                'User-Agent': 'WeatherDashboardApp/1.0'
            }
        });
        
        if (!stationsResponse.data.features || stationsResponse.data.features.length === 0) {
            throw new Error('No observation stations found');
        }
        
        return stationsResponse.data.features[0].id;
    } catch (error) {
        console.error('Error getting station:', error.message);
        throw error;
    }
}

// Helper function to convert Celsius to Fahrenheit
function celsiusToFahrenheit(celsius) {
    return Math.round((celsius * 9/5) + 32);
}

// Helper function to convert meters per second to mph
function mpsToMph(mps) {
    return (mps * 2.237).toFixed(1);
}

// API Routes

// Get current weather for a city
app.get('/api/weather', async (req, res) => {
    const { city } = req.query;
    
    if (!city) {
        return res.status(400).json({ error: 'City name is required' });
    }
    
    try {
        // Step 1: Get coordinates for the US city
        const location = await getCityCoordinates(city);
        
        if (!location) {
            return res.status(404).json({ error: 'US city not found. Please enter a valid US city name.' });
        }
        
        const { latitude, longitude, displayName } = location;
        
        // Extract city name from display name
        const cityName = displayName.split(',')[0];
        
        // Step 2: Get observation stations URL from weather.gov
        const stationsUrl = await getWeatherForecastUrl(latitude, longitude);
        
        // Step 3: Get nearest observation station
        const stationId = await getNearestStation(stationsUrl);
        
        // Step 4: Get current observations from the station
        const observationUrl = `${stationId}/observations/latest`;
        const observationResponse = await axios.get(observationUrl, {
            headers: {
                'User-Agent': 'WeatherDashboardApp/1.0'
            }
        });
        
        const observation = observationResponse.data.properties;
        
        // Extract weather data
        const temperatureCelsius = observation.temperature.value;
        const temperature = temperatureCelsius !== null ? celsiusToFahrenheit(temperatureCelsius) : null;
        const humidity = observation.relativeHumidity.value !== null ? Math.round(observation.relativeHumidity.value) : null;
        const windSpeedMps = observation.windSpeed.value;
        const windSpeed = windSpeedMps !== null ? mpsToMph(windSpeedMps) : null;
        const description = observation.textDescription || 'N/A';
        
        if (temperature === null) {
            return res.status(503).json({ error: 'Weather data temporarily unavailable for this location' });
        }
        
        // Store search in database
        await pool.query(
            'INSERT INTO searches (city, temperature, timestamp) VALUES ($1, $2, NOW())',
            [cityName, temperature]
        );
        
        // Return weather data (converting to format expected by frontend)
        res.json({
            city: cityName,
            temperature: temperature,
            description: description.toLowerCase(),
            humidity: humidity,
            windSpeed: windSpeed
        });
        
    } catch (error) {
        console.error('Error fetching weather:', error.message);
        
        if (error.response && error.response.status === 404) {
            return res.status(404).json({ error: 'Weather data not available for this location. Try another US city.' });
        }
        
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});

// Get last 10 searches from database
app.get('/api/history', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT city, temperature, timestamp FROM searches ORDER BY timestamp DESC LIMIT 10'
        );
        
        res.json({
            history: result.rows
        });
        
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Using weather.gov API for US weather data');
});
