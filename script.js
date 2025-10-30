// script.js - Main dashboard functionality with user authentication
updateWeatherVideo('cloudy');
const API_URL = '/api';
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const currentWeather = document.getElementById('currentWeather');
const errorDiv = document.getElementById('error');
const historyBody = document.getElementById('historyBody');

// Autocomplete variables
const autocompleteDropdown = document.getElementById('autocompleteDropdown');
let selectedCityData = null;
let debounceTimer;

// Forecast variables
//const hourlyForecast = document.getElementById('hourlyForecast');
//const dailyForecast = document.getElementById('dailyForecast');
const hourlyContainer = document.getElementById('hourlyContainer');
const dailyContainer = document.getElementById('dailyContainer');

// User-related variables
let currentUser = null;
let currentCityData = null; // Store current city being displayed

// Navigation elements
const guestNav = document.getElementById('guestNav');
const userNav = document.getElementById('userNav');
const navUserName = document.getElementById('navUserName');
const logoutBtn = document.getElementById('logoutBtn');
const guestTitle = document.getElementById('guestTitle');
const welcomeMessage = document.getElementById('welcomeMessage');
const welcomeUserName = document.getElementById('welcomeUserName');
const savePrompt = document.getElementById('savePrompt');
const saveCitySection = document.getElementById('saveCitySection');
const saveCityBtn = document.getElementById('saveCityBtn');
const savedCitiesSection = document.getElementById('savedCitiesSection');
const savedCitiesGrid = document.getElementById('savedCitiesGrid');

// AUTH & PROFILE DROPDOWN ELEMENTS
// ============================================

// Guest auth elements
const loginMenuBtn = document.getElementById('loginMenuBtn');
const authDropdown = document.getElementById('authDropdown');
const loginFormContainer = document.getElementById('loginFormContainer');
const signupFormContainer = document.getElementById('signupFormContainer');
const showSignupBtn = document.getElementById('showSignupBtn');
const showLoginBtn = document.getElementById('showLoginBtn');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const authError = document.getElementById('authError');
const promptLoginBtn = document.getElementById('promptLoginBtn');

// Profile elements
const profileMenuBtn = document.getElementById('profileMenuBtn');
const profileDropdown = document.getElementById('profileDropdown');
const dropdownUserName = document.getElementById('dropdownUserName');

const loadingSpinner = document.getElementById('loadingSpinner');
const weatherLayout = document.getElementById('weatherLayout');
const savedCitiesToggle = document.getElementById('savedCitiesToggle');
const savedCitiesContent = document.getElementById('savedCitiesContent');
const historyToggle = document.getElementById('historyToggle');
const historyContent = document.getElementById('historyContent');
const historySection = document.getElementById('historySection');


// Check if user is logged in on page load
checkAuth();

async function checkAuth() {
    try {
        const response = await fetch(`${API_URL}/auth/me`);
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showLoggedInUI();
            loadUserData();
        } else {
            currentUser = null;
            showGuestUI();
        }
        
    } catch (error) {
        console.error('Auth check error:', error);
        currentUser = null;
        showGuestUI();
    }
}

function showLoggedInUI() {
    // Hide guest nav, show user nav
    if (guestNav) guestNav.classList.add('hidden');
    if (userNav) userNav.classList.remove('hidden');
    
    // Make absolutely sure auth dropdown is closed
    if (authDropdown) authDropdown.classList.add('hidden');
    if (profileDropdown) profileDropdown.classList.add('hidden');
    
    // Set user name in profile dropdown
    if (dropdownUserName) {
        dropdownUserName.textContent = currentUser.name;
    }
    
    // Show welcome message, hide guest title
    if (guestTitle) guestTitle.classList.add('hidden');
    if (welcomeMessage) welcomeMessage.classList.remove('hidden');
    if (welcomeUserName) welcomeUserName.textContent = currentUser.name;
    
    // Initialize lucide icons for profile icon
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Load user's default city if set
    loadDefaultCity();
}

