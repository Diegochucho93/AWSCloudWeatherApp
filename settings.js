// settings.js

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/api';
    let selectedCityData = null; // For default city autocomplete
    let debounceTimer;

    // --- DOM Elements ---
    const navUserName = document.getElementById('navUserName');
    const logoutBtn = document.getElementById('logoutBtn');

    // Account Info
    const accountName = document.getElementById('accountName');
    const accountEmail = document.getElementById('accountEmail');
    const accountCreated = document.getElementById('accountCreated');

    // Default City
    const defaultCityForm = document.getElementById('defaultCityForm');
    const defaultCityInput = document.getElementById('defaultCityInput');
    const defaultCityDropdown = document.getElementById('defaultCityDropdown');
    const currentDefault = document.getElementById('currentDefault');

    // Preferences
    const savePreferencesBtn = document.getElementById('savePreferencesBtn');
    const tempUnitRadios = document.getElementsByName('tempUnit');

    // Saved Cities
    const savedCitiesList = document.getElementById('savedCitiesList');

    // Change Password
    const changePasswordForm = document.getElementById('changePasswordForm');
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    // Danger Zone
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');

    // Messaging
    const settingsMessage = document.getElementById('settingsMessage');

    // --- Initialization ---
    checkAuth();

    async function checkAuth() {
        try {
            const response = await fetch(`${API_URL}/auth/me`);
            if (!response.ok) {
                // Not logged in, redirect to login
                window.location.href = 'login.html';
                return;
            }
            
            const data = await response.json();
            const user = data.user;
            
            // User is logged in, populate UI
            if (navUserName) {
                navUserName.textContent = user.name;
            }
            
            // Load all settings data
            loadAccountInfo(user);
            loadPreferences();
            loadSavedCities();
            
        } catch (error) {
            console.error('Auth check error:', error);
            window.location.href = 'login.html';
        }
    }

    // --- Data Loading Functions ---

    function loadAccountInfo(user) {
        if (accountName) accountName.textContent = user.name;
        if (accountEmail) accountEmail.textContent = user.email;
        if (accountCreated) accountCreated.textContent = formatDate(user.created_at);
    }

    async function loadPreferences() {
        try {
            const response = await fetch(`${API_URL}/preferences`);
            if (!response.ok) throw new Error('Failed to load preferences');
            
            const data = await response.json();
            const prefs = data.preferences || data;

            // Set default city
            if (prefs.default_city && prefs.default_state) {
                currentDefault.textContent = `${prefs.default_city}, ${prefs.default_state}`;
            } else {
                currentDefault.textContent = 'None set';
            }

            // Set temperature unit
            for (const radio of tempUnitRadios) {
                if (radio.value === prefs.temp_unit) {
                    radio.checked = true;
                    break;
                }
            }
        } catch (error) {
            console.error(error.message);
            showSettingsMessage(error.message, true);
        }
    }

    async function loadSavedCities() {
        try {
            const response = await fetch(`${API_URL}/saved-cities`);
            if (!response.ok) throw new Error('Failed to load saved cities');
            
            const data = await response.json();
            
            if (!data.cities || data.cities.length === 0) {
                savedCitiesList.innerHTML = '<p class="empty-state">No saved cities yet</p>';
                return;
            }

            savedCitiesList.innerHTML = data.cities.map(city => `
                <div class="saved-city-item">
                    <span>${city.city}, ${city.state_id}</span>
                    <button class="remove-city-btn" data-id="${city.id}" aria-label="Remove ${city.city}">&times;</button>
                </div>
            `).join('');
            
            // Add event listeners to new remove buttons
            savedCitiesList.querySelectorAll('.remove-city-btn').forEach(btn => {
                btn.addEventListener('click', handleRemoveCity);
            });

        } catch (error) {
            console.error(error.message);
            showSettingsMessage(error.message, true);
        }
    }

    // --- Event Handlers ---

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch(`${API_URL}/auth/logout`, { method: 'POST' });
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
    }

    // Update Default City
    if (defaultCityForm) {
        defaultCityForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!selectedCityData) {
                showSettingsMessage('Please select a valid city from the dropdown.', true);
                return;
            }

            try {
                const response = await fetch(`${API_URL}/preferences`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        default_city: selectedCityData.city,
                        default_state: selectedCityData.state
                    })
                });

                if (!response.ok) throw new Error(await response.json().error);

                showSettingsMessage('Default city updated successfully!');
                currentDefault.textContent = `${selectedCityData.city}, ${selectedCityData.state}`;
                defaultCityInput.value = '';
                selectedCityData = null;
            } catch (error) {
                showSettingsMessage(error.message, true);
            }
        });
    }

    // Save Preferences (Temp Unit)
    if (savePreferencesBtn) {
        savePreferencesBtn.addEventListener('click', async () => {
            const selectedUnit = document.querySelector('input[name="tempUnit"]:checked').value;
            
            try {
                const response = await fetch(`${API_URL}/preferences`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ temp_unit: selectedUnit })
                });

                if (!response.ok) throw new Error(await response.json().error);
                
                showSettingsMessage('Preferences saved successfully!');
            } catch (error) {
                showSettingsMessage(error.message, true);
            }
        });
    }

    // Remove Saved City
    async function handleRemoveCity(e) {
        const cityId = e.target.dataset.id;
        if (!cityId) return;
        
        try {
            const response = await fetch(`${API_URL}/saved-cities/${cityId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error(await response.json().error);
            
            showSettingsMessage('City removed successfully.');
            loadSavedCities(); // Reload the list
        } catch (error) {
            showSettingsMessage(error.message, true);
        }
    }

    // Change Password
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = currentPasswordInput.value;
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            if (newPassword !== confirmPassword) {
                showSettingsMessage('New passwords do not match.', true);
                return;
            }
            
            if (newPassword.length < 6) {
                showSettingsMessage('New password must be at least 6 characters.', true);
                return;
            }

            try {
                const response = await fetch(`${API_URL}/auth/change-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ currentPassword, newPassword })
                });
                
                const data = await response.json();

                if (!response.ok) throw new Error(data.error);
                
                showSettingsMessage('Password changed successfully!');
                changePasswordForm.reset();
            } catch (error) {
                showSettingsMessage(error.message, true);
            }
        });
    }
    
    // Delete Account
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', async () => {
            if (!confirm('Are you absolutely sure? This action cannot be undone.')) {
                return;
            }
            
            const password = prompt('Please enter your password to confirm account deletion:');
            if (!password) {
                showSettingsMessage('Password is required to delete account.', true);
                return;
            }

            try {
                const response = await fetch(`${API_URL}/auth/account`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });
                
                const data = await response.json();
                
                if (!response.ok) throw new Error(data.error);

                alert('Account deleted successfully.');
                window.location.href = 'index.html';

            } catch (error) {
                showSettingsMessage(error.message, true);
            }
        });
    }

    // --- Autocomplete Logic ---
    if (defaultCityInput) {
        defaultCityInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            clearTimeout(debounceTimer);
            selectedCityData = null; // Clear selection on new input

            if (query.length < 2) {
                hideAutocomplete();
                return;
            }

            debounceTimer = setTimeout(() => {
                searchCities(query);
            }, 300);
        });
    }

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

    function displayAutocomplete(cities) {
        defaultCityDropdown.innerHTML = cities.map(city => `
            <div class="autocomplete-item" data-city="${city.city}" data-state="${city.state}">
                <span class="city-name">${city.city}</span>
                <span class="state-name">${city.state}</span>
            </div>
        `).join('');
        
        defaultCityDropdown.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                selectCity(item);
            });
        });
        
        defaultCityDropdown.classList.remove('hidden');
    }

    function selectCity(item) {
        const city = item.dataset.city;
        const state = item.dataset.state;
        
        selectedCityData = { city, state };
        defaultCityInput.value = `${city}, ${state}`;
        hideAutocomplete();
    }

    function hideAutocomplete() {
        defaultCityDropdown.classList.add('hidden');
        defaultCityDropdown.innerHTML = '';
    }

    // Click outside to close dropdown
    document.addEventListener('click', (e) => {
        if (!defaultCityInput.contains(e.target) && !defaultCityDropdown.contains(e.target)) {
            hideAutocomplete();
        }
    });

    // --- Helper Functions ---

    function formatDate(isoString) {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function showSettingsMessage(message, isError = false) {
        settingsMessage.textContent = message;
        settingsMessage.classList.remove('hidden');
        
        if (isError) {
            settingsMessage.classList.add('error');
            settingsMessage.classList.remove('success');
        } else {
            settingsMessage.classList.remove('error');
            settingsMessage.classList.add('success');
        }

        // Hide message after 5 seconds
        setTimeout(() => {
            settingsMessage.classList.add('hidden');
        }, 5000);
    }
});