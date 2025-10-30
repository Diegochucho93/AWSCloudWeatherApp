# SimpleMaps Data Licensing - Corrected Section

## ⚠️ Important: City Database Setup

### Data Source
This project uses the [SimpleMaps US Cities Database](https://simplemaps.com/data/us-cities) which contains 30,000+ US cities with coordinates and population data.

### ⚠️ Licensing Note
**The SimpleMaps database is NOT included in this repository** due to licensing restrictions. Per SimpleMaps' license terms:
- ✅ You CAN use the data in your application
- ✅ You CAN share analysis/subsets in your application
- ❌ You CANNOT redistribute the complete CSV publicly
- ❌ You CANNOT upload it to GitHub or public repositories

### How to Set Up the City Database

#### Option 1: Purchase from SimpleMaps (Recommended)
1. Purchase the [US Cities Database](https://simplemaps.com/data/us-cities) (~$39 for basic)
2. Download the CSV file
3. Import into your PostgreSQL database:

```bash
# After purchasing and downloading uscities.csv
psql -U postgres -d weather_db

# Import the data
\COPY cities(city, state_id, state_name, lat, lng, population) 
FROM '/path/to/uscities.csv' 
DELIMITER ',' 
CSV HEADER;
```

#### Option 2: Alternative Free Data Sources
If you prefer free alternatives, you can use:

1. **US Census Bureau Gazetteers**
   - URL: https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html
   - Free, public domain
   - Less comprehensive than SimpleMaps

2. **GeoNames**
   - URL: http://www.geonames.org/
   - Free, Creative Commons Attribution 4.0
   - Global coverage
   - Download: http://download.geonames.org/export/dump/

3. **Natural Earth Data**
   - URL: https://www.naturalearthdata.com/
   - Free, public domain
   - Good for major cities

#### Option 3: Build Your Own Subset
Create a minimal dataset for development:

```sql
-- Create a basic cities table with major cities
INSERT INTO cities (city, state_id, state_name, lat, lng, population) VALUES
('New York', 'NY', 'New York', 40.7128, -74.0060, 8336817),
('Los Angeles', 'CA', 'California', 34.0522, -118.2437, 3979576),
('Chicago', 'IL', 'Illinois', 41.8781, -87.6298, 2693976),
('Houston', 'TX', 'Texas', 29.7604, -95.3698, 2320268),
('Phoenix', 'AZ', 'Arizona', 33.4484, -112.0740, 1680992),
-- Add more cities as needed
;
```

### Database Schema
Regardless of data source, your cities table should have:

```sql
CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    city VARCHAR(255) NOT NULL,
    state_id VARCHAR(2) NOT NULL,
    state_name VARCHAR(255) NOT NULL,
    lat DECIMAL(10, 6) NOT NULL,
    lng DECIMAL(10, 6) NOT NULL,
    population INTEGER
);

-- Add indexes for search performance
CREATE INDEX IF NOT EXISTS idx_cities_city_lower ON cities(LOWER(city));
CREATE INDEX IF NOT EXISTS idx_cities_state ON cities(state_id);
CREATE INDEX IF NOT EXISTS idx_cities_city_state ON cities(city, state_id);
```

### Development vs Production

#### For Development/Testing:
- Use Option 3 (minimal dataset) with ~100 major cities
- Or use free alternatives (GeoNames, Census data)

#### For Production:
- Purchase SimpleMaps database for comprehensive coverage
- Or use GeoNames for free global coverage
- Ensure your data source license allows your use case

---

## 📝 Attribution

If using SimpleMaps data (after purchasing):
```markdown
City data provided by [SimpleMaps](https://simplemaps.com/data/us-cities)
```

If using GeoNames:
```markdown
City data from [GeoNames](http://www.geonames.org/) 
licensed under CC BY 4.0
```

If using US Census data:
```markdown
City data from US Census Bureau Gazetteer Files (Public Domain)
```

---

## ⚖️ License Compliance Checklist

- [ ] Removed SimpleMaps CSV from GitHub repository
- [ ] Removed SimpleMaps CSV from git history (if committed)
- [ ] Added setup instructions for users to obtain data
- [ ] Provided alternative free data sources
- [ ] Documented which data source you're using
- [ ] Added proper attribution for data source
- [ ] Updated .gitignore to prevent accidental commits:

```gitignore
# Data files (per licensing restrictions)
*.csv
/data/*.csv
uscities.csv
cities_data.csv
```

---

## 🤝 For Contributors

If you're contributing to this project:
1. **DO NOT** commit CSV data files
2. Use the setup instructions above to populate your local database
3. Only commit code, schemas, and documentation
4. Ensure your local `.gitignore` prevents CSV commits

---

## ❓ FAQ

**Q: Why isn't the city data included in the repo?**  
A: SimpleMaps' license prohibits public redistribution of their database. You need to obtain it separately.

**Q: Do I need to purchase SimpleMaps data?**  
A: No, you can use free alternatives like GeoNames or Census data, though they may be less comprehensive.

**Q: Can I share the database with my team?**  
A: If you purchased SimpleMaps: Yes, with project collaborators. If using GeoNames: Yes, per CC BY 4.0 license.

**Q: What if I already committed the CSV?**  
A: Remove it immediately and purge from git history using the commands above.

---

## 📧 Questions About Licensing?

- **SimpleMaps:** support@simplemaps.com
- **GeoNames:** See their [FAQ](http://www.geonames.org/about.html)
- **US Census:** Public domain, no restrictions