function showGuestUI() {
    // Show guest nav, hide user nav
    if (guestNav) guestNav.classList.remove('hidden');
    if (userNav) userNav.classList.add('hidden');
    
    // Make absolutely sure profile dropdown is closed
    if (profileDropdown) profileDropdown.classList.add('hidden');
    if (authDropdown) authDropdown.classList.add('hidden');
    
    // Show guest title, hide welcome message
    if (guestTitle) guestTitle.classList.remove('hidden');
    if (welcomeMessage) welcomeMessage.classList.add('hidden');
    
    // Hide user-specific sections
    if (savedCitiesSection) savedCitiesSection.classList.add('hidden');
    
    // Show placeholder for guests
    showWeatherPlaceholder();
}
// ============================================
// AUTH DROPDOWN TOGGLE & SWITCHING
// ============================================

// Toggle auth dropdown (login button click)
if (loginMenuBtn && authDropdown) {
    loginMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        authDropdown.classList.toggle('hidden');
        
        // Reset to login form when opening
        if (!authDropdown.classList.contains('hidden')) {
            showLoginForm();
        }
        
        // Initialize lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    });
}

// Prompt login button (in save prompt)
if (promptLoginBtn) {
    promptLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        authDropdown.classList.remove('hidden');
        showLoginForm();
    });
}

// Switch to signup form
if (showSignupBtn) {
    showSignupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showSignupForm();
    });
}

// Switch to login form
if (showLoginBtn) {
    showLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
    });
}

function showLoginForm() {
    loginFormContainer.classList.remove('hidden');
    signupFormContainer.classList.add('hidden');
    authError.classList.add('hidden');
}

function showSignupForm() {
    loginFormContainer.classList.add('hidden');
    signupFormContainer.classList.remove('hidden');
    authError.classList.add('hidden');
}

// ============================================
// LOGIN FORM SUBMISSION
// ============================================

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Success - close dropdown and refresh UI
                authDropdown.classList.add('hidden');
                loginForm.reset();
                
                // Reload user state
                await checkAuth();
            } else {
                showAuthError(data.error || 'Login failed');
            }
            
        } catch (error) {
            showAuthError('Failed to connect to server');
            console.error('Login error:', error);
        }
    });
}

// ============================================
// SIGNUP FORM SUBMISSION
// ============================================

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
        
        // Validate passwords match
        if (password !== passwordConfirm) {
            showAuthError('Passwords do not match');
            return;
        }
        
        if (password.length < 6) {
            showAuthError('Password must be at least 6 characters');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Success - close dropdown and refresh UI
                authDropdown.classList.add('hidden');
                signupForm.reset();
                
                // Reload user state
                await checkAuth();
            } else {
                showAuthError(data.error || 'Signup failed');
            }
            
        } catch (error) {
            showAuthError('Failed to connect to server');
            console.error('Signup error:', error);
        }
    });
}

function showAuthError(message) {
    authError.textContent = message;
    authError.classList.remove('hidden');
    
    // Hide after 5 seconds
    setTimeout(() => {
        authError.classList.add('hidden');
    }, 5000);
}

// ============================================
// LOADING SPINNER FUNCTIONS
// ============================================

function showLoading() {
    if (loadingSpinner) {
        loadingSpinner.classList.remove('hidden');
    }
    if (weatherLayout) {
        weatherLayout.classList.add('hidden');
    }
    hideError();
}

function hideLoading() {
    if (loadingSpinner) {
        loadingSpinner.classList.add('hidden');
    }
}

// ============================================
// COLLAPSIBLE SECTION TOGGLES
// ============================================

