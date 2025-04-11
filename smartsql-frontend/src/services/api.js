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

// 提交练习
export const submitExercise = async (courseId, moduleId, exerciseId, answer) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/student/courses/${courseId}/modules/${moduleId}/exercises/${exerciseId}/submit/`,
      { answer },
      { headers: { Authorization: `Bearer ${localStorage.getItem('access')}` } }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: '提交练习失败' };
  }
};

export default apiClient;