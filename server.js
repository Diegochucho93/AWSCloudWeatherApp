const express = require('express');
const axios = require('axios');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 3000;


const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const SALT_ROUNDS = 10;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static('.')); // Serve frontend files
function authenticateToken(req, res, next) {
    const token = req.cookies.token;
    
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user; // Add user info to request
        next();
    });
}

// Optional middleware - check if user is logged in (doesn't require auth)
function checkAuth(req, res, next) {
    const token = req.cookies.token;
    
    if (token) {
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (!err) {
                req.user = user;
            }
        });
    }
    next();
}
// PostgreSQL connection pool
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'weather_db',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
    ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false // For RDS and other cloud databases
    } : false
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Database connected successfully');
    }
});

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    try {
        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email.toLowerCase()]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Hash password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        
        // Create user
        const result = await pool.query(
            'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
            [email.toLowerCase(), passwordHash, name]
        );
        
        const user = result.rows[0];
        
        // Create default preferences
        await pool.query(
            'INSERT INTO user_preferences (user_id) VALUES ($1)',
            [user.id]
        );
        
        // Create JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: '30d' }
        );
        
        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            sameSite: 'lax'
        });
        
        res.json({
            message: 'Account created successfully',
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Failed to create account' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    
    try {
        // Get user
        const result = await pool.query(
            'SELECT id, email, password_hash, name FROM users WHERE email = $1',
            [email.toLowerCase()]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const user = result.rows[0];
        
        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Update last login
        await pool.query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [user.id]
        );
        
        // Create JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: '30d' }
        );
        
        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            sameSite: 'lax'
        });
        
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

// Get current user info
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, name, created_at, last_login FROM users WHERE id = $1',
            [req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ user: result.rows[0] });
        
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user info' });
    }
});
// ============================================
// SAVED CITIES ENDPOINTS
// ============================================

// Get user's saved cities
app.get('/api/saved-cities', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, city, state_id, state_name, lat, lng, added_at FROM saved_cities WHERE user_id = $1 ORDER BY added_at DESC',
            [req.user.id]
        );
        
        res.json({ cities: result.rows });
        
    } catch (error) {
        console.error('Error fetching saved cities:', error);
        res.status(500).json({ error: 'Failed to fetch saved cities' });
    }
});

// Save a city
app.post('/api/saved-cities', authenticateToken, async (req, res) => {
    const { city, state_id, state_name, lat, lng } = req.body;
    
    if (!city || !state_id || !state_name || !lat || !lng) {
        return res.status(400).json({ error: 'All city fields are required' });
    }
    
    try {
        // Check if already saved
        const existing = await pool.query(
            'SELECT id FROM saved_cities WHERE user_id = $1 AND city = $2 AND state_id = $3',
            [req.user.id, city, state_id]
        );
        
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'City already saved' });
        }
        
        // Save city
        const result = await pool.query(
            'INSERT INTO saved_cities (user_id, city, state_id, state_name, lat, lng) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [req.user.id, city, state_id, state_name, lat, lng]
        );
        
        res.json({
            message: 'City saved successfully',
            city: result.rows[0]
        });
        
    } catch (error) {
        console.error('Error saving city:', error);
        res.status(500).json({ error: 'Failed to save city' });
    }
});

// Remove a saved city
app.delete('/api/saved-cities/:id', authenticateToken, async (req, res) => {
    const cityId = req.params.id;
    
    try {
        const result = await pool.query(
            'DELETE FROM saved_cities WHERE id = $1 AND user_id = $2 RETURNING *',
            [cityId, req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'City not found' });
        }
        
        res.json({ message: 'City removed successfully' });
        
    } catch (error) {
        console.error('Error removing city:', error);
        res.status(500).json({ error: 'Failed to remove city' });
    }
});

// ============================================
// USER PREFERENCES ENDPOINTS
// ============================================

// Get user preferences
app.get('/api/preferences', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT default_city, default_state, temp_unit, notifications_enabled FROM user_preferences WHERE user_id = $1',
            [req.user.id]
        );
        
        if (result.rows.length === 0) {
            // Create default preferences if they don't exist
            await pool.query(
                'INSERT INTO user_preferences (user_id) VALUES ($1)',
                [req.user.id]
            );
            return res.json({
                default_city: null,
                default_state: null,
                temp_unit: 'F',
                notifications_enabled: false
            });
        }
        
        res.json({ preferences: result.rows[0] });
        
    } catch (error) {
        console.error('Error fetching preferences:', error);
        res.status(500).json({ error: 'Failed to fetch preferences' });
    }
});

// Update user preferences
app.put('/api/preferences', authenticateToken, async (req, res) => {
    const { default_city, default_state, temp_unit, notifications_enabled } = req.body;
    
    try {
        const result = await pool.query(
            `UPDATE user_preferences 
             SET default_city = COALESCE($1, default_city),
                 default_state = COALESCE($2, default_state),
                 temp_unit = COALESCE($3, temp_unit),
                 notifications_enabled = COALESCE($4, notifications_enabled)
             WHERE user_id = $5
             RETURNING *`,
            [default_city, default_state, temp_unit, notifications_enabled, req.user.id]
        );
        
        res.json({
            message: 'Preferences updated successfully',
            preferences: result.rows[0]
        });
        
    } catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});

// ============================================
// ACCOUNT MANAGEMENT ENDPOINTS
// ============================================

// Change password
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password are required' });
    }
    
    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    
    try {
        // Get current password hash
        const result = await pool.query(
            'SELECT password_hash FROM users WHERE id = $1',
            [req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Verify current password
        const validPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        
        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        
        // Update password
        await pool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [newPasswordHash, req.user.id]
        );
        
        res.json({ message: 'Password changed successfully' });
        
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// Delete account
app.delete('/api/auth/account', authenticateToken, async (req, res) => {
    const { password } = req.body;
    
    if (!password) {
        return res.status(400).json({ error: 'Password is required to delete account' });
    }
    
    try {
        // Get password hash
        const result = await pool.query(
            'SELECT password_hash FROM users WHERE id = $1',
            [req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Verify password
        const validPassword = await bcrypt.compare(password, result.rows[0].password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Incorrect password' });
        }
        
        // Delete user (CASCADE will delete related records)
        await pool.query('DELETE FROM users WHERE id = $1', [req.user.id]);
        
        // Clear cookie
        res.clearCookie('token');
        
        res.json({ message: 'Account deleted successfully' });
        
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ error: 'Failed to delete account' });
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
async function getWeatherEndpoints(latitude, longitude) {
    try {
        const pointResponse = await axios.get(`${WEATHER_GOV_API}/points/${latitude},${longitude}`, {
            headers: {
                'User-Agent': 'WeatherDashboardApp/1.0'
            }
        });
        
        const properties = pointResponse.data.properties;
        
        return {
            observationStations: properties.observationStations,
            forecast: properties.forecast,              // 12-hour periods
            forecastHourly: properties.forecastHourly   // hourly forecast
        };
    } catch (error) {
        console.error('Error getting weather endpoints:', error.message);
        throw error;
    }
}

// NEW FUNCTION: Get hourly forecast (next 12 hours)
async function getHourlyForecast(forecastHourlyUrl) {
    try {
        const response = await axios.get(forecastHourlyUrl, {
            headers: {
                'User-Agent': 'WeatherDashboardApp/1.0'
            }
        });
        
        // Get only the next 12 hours
        const periods = response.data.properties.periods.slice(0, 12);
        
        return periods.map(period => ({
            time: period.startTime,
            temperature: period.temperature,
            temperatureUnit: period.temperatureUnit,
            shortForecast: period.shortForecast,
            windSpeed: period.windSpeed,
            windDirection: period.windDirection,
            isDaytime: period.isDaytime  // Add isDaytime for night detection
        }));
    } catch (error) {
        console.error('Error getting hourly forecast:', error.message);
        return [];
    }
}

// NEW FUNCTION: Get daily forecast (next 7 days)
async function getDailyForecast(forecastUrl) {
    try {
        const response = await axios.get(forecastUrl, {
            headers: {
                'User-Agent': 'WeatherDashboardApp/1.0'
            }
        });
        
        // Get the next 7 days (14 periods = 7 days x 2 periods per day)
        const periods = response.data.properties.periods.slice(0, 14);
        
        return periods.map(period => ({
            name: period.name,              // e.g., "Tonight", "Wednesday", "Wednesday Night"
            temperature: period.temperature,
            temperatureUnit: period.temperatureUnit,
            shortForecast: period.shortForecast,
            detailedForecast: period.detailedForecast,
            isDaytime: period.isDaytime
        }));
    } catch (error) {
        console.error('Error getting daily forecast:', error.message);
        return [];
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
app.get('/api/cities/search', async (req, res) => {
    const { q } = req.query;
    
    // Return empty array if query is too short
    if (!q || q.length < 2) {
        return res.json({ cities: [] });
    }
    
    try {
        // Search for cities that start with the query (case-insensitive)
        // Limit to 4 results
        const result = await pool.query(
            `SELECT city, state_id, state_name, lat, lng 
             FROM cities 
             WHERE LOWER(city) LIKE LOWER($1)
             LIMIT 4`,
            [`${q}%`]
        );
        
        // Format the results for the frontend
        const cities = result.rows.map(row => ({
            city: row.city,
            state: row.state_id,
            stateName: row.state_name,
            display: `${row.city}, ${row.state_id}`,
            lat: parseFloat(row.lat),
            lng: parseFloat(row.lng)
        }));
        
        res.json({ cities });
        
    } catch (error) {
        console.error('Error searching cities:', error);
        res.status(500).json({ error: 'Failed to search cities' });
    }
});
// Get current weather for a city
app.get('/api/weather', checkAuth, async (req, res) => {
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
        
        // Step 2: Get all weather endpoints from weather.gov
        const endpoints = await getWeatherEndpoints(latitude, longitude);
        
        // Step 3: Get nearest observation station for current weather
        const stationId = await getNearestStation(endpoints.observationStations);
        
        // Step 4: Get current observations from the station
        const observationUrl = `${stationId}/observations/latest`;
        const observationResponse = await axios.get(observationUrl, {
            headers: {
                'User-Agent': 'WeatherDashboardApp/1.0'
            }
        });
        
        const observation = observationResponse.data.properties;
        
        // Extract current weather data
        const temperatureCelsius = observation.temperature.value;
        const temperature = temperatureCelsius !== null ? celsiusToFahrenheit(temperatureCelsius) : null;
        const humidity = observation.relativeHumidity.value !== null ? Math.round(observation.relativeHumidity.value) : null;
        const windSpeedMps = observation.windSpeed.value;
        const windSpeed = windSpeedMps !== null ? mpsToMph(windSpeedMps) : null;
        const description = observation.textDescription || 'N/A';
        
        if (temperature === null) {
            return res.status(503).json({ error: 'Weather data temporarily unavailable for this location' });
        }
        
        // Step 5: Get forecast data (hourly and daily) - make these calls in parallel
        const [hourlyForecast, dailyForecast] = await Promise.all([
            getHourlyForecast(endpoints.forecastHourly),
            getDailyForecast(endpoints.forecast)
        ]);
        
        // Store search in database
        if (req.user) {
        await pool.query(
            'INSERT INTO user_searches (user_id, city, temperature) VALUES ($1, $2, $3)',
            [req.user.id, cityName, temperature]
        );
        }
        
        // Return weather data with forecasts
        res.json({
            city: cityName,
            temperature: temperature,
            description: description.toLowerCase(),
            humidity: humidity,
            windSpeed: windSpeed,
            hourlyForecast: hourlyForecast,    // NEW: next 12 hours
            dailyForecast: dailyForecast        // NEW: next 7 days
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
app.get('/api/history', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT city, temperature, timestamp FROM user_searches WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 10',
            [req.user.id]
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