// Saved Cities Toggle
if (savedCitiesToggle && savedCitiesContent) {
    savedCitiesToggle.addEventListener('click', () => {
        savedCitiesToggle.classList.toggle('active');
        savedCitiesContent.classList.toggle('hidden');
        
        // Re-initialize lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    });
}

// History Toggle
if (historyToggle && historyContent) {
    historyToggle.addEventListener('click', () => {
        historyToggle.classList.toggle('active');
        historyContent.classList.toggle('hidden');
        
        // Re-initialize lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    });
}


// ============================================
// PROFILE DROPDOWN TOGGLE
// ============================================

if (profileMenuBtn && profileDropdown) {
    profileMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('hidden');
        
        // Initialize lucide icons in dropdown
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!profileMenuBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.add('hidden');
        }
    });
}
// Close auth dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (authDropdown && loginMenuBtn) {
        if (!loginMenuBtn.contains(e.target) && !authDropdown.contains(e.target)) {
            authDropdown.classList.add('hidden');
        }
    }
});
// Load user's default city weather
async function loadDefaultCity() {
    try {
        const response = await fetch(`${API_URL}/preferences`);
        if (response.ok) {
            const data = await response.json();
            const prefs = data.preferences || data;
            
            if (prefs.default_city && prefs.default_state) {
                // Auto-load default city weather
                const cityQuery = `${prefs.default_city}, ${prefs.default_state}`;
                cityInput.value = cityQuery;
                
                // Set selected city data for the search
                selectedCityData = {
                    city: prefs.default_city,
                    state: prefs.default_state,
                    lat: null, // Will be fetched from API
                    lng: null
                };
                
                // Trigger search
                await searchWeather();
            } else {
                // No default city set - show placeholder
                showWeatherPlaceholder();
            }
        } else {
            // Failed to load preferences - show placeholder
            showWeatherPlaceholder();
        }
    } catch (error) {
        console.error('Error loading default city:', error);
        showWeatherPlaceholder();
    }
    
    // Load saved cities
    loadSavedCities();
}

// Show placeholder in weather layout when no city is searched
function showWeatherPlaceholder() {
    // Hide error and show weather layout
    hideError();
    if (weatherLayout) {
        weatherLayout.classList.remove('hidden');
    }
    
    // Set placeholder content in current weather card
    document.getElementById('cityName').textContent = '';
    document.getElementById('temperature').innerHTML = '<i data-lucide="search" class="placeholder-icon"></i>';
    document.getElementById('description').textContent = 'Search for a city to view weather data';
    document.getElementById('humidity').textContent = '';
    document.getElementById('windSpeed').textContent = '';
    
    // Set placeholder content in hourly forecast
    if (hourlyContainer) {
        hourlyContainer.innerHTML = `
            <div class="forecast-placeholder">
                <i data-lucide="clock" class="placeholder-icon-small"></i>
                <p>Hourly forecast will appear here</p>
            </div>
        `;
    }
    
    // Set placeholder content in daily forecast
    if (dailyContainer) {
        dailyContainer.innerHTML = `
            <div class="forecast-placeholder">
                <i data-lucide="calendar" class="placeholder-icon-small"></i>
                <p>7-day forecast will appear here</p>
            </div>
        `;
    }
    
    // Re-initialize lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Load user data (saved cities and search history)
async function loadUserData() {
    loadSavedCities();
    loadHistory();
}

// Load saved/favorite cities
async function loadSavedCities() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_URL}/saved-cities`);
        if (response.ok) {
            const data = await response.json();
            displaySavedCities(data.cities);
        }
    } catch (error) {
        console.error('Error loading saved cities:', error);
    }
}

function displaySavedCities(cities) {
    if (!cities || cities.length === 0) {
        savedCitiesSection.classList.add('hidden');
        return;
    }
    
    savedCitiesSection.classList.remove('hidden');
    savedCitiesGrid.innerHTML = cities.map(city => `
        <div class="saved-city-card" data-city="${city.city}" data-state="${city.state_id}">
            <h3>${city.city}, ${city.state_id}</h3>
            <button class="remove-city-btn" data-id="${city.id}">×</button>
        </div>
    `).join('');
    
    // Add click handlers
    document.querySelectorAll('.saved-city-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('remove-city-btn')) {
                const city = card.dataset.city;
                const state = card.dataset.state;
                cityInput.value = `${city}, ${state}`;
                searchWeather();
            }
        });
    });
    
    // Add remove button handlers
    document.querySelectorAll('.remove-city-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const cityId = btn.dataset.id;
            await removeSavedCity(cityId);
        });
    });
    
    // Re-initialize lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

async function removeSavedCity(cityId) {
    try {
        const response = await fetch(`${API_URL}/saved-cities/${cityId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadSavedCities(); // Reload list
        }
    } catch (error) {
        console.error('Error removing city:', error);
    }
}

