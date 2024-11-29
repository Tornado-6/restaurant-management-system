import axios from 'axios';
import store from '../store';
import { refreshToken, logout } from '../store/slices/authSlice';

const API_BASE_URL = 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling token refresh and errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token has expired and we haven't tried to refresh yet
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      localStorage.getItem('refreshToken')
    ) {
      originalRequest._retry = true;

      try {
        // Dispatch refresh token action
        const newToken = await store.dispatch(refreshToken()).unwrap();
        
        // Update authorization header
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, log out the user
        store.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.status === 403) {
      // Unauthorized access
      store.dispatch(logout());
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
