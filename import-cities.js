const fs = require('fs');
const { Pool } = require('pg');
const readline = require('readline');
require('dotenv').config();

// PostgreSQL connection
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'weather_db',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 5432,
});

// Function to parse CSV line (handles quoted fields with commas)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    
    return result;
}

async function importCities() {
    console.log('Starting city import...');
    console.log('Reading uscities.csv...\n');
    
    const fileStream = fs.createReadStream('uscities.csv');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    
    let lineCount = 0;
    let importCount = 0;
    let headerSkipped = false;
    
    for await (const line of rl) {
        lineCount++;
        
        // Skip header row
        if (!headerSkipped) {
            headerSkipped = true;
            continue;
        }
        
        try {
            const columns = parseCSVLine(line);
            
            // Extract the columns we need
            // CSV structure: city, city_ascii, state_id, state_name, county_fips, county_name, lat, lng, population, ...
            const city = columns[0];
            const state_id = columns[2];
            const state_name = columns[3];
            const lat = parseFloat(columns[6]);
            const lng = parseFloat(columns[7]);
            const population = columns[8] ? parseInt(columns[8]) : null;
            
            // Validate required fields
            if (!city || !state_id || !state_name || isNaN(lat) || isNaN(lng)) {
                console.log(`Skipping invalid row ${lineCount}: ${city}, ${state_id}`);
                continue;
            }
            
            // Insert into database
            await pool.query(
                'INSERT INTO cities (city, state_id, state_name, lat, lng, population) VALUES ($1, $2, $3, $4, $5, $6)',
                [city, state_id, state_name, lat, lng, population]
            );
            
            importCount++;
            
            // Show progress every 1000 rows
            if (importCount % 1000 === 0) {
                console.log(`Imported ${importCount} cities...`);
            }
            
        } catch (error) {
            console.error(`Error on line ${lineCount}:`, error.message);
        }
    }
    
    console.log(`\n✅ Import complete!`);
    console.log(`Total rows processed: ${lineCount - 1}`);
    console.log(`Cities imported: ${importCount}`);
    
    // Verify the import
    const result = await pool.query('SELECT COUNT(*) FROM cities');
    console.log(`Cities in database: ${result.rows[0].count}`);
    
    await pool.end();
}

// Run the import
importCities().catch(error => {
    console.error('Import failed:', error);
    process.exit(1);
});
