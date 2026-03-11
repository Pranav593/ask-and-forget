import axios from 'axios';

const API_BASE = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('idToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  signup: (email, password) => api.post('/auth/signup', { email, password }),
  login: (email, password) => api.post('/auth/login', { email, password }),
};

export const reminderAPI = {
  getReminders: () => api.get('/reminders'),
  getReminder: (id) => api.get(`/reminders/${id}`),
  createReminder: (data) => api.post('/reminders', data),
  updateReminder: (id, data) => api.put(`/reminders/${id}`, data),
  deleteReminder: (id) => api.delete(`/reminders/${id}`),
};

export const parserAPI = {
  parse: (sentence) => api.post('/parse', { sentence }),
};

export default api;
