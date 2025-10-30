const API_URL = '/api';
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const currentWeather = document.getElementById('currentWeather');
const errorDiv = document.getElementById('error');
const historyBody = document.getElementById('historyBody');
const hourlyForecast = document.getElementById('hourlyForecast');
const dailyForecast = document.getElementById('dailyForecast');
const hourlyContainer = document.getElementById('hourlyContainer');
const dailyContainer = document.getElementById('dailyContainer');

// Autocomplete variables
const autocompleteDropdown = document.getElementById('autocompleteDropdown');
let selectedCityData = null; // Store selected city's coordinates
let debounceTimer;

// Listen for typing in the city input
cityInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    
    // Clear previous timer
    clearTimeout(debounceTimer);
    
    // If query is too short, hide dropdown
    if (query.length < 2) {
        hideAutocomplete();
        return;
    }
    
    // Debounce: wait 300ms after user stops typing before searching
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

// Display autocomplete dropdown with results
function displayAutocomplete(cities) {
    autocompleteDropdown.innerHTML = cities.map(city => `
        <div class="autocomplete-item" data-city="${city.city}" data-state="${city.state}" data-lat="${city.lat}" data-lng="${city.lng}">
            <span class="city-name">${city.city}</span>
            <span class="state-name">${city.state}</span>
        </div>
    `).join('');
    
    // Add click handlers to each item
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
    
    // Store the selected city data
    selectedCityData = { city, state, lat, lng };
    
    // Update input field
    cityInput.value = `${city}, ${state}`;
    
    // Hide dropdown
    hideAutocomplete();
    
    // Automatically search weather for selected city
    searchWeatherWithCoordinates(city, state, lat, lng);
}

// Hide autocomplete dropdown
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

// Modified search function to use coordinates if available
async function searchWeatherWithCoordinates(city, state, lat, lng) {
    try {
        hideError();
        
        const response = await fetch(`${API_URL}/weather?city=${encodeURIComponent(city + ', ' + state)}`);
        const data = await response.json();
        
        if (!response.ok) {
            showError(data.error || 'Failed to fetch weather data');
            return;
        }
        
        displayWeather(data);
        loadHistory();
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
        loadHistory();
        cityInput.value = '';
        
    } catch (error) {
        showError('Failed to connect to server. Make sure the backend is running.');
        console.error('Error:', error);
    }
}

function displayWeather(data) {
    // Display current weather (same as before)
    document.getElementById('cityName').textContent = data.city;
    document.getElementById('temperature').textContent = `${data.temperature}°F`;
    document.getElementById('description').textContent = data.description;
    document.getElementById('humidity').textContent = `Humidity: ${data.humidity}%`;
    document.getElementById('windSpeed').textContent = `Wind Speed: ${data.windSpeed} mph`;
    
    currentWeather.classList.remove('hidden');
    
    // NEW: Update background video based on weather
    updateWeatherVideo(data.description);
    
    // NEW: Display hourly forecast
    if (data.hourlyForecast && data.hourlyForecast.length > 0) {
        displayHourlyForecast(data.hourlyForecast);
    }
    
    // NEW: Display daily forecast
    if (data.dailyForecast && data.dailyForecast.length > 0) {
        displayDailyForecast(data.dailyForecast);
    }
}

// NEW FUNCTION: Display hourly forecast
function displayHourlyForecast(hours) {
    hourlyContainer.innerHTML = hours.map(hour => {
        const time = new Date(hour.time);
        const timeString = time.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            hour12: true 
        });
        
        // Calculate isDaytime from hour if API doesn't provide it
        // 6 AM (6) to 6 PM (18) = daytime
        const currentHour = time.getHours();
        const isDaytime = hour.isDaytime !== undefined 
            ? hour.isDaytime 
            : (currentHour >= 6 && currentHour < 18);
        
        // Get weather icon info with night detection
        const iconInfo = getWeatherIcon(hour.shortForecast, isDaytime);
        
        return `
            <div class="hourly-card">
                <div class="time">${timeString}</div>
                <div class="weather-icon-container ${iconInfo.class}">
                    <i data-lucide="${iconInfo.icon}"></i>
                </div>
                <div class="temp">${hour.temperature}°${hour.temperatureUnit}</div>
                <div class="condition">${hour.shortForecast}</div>
            </div>
        `;
    }).join('');
    
    hourlyForecast.classList.remove('hidden');
    
    // Initialize Lucide icons
    lucide.createIcons();
}

// NEW FUNCTION: Display daily forecast
function displayDailyForecast(days) {
    dailyContainer.innerHTML = days.map(day => {
        // Get weather icon info with night detection
        const iconInfo = getWeatherIcon(day.shortForecast, day.isDaytime);
        
        return `
            <div class="daily-card">
                <div class="day-name">${day.name}</div>
                <div class="weather-icon-container ${iconInfo.class}">
                    <i data-lucide="${iconInfo.icon}"></i>
                </div>
                <div class="temp">${day.temperature}°${day.temperatureUnit}</div>
                <div class="condition">${day.shortForecast}</div>
            </div>
        `;
    }).join('');
    
    dailyForecast.classList.remove('hidden');
    
    // Initialize Lucide icons
    lucide.createIcons();
}


