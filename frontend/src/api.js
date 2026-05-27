import axios from 'axios';
import {
  clearAuthStorage,
  getAccessToken,
  getRefreshToken,
  setAuthStorage,
} from './authStorage';

const rawApiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const normalizedApiBaseUrl = rawApiBaseUrl.replace(/\/+$/, '');
const API_BASE_URL = normalizedApiBaseUrl.endsWith('/api')
  ? normalizedApiBaseUrl
  : `${normalizedApiBaseUrl}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
});

const authApi = axios.create({
  baseURL: API_BASE_URL,
});

let refreshPromise = null;

async function refreshAccessToken() {
  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await authApi.post('/auth/refresh', {
    refreshToken: currentRefreshToken,
  });

  const { token, refreshToken, user } = response.data;

  setAuthStorage({
    user,
    token,
    refreshToken,
  });

  return token;
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const statusCode = error.response?.status;
    const shouldAttemptRefresh =
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/refresh') &&
      (statusCode === 401 || statusCode === 403) &&
      !!getRefreshToken();

    if (!shouldAttemptRefresh) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      clearAuthStorage();
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
      return Promise.reject(refreshError);
    }
  }
);

export default api;