// Logout
if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.stopPropagation(); // Prevent dropdown from reopening
        try {
            await fetch(`${API_URL}/auth/logout`, { method: 'POST' });
            window.location.reload();
        } catch (error) {
            console.error('Logout error:', error);
        }
    });
}

// Save current city
if (saveCityBtn) {
    saveCityBtn.addEventListener('click', async () => {
        if (!currentCityData) return;
        
        try {
            const response = await fetch(`${API_URL}/saved-cities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentCityData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                saveCityBtn.textContent = '✓ Saved!';
                setTimeout(() => {
                    saveCityBtn.textContent = '⭐ Save this city';
                    saveCitySection.classList.add('hidden');
                }, 2000);
                loadSavedCities();
            } else {
                alert(data.error || 'Failed to save city');
            }
            
        } catch (error) {
            console.error('Error saving city:', error);
            alert('Failed to save city');
        }
    });
}

// Listen for typing in the city input (autocomplete)
cityInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    clearTimeout(debounceTimer);
    
    if (query.length < 2) {
        hideAutocomplete();
        return;
    }
    
    debounceTimer = setTimeout(() => {
        searchCities(query);
    }, 300);
});

// Search for cities via API
async function searchCities(query) {
    try {
        const response = await fetch(`${API_URL}/cities/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.cities && data.cities.length > 0) {
            displayAutocomplete(data.cities);
        } else {
            hideAutocomplete();
        }
        
    } catch (error) {
        console.error('Error searching cities:', error);
        hideAutocomplete();
    }
}

// Display autocomplete dropdown
function displayAutocomplete(cities) {
    autocompleteDropdown.innerHTML = cities.map(city => `
        <div class="autocomplete-item" data-city="${city.city}" data-state="${city.state}" data-lat="${city.lat}" data-lng="${city.lng}">
            <span class="city-name">${city.city}</span>
            <span class="state-name">${city.state}</span>
        </div>
    `).join('');
    
    const items = autocompleteDropdown.querySelectorAll('.autocomplete-item');
    items.forEach(item => {
        item.addEventListener('click', () => {
            selectCity(item);
        });
    });
    
    autocompleteDropdown.classList.remove('hidden');
}

// Handle city selection from dropdown
function selectCity(item) {
    const city = item.dataset.city;
    const state = item.dataset.state;
    const lat = parseFloat(item.dataset.lat);
    const lng = parseFloat(item.dataset.lng);
    
    selectedCityData = { city, state, lat, lng };
    cityInput.value = `${city}, ${state}`;
    hideAutocomplete();
    searchWeatherWithCoordinates(city, state, lat, lng);
}

// Hide autocomplete
function hideAutocomplete() {
    autocompleteDropdown.classList.add('hidden');
    autocompleteDropdown.innerHTML = '';
}

// Click outside to close dropdown
document.addEventListener('click', (e) => {
    if (!cityInput.contains(e.target) && !autocompleteDropdown.contains(e.target)) {
        hideAutocomplete();
    }
});

// Search weather with coordinates
async function searchWeatherWithCoordinates(city, state, lat, lng) {
    try {
        showLoading(); // Show spinner
        hideError();
        
        const response = await fetch(`${API_URL}/weather?city=${encodeURIComponent(city + ', ' + state)}`);
        const data = await response.json();
        
        hideLoading(); // Hide spinner
        
        if (!response.ok) {
            showError(data.error || 'Failed to fetch weather data');
            return;
        }
        
        // Store current city data
        currentCityData = {
            city: data.city,
            state_id: state,
            state_name: state,
            lat: lat,
            lng: lng
        };
        
        displayWeather(data);
        
        if (currentUser) {
            loadHistory();
            saveCitySection.classList.remove('hidden');
            historySection.classList.remove('hidden'); // Show history section
        } else {
            savePrompt.classList.remove('hidden');
        }
        
        cityInput.value = '';
        selectedCityData = null;
        
    } catch (error) {
        hideLoading();
        showError('Failed to connect to server.');
        console.error('Error:', error);
    }
}

// Search weather on button click
searchBtn.addEventListener('click', searchWeather);

// Search weather on Enter key
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        hideAutocomplete();
        searchWeather();
    }
});

