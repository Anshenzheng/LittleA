import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const chatAPI = {
  sendMessage: async (messages) => {
    const response = await api.post('/chat/send', { messages });
    return response.data;
  },

  searchAndSummarize: async (query) => {
    const response = await api.post('/chat/search', { query });
    return response.data;
  },

  health: async () => {
    const response = await api.get('/chat/health');
    return response.data;
  },
};

export const taskAPI = {
  getAll: async () => {
    const response = await api.get('/tasks/');
    return response.data;
  },

  getById: async (taskId) => {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  },

  create: async (taskData) => {
    const response = await api.post('/tasks/', taskData);
    return response.data;
  },

  update: async (taskId, taskData) => {
    const response = await api.put(`/tasks/${taskId}`, taskData);
    return response.data;
  },

  delete: async (taskId) => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },

  pause: async (taskId) => {
    const response = await api.post(`/tasks/${taskId}/pause`);
    return response.data;
  },

  resume: async (taskId) => {
    const response = await api.post(`/tasks/${taskId}/resume`);
    return response.data;
  },

  execute: async (taskId) => {
    const response = await api.post(`/tasks/${taskId}/execute`);
    return response.data;
  },

  getResult: async (taskId) => {
    const response = await api.get(`/tasks/${taskId}/result`);
    return response.data;
  },
};

export const configAPI = {
  getModelConfig: async () => {
    const response = await api.get('/config/model');
    return response.data;
  },

  updateModelConfig: async (config) => {
    const response = await api.put('/config/model', config);
    return response.data;
  },

  getSearchConfig: async () => {
    const response = await api.get('/config/search');
    return response.data;
  },

  updateSearchConfig: async (config) => {
    const response = await api.put('/config/search', config);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/config/all');
    return response.data;
  },
};

export default api;
