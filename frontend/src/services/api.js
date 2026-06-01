import axios from 'axios';

const apiBaseUrl = process.env.REACT_APP_URL_LOCAL;
const SHIELD_ENABLED_KEY = 'vehicleShieldModeEnabled';
const SHIELD_LEVEL_KEY = 'vehicleShieldModeLevel';

export const getShieldModeLevel = () => {
  const storedLevel = Number(localStorage.getItem(SHIELD_LEVEL_KEY));
  if (storedLevel === 1 || storedLevel === 2) return storedLevel;
  return localStorage.getItem(SHIELD_ENABLED_KEY) === 'true' ? 1 : 0;
};

export const withShieldHeaders = (headers = {}) => ({
  ...headers,
  'X-Shield-Mode-Level': String(getShieldModeLevel()),
});

export const shieldFetch = (url, options = {}) => (
  fetch(url, {
    ...options,
    headers: withShieldHeaders(options.headers || {}),
  })
);

const api = axios.create({
  baseURL: `${apiBaseUrl}/api`, // URL de base pour les appels API
});

// Ajouter un interceptor pour inclure le token JWT dans chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-Shield-Mode-Level'] = String(getShieldModeLevel());
  return config;
});

export default api;