// Load history when page loads
window.addEventListener('load', loadHistory);

async function searchWeather() {
    const city = cityInput.value.trim();
    
    if (!city) {
        showError('Please enter a city name');
        return;
    }
    
    try {
        showLoading(); // Show spinner
        hideError();
        
        const response = await fetch(`${API_URL}/weather?city=${encodeURIComponent(city)}`);
        const data = await response.json();
        
        hideLoading(); // Hide spinner
        
        if (!response.ok) {
            showError(data.error || 'Failed to fetch weather data');
            return;
        }
        
        displayWeather(data);
        
        if (currentUser) {
            loadHistory();
            saveCitySection.classList.remove('hidden');
            historySection.classList.remove('hidden'); // Show history section
        } else {
            savePrompt.classList.remove('hidden');
        }
        
        cityInput.value = '';
        
    } catch (error) {
        hideLoading();
        showError('Failed to connect to server. Make sure the backend is running.');
        console.error('Error:', error);
    }
}



function displayWeather(data) {
    // Update current weather
    document.getElementById('cityName').textContent = data.city;
    document.getElementById('temperature').textContent = `${data.temperature}°F`;
    document.getElementById('description').textContent = data.description;
    document.getElementById('humidity').textContent = `💧 ${data.humidity}%`;
    document.getElementById('windSpeed').textContent = `🌬️ ${data.windSpeed} mph`;
    
    // Update background video based on weather condition
    if (data.description) {
        updateWeatherVideo(data.description);
    }
    
    // Show weather layout
    if (weatherLayout) {
        weatherLayout.classList.remove('hidden');
    }
    
    // Display forecasts
    if (data.hourlyForecast && data.hourlyForecast.length > 0) {
        displayHourlyForecast(data.hourlyForecast);
    }
    
    if (data.dailyForecast && data.dailyForecast.length > 0) {
        displayDailyForecast(data.dailyForecast);
    }
    
    // Re-initialize lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function displayHourlyForecast(hours) {
    if (!hourlyContainer) return;
    
    hourlyContainer.innerHTML = hours.map(hour => {
        const time = new Date(hour.time);
        const timeString = time.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            hour12: true 
        });
        
        // Get weather emoji
        const emoji = getWeatherEmoji(hour.shortForecast);
        
        return `
            <div class="hourly-card">
                <div class="time">${timeString}</div>
                <div class="emoji">${emoji}</div>
                <div class="temp">${hour.temperature}°${hour.temperatureUnit}</div>
                <div class="condition">${hour.shortForecast}</div>
            </div>
        `;
    }).join('');
}

function displayDailyForecast(days) {
    if (!dailyContainer) return;
    
    dailyContainer.innerHTML = days.map(day => {
        // Get weather emoji
        const emoji = getWeatherEmoji(day.shortForecast);
        
        return `
            <div class="daily-card">
                <div class="day-name">${day.name}</div>
                <div class="emoji">${emoji}</div>
                <div class="temp">${day.temperature}°${day.temperatureUnit}</div>
                <div class="condition">${day.shortForecast}</div>
            </div>
        `;
    }).join('');
}

