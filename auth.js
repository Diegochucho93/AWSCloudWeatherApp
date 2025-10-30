// auth.js - Handles login and signup functionality

const API_URL = '/api';

// Check if already logged in (redirect to home)
async function checkIfLoggedIn() {
    try {
        const response = await fetch(`${API_URL}/auth/me`);
        if (response.ok) {
            // User is logged in, redirect to home
            window.location.href = 'index.html';
        }
    } catch (error) {
        // Not logged in, stay on auth page
    }
}

// Call on page load
checkIfLoggedIn();

// Handle signup form
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
        
        // Validate passwords match
        if (password !== passwordConfirm) {
            showError('Passwords do not match');
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
                // Success - redirect to home
                window.location.href = 'index.html';
            } else {
                showError(data.error || 'Signup failed');
            }
            
        } catch (error) {
            showError('Failed to connect to server');
            console.error('Signup error:', error);
        }
    });
}

// Handle login form
const loginForm = document.getElementById('loginForm');
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
                // Success - redirect to home
                window.location.href = 'index.html';
            } else {
                showError(data.error || 'Login failed');
            }
            
        } catch (error) {
            showError('Failed to connect to server');
            console.error('Login error:', error);
        }
    });
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('authError');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    
    // Hide after 5 seconds
    setTimeout(() => {
        errorDiv.classList.add('hidden');
    }, 5000);
}
