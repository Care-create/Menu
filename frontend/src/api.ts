import axios from 'axios';

const api = axios.create({
  baseURL: 'http://167.233.111.32:3001/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
