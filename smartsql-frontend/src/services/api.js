import axios from 'axios';

// 设置 API 基础 URL，根据你的 Django 后端地址调整
const API_URL = import.meta.env.VITE_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 💡 在这里添加拦截器 ➜ 自动注入 token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access'); // 从本地拿 token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;