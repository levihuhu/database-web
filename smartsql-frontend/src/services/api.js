import axios from 'axios';

// 设置 API 基础 URL，根据你的 Django 后端地址调整
const API_URL = 'http://localhost:8000/api/';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;