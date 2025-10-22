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

// OpenWeatherMap API configuration
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// API Routes

// Get current weather for a city
app.get('/api/weather', async (req, res) => {
    const { city } = req.query;
    
    if (!city) {
        return res.status(400).json({ error: 'City name is required' });
    }
    
    if (!WEATHER_API_KEY) {
        return res.status(500).json({ error: 'Weather API key not configured' });
    }
    
    try {
        // Fetch weather data from OpenWeatherMap
        const weatherResponse = await axios.get(WEATHER_API_URL, {
            params: {
                q: city,
                appid: WEATHER_API_KEY,
                units: 'metric' // Use Celsius
            }
        });
        
        const weatherData = weatherResponse.data;
        const temperature = Math.round(weatherData.main.temp);
        const description = weatherData.weather[0].description;
        const humidity = weatherData.main.humidity;
        const windSpeed = weatherData.wind.speed;
        
        // Store search in database
        await pool.query(
            'INSERT INTO searches (city, temperature, timestamp) VALUES ($1, $2, NOW())',
            [weatherData.name, temperature]
        );
        
        // Return weather data
        res.json({
            city: weatherData.name,
            temperature,
            description,
            humidity,
            windSpeed
        });
        
    } catch (error) {
        console.error('Error fetching weather:', error.message);
        
        if (error.response && error.response.status === 404) {
            return res.status(404).json({ error: 'City not found' });
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
});
