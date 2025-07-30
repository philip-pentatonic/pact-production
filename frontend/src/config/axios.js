import axios from 'axios';

// Set base URL from environment variable
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

// Add request interceptor to log requests in development
if (import.meta.env.DEV) {
  axios.interceptors.request.use(
    (config) => {
      console.log('API Request:', config.method?.toUpperCase(), config.url);
      return config;
    },
    (error) => {
      console.error('API Request Error:', error);
      return Promise.reject(error);
    }
  );
}

export default axios;