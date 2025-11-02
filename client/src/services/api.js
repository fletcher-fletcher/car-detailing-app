// client/src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
console.log('🔗 API URL:', API_URL);
console.log('🔗 All env vars:', import.meta.env);

export const authAPI = {
  // Регистрация
  register: async (userData) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  // Логин
  login: async (credentials) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    return response.json();
  },
};
