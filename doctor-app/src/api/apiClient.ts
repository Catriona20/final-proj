import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:5000';
export const DOCTOR_AUTH_STORAGE_KEY = '@medlink_doctor_session_v3';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach Doctor JWT Bearer Token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const sessionData = await AsyncStorage.getItem(DOCTOR_AUTH_STORAGE_KEY);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        if (parsed.token) {
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      }
    } catch (e) {
      // Storage read error ignored
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Friendly error message formatting
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Network request failed. Please check server connectivity.';
    return Promise.reject(new Error(message));
  }
);
