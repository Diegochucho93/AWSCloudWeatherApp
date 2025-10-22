const API_URL = 'http://localhost:3000/api';

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const currentWeather = document.getElementById('currentWeather');
const errorDiv = document.getElementById('error');
const historyBody = document.getElementById('historyBody');

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
        loadHistory(); // Reload history after new search
        cityInput.value = ''; // Clear input
        
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
