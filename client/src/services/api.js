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

// ==================== НОВЫЕ API ФУНКЦИИ ====================

export const executorAPI = {
  // Получить все заказы исполнителя
  getAppointments: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/executor/appointments`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch appointments');
    return response.json();
  },

  // Получить детали заказа с материалами
  getAppointmentDetails: async (appointmentId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/executor/appointments/${appointmentId}/details`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch appointment details');
    return response.json();
  },

  // Редактировать заказ
  updateAppointment: async (appointmentId, updateData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/executor/appointments/${appointmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
    if (!response.ok) throw new Error('Failed to update appointment');
    return response.json();
  },

  // Удалить заказ
  deleteAppointment: async (appointmentId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/executor/appointments/${appointmentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to delete appointment');
    return response.json();
  },

  // Получить материалы с предупреждениями о запасах
  getMaterials: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/executor/materials`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch materials');
    return response.json();
  },

  // Получить уведомления о низких запасах
  getStockAlerts: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/executor/materials/stock-alerts`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch stock alerts');
    return response.json();
  },

  // Использовать материалы для заказа
  useMaterials: async (appointmentId, materials) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/executor/appointments/${appointmentId}/use-materials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ materials })
    });
    if (!response.ok) throw new Error('Failed to use materials');
    return response.json();
  },

  // Получить историю использования материалов
  getMaterialUsageHistory: async (filters = {}) => {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_URL}/api/executor/materials/usage-history?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch usage history');
    return response.json();
  }
};

// ==================== API ФУНКЦИИ ДЛЯ СЕРВИСОВ ====================

export const servicesAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/api/services`);
    if (!response.ok) throw new Error('Failed to fetch services');
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_URL}/api/services/${id}`);
    if (!response.ok) throw new Error('Failed to fetch service');
    return response.json();
  }
};

// ==================== API ФУНКЦИИ ДЛЯ ЗАПИСЕЙ ====================

export const appointmentsAPI = {
  create: async (appointmentData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(appointmentData)
    });
    if (!response.ok) throw new Error('Failed to create appointment');
    return response.json();
  },

  getUserAppointments: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/appointments/user`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch user appointments');
    return response.json();
  }
};
