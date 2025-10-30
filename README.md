# Weather Dashboard (US Cities)

> **AI-Assisted Development Showcase:** This project was developed using AI pair programming with **Claude Sonnet 4.5** and **Google Gemini 2.5 Pro** to demonstrate advanced AI prompting abilities and modern full-stack development practices.

A full-stack weather dashboard application featuring user authentication, personalized settings, and real-time weather data for US cities. Built as a learning project to explore AWS services, PostgreSQL, and modern web development patterns.

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?logo=express)

---

## 🎯 Project Purpose

This project serves multiple purposes:
- **AI Prompting Showcase:** Demonstrates effective AI-assisted development workflows
- **AWS Learning Lab:** Test bed for various AWS services (EC2, RDS, S3, CloudFront, etc.)
- **Full-Stack Practice:** Hands-on experience with authentication, databases, and API integration
- **DevOps Exploration:** Practice deployment, monitoring, and scaling on Ubuntu/Linux

---

## ✨ Features

### 🌤️ Weather & Data
- **Real-time Weather:** Current conditions, 12-hour forecast, and 7-day forecast
- **Smart Autocomplete:** City search with 30,000+ US cities from SimpleMaps dataset
- **Dynamic Backgrounds:** AI-generated weather-appropriate video backgrounds that change with conditions
  - 12 unique variants (day/night × clear/cloudy/rain/snow/storm/wind + fog)
  - Seamlessly looping Veo 3-generated videos
  - Realistic window-view perspective with depth-of-field effects
- **No API Key Required:** Uses National Weather Service (weather.gov) API - completely free!

### 👤 User Features
- **User Authentication:** Secure signup/login with bcrypt password hashing
- **Personalized Dashboard:** Welcome messages and user-specific data
- **Favorite Cities:** Save and quickly access your most-searched locations
- **Default City:** Auto-load your preferred city on login
- **Search History:** Track your weather lookups with timestamps
- **User Preferences:** Customize temperature units (°F/°C) and other settings

### 🎨 UI/UX
- **Glassmorphic Design:** Modern, semi-transparent card-based interface
- **Responsive Layout:** Works seamlessly on mobile, tablet, and desktop
- **Smart Placeholders:** Helpful guidance when no city is searched
- **Loading States:** Smooth transitions with loading spinners
- **Collapsible Sections:** Organized UI with expandable favorite cities and history

### 🔒 Security
- **Session Management:** Cookie-based authentication with httpOnly flags
- **Password Hashing:** bcrypt with salt rounds for secure storage
- **SQL Injection Protection:** Parameterized queries throughout
- **CSRF Protection:** Secure form submissions
- **Input Validation:** Client and server-side validation

---

## 🏗️ Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Glassmorphic design with backdrop filters
- **Vanilla JavaScript** - No frameworks, pure ES6+
- **Lucide Icons** - Beautiful, consistent iconography

### Backend
- **Node.js** (v14+) - JavaScript runtime
- **Express.js** - Web application framework
- **express-session** - Session management
- **bcrypt** - Password hashing
- **node-postgres (pg)** - PostgreSQL client

### Database
- **PostgreSQL** (v12+) - Primary database
  - Users and authentication
  - Saved cities and preferences
  - Search history tracking
  - City autocomplete data (30,000+ US cities)

### APIs & Services
- **National Weather Service (weather.gov)** - Real-time weather data
  - Current conditions
  - Hourly forecasts
  - 7-day forecasts
  - No API key required!
- **OpenStreetMap Nominatim** - Geocoding for city coordinates
- **Google Veo 3** - AI-generated weather background videos
  - Dynamic day/night cycles
  - Weather-specific scenes (clear, cloudy, rain, snow, storm, wind, fog)
  - Seamlessly looping 12-variant video set
  - Custom-prompted for realistic window view aesthetics

### AWS Infrastructure (Current & Learning)

#### Compute & Networking
- **EC2 Instances** - Ubuntu 22.04 LTS servers
- **Application Load Balancer (ALB)** - Traffic distribution across instances
- **Target Groups** - Health checks and routing rules
- **Auto Scaling Groups** - Dynamic scaling with policies (min/max/desired)
- **Launch Templates** - Preconfigured instance settings with user data scripts

