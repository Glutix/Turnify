import axios from "axios";
import { useAuthStore } from "../stores/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Interceptor de request: agrega el token JWT automáticamente a cada solicitud
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de response: maneja errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido — limpia la sesión
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export default api;
