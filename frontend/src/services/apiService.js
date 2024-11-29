import axios from 'axios';
import { store } from '../store';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

const getToken = () => {
    // First try to get token from Redux store
    const state = store.getState();
    const token = state.auth?.token;
    
    if (token) {
        return token;
    }
    
    // Fallback to localStorage
    return localStorage.getItem('token');
};

const normalizeResponse = (response) => {
    // If the response has a data property, return that
    if (response.data !== undefined) {
        return response.data;
    }
    
    // If response has results (for paginated responses), return that
    if (response.results !== undefined) {
        return response.results;
    }
    
    // Otherwise return the response itself
    return response;
};

const apiService = {
    async get(endpoint, params = {}) {
        try {
            const token = getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await axios.get(`${BASE_URL}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                params
            });
            
            return normalizeResponse(response);
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    },

    async post(endpoint, data = {}, config = {}) {
        try {
            const token = getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await axios.post(`${BASE_URL}${endpoint}`, data, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    ...config.headers
                },
                ...config
            });
            
            return normalizeResponse(response);
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    },

    async put(endpoint, data = {}, config = {}) {
        try {
            const token = getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await axios.put(`${BASE_URL}${endpoint}`, data, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    ...config.headers
                },
                ...config
            });
            
            return normalizeResponse(response);
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    },

    async delete(endpoint, config = {}) {
        try {
            const token = getToken();
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await axios.delete(`${BASE_URL}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    ...config.headers
                },
                ...config
            });
            
            return normalizeResponse(response);
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    },

    handleError(error) {
        // Log the full error for debugging
        console.group('API Error Details');
        console.error('Original Error:', error);
        console.error('Error Config:', error.config);
        console.error('Error Message:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
            console.error('Response Status:', error.response.status);
            console.error('Response Headers:', error.response.headers);
        }
        console.groupEnd();

        // Handle different types of errors
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                    break;
                
                case 403:
                case 404:
                case 422:
                case 500:
                    break;
                
                default:
                    console.error('Unexpected error status:', error.response.status);
            }
        }
    }
};

// Utility function to format currency
const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
};

export { apiService, formatCurrency };