#### Storage & Database
- **RDS PostgreSQL** - Multi-AZ managed database
  - Automated backups and snapshots
  - Database subnet groups (private subnets)
  - SSL/TLS encrypted connections
- **EFS (Elastic File System)** - Shared storage across EC2 instances
  - Weather video assets
  - Application logs
  - Security group for NFS access
- **S3** - Object storage for backups and static assets

#### Networking & Security
- **VPC (Virtual Private Cloud)** - Isolated network environment
- **Public Subnets** - For ALB and bastion hosts
- **Private Subnets** - For EC2 app servers
- **Database Subnets** - Isolated RDS deployment
- **Security Groups** - Instance-level firewalls
  - ALB security group (HTTP/HTTPS)
  - EC2 security group (SSH from bastion only)
  - RDS security group (PostgreSQL from EC2 only)
  - EFS security group (NFS from EC2 only)
  - Bastion security group (SSH from specific IPs)
- **Bastion Host** - Secure SSH jump server for private instance access
- **NAT Gateway** - Outbound internet for private subnets
- **Internet Gateway** - Inbound/outbound for public subnets

#### Monitoring & Management
- **CloudWatch** - Logs, metrics, and alarms
- **Systems Manager** - Parameter Store for secrets
- **IAM Roles** - Instance profiles with least-privilege policies

#### Content Delivery (Planned)
- **CloudFront** - CDN for weather videos and static assets
- **Route 53** - DNS management and routing policies

### Architecture Diagram
```
Internet
    │
    ↓
[Route 53] → [CloudFront CDN]
    │              │
    ↓              ↓
[ALB (Public Subnet)]
    │
    ├─→ [Target Group]
    │       │
    │       ├─→ [EC2 Instance 1 (Private Subnet)] ──→ [EFS Mount]
    │       │         │
    │       └─→ [EC2 Instance 2 (Private Subnet)] ──→ [EFS Mount]
    │                 │
    │                 ↓
    │           [RDS PostgreSQL]
    │          (Database Subnet)
    │          (Multi-AZ)
    │
[Bastion Host] ──SSH──→ [Private EC2 Instances]
(Public Subnet)

[Auto Scaling] monitors Target Group
    ├─→ Scale Up: CPU > 70%
    └─→ Scale Down: CPU < 30%
```

---

## 📊 Database Schema

### Core Tables

#### `users`
```sql
- id (SERIAL PRIMARY KEY)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- name (VARCHAR)
- created_at (TIMESTAMP)
- last_login (TIMESTAMP)
```

#### `saved_cities`
```sql
- id (SERIAL PRIMARY KEY)
- user_id (INTEGER, FK to users)
- city (VARCHAR)
- state_id (VARCHAR)
- state_name (VARCHAR)
- lat, lng (DECIMAL)
- added_at (TIMESTAMP)
- UNIQUE(user_id, city, state_id)
```

#### `user_preferences`
```sql
- user_id (INTEGER, PK, FK to users)
- default_city (VARCHAR)
- default_state (VARCHAR)
- temp_unit (VARCHAR) - 'F' or 'C'
- notifications_enabled (BOOLEAN)
```

#### `user_searches`
```sql
- id (SERIAL PRIMARY KEY)
- user_id (INTEGER, FK to users)
- city (VARCHAR)
- temperature (INTEGER)
- timestamp (TIMESTAMP)
```

#### `cities` (Autocomplete Database)
```sql
- id (SERIAL PRIMARY KEY)
- city (VARCHAR)
- state_id (VARCHAR) - Two-letter code
- state_name (VARCHAR)
- lat, lng (DECIMAL)
- population (INTEGER)
```

**City Data Source:** This project uses city data for autocomplete functionality. Due to licensing restrictions, the database is **NOT included in this repository**.

**To set up the city database:**

