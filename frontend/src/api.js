import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://lms-english-one.vercel.app/api/v1';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle Session Expiration
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            const msg = error.response.data?.error || "";
            // If explicit session expired or specific 401/403
            if (msg.includes("Session expired") || error.response.status === 403) {
                localStorage.removeItem('token');
                // Only redirect if we are not already on login (optional check)
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