async function loadHistory() {
    if (!currentUser) return;
    
    try {
        const response = await fetch(`${API_URL}/history`);
        const data = await response.json();
        
        if (!response.ok) {
            console.error('Failed to load history:', data.error);
            return;
        }
        
        displayHistory(data.history);
        
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

function displayHistory(history) {
    if (!history || history.length === 0) {
        historyBody.innerHTML = '<tr><td colspan="3">No search history yet</td></tr>';
        return;
    }
    
    historyBody.innerHTML = history.map(item => `
        <tr>
            <td>${item.city}</td>
            <td>${item.temperature}°F</td>
            <td>${formatDate(item.timestamp)}</td>
        </tr>
    `).join('');
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    if (weatherLayout) {
       weatherLayout.classList.add('hidden');
   }
}

function hideError() {
    errorDiv.classList.add('hidden');
}

// Update background video based on weather condition
function updateWeatherVideo(condition) {
    const videoElement = document.getElementById('weatherVideo');
    if (!videoElement) return;
    
    // Determine if it's daytime (6 AM - 6 PM)
    const currentHour = new Date().getHours();
    const isDaytime = currentHour >= 6 && currentHour < 18;
    const timePrefix = isDaytime ? 'day' : 'night';
    
    // Map weather condition to video filename
    const weatherMap = {
        'clear': 'clear',
        'sunny': 'clear',
        'clear sky': 'clear',
        'fair': 'clear',
        'cloudy': 'cloudy',
        'clouds': 'cloudy',
        'overcast': 'cloudy',
        'partly cloudy': 'cloudy',
        'mostly cloudy': 'cloudy',
        'few clouds': 'cloudy',
        'scattered clouds': 'cloudy',
        'broken clouds': 'cloudy',
        'rain': 'rain',
        'rainy': 'rain',
        'light rain': 'rain',
        'drizzle': 'rain',
        'shower': 'rain',
        'showers': 'rain',
        'heavy rain': 'rain',
        'chance rain': 'rain',
        'thunderstorm': 'storm',
        'storm': 'storm',
        'thunder': 'storm',
        't-storm': 'storm',
        'snow': 'snow',
        'snowy': 'snow',
        'light snow': 'snow',
        'heavy snow': 'snow',
        'sleet': 'snow',
        'flurries': 'snow',
        'fog': 'fog',
        'mist': 'fog',
        'haze': 'fog',
        'foggy': 'fog',
        'windy': 'cloudy',
        'wind': 'cloudy',
        'breezy': 'cloudy'
    };
    
    const normalized = condition.toLowerCase().trim();
    let weatherType = 'cloudy'; // default
    
    // Find matching weather type
    for (const [key, value] of Object.entries(weatherMap)) {
        if (normalized.includes(key)) {
            weatherType = value;
            break;
        }
    }
    
    // This is the line that uses your folder name
    const videoPath = `weather-videos/${timePrefix}-${weatherType}.mp4`;
    
    // Update video src directly
    if (videoElement.src !== videoPath) {
        videoElement.src = videoPath;
        videoElement.load();
        videoElement.play().catch(err => {
            console.log('Video autoplay prevented:', err);
        });
    }
}

// Weather icon mapping helper (needed for the other file, but good to keep with video logic)
function getWeatherIcon(condition, isDaytime = true) {
    const weatherIconMap = {
        'clear': { day: { icon: 'sun', class: 'sunny' }, night: { icon: 'moon', class: 'night' } },
        'sunny': { day: { icon: 'sun', class: 'sunny' }, night: { icon: 'moon', class: 'night' } },
        'clear sky': { day: { icon: 'sun', class: 'sunny' }, night: { icon: 'moon', class: 'night' } },
        'fair': { day: { icon: 'sun', class: 'sunny' }, night: { icon: 'moon', class: 'night' } },
        'cloudy': { icon: 'cloud', class: 'cloudy' },
        'clouds': { icon: 'cloud', class: 'cloudy' },
        'overcast': { icon: 'cloud', class: 'cloudy' },
        'partly cloudy': { day: { icon: 'cloud-sun', class: 'cloudy' }, night: { icon: 'cloud-moon', class: 'night-cloudy' } },
        'mostly cloudy': { day: { icon: 'cloud', class: 'cloudy' }, night: { icon: 'cloud-moon', class: 'night-cloudy' } },
        'few clouds': { day: { icon: 'cloud-sun', class: 'cloudy' }, night: { icon: 'cloud-moon', class: 'night-cloudy' } },
        'scattered clouds': { day: { icon: 'cloud-sun', class: 'cloudy' }, night: { icon: 'cloud-moon', class: 'night-cloudy' } },
        'broken clouds': { icon: 'cloud', class: 'cloudy' },
        'rain': { icon: 'cloud-rain', class: 'rainy' },
        'rainy': { icon: 'cloud-rain', class: 'rainy' },
        'light rain': { icon: 'cloud-drizzle', class: 'rainy' },
        'drizzle': { icon: 'cloud-drizzle', class: 'rainy' },
        'shower': { icon: 'cloud-rain', class: 'rainy' },
        'showers': { icon: 'cloud-rain', class: 'rainy' },
        'heavy rain': { icon: 'cloud-rain', class: 'rainy' },
        'chance rain': { icon: 'cloud-rain', class: 'rainy' },
        'thunderstorm': { icon: 'cloud-lightning', class: 'stormy' },
        'storm': { icon: 'cloud-lightning', class: 'stormy' },
        'thunder': { icon: 'cloud-lightning', class: 'stormy' },
        't-storm': { icon: 'cloud-lightning', class: 'stormy' },
        'snow': { icon: 'cloud-snow', class: 'snowy' },
        'snowy': { icon: 'cloud-snow', class: 'snowy' },
        'light snow': { icon: 'cloud-snow', class: 'snowy' },
        'heavy snow': { icon: 'cloud-snow', class: 'snowy' },
        'sleet': { icon: 'cloud-snow', class: 'snowy' },
        'flurries': { icon: 'cloud-snow', class: 'snowy' },
        'windy': { icon: 'wind', class: 'windy' },
        'wind': { icon: 'wind', class: 'windy' },
        'breezy': { icon: 'wind', class: 'windy' },
        'fog': { icon: 'cloud-fog', class: 'cloudy' },
        'mist': { icon: 'cloud-fog', class: 'cloudy' },
        'haze': { icon: 'cloud-fog', class: 'cloudy' },
        'foggy': { icon: 'cloud-fog', class: 'cloudy' }
    };
    
    const normalized = condition.toLowerCase().trim();
    // Check for exact match first
    if (weatherIconMap[normalized]) {
        const mapping = weatherIconMap[normalized];
        if (mapping.day && mapping.night) {
            return isDaytime ? mapping.day : mapping.night;
        }
        return mapping;
    }
    
    // Check for partial matches
    for (const [key, value] of Object.entries(weatherIconMap)) {
        if (normalized.includes(key)) {
            if (value.day && value.night) {
                return isDaytime ? value.day : value.night;
           }
            return value;
        }
    }
    
    // Default to cloudy/night-cloudy based on time
    return isDaytime 
        ? { icon: 'cloud', class: 'cloudy' }
        : { icon: 'cloud-moon', class: 'night-cloudy' };
}
function getWeatherEmoji(condition) {
    const normalized = condition.toLowerCase();
    
    // Check for specific conditions
    if (normalized.includes('thunder') || normalized.includes('t-storm')) return '⛈️';
    if (normalized.includes('snow') || normalized.includes('flurries') || normalized.includes('sleet')) return '🌨️';
    if (normalized.includes('rain') || normalized.includes('shower') || normalized.includes('drizzle')) return '🌧️';
    if (normalized.includes('fog') || normalized.includes('mist') || normalized.includes('haze')) return '🌫️';
    if (normalized.includes('wind') || normalized.includes('breezy')) return '💨';
    if (normalized.includes('cloudy') || normalized.includes('overcast') || normalized.includes('clouds')) return '☁️';
    if (normalized.includes('partly') || normalized.includes('mostly')) return '⛅';
    if (normalized.includes('clear') || normalized.includes('sunny') || normalized.includes('fair')) return '☀️';
    
    // Default
    return '🌤️';
}