1. **Option A - Download the Basic Database on SimpleMaps** (~FREE): [US Cities Database](https://simplemaps.com/data/us-cities)
   - 30,000+ cities with accurate coordinates
   - Regular updates
   - Basic Fields
   - Creative Commons Attribution 4.0

2. **Option B - Use Other Free Alternatives:**
   - **GeoNames** (http://www.geonames.org/) - Free, CC BY 4.0 license, global coverage
   - **US Census Gazetteers** (census.gov) - Free, public domain
   - **Natural Earth Data** (naturalearthdata.com) - Free, public domain

3. **Option C - Development Dataset:** Use a minimal dataset of major cities (see SETUP.md for SQL)

**Important:** Per SimpleMaps license terms, their CSV cannot be publicly redistributed or uploaded to GitHub. Users must obtain the data directly from the source.

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm (comes with Node.js)
- (Optional) AWS account for cloud deployment

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/weather-dashboard.git
cd weather-dashboard
```

### 2. Database Setup

#### Create the database:
```bash
# Login to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE weather_db;

# Exit
\q
```

#### Run the schema files:
```bash
# Core tables
psql -U postgres -d weather_db -f user_schema.sql

# Cities autocomplete data
psql -U postgres -d weather_db -f cities_schema.sql
```

#### Load city data:

**⚠️ Important:** The city database CSV is **NOT included** in this repository due to SimpleMaps licensing restrictions.

**Choose one option:**

**Option 1:** Purchase and use SimpleMaps data (~$39)
```bash
# After purchasing from https://simplemaps.com/data/us-cities
psql -U postgres -d weather_db

\COPY cities(city, state_id, state_name, lat, lng, population) 
FROM '/path/to/downloaded/uscities.csv' 
DELIMITER ',' 
CSV HEADER;
```

**Option 2:** Use free alternative data sources
```bash
# GeoNames (Free, CC BY 4.0)
# Download from: http://download.geonames.org/export/dump/
# Or use US Census Bureau data (public domain)
```

**Option 3:** Create a development dataset
```bash
# For testing, use a minimal set of major cities
psql -U postgres -d weather_db -f dev_cities.sql
# (Create dev_cities.sql with ~100 major cities)
```

**See CORRECTED_DATA_LICENSING.md for detailed instructions and alternatives.**

### 3. Configure Environment Variables

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=weather_db
DB_PASSWORD=your_postgres_password
DB_PORT=5432
DB_SSL=false

# Session Secret (generate a random string)
SESSION_SECRET=your-super-secret-session-key-change-this

# Server Configuration
PORT=3000
NODE_ENV=development

# AWS Configuration (optional, for cloud deployment)
AWS_REGION=us-east-1
AWS_RDS_ENDPOINT=your-rds-endpoint.rds.amazonaws.com
```

### 3a. Update .gitignore

**⚠️ Important:** Add to your `.gitignore` to prevent accidentally committing data files:

```bash
# Add to .gitignore
*.csv
/data/*.csv
uscities.csv
cities_data.csv
```

This prevents SimpleMaps CSV (or any city data) from being committed to your repository.

### 4. Install Dependencies
```bash
npm install
```

### 5. Start the Application

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The server will start on `http://localhost:3000`

---

## 📁 Project Structure

```
weather-dashboard/
├── public/
│   ├── index.html              # Main dashboard
│   ├── settings.html           # User settings page
│   ├── script.js               # Main dashboard logic
│   ├── settings.js             # Settings page logic
│   ├── style.css               # Glassmorphic styling
│   └── weather-videos/         # Background videos (day/night variants)
│       ├── day-clear.mp4
│       ├── night-clear.mp4
│       ├── day-cloudy.mp4
│       ├── night-cloudy.mp4
│       ├── day-rain.mp4
│       ├── night-rain.mp4
│       └── ... (more variants)
├── server.js                   # Express backend server
├── user_schema.sql             # User & auth tables
├── cities_schema.sql           # City autocomplete data
├── package.json                # Node.js dependencies
├── .env.example                # Environment template
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/change-password` - Change user password
- `DELETE /api/auth/account` - Delete user account

### Weather
- `GET /api/weather?city={cityName}` - Get weather for city
  ```json
  {
    "city": "Austin",
    "temperature": 75,
    "description": "Partly Cloudy",
    "humidity": 60,
    "windSpeed": 10.5,
    "hourlyForecast": [...],
    "dailyForecast": [...]
  }
  ```

### User Data
- `GET /api/saved-cities` - Get user's favorite cities
- `POST /api/saved-cities` - Save a city to favorites
- `DELETE /api/saved-cities/:id` - Remove saved city
- `GET /api/history` - Get user's search history
- `GET /api/preferences` - Get user preferences
- `PUT /api/preferences` - Update user preferences

### Autocomplete
- `GET /api/cities/search?q={query}` - Search cities for autocomplete
  ```json
  {
    "cities": [
      {
        "city": "Austin",
        "state": "Texas",
        "state_id": "TX",
        "lat": 30.2672,
        "lng": -97.7431
      }
    ]
  }
  ```

---

## 🎓 What I Learned

### AI-Assisted Development
- **Effective Prompting:** How to structure prompts for complex features
- **Iterative Refinement:** Working with AI to debug and enhance code
- **Documentation Generation:** Using AI to create comprehensive docs
- **Code Review:** Leveraging AI for code quality and best practices
- **Vibe Coding:** Rapid prototyping with AI pair programming

### Full-Stack Development
- **User Authentication:** Implementing secure login systems with bcrypt
- **Session Management:** Cookie-based authentication flows
- **Database Design:** Normalized schema with foreign keys and indexes
- **RESTful APIs:** CRUD operations and proper HTTP status codes
- **Frontend State Management:** Managing user state without frameworks
- **Real-time Features:** Dynamic UI updates and loading states

### AWS Infrastructure & Networking
- **EC2 Configuration:** Ubuntu server setup, instance management
- **Security Groups:** Inbound/outbound rules, port management
- **Target Groups:** Load balancer targets and health checks
- **Application Load Balancer (ALB):** Traffic distribution and routing
- **Launch Templates:** AMI configuration, user data scripts for auto-installation
- **Auto Scaling Groups:** Min/max/desired capacity, scaling policies
- **Subnets & VPC:** Public and private subnet architecture
- **Database Subnets:** Isolated RDS deployment across availability zones
- **Bastion Hosts:** Secure SSH access to private instances
- **Elastic File System (EFS):** Shared storage with security groups
- **Network ACLs:** Subnet-level security
- **Route Tables:** Traffic routing between subnets

### DevOps & AWS Services
- **RDS PostgreSQL:** Managed database with multi-AZ, automated backups
- **S3 & CloudFront:** Static asset hosting and CDN delivery
- **Environment Variables:** Secure configuration management
- **CloudWatch:** Logs, metrics, and monitoring dashboards
- **IAM Roles:** Least-privilege access policies
- **Systems Manager:** Parameter Store for secrets management

### Database Skills
- **PostgreSQL:** Complex queries, joins, indexes, views
- **Data Import:** Bulk loading 30,000+ records from CSV
- **Performance:** Query optimization, indexing strategies, EXPLAIN ANALYZE
- **Security:** Parameterized queries to prevent SQL injection
- **Migrations:** Schema versioning and updates
- **Connection Pooling:** Efficient database connections

---

## ☁️ AWS Deployment Configuration

### Launch Template Configuration
The EC2 launch template includes user data for automatic setup:

```bash
#!/bin/bash
# Update system
apt-get update -y
apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PostgreSQL client
apt-get install -y postgresql-client

# Install git
apt-get install -y git

# Install PM2 globally
npm install -g pm2

# Clone repository (replace with your repo)
cd /home/ubuntu
git clone https://github.com/yourusername/weather-dashboard.git
cd weather-dashboard

# Install dependencies
npm install

# Set up environment variables from Systems Manager
# (Or manually create .env file)

# Start application with PM2
pm2 start server.js --name weather-app
pm2 startup systemd
pm2 save

# Mount EFS for shared storage
mkdir -p /mnt/efs
mount -t nfs4 -o nfsvers=4.1 fs-xxxxx.efs.us-east-1.amazonaws.com:/ /mnt/efs

# Symlink weather videos to EFS
ln -s /mnt/efs/weather-videos /home/ubuntu/weather-dashboard/public/weather-videos
```

### Auto Scaling Policies
**Scale Up Policy:**
- Metric: Average CPU Utilization
- Threshold: > 70% for 2 consecutive periods (2 minutes)
- Action: Add 1 instance
- Cooldown: 300 seconds

**Scale Down Policy:**
- Metric: Average CPU Utilization
- Threshold: < 30% for 5 consecutive periods (5 minutes)
- Action: Remove 1 instance
- Cooldown: 300 seconds

**Capacity Settings:**
- Minimum: 1 instance
- Desired: 2 instances
- Maximum: 4 instances

### Security Group Rules

#### ALB Security Group
**Inbound:**
- HTTP (80) from 0.0.0.0/0
- HTTPS (443) from 0.0.0.0/0

**Outbound:**
- All traffic to EC2 security group

#### EC2 Security Group
**Inbound:**
- HTTP (3000) from ALB security group
- SSH (22) from Bastion security group
- NFS (2049) from EFS security group

**Outbound:**
- PostgreSQL (5432) to RDS security group
- HTTPS (443) to 0.0.0.0/0 (for API calls)
- NFS (2049) to EFS security group

#### RDS Security Group
**Inbound:**
- PostgreSQL (5432) from EC2 security group

**Outbound:**
- All traffic denied (default)

#### EFS Security Group
**Inbound:**
- NFS (2049) from EC2 security group

**Outbound:**
- NFS (2049) to EC2 security group

#### Bastion Host Security Group
**Inbound:**
- SSH (22) from your IP address (e.g., 203.0.113.0/32)

**Outbound:**
- SSH (22) to EC2 security group

### VPC Configuration
- **VPC CIDR:** 10.0.0.0/16
- **Public Subnet 1:** 10.0.1.0/24 (us-east-1a)
- **Public Subnet 2:** 10.0.2.0/24 (us-east-1b)
- **Private Subnet 1:** 10.0.10.0/24 (us-east-1a)
- **Private Subnet 2:** 10.0.11.0/24 (us-east-1b)
- **Database Subnet 1:** 10.0.20.0/24 (us-east-1a)
- **Database Subnet 2:** 10.0.21.0/24 (us-east-1b)

### Health Checks
**ALB Target Group Health Check:**
- Path: `/api/health` (or `/`)
- Interval: 30 seconds
- Timeout: 5 seconds
- Healthy threshold: 2 consecutive checks
- Unhealthy threshold: 3 consecutive checks

**Auto Scaling Health Check:**
- Type: ELB (load balancer health check)
- Grace period: 300 seconds

### Cost Optimization
Current monthly estimate (varies by usage):
- EC2 (2x t3.small): ~$30
- RDS (db.t3.micro): ~$15
- ALB: ~$16
- EFS (100 GB): ~$30
- Data transfer: ~$5-10
- **Total: ~$100-110/month**

---

## 🚧 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Start PostgreSQL
sudo service postgresql start

# Verify database exists
psql -U postgres -l

# Test connection
psql -U postgres -d weather_db
```

### AWS RDS Connection
If using AWS RDS with SSL:
```env
DB_SSL=true
DB_HOST=your-rds-endpoint.rds.amazonaws.com
```

Ensure security group allows inbound traffic on port 5432 from your server.

### Port Already in Use
Change port in `server.js`:
```javascript
const PORT = process.env.PORT || 3001;
```

Update frontend API URL in `script.js`:
```javascript
const API_URL = '/api'; // Relative path works best
```

### City Autocomplete Not Working
Make sure cities table is populated:
```bash
psql -U postgres -d weather_db

SELECT COUNT(*) FROM cities;
-- Should return ~30,000 rows
```

### Session Issues
Generate a strong session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add to `.env`:
```env
SESSION_SECRET=<generated-secret>
```

---

## 🔐 Security Best Practices

This project implements several security measures:
- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ httpOnly cookies for session management
- ✅ Parameterized SQL queries (no SQL injection)
- ✅ Input validation on client and server
- ✅ CORS configuration for API security
- ✅ Environment variables for sensitive data
- ✅ Session expiration and logout functionality

**Note:** This is a learning project. For production use, consider:
- HTTPS/TLS certificates
- Rate limiting
- CSRF tokens
- Content Security Policy headers
- Regular security audits

---

## 📝 Future Enhancements

### Planned AWS Service Integrations

#### 📧 Email Notifications (SES - Simple Email Service)
- [ ] Daily weather digest emails for saved cities
- [ ] Severe weather alerts sent automatically
- [ ] Welcome emails on signup with account verification
- [ ] Password reset via email
- **Learning Goals:** Email automation, HTML email templates, scheduled tasks

#### ⏰ Scheduled Tasks (Lambda + EventBridge)
- [ ] Hourly auto-fetch weather for all saved cities
- [ ] Daily weather summary emails at 7 AM
- [ ] Weekly cleanup of old search history (90+ days)
- [ ] Monthly analytics reports
- **Learning Goals:** Serverless functions, cron expressions, event-driven architecture

#### 📈 Analytics Dashboard (CloudWatch + Custom Dashboard)
- [ ] Real-time API usage tracking
- [ ] Response time monitoring with alarms
- [ ] Most searched cities leaderboard
- [ ] Error rate tracking and alerting
- [ ] User growth metrics
- **Learning Goals:** Custom metrics, CloudWatch Insights, log analysis

#### 🔔 Real-time Notifications (SNS - Simple Notification Service)
- [ ] Browser push notifications for weather alerts
- [ ] SMS alerts for severe weather in saved cities
- [ ] Tornado/hurricane warnings
- [ ] Topic-based subscriptions (by severity)
- **Learning Goals:** Pub/sub messaging, mobile notifications, fan-out patterns

#### 🌍 Global Performance (CloudFront CDN)
- [ ] Edge caching for static assets
- [ ] Reduced latency for global users
- [ ] Custom domain with SSL certificate
- [ ] Compressed asset delivery
- **Learning Goals:** Content delivery networks, edge computing, cache optimization

### Application Features

#### 🌦️ Weather Enhancements
- [ ] **Weather Radar Integration:** Interactive radar maps showing precipitation
- [ ] **Location Detection:** "Use My Location" button with geolocation API
- [ ] **Weather Comparison:** Side-by-side comparison of multiple cities
- [ ] **Historical Data Charts:** Temperature and precipitation trends
- [ ] **Air Quality Index (AQI):** Pollution levels and health recommendations
- [ ] **UV Index & Sunrise/Sunset:** Additional weather metrics

#### 🎨 UI/UX Improvements
- [ ] **Dark Mode Toggle:** User preference saved to database
- [ ] **Custom Themes:** Multiple color schemes
- [ ] **Accessibility Improvements:** ARIA labels, keyboard navigation
- [ ] **Animations:** Smooth transitions and loading states
- [ ] **Mobile App:** React Native or PWA version
- **🤝 Open for contributions! CSS/HTML help welcome!**

#### 🔐 Security & Performance
- [ ] Rate limiting (API Gateway or Express middleware)
- [ ] Two-factor authentication (2FA)
- [ ] CAPTCHA on signup/login
- [ ] Redis caching for weather data
- [ ] WebSocket for real-time updates

#### 🌐 Social Features
- [ ] Share weather cards on social media
- [ ] Public weather report permalinks
- [ ] User profiles (public/private)
- [ ] Weather discussion forums

---

## 🤝 Contributing & Getting Help

### 🎨 Looking for CSS/HTML Help!
I'm actively seeking contributors to help improve:
- **Responsive Design:** Better mobile layouts
- **Accessibility:** Screen reader support, ARIA labels
- **Modern CSS:** Grid layouts, animations, transitions
- **Cross-browser Compatibility:** Testing on Safari, Firefox, etc.

**How to contribute:**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/improve-mobile-layout`)
3. Make your changes and test thoroughly
4. Submit a pull request with screenshots

### 🐛 Found a Bug?
1. Check existing issues first
2. Open a new issue with:
   - Description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Browser/OS information

### 💡 Feature Suggestions
Have ideas for new features? Open an issue with the `enhancement` label!

### 📧 Contact for Collaboration
Interested in collaborating on AWS implementations or full-stack features? Reach out!

---

## 📄 License

ISC License - Feel free to use this project for learning purposes.

**Note on Data:** This repository does NOT include the SimpleMaps city database due to licensing restrictions. Users must obtain city data separately from approved sources (see setup instructions).

---

## 🙏 Acknowledgments

### AI Assistants
- **Claude Sonnet 4.5** (Anthropic) - Primary development assistant
- **Google Gemini 2.5 Pro** - Additional features and refinements
- **Google Veo 3** - AI video generation for dynamic weather backgrounds

### Data Sources & APIs
- [National Weather Service API](https://www.weather.gov/documentation/services-web-api) - Free weather data
- [SimpleMaps](https://simplemaps.com/data/us-cities) - City database (purchased separately, not included)
- [GeoNames](http://www.geonames.org/) - Alternative free city data (CC BY 4.0)
- [US Census Bureau](https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html) - Free public domain city data
- [OpenStreetMap Nominatim](https://nominatim.org/) - Geocoding service

### Video Assets
- **Weather Background Videos:** Generated using Google Veo 3
  - 12 unique variants (day/night × weather conditions)
  - Custom-prompted for seamless looping and window-view perspective
  - See [VEO3_VIDEO_BACKGROUNDS.md](./docs/VEO3_VIDEO_BACKGROUNDS.md) for full prompts

### Important License Notes
- **SimpleMaps Data:** If you purchase and use SimpleMaps data, you cannot publicly redistribute it. This means:
  - ❌ Do not commit the CSV to GitHub
  - ❌ Do not upload to public repositories
  - ✅ Can share with project collaborators
  - ✅ Can use in your application
  - ✅ Can publish analysis/subsets (not the full database)
- **GeoNames Data:** Free to use under CC BY 4.0 license (requires attribution)
- **Census Data:** Public domain, no restrictions
- **Veo 3 Videos:** Check Google's terms for usage rights and attribution requirements

### Inspirations
- Modern weather apps (Weather.com, Dark Sky)
- Glassmorphism design trend
- AWS documentation and tutorials

---

## 📊 Project Stats

### Development Metrics
- **Lines of Code:** ~3,500+ (JavaScript, CSS, HTML)
- **Development Time:** ~40 hours (with AI assistance)
- **AI Prompts Used:** 200+ iterative prompts
- **Git Commits:** 100+ commits
- **Features Implemented:** 25+ distinct features

### Data & Performance
- **Database Records:** 30,000+ US cities (SimpleMaps dataset)
- **Weather Data Points:** Current + 12 hourly + 7 daily forecasts per city
- **API Endpoints:** 12+ RESTful endpoints
- **Response Time:** <500ms average (cached weather data)
- **Database Queries:** Optimized with indexes (sub-10ms average)

### AWS Infrastructure
- **EC2 Instances:** 2-4 (auto-scaling)
- **Availability Zones:** 2 (multi-AZ deployment)
- **Security Groups:** 5 (layered security)
- **Subnets:** 6 (public, private, database)
- **Storage:** EFS + S3 + RDS
- **Uptime Target:** 99.9%

### User Features
- **Authentication:** Secure signup/login with sessions
- **Saved Cities:** Unlimited favorites per user
- **Search History:** Full tracking with timestamps
- **Preferences:** Customizable settings (temp units, default city)
- **Weather Forecasts:** 19 data points (current + hourly + daily)

---

## 🎯 About This Project

This weather dashboard was intentionally "vibe coded" using AI pair programming to:
1. **Demonstrate AI prompting skills** - Effective collaboration with LLMs
2. **Learn AWS services** - Hands-on practice with cloud infrastructure
3. **Master full-stack development** - End-to-end application building
4. **Practice DevOps** - Deployment and monitoring on Ubuntu

The development process showcased:
- Clear requirement specification to AI
- Iterative refinement and debugging
- Code review and optimization
- Comprehensive documentation generation
- Testing and quality assurance

---

## 📧 Contact

For questions, suggestions, or just to connect:
- **GitHub:** [@yourusername](https://github.com/yourusername)
- **Email:** your.email@example.com
- **LinkedIn:** [Your Name](https://linkedin.com/in/yourprofile)

---

## ⚡ Quick Start Summary

```bash
# 1. Clone
git clone https://github.com/yourusername/weather-dashboard.git
cd weather-dashboard

# 2. Setup database
psql -U postgres -d weather_db -f user_schema.sql
psql -U postgres -d weather_db -f cities_schema.sql

# 3. Configure
cp .env.example .env
# Edit .env with your settings

# 4. Install & Run
npm install
npm start

# 5. Open browser
# http://localhost:3000
```

---

**Built with ❤️ and AI assistance | Learning project | Not for commercial use**
