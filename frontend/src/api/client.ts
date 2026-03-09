import axios from 'axios';

// Create generic axios instance for API communication
export const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1',
    withCredentials: true, // Required for Django session cookies (CSRF & Session ID)
});

// Add a request interceptor to handle CSRF tokens dynamically if needed
api.interceptors.request.use(config => {
    // In a real Django setup, the csrf token is either set in the cookie by Django
    // and read here, or Django's Cors middleware with CSRF trusted origins is used.
    // For basic React + Django session auth, axios withCredentials automatically sends cookies.

    // Optional: Read csrftoken from cookies and set header if Django CSRF is strictly enabled
    const match = document.cookie.match(new RegExp('(^| )csrftoken=([^;]+)'));
    if (match && match[2]) {
        config.headers['X-CSRFToken'] = match[2];
    }

    return config;
});
