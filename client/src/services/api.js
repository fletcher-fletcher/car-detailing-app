// client/src/services/api.js
const API_URL = 'https://car-detailing-app-14qu.onrender.com';
console.log('🔗 API URL:', API_URL);
console.log('🔗 All env vars:', import.meta.env);

export const authAPI = {
  // Регистрация
  register: async (userData) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
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
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    return response.json();
  },
};
