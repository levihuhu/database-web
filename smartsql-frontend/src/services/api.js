import axios from 'axios';

// Set up the base URL for the API, adjust according to your Django backend address
// const API_BASE_URL = 'http://127.0.0.1:8000'; // 示例：本地开发环境
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'; // Use environment variable

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 💡 Add interceptor here ➜ automatically inject token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access'); // Get token from local storage
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Submit exercise
export const submitExercise = async (courseId, moduleId, exerciseId, answer) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/student/courses/${courseId}/modules/${moduleId}/exercises/${exerciseId}/submit/`,
      { answer },
      { headers: { Authorization: `Bearer ${localStorage.getItem('access')}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error submitting exercise:', error);
    // Rethrow a standardized error object or message
    throw error.response?.data || { message: 'Failed to submit exercise' };
  }
};

export default apiClient;