-- Cities table for autocomplete feature

CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    city VARCHAR(255) NOT NULL,
    state_id VARCHAR(2) NOT NULL,
    state_name VARCHAR(255) NOT NULL,
    lat DECIMAL(10, 6) NOT NULL,
    lng DECIMAL(10, 6) NOT NULL,
    population INTEGER
);

-- Create index for fast city name searches (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_cities_city_lower ON cities(LOWER(city));

-- Create index for state searches
CREATE INDEX IF NOT EXISTS idx_cities_state ON cities(state_id);

-- Composite index for city + state searches
CREATE INDEX IF NOT EXISTS idx_cities_city_state ON cities(city, state_id);
