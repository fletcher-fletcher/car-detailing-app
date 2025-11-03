import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';

const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);

  // Данные
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [materials, setMaterials] = useState([]);

  // Модальные окна
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);

  // Выбранные элементы для редактирования
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  // Формы
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'client'
  });

  const [appointmentForm, setAppointmentForm] = useState({
    executor_id: '',
    appointment_date: '',
    appointment_time: '',
    status: '',
    notes: ''
  });

  const [materialForm, setMaterialForm] = useState({
    name: '',
    description: '',
    unit: '',
    quantity_in_stock: 0,
    min_stock_level: 0,
    price_per_unit: 0,
    supplier: '',
    is_active: true
  });

  const [restockForm, setRestockForm] = useState({
    quantity: 0,
    cost_per_unit: 0,
    supplier_info: ''
  });

  // Фильтры
  const [userFilters, setUserFilters] = useState({ role: '', search: '' });
  const [appointmentFilters, setAppointmentFilters] = useState({ status: '', date_from: '', date_to: '' });
  const [materialFilters, setMaterialFilters] = useState({ search: '', low_stock_only: false });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (!loading) {
      switch (activeTab) {
        case 'users':
          fetchUsers();
          break;
        case 'appointments':
          fetchAppointments();
          break;
        case 'materials':
          fetchMaterials();
          break;
      }
    }
  }, [activeTab, loading]);

  const checkAdminAccess = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    if (!user || user.role !== 'admin' || !token) {
      alert('Доступ запрещен. Требуются права администратора.');
      navigate('/');
      return;
    }
    setLoading(false);
  };

  // ==================== ПОЛЬЗОВАТЕЛИ ====================

  const fetchUsers = async () => {
    try {
      const data = await adminAPI.getUsers(userFilters);
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Ошибка загрузки пользователей');
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      role: user.role || 'client'
    });
    setShowUserModal(true);
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setUserForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'client'
    });
    setShowUserModal(true);
  };

  const submitUserForm = async () => {
    try {
      if (selectedUser) {
        // Редактирование
        await adminAPI.updateUser(selectedUser.id, userForm);
        alert('Пользователь обновлен');
      } else {
        // Создание (через регистрацию)
        const { authAPI } = await import('../services/api');
        await authAPI.register(userForm);
        alert('Пользователь создан');
      }
      setShowUserModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Ошибка сохранения пользователя: ' + error.message);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?')) return;

        try {
      await adminAPI.deleteUser(userId);
      alert('Пользователь удален');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Ошибка удаления пользователя: ' + error.message);
    }
  };

  // ==================== ЗАКАЗЫ ====================

  const fetchAppointments = async () => {
    try {
      const data = await adminAPI.getAppointments(appointmentFilters);
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      alert('Ошибка загрузки заказов');
    }
  };

  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setAppointmentForm({
      executor_id: appointment.executor_id || '',
      appointment_date: appointment.appointment_date || '',
      appointment_time: appointment.appointment_time || '',
      status: appointment.status || '',
      notes: appointment.notes || ''
    });
    setShowAppointmentModal(true);
  };

  const submitAppointmentForm = async () => {
    try {
      await adminAPI.updateAppointment(selectedAppointment.id, appointmentForm);
      alert('Заказ обновлен');
      setShowAppointmentModal(false);
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Ошибка обновления заказа: ' + error.message);
    }
  };

  const deleteAppointment = async (appointmentId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот заказ?')) return;

    try {
      await adminAPI.deleteAppointment(appointmentId);
      alert('Заказ удален');
      fetchAppointments();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Ошибка удаления заказа: ' + error.message);
    }
  };

  // ==================== МАТЕРИАЛЫ ====================

  const fetchMaterials = async () => {
    try {
      const data = await adminAPI.getMaterials(materialFilters);
      setMaterials(data.materials || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      alert('Ошибка загрузки материалов');
    }
  };

  const handleEditMaterial = (material) => {
    setSelectedMaterial(material);
    setMaterialForm({
      name: material.name || '',
      description: material.description || '',
      unit: material.unit || '',
      quantity_in_stock: material.quantity_in_stock || 0,
      min_stock_level: material.min_stock_level || 0,
      price_per_unit: material.price_per_unit || 0,
      supplier: material.supplier || '',
      is_active: material.is_active !== undefined ? material.is_active : true
    });
    setShowMaterialModal(true);
  };

  const handleCreateMaterial = () => {
    setSelectedMaterial(null);
    setMaterialForm({
      name: '',
      description: '',
      unit: '',
      quantity_in_stock: 0,
      min_stock_level: 0,
      price_per_unit: 0,
      supplier: '',
      is_active: true
    });
    setShowMaterialModal(true);
  };

  const submitMaterialForm = async () => {
    try {
      if (selectedMaterial) {
        await adminAPI.updateMaterial(selectedMaterial.id, materialForm);
        alert('Материал обновлен');
      } else {
        await adminAPI.createMaterial(materialForm);
        alert('Материал создан');
      }
      setShowMaterialModal(false);
      fetchMaterials();
    } catch (error) {
      console.error('Error saving material:', error);
      alert('Ошибка сохранения материала: ' + error.message);
    }
  };

  const deleteMaterial = async (materialId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот материал?')) return;

    try {
      await adminAPI.deleteMaterial(materialId);
      alert('Материал удален');
      fetchMaterials();
    } catch (error) {
      console.error('Error deleting material:', error);
      alert('Ошибка удаления материала: ' + error.message);
    }
  };

  const handleRestockMaterial = (material) => {
    setSelectedMaterial(material);
    setRestockForm({
      quantity: 0,
      cost_per_unit: material.price_per_unit || 0,
      supplier_info: material.supplier || ''
    });
    setShowRestockModal(true);
  };

  const submitRestockForm = async () => {
    try {
      await adminAPI.restockMaterial(selectedMaterial.id, restockForm);
      alert('Склад пополнен');
      setShowRestockModal(false);
      fetchMaterials();
    } catch (error) {
      console.error('Error restocking material:', error);
      alert('Ошибка пополнения склада: ' + error.message);
    }
  };

  // ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

  const getStatusColor = (status) => {
    switch (status) {
      case 'booked': return '#3B82F6';
      case 'in_progress': return '#F59E0B';
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'booked': return 'Забронировано';
      case 'in_progress': return 'В работе';
      case 'completed': return 'Выполнено';
      case 'cancelled': return 'Отменено';
      default: return status;
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'executor': return 'Исполнитель';
      case 'client': return 'Клиент';
      default: return role;
    }
  };

  const getStockStatusColor = (material) => {
    if (material.quantity_in_stock <= material.min_stock_level) return '#EF4444';
    if (material.quantity_in_stock <= material.min_stock_level * 1.5) return '#F59E0B';
    return '#10B981';
  };

  if (loading) {
    return (
      <div className="container py-8 text-center">
        <div style={{fontSize: '18px', color: '#666'}}>Проверка доступа...</div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 style={{fontSize: '28px', fontWeight: 'bold', marginBottom: '30px'}}>
        Панель администратора
      </h1>

      {/* Навигация по вкладкам */}
      <div style={{display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid #E5E7EB'}}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'users' ? '#2563eb' : 'transparent',
            color: activeTab === 'users' ? 'white' : '#6B7280',
            cursor: 'pointer',
            borderBottom: activeTab === 'users' ? '2px solid #2563eb' : '2px solid transparent'
          }}
        >
          Пользователи ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'appointments' ? '#2563eb' : 'transparent',
            color: activeTab === 'appointments' ? 'white' : '#6B7280',
            cursor: 'pointer',
            borderBottom: activeTab === 'appointments' ? '2px solid #2563eb' : '2px solid transparent'
          }}
        >
          Заказы ({appointments.length})
        </button>
               <button
          onClick={() => setActiveTab('materials')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'materials' ? '#2563eb' : 'transparent',
            color: activeTab === 'materials' ? 'white' : '#6B7280',
            cursor: 'pointer',
            borderBottom: activeTab === 'materials' ? '2px solid #2563eb' : '2px solid transparent'
          }}
        >
          Расходные материалы ({materials.length})
        </button>
      </div>

      {/* ==================== ВКЛАДКА ПОЛЬЗОВАТЕЛИ ==================== */}
      {activeTab === 'users' && (
        <div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h2 style={{fontSize: '22px', fontWeight: '600'}}>
              Управление пользователями
            </h2>
            <button
              onClick={handleCreateUser}
              style={{
                background: '#10B981',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              + Добавить пользователя
            </button>
          </div>

          {/* Фильтры для пользователей */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginBottom: '20px',
            padding: '15px',
            background: '#F9FAFB',
            borderRadius: '8px',
            border: '1px solid #E5E7EB'
          }}>
            <div>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                Роль:
              </label>
              <select
                value={userFilters.role}
                onChange={(e) => {
                  setUserFilters({...userFilters, role: e.target.value});
                  setTimeout(fetchUsers, 300);
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px'
                }}
              >
                <option value="">Все роли</option>
                <option value="client">Клиенты</option>
                <option value="executor">Исполнители</option>
                <option value="admin">Администраторы</option>
              </select>
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                Поиск:
              </label>
              <input
                type="text"
                value={userFilters.search}
                onChange={(e) => {
                  setUserFilters({...userFilters, search: e.target.value});
                  setTimeout(fetchUsers, 500);
                }}
                placeholder="Имя, email или телефон..."
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>

          {/* Список пользователей */}
          {users.length === 0 ? (
            <div style={{textAlign: 'center', color: '#666', padding: '40px'}}>
              Пользователи не найдены
            </div>
          ) : (
            <div style={{display: 'grid', gap: '15px'}}>
              {users.map((user) => (
                <div key={user.id} style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '20px',
                  background: 'white'
                }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                    <div style={{flex: 1}}>
                      <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '5px'}}>
                        {user.name}
                      </h3>
                      <div style={{display: 'grid', gap: '5px', marginBottom: '10px'}}>
                        <p style={{color: '#666'}}>
                          <strong>Email:</strong> {user.email}
                        </p>
                        <p style={{color: '#666'}}>
                          <strong>Телефон:</strong> {user.phone || 'Не указан'}
                        </p>
                        <p style={{color: '#666'}}>
                          <strong>Зарегистрирован:</strong> {new Date(user.created_at).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px'}}>
                      <div style={{
                        background: user.role === 'admin' ? '#7C3AED' : user.role === 'executor' ? '#F59E0B' : '#3B82F6',
                        color: 'white',
                        padding: '5px 12px',
                        borderRadius: '15px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        {getRoleText(user.role)}
                      </div>
                      <div style={{display: 'flex', gap: '8px'}}>
                        <button
                          onClick={() => handleEditUser(user)}
                          style={{
                            background: '#3B82F6',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          Редактировать
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          style={{
                            background: '#EF4444',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== ВКЛАДКА ЗАКАЗЫ ==================== */}
      {activeTab === 'appointments' && (
        <div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h2 style={{fontSize: '22px', fontWeight: '600'}}>
              Управление заказами
            </h2>
          </div>

          {/* Фильтры для заказов */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginBottom: '20px',
            padding: '15px',
            background: '#F9FAFB',
            borderRadius: '8px',
            border: '1px solid #E5E7EB'
          }}>
            <div>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                Статус:
              </label>
              <select
                value={appointmentFilters.status}
                onChange={(e) => {
                  setAppointmentFilters({...appointmentFilters, status: e.target.value});
                  setTimeout(fetchAppointments, 300);
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px'
                }}
              >
                <option value="">Все статусы</option>
                <option value="booked">Забронировано</option>
                <option value="in_progress">В работе</option>
                <option value="completed">Выполнено</option>
                <option value="cancelled">Отменено</option>
              </select>
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                Дата от:
              </label>
              <input
                type="date"
                value={appointmentFilters.date_from}
                onChange={(e) => {
                  setAppointmentFilters({...appointmentFilters, date_from: e.target.value});
                  setTimeout(fetchAppointments, 300);
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                Дата до:
              </label>
              <input
                type="date"
                value={appointmentFilters.date_to}
                onChange={(e) => {
                  setAppointmentFilters({...appointmentFilters, date_to: e.target.value});
                  setTimeout(fetchAppointments, 300);
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>

          {/* Список заказов */}
          {appointments.length === 0 ? (
            <div style={{textAlign: 'center', color: '#666', padding: '40px'}}>
              Заказы не найдены
            </div>
          ) : (
            <div style={{display: 'grid', gap: '15px'}}>
              {appointments.map((appointment) => (
                <div key={appointment.id} style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '20px',
                  background: 'white'
                }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px'}}>
                    <div style={{flex: 1}}>
                      <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '5px'}}>
                        {appointment.service_name}
                      </h3>
                      <div style={{display: 'grid', gap: '5px', marginBottom: '10px'}}>
                        <p style={{color: '#666'}}>
                          <strong>Клиент:</strong> {appointment.user_name} ({appointment.user_email})
                        </p>
                        <p style={{color: '#666'}}>
                          <strong>Телефон:</strong> {appointment.user_phone || 'Не указан'}
                        </p>
                        <p style={{color: '#666'}}>
                          <strong>Исполнитель:</strong> {appointment.executor_name || 'Не назначен'}
                        </p>
                        <p style={{color: '#666'}}>
                          <strong>Дата:</strong> {new Date(appointment.appointment_date).toLocaleDateString('ru-RU')} в {appointment.appointment_time}
                        </p>
                        <p style={{color: '#666'}}>
                          <strong>Цена:</strong> {appointment.price}₽ | <strong>Длительность:</strong> {appointment.duration} мин
                        </p>
                      </div>
                      {appointment.notes && (
                        <div style={{
                          background: '#F3F4F6',
                          padding: '8px',
                          borderRadius: '4px',
                          fontSize: '14px',
                          color: '#666'
                        }}>
                          <strong>Заметки:</strong> {appointment.notes}
                        </div>
                      )}
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px'}}>
                      <div style={{
                        background: getStatusColor(appointment.status),
                        color: 'white',
                        padding: '5px 12px',
                        borderRadius: '15px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        {getStatusText(appointment.status)}
                      </div>
                      <div style={{display: 'flex', gap: '8px'}}>
                        <button
                          onClick={() => handleEditAppointment(appointment)}
                          style={{
                            background: '#3B82F6',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          Редактировать
                        </button>
                        <button
                          onClick={() => deleteAppointment(appointment.id)}
                          style={{
                            background: '#EF4444',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== ВКЛАДКА МАТЕРИАЛЫ ==================== */}
      {activeTab === 'materials' && (
        <div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h2 style={{fontSize: '22px', fontWeight: '600'}}>
              Управление материалами
            </h2>
            <button
              onClick={handleCreateMaterial}
              style={{
                background: '#10B981',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              + Добавить материал
            </button>
          </div>

          {/* Фильтры для материалов */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginBottom: '20px',
            padding: '15px',
            background: '#F9FAFB',
            borderRadius: '8px',
            border: '1px solid #E5E7EB'
          }}>
            <div>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                Поиск:
              </label>
              <input
                type="text"
                value={materialFilters.search}
                onChange={(e) => {
                  setMaterialFilters({...materialFilters, search: e.target.value});
                  setTimeout(fetchMaterials, 500);
                }}
                placeholder="Название или описание материала..."
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div>
              <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
                <input
                  type="checkbox"
                  checked={materialFilters.low_stock_only}
                  onChange={(e) => {
                    setMaterialFilters({...materialFilters, low_stock_only: e.target.checked});
                    setTimeout(fetchMaterials, 300);
                  }}
                />
                Показать только материалы с низким запасом
              </label>
            </div>
          </div>

          {/* Список материалов */}
          {materials.length === 0 ? (
            <div style={{textAlign: 'center', color: '#666', padding: '40px'}}>
              Материалы не найдены
            </div>
          ) : (
            <div style={{display: 'grid', gap: '15px'}}>
              {materials.map((material) => (
                <div key={material.id} style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '20px',
                  background: 'white'
                }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px'}}>
                    <div style={{flex: 1}}>
                      <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '5px'}}>
                        {material.name}
                      </h3>
                      {material.description && (
                        <p style={{color: '#666', marginBottom: '10px'}}>
                          {material.description}
                        </p>
                      )}
                      <div style={{display: 'grid', gap: '5px', marginBottom: '10px'}}>
                        <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
                          <span style={{fontSize: '16px', fontWeight: '500'}}>
                            На складе: <strong style={{color: getStockStatusColor(material)}}>
                              {material.quantity_in_stock} {material.unit}
                            </strong>
                          </span>
                          <span style={{fontSize: '14px', color: '#666'}}>
                            Мин. уровень: {material.min_stock_level} {material.unit}
                          </span>
                        </div>
                        <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
                          {material.price_per_unit > 0 && (
                            <span style={{fontSize: '14px', color: '#666'}}>
                              Цена: {material.price_per_unit}₽/{material.unit}
                            </span>
                          )}
                          {material.supplier && (
                            <span style={{fontSize: '14px', color: '#666'}}>
                              Поставщик: {material.supplier}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px'}}>
                      <div style={{
                        background: material.quantity_in_stock <= material.min_stock_level ? '#EF4444' : 
                                   material.quantity_in_stock <= material.min_stock_level * 1.5 ? '#F59E0B' : '#10B981',
                        color: 'white',
                        padding: '5px 12px',
                        borderRadius: '15px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        {material.quantity_in_stock <= material.min_stock_level ? 'Критично' :
                         material.quantity_in_stock <= material.min_stock_level * 1.5 ? 'Внимание' : 'Норма'}
                      </div>
                      <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                        <button
                          onClick={() => handleRestockMaterial(material)}
                          style={{
                            background: '#8B5CF6',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          Пополнить
                        </button>
                        <button
                          onClick={() => handleEditMaterial(material)}
                          style={{
                            background: '#3B82F6',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          Редактировать
                        </button>
                        <button
                          onClick={() => deleteMaterial(material.id)}
                          style={{
                            background: '#EF4444',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  </div>
                  {!material.is_active && (
                    <div style={{
                      background: '#FEE2E2',
                      border: '1px solid #FECACA',
                      borderRadius: '4px',
                      padding: '8px',
                      color: '#DC2626',
                      fontSize: '14px'
                    }}>
                      ⚠️ Материал неактивен
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== МОДАЛЬНЫЕ ОКНА ==================== */}

      {/* Модальное окно пользователя */}
      {showUserModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{fontSize: '20px', fontWeight: '600', marginBottom: '20px'}}>
              {selectedUser ? 'Редактировать пользователя' : 'Создать пользователя'}
            </h3>

            <div style={{display: 'grid', gap: '15px', marginBottom: '20px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                  Имя *
                </label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                  placeholder="Введите имя"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                  Email *
                </label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  placeholder="Введите email"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                  Телефон
                </label>
                <input
                  type="tel"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                  placeholder="Введите телефон"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                  Пароль {selectedUser ? '(оставьте пустым для сохранения текущего)' : '*'}
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                  placeholder={selectedUser ? 'Новый пароль (необязательно)' : 'Введите пароль'}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                  Роль *
                </label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px'
                  }}
                >
                  <option value="client">Клиент</option>
                  <option value="executor">Исполнитель</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
            </div>

            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
              <button
                onClick={() => setShowUserModal(false)}
                style={{
                  background: '#6B7280',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Отменить
              </button>
              <button
                onClick={submitUserForm}
                disabled={!userForm.name || !userForm.email || (!selectedUser && !userForm.password)}
                style={{
                  background: (!userForm.name || !userForm.email || (!selectedUser && !userForm.password)) 
                    ? '#9CA3AF' : '#10B981',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: (!userForm.name || !userForm.email || (!selectedUser && !userForm.password)) 
                    ? 'not-allowed' : 'pointer'
                }}
              >
                {selectedUser ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования заказа */}
      {showAppointmentModal && selectedAppointment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{fontSize: '20px', fontWeight: '600', marginBottom: '20px'}}>
              Редактировать заказ
            </h3>

            <div style={{marginBottom: '20px', padding: '15px', background: '#F3F4F6', borderRadius: '6px'}}>
              <h4 style={{fontWeight: '600', marginBottom: '5px'}}>Заказ:</h4>
              <p>{selectedAppointment.service_name} - {selectedAppointment.user_name}</p>
              <p>Текущий статус: {getStatusText(selectedAppointment.status)}</p>
            </div>

            <div style={{display: 'grid', gap: '15px', marginBottom: '20px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                  Исполнитель:
                </label>
                <select
                  value={appointmentForm.executor_id}
                  onChange={(e) => setAppointmentForm({...appointmentForm, executor_id: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px'
                  }}
                >
                  <option value="">Не назначен</option>
                  {users.filter(u => u.role === 'executor').map(executor => (
                    <option key={executor.id} value={executor.id}>
                      {executor.name} ({executor.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                    Дата:
                  </label>
                  <input
                    type="date"
                    value={appointmentForm.appointment_date}
                    onChange={(e) => setAppointmentForm({...appointmentForm, appointment_date: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                    Время:
                  </label>
                  <input
                    type="time"
                    value={appointmentForm.appointment_time}
                    onChange={(e) => setAppointmentForm({...appointmentForm, appointment_time: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                  Статус:
                </label>
                <select
                  value={appointmentForm.status}
                  onChange={(e) => setAppointmentForm({...appointmentForm, status: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px'
                  }}
                >
                  <option value="booked">Забронировано</option>
                  <option value="in_progress">В работе</option>
                  <option value="completed">Выполнено</option>
                  <option value="cancelled">Отменено</option>
                </select>
              </div>

              <div>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                  Заметки:
                </label>
                <textarea
                  value={appointmentForm.notes}
                  onChange={(e) => setAppointmentForm({...appointmentForm, notes: e.target.value})}
                  placeholder="Дополнительные заметки к заказу..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
              <button
                onClick={() => setShowAppointmentModal(false)}
                style={{
                  background: '#6B7280',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Отменить
              </button>
              <button
                onClick={submitAppointmentForm}
                style={{
                  background: '#10B981',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно материала */}
      {showMaterialModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{fontSize: '20px', fontWeight: '600', marginBottom: '20px'}}>
              {selectedMaterial ? 'Редактировать материал' : 'Создать материал'}
            </h3>

            <div style={{display: 'grid', gap: '15px', marginBottom: '20px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                  Название *
                </label>
                <input
                  type="text"
                  value={materialForm.name}
                  onChange={(e) => setMaterialForm({...materialForm, name: e.target.value})}
                  placeholder="Введите название материала"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                  Описание
                </label>
                <textarea
                  value={materialForm.description}
                  onChange={(e) => setMaterialForm({...materialForm, description: e.target.value})}
                  placeholder="Описание материала..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    minHeight: '60px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                    Единица измерения *
                  </label>
                  <input
                    type="text"
                    value={materialForm.unit}
                    onChange={(e) => setMaterialForm({...materialForm, unit: e.target.value})}
                    placeholder="шт, л, кг, м2..."
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                    Количество на складе
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={materialForm.quantity_in_stock}
                    onChange={(e) => setMaterialForm({...materialForm, quantity_in_stock: parseFloat(e.target.value) || 0})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                    Минимальный уровень
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={materialForm.min_stock_level}
                    onChange={(e) => setMaterialForm({...materialForm, min_stock_level: parseFloat(e.target.value) || 0})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '4px'
                    }}
                  />
                </div>

                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                    Цена за единицу (₽)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={materialForm.price_per_unit}
                    onChange={(e) => setMaterialForm({...materialForm, price_per_unit: parseFloat(e.target.value) || 0})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                  Поставщик
                </label>
                <input
                  type="text"
                  value={materialForm.supplier}
                  onChange={(e) => setMaterialForm({...materialForm, supplier: e.target.value})}
                  placeholder="Название поставщика..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
                  <input
                    type="checkbox"
                    checked={materialForm.is_active}
                    onChange={(e) => setMaterialForm({...materialForm, is_active: e.target.checked})}
                  />
                  Материал активен
                </label>
              </div>
            </div>

            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
              <button
                onClick={() => setShowMaterialModal(false)}
                style={{
                  background: '#6B7280',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Отменить
              </button>
              <button
                onClick={submitMaterialForm}
                disabled={!materialForm.name || !materialForm.unit}
                style={{
                  background: (!materialForm.name || !materialForm.unit) ? '#9CA3AF' : '#10B981',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: (!materialForm.name || !materialForm.unit) ? 'not-allowed' : 'pointer'
                }}
              >
                {selectedMaterial ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно пополнения склада */}
      {showRestockModal && selectedMaterial && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{fontSize: '20px', fontWeight: '600', marginBottom: '20px'}}>
              Пополнить склад
            </h3>

            <div style={{marginBottom: '20px', padding: '15px', background: '#F3F4F6', borderRadius: '6px'}}>
              <h4 style={{fontWeight: '600', marginBottom: '5px'}}>Материал:</h4>
              <p><strong>{selectedMaterial.name}</strong></p>
              <p>Текущий запас: <strong>{selectedMaterial.quantity_in_stock} {selectedMaterial.unit}</strong></p>
              <p>Минимальный уровень: {selectedMaterial.min_stock_level} {selectedMaterial.unit}</p>
            </div>

            <div style={{display: 'grid', gap: '15px', marginBottom: '20px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                  Количество для пополнения *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={restockForm.quantity}
                  onChange={(e) => setRestockForm({...restockForm, quantity: parseFloat(e.target.value) || 0})}
                  placeholder="Введите количество..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                  Стоимость за единицу (₽)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={restockForm.cost_per_unit}
                  onChange={(e) => setRestockForm({...restockForm, cost_per_unit: parseFloat(e.target.value) || 0})}
                  placeholder="Цена покупки за единицу..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                  Информация о поставщике
                </label>
                <input
                  type="text"
                  value={restockForm.supplier_info}
                  onChange={(e) => setRestockForm({...restockForm, supplier_info: e.target.value})}
                  placeholder="Название поставщика или заметки о закупке..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px'
                  }}
                />
              </div>

              {/* Предварительный расчет */}
              {restockForm.quantity > 0 && (
                <div style={{
                  background: '#F0F9FF',
                  border: '1px solid #BAE6FD',
                  borderRadius: '6px',
                  padding: '15px'
                }}>
                  <h4 style={{fontWeight: '600', marginBottom: '10px', color: '#0369A1'}}>
                    Итоги пополнения:
                  </h4>
                  <div style={{display: 'grid', gap: '5px', fontSize: '14px'}}>
                    <p>
                      <strong>Добавляется:</strong> {restockForm.quantity} {selectedMaterial.unit}
                    </p>
                    <p>
                      <strong>Станет на складе:</strong> {(selectedMaterial.quantity_in_stock + restockForm.quantity).toFixed(2)} {selectedMaterial.unit}
                    </p>
                    {restockForm.cost_per_unit > 0 && (
                      <p>
                        <strong>Общая стоимость:</strong> {(restockForm.quantity * restockForm.cost_per_unit).toFixed(2)}₽
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
              <button
                onClick={() => setShowRestockModal(false)}
                style={{
                  background: '#6B7280',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Отменить
              </button>
              <button
                onClick={submitRestockForm}
                disabled={restockForm.quantity <= 0}
                style={{
                  background: restockForm.quantity <= 0 ? '#9CA3AF' : '#10B981',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: restockForm.quantity <= 0 ? 'not-allowed' : 'pointer'
                }}
              >
                Пополнить склад
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
