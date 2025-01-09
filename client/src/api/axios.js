import axios from 'axios';

const instance = axios.create({
  //baseURL: '/api',
  baseURL: 'http://localhost:5000/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to add auth token to requests
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add interceptor to handle token expiration
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default instance;