async function loadHistory() {
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

// Update background video based on weather condition
function updateWeatherVideo(condition) {
    const videoElement = document.getElementById('weatherVideo');
    const videoSource = videoElement.querySelector('source');
    
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
    
    // Build video path
    const videoPath = `weather-videos/${timePrefix}-${weatherType}.mp4`;
    
    // Only update if video path changed
    if (videoSource.src !== videoPath) {
        videoSource.src = videoPath;
        videoElement.load();
        videoElement.play().catch(err => {
            console.log('Video autoplay prevented:', err);
        });
    }
}

// Weather icon mapping helper
function getWeatherIcon(condition, isDaytime = true) {
    const weatherIconMap = {
        // Sunny/Clear conditions - different for day/night
        'clear': { 
            day: { icon: 'sun', class: 'sunny' },
            night: { icon: 'moon', class: 'night' }
        },
        'sunny': { 
            day: { icon: 'sun', class: 'sunny' },
            night: { icon: 'moon', class: 'night' }
        },
        'clear sky': { 
            day: { icon: 'sun', class: 'sunny' },
            night: { icon: 'moon', class: 'night' }
        },
        'fair': { 
            day: { icon: 'sun', class: 'sunny' },
            night: { icon: 'moon', class: 'night' }
        },
        
        // Cloudy conditions - different for day/night
        'cloudy': { icon: 'cloud', class: 'cloudy' },
        'clouds': { icon: 'cloud', class: 'cloudy' },
        'overcast': { icon: 'cloud', class: 'cloudy' },
        'partly cloudy': { 
            day: { icon: 'cloud-sun', class: 'cloudy' },
            night: { icon: 'cloud-moon', class: 'night-cloudy' }
        },
        'mostly cloudy': { 
            day: { icon: 'cloud', class: 'cloudy' },
            night: { icon: 'cloud-moon', class: 'night-cloudy' }
        },
        'few clouds': { 
            day: { icon: 'cloud-sun', class: 'cloudy' },
            night: { icon: 'cloud-moon', class: 'night-cloudy' }
        },
        'scattered clouds': { 
            day: { icon: 'cloud-sun', class: 'cloudy' },
            night: { icon: 'cloud-moon', class: 'night-cloudy' }
        },
        'broken clouds': { icon: 'cloud', class: 'cloudy' },
        
        // Rainy conditions (same day/night)
        'rain': { icon: 'cloud-rain', class: 'rainy' },
        'rainy': { icon: 'cloud-rain', class: 'rainy' },
        'light rain': { icon: 'cloud-drizzle', class: 'rainy' },
        'drizzle': { icon: 'cloud-drizzle', class: 'rainy' },
        'shower': { icon: 'cloud-rain', class: 'rainy' },
        'showers': { icon: 'cloud-rain', class: 'rainy' },
        'heavy rain': { icon: 'cloud-rain', class: 'rainy' },
        'chance rain': { icon: 'cloud-rain', class: 'rainy' },
        
        // Stormy conditions (same day/night)
        'thunderstorm': { icon: 'cloud-lightning', class: 'stormy' },
        'storm': { icon: 'cloud-lightning', class: 'stormy' },
        'thunder': { icon: 'cloud-lightning', class: 'stormy' },
        't-storm': { icon: 'cloud-lightning', class: 'stormy' },
        
        // Snowy conditions (same day/night)
        'snow': { icon: 'cloud-snow', class: 'snowy' },
        'snowy': { icon: 'cloud-snow', class: 'snowy' },
        'light snow': { icon: 'cloud-snow', class: 'snowy' },
        'heavy snow': { icon: 'cloud-snow', class: 'snowy' },
        'sleet': { icon: 'cloud-snow', class: 'snowy' },
        'flurries': { icon: 'cloud-snow', class: 'snowy' },
        
        // Windy conditions (same day/night)
        'windy': { icon: 'wind', class: 'windy' },
        'wind': { icon: 'wind', class: 'windy' },
        'breezy': { icon: 'wind', class: 'windy' },
        
        // Foggy/Misty (same day/night)
        'fog': { icon: 'cloud-fog', class: 'cloudy' },
        'mist': { icon: 'cloud-fog', class: 'cloudy' },
        'haze': { icon: 'cloud-fog', class: 'cloudy' },
        'foggy': { icon: 'cloud-fog', class: 'cloudy' }
    };
    
    const normalized = condition.toLowerCase().trim();
    
    // Check for exact match first
    if (weatherIconMap[normalized]) {
        const mapping = weatherIconMap[normalized];
        // If mapping has day/night variants, choose based on isDaytime
        if (mapping.day && mapping.night) {
            return isDaytime ? mapping.day : mapping.night;
        }
        // Otherwise return the single mapping
        return mapping;
    }
    
    // Check for partial matches
    for (const [key, value] of Object.entries(weatherIconMap)) {
        if (normalized.includes(key)) {
            // If mapping has day/night variants, choose based on isDaytime
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