// ADD THESE TO YOUR server.js

// ============================================
// STEP 1: Add these imports at the top with your other requires
// ============================================
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

// ============================================
// STEP 2: Add these configuration variables after your PORT
// ============================================
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const SALT_ROUNDS = 10;

// ============================================
// STEP 3: Add cookie-parser middleware (after app.use(express.json()))
// ============================================
app.use(cookieParser());

// ============================================
// STEP 4: Add this authentication middleware function
// (Put this BEFORE your API routes section)
// ============================================

// Middleware to verify JWT token
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

// ============================================
// STEP 5: Add these AUTH API endpoints
// (Add these BEFORE your existing /api/weather route)
// ============================================

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
// STEP 6: Modify your existing /api/weather endpoint
// Add checkAuth middleware to support both guest and logged-in users
// ============================================

// Change this line:
// app.get('/api/weather', async (req, res) => {

// To this:
app.get('/api/weather', checkAuth, async (req, res) => {
    // ... rest of your weather code stays the same until the database insert
    
    // REPLACE this line:
    // await pool.query(
    //     'INSERT INTO searches (city, temperature, timestamp) VALUES ($1, $2, NOW())',
    //     [cityName, temperature]
    // );
    
    // WITH this (saves to user_searches if logged in, otherwise skips):
    if (req.user) {
        await pool.query(
            'INSERT INTO user_searches (user_id, city, temperature) VALUES ($1, $2, $3)',
            [req.user.id, cityName, temperature]
        );
    }
    
    // ... rest of your weather code continues
});

// ============================================
// STEP 7: Modify your /api/history endpoint
// Make it show only the logged-in user's history
// ============================================

// REPLACE your entire /api/history endpoint with this:
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
