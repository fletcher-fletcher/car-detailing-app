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

  // Пополнить склад материала
  restockMaterial: async (materialId, restockData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/admin/materials/${materialId}/restock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(restockData)
    });
    if (!response.ok) throw new Error('Failed to restock material');
    return response.json();
  },

  // Получить отчеты по материалам
  getMaterialsReport: async (filters = {}) => {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_URL}/api/admin/reports/materials?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // ==================== API ФУНКЦИИ ДЛЯ АДМИНА ====================

export const adminAPI = {
  // ==================== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ====================
  
  // Получить всех пользователей с фильтрацией
  getUsers: async (filters = {}) => {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_URL}/api/admin/users?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  // Редактировать пользователя
  updateUser: async (userId, updateData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  },

  // Удалить пользователя
  deleteUser: async (userId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to delete user');
    return response.json();
  },

  // ==================== УПРАВЛЕНИЕ ЗАКАЗАМИ ====================
  
  // Получить все заказы с фильтрацией
  getAppointments: async (filters = {}) => {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_URL}/api/admin/appointments?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch appointments');
    return response.json();
  },

  // Редактировать заказ
  updateAppointment: async (appointmentId, updateData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/admin/appointments/${appointmentId}`, {
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
    const response = await fetch(`${API_URL}/api/admin/appointments/${appointmentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to delete appointment');
    return response.json();
  },

  // ==================== УПРАВЛЕНИЕ МАТЕРИАЛАМИ ====================
  
  // Получить все материалы
  getMaterials: async (filters = {}) => {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_URL}/api/admin/materials?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch materials');
    return response.json();
  },

  // Создать материал
  createMaterial: async (materialData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/admin/materials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(materialData)
    });
    if (!response.ok) throw new Error('Failed to create material');
    return response.json();
  },

  // Редактировать материал
  updateMaterial: async (materialId, updateData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/admin/materials/${materialId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
    if (!response.ok) throw new Error('Failed to update material');
    return response.json();
  },

  // Удалить материал
  deleteMaterial: async (materialId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/admin/materials/${materialId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to delete material');
    return response.json();
  },

  // Пополнить склад материала
  restockMaterial: async (materialId, restockData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/admin/materials/${materialId}/restock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(restockData)
    });
    if (!response.ok) throw new Error('Failed to restock material');
    return response.json();
  },

  // Получить отчеты по материалам
  getMaterialsReport: async (filters = {}) => {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_URL}/api/admin/reports/materials?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch materials report');
    return response.json();
  }
};
    if (!response.ok) throw new Error('Failed to fetch materials report');
    return response.json();
  }
};
