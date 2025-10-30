// script.js - Main dashboard functionality with user authentication

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
const hourlyForecast = document.getElementById('hourlyForecast');
const dailyForecast = document.getElementById('dailyForecast');
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
    // Show user nav, hide guest nav
    guestNav.classList.add('hidden');
    userNav.classList.remove('hidden');
    navUserName.textContent = currentUser.name;
    
    // Show welcome message, hide guest title
    guestTitle.classList.add('hidden');
    welcomeMessage.classList.remove('hidden');
    welcomeUserName.textContent = currentUser.name;
    
    // Load user's default city if set
    loadDefaultCity();
}

function showGuestUI() {
    // Show guest nav, hide user nav
    guestNav.classList.remove('hidden');
    userNav.classList.add('hidden');
    
    // Show guest title, hide welcome message
    guestTitle.classList.remove('hidden');
    welcomeMessage.classList.add('hidden');
    
    // Hide user-specific sections
    savedCitiesSection.classList.add('hidden');
}

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
                searchWeather();
            }
        }
    } catch (error) {
        console.error('Error loading default city:', error);
    }
    
    // Load saved cities
    loadSavedCities();
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
    logoutBtn.addEventListener('click', async () => {
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
        hideError();
        
        const response = await fetch(`${API_URL}/weather?city=${encodeURIComponent(city + ', ' + state)}`);
        const data = await response.json();
        
        if (!response.ok) {
            showError(data.error || 'Failed to fetch weather data');
            return;
        }
        
        // Store current city data
        currentCityData = {
            city: data.city,
            state_id: state,
            state_name: state, // You might want to get full state name
            lat: lat,
            lng: lng
        };
        
        displayWeather(data);
        
        if (currentUser) {
            loadHistory();
            saveCitySection.classList.remove('hidden');
        } else {
            savePrompt.classList.remove('hidden');
        }
        
        cityInput.value = '';
        selectedCityData = null;
        
    } catch (error) {
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
        hideError();
        
        const response = await fetch(`${API_URL}/weather?city=${encodeURIComponent(city)}`);
        const data = await response.json();
        
        if (!response.ok) {
            showError(data.error || 'Failed to fetch weather data');
            return;
        }
        
        displayWeather(data);
        
        if (currentUser) {
            loadHistory();
        } else {
            savePrompt.classList.remove('hidden');
        }
        
        cityInput.value = '';
        
    } catch (error) {
        showError('Failed to connect to server. Make sure the backend is running.');
        console.error('Error:', error);
    }
}

function displayWeather(data) {
    document.getElementById('cityName').textContent = data.city;
    document.getElementById('temperature').textContent = `${data.temperature}°F`;
    document.getElementById('description').textContent = data.description;
    document.getElementById('humidity').textContent = `Humidity: ${data.humidity}%`;
    document.getElementById('windSpeed').textContent = `Wind Speed: ${data.windSpeed} mph`;
    
    currentWeather.classList.remove('hidden');
    
    // Display forecasts
    if (data.hourlyForecast && data.hourlyForecast.length > 0) {
        displayHourlyForecast(data.hourlyForecast);
    }
    
    if (data.dailyForecast && data.dailyForecast.length > 0) {
        displayDailyForecast(data.dailyForecast);
    }
}

function displayHourlyForecast(hours) {
    hourlyContainer.innerHTML = hours.map(hour => {
        const time = new Date(hour.time);
        const timeString = time.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            hour12: true 
        });
        
        return `
            <div class="hourly-card">
                <div class="time">${timeString}</div>
                <div class="temp">${hour.temperature}°${hour.temperatureUnit}</div>
                <div class="condition">${hour.shortForecast}</div>
            </div>
        `;
    }).join('');
    
    hourlyForecast.classList.remove('hidden');
}

function displayDailyForecast(days) {
    dailyContainer.innerHTML = days.map(day => {
        return `
            <div class="daily-card">
                <div class="day-name">${day.name}</div>
                <div class="temp">${day.temperature}°${day.temperatureUnit}</div>
                <div class="condition">${day.shortForecast}</div>
            </div>
        `;
    }).join('');
    
    dailyForecast.classList.remove('hidden');
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
    currentWeather.classList.add('hidden');
}

function hideError() {
    errorDiv.classList.add('hidden');
}
