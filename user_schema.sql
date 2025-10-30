-- User Authentication and Personalization Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Saved/Favorite cities for each user
CREATE TABLE IF NOT EXISTS saved_cities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    city VARCHAR(255) NOT NULL,
    state_id VARCHAR(2) NOT NULL,
    state_name VARCHAR(255) NOT NULL,
    lat DECIMAL(10, 6) NOT NULL,
    lng DECIMAL(10, 6) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, city, state_id)
);

-- User-specific search history (replaces global searches table)
CREATE TABLE IF NOT EXISTS user_searches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    city VARCHAR(255) NOT NULL,
    temperature INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    default_city VARCHAR(255),
    default_state VARCHAR(2),
    temp_unit VARCHAR(1) DEFAULT 'F', -- 'F' or 'C'
    notifications_enabled BOOLEAN DEFAULT FALSE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_cities_user ON saved_cities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_searches_user ON user_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_searches_timestamp ON user_searches(user_id, timestamp DESC);

-- Note: We'll keep the old 'searches' table for now during migration
-- You can drop it later with: DROP TABLE searches;
