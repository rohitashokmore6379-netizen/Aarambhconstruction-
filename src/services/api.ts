import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('arambh_auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle global responses & errors
api.interceptors.response.use(
  (response) => {
    if (typeof window !== 'undefined' && !response.config.url?.includes('/sync/status')) {
      window.dispatchEvent(new CustomEvent('arambh-sync-success'));
    }
    return response;
  },
  (error) => {
    if (typeof window !== 'undefined' && (!error.response || error.code === 'ERR_NETWORK')) {
      window.dispatchEvent(new CustomEvent('arambh-sync-network-error'));
    }

    if (error.response?.status === 401 && !window.location.pathname.includes('/admin/login')) {
      localStorage.removeItem('arambh_auth_token');
      localStorage.removeItem('arambh_user');
      // only redirect if in admin area
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
