-- Weather Dashboard Database Schema

-- Create the database (run this first if database doesn't exist)
-- CREATE DATABASE weather_db;

-- Connect to the database
-- \c weather_db;

-- Create the searches table
CREATE TABLE IF NOT EXISTS searches (
    id SERIAL PRIMARY KEY,
    city VARCHAR(255) NOT NULL,
    temperature INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on timestamp for faster queries
CREATE INDEX IF NOT EXISTS idx_searches_timestamp ON searches(timestamp DESC);

-- Optional: View to see recent searches
CREATE OR REPLACE VIEW recent_searches AS
SELECT id, city, temperature, timestamp
FROM searches
ORDER BY timestamp DESC
LIMIT 10;
