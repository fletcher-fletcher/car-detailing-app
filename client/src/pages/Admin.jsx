import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, authAPI } from '../services/api';

const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);

  // Данные
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [executors, setExecutors] = useState([]);

  // Модальные окна
  const [showUserModal, setShowUserModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  // Выбранные элементы для редактирования
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Формы
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'client'
  });

  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    price: 0,
    duration: 60,
    category: '',
    preparation_days: 0,
    is_active: true
  });

  const [appointmentForm, setAppointmentForm] = useState({
    executor_id: '',
    appointment_date: '',
    appointment_time: '',
    status: ''
  });

  // Фильтры
  const [userFilters, setUserFilters] = useState({ role: '', search: '' });
  const [serviceFilters, setServiceFilters] = useState({ search: '', active_only: false });
  const [appointmentFilters, setAppointmentFilters] = useState({ status: '', executor_id: '' });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (!loading) {
      switch (activeTab) {
        case 'users':
          fetchUsers();
          break;
        case 'services':
          fetchServices();
          break;
        case 'appointments':
          fetchAppointments();
          fetchExecutors();
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
      setUsers(data.users || data || []);
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
        const updateData = { ...userForm };
        if (!updateData.password) delete updateData.password; // Не обновляем пароль если он пустой
        await adminAPI.updateUser(selectedUser.id, updateData);
        alert('Пользователь обновлен');
      } else {
        // Создание
        if (!userForm.password) {
          alert('Пароль обязателен при создании пользователя');
          return;
        }
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

  // ==================== УСЛУГИ ====================

  const fetchServices = async () => {
    try {
      const data = await adminAPI.getServices();
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      alert('Ошибка загрузки услуг');
    }
  };

  const handleEditService = (service) => {
    setSelectedService(service);
    setServiceForm({
      name: service.name || '',
      description: service.description || '',
      price: service.price || 0,
      duration: service.duration || 60,
      category: service.category || '',
      preparation_days: service.preparation_days || 0,
      is_active: service.is_active !== undefined ? service.is_active : true
    });
    setShowServiceModal(true);
  };

  const handleCreateService = () => {
    setSelectedService(null);
    setServiceForm({
      name: '',
      description: '',
      price: 0,
      duration: 60,
      category: '',
      preparation_days: 0,
      is_active: true
    });
    setShowServiceModal(true);
  };

  const submitServiceForm = async () => {
    try {
      if (selectedService) {
        await adminAPI.updateService(selectedService.id, serviceForm);
        alert('Услуга обновлена');
      } else {
        await adminAPI.createService(serviceForm);
        alert('Услуга создана');
      }
      setShowServiceModal(false);
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Ошибка сохранения услуги: ' + error.message);
    }
  };

  const deleteService = async (serviceId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту услугу?')) return;
    
    try {
      await adminAPI.deleteService(serviceId);
      alert('Услуга удалена');
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Ошибка удаления услуги: ' + error.message);
    }
  };

  // ==================== ЗАКАЗЫ ====================

  const fetchAppointments = async () => {
    try {
      const data = await adminAPI.getAppointments(appointmentFilters);
      setAppointments(data.appointments || data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      alert('Ошибка загрузки заказов');
    }
  };

  const fetchExecutors = async () => {
    try {
      const data = await adminAPI.getExecutors();
      setExecutors(data || []);
    } catch (error) {
      console.error('Error fetching executors:', error);
    }
  };

  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setAppointmentForm({
      executor_id: appointment.executor_id || '',
      appointment_date: appointment.appointment_date?.split('T')[0] || '',
      appointment_time: appointment.appointment_time || '',
      status: appointment.status || ''
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

  const getRoleText = (role) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'executor': return 'Исполнитель';
      case 'client': return 'Клиент';
      default: return role;
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'booked': return '#3B82F6';
      case 'in_progress': return '#F59E0B';
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
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
            padding: '12px 24px',
            border: 'none',
            background: activeTab === 'users' ? '#2563eb' : 'transparent',
            color: activeTab === 'users' ? 'white' : '#6B7280',
            cursor: 'pointer',
            borderRadius: '8px 8px 0 0',
            fontWeight: activeTab === 'users' ? '600' : 'normal'
          }}
        >
          👥 Пользователи ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('services')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: activeTab === 'services' ? '#2563eb' : 'transparent',
            color: activeTab === 'services' ? 'white' : '#6B7280',
            cursor: 'pointer',
            borderRadius: '8px 8px 0 0',
            fontWeight: activeTab === 'services' ? '600' : 'normal'
          }}
        >
          🛠️ Услуги ({services.length})
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: activeTab === 'appointments' ? '#2563eb' : 'transparent',
            color: activeTab === 'appointments' ? 'white' : '#6B7280',
            cursor: 'pointer',
            borderRadius: '8px 8px 0 0',
            fontWeight: activeTab === 'appointments' ? '600' : 'normal'
          }}
        >
          📅 Записи ({appointments.length})
        </button>
      </div>

      {/* ==================== ВКЛАДКА ПОЛЬЗОВАТЕЛИ ==================== */}
      {activeTab === 'users' && (
        <div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h2 style={{fontSize: '22px', fontWeight: '600'}}>Управление пользователями</h2>
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
              + Создать пользователя
            </button>
          </div>

          {/* Фильтры пользователей */}
          <div style={{
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            <div>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>Роль:</label>
              <select
                value={userFilters.role}
                onChange={(e) => setUserFilters({...userFilters, role: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px'
                }}
              >
                <option value="">Все роли</option>
                <option value="admin">Администратор</option>
                <option value="executor">Исполнитель</option>
                <option value="client">Клиент</option>
              </select>
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>Поиск:</label>
              <input
                type="text"
                placeholder="Имя, email или телефон..."
                value={userFilters.search}
                onChange={(e) => setUserFilters({...userFilters, search: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div style={{display: 'flex', alignItems: 'end'}}>
              <button
                onClick={fetchUsers}
                style={{
                  background: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Применить фильтры
              </button>
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
                      <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '8px'}}>
                        {user.name || 'Без имени'}
                      </h3>
                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', color: '#666'}}>
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>Телефон:</strong> {user.phone || 'Не указан'}</p>
                        <p><strong>Роль:</strong> {getRoleText(user.role)}</p>
                        <p><strong>Создан:</strong> {new Date(user.created_at).toLocaleDateString('ru-RU')}</p>
                      </div>
                    </div>
                    <div style={{display: 'flex', gap: '10px'}}>
                      <button
                        onClick={() => handleEditUser(user)}
                        style={{
                          background: '#3B82F6',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
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
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== ВКЛАДКА УСЛУГИ ==================== */}
      {activeTab === 'services' && (
        <div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h2 style={{fontSize: '22px', fontWeight: '600'}}>Управление услугами</h2>
            <button
              onClick={handleCreateService}
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
              + Создать услугу
            </button>
          </div>

          {/* Фильтры услуг */}
          <div style={{
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            <div>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>Поиск:</label>
              <input
                type="text"
                placeholder="Название или описание..."
                value={serviceFilters.search}
                onChange={(e) => setServiceFilters({...serviceFilters, search: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <label style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                <input
                  type="checkbox"
                  checked={serviceFilters.active_only}
                  onChange={(e) => setServiceFilters({...serviceFilters, active_only: e.target.checked})}
                />
                Только активные услуги
              </label>
            </div>
            <div style={{display: 'flex', alignItems: 'end'}}>
              <button
                onClick={fetchServices}
                style={{
                  background: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Применить фильтры
              </button>
            </div>
          </div>

          {/* Список услуг */}
          {services.length === 0 ? (
            <div style={{textAlign: 'center', color: '#666', padding: '40px'}}>
              Услуги не найдены
            </div>
          ) : (
            <div style={{display: 'grid', gap: '15px'}}>
              {services.map((service) => (
                <div key={service.id} style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '20px',
                  background: 'white',
                  opacity: service.is_active === false ? 0.6 : 1
                }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                    <div style={{flex: 1}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px'}}>
                        <h3 style={{fontSize: '18px', fontWeight: '600'}}>
                          {service.name}
                        </h3>
                        <span style={{
                          background: service.is_active ? '#D1FAE5' : '#FEE2E2',
                          color: service.is_active ? '#064E3B' : '#7F1D1D',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {service.is_active ? 'Активна' : 'Неактивна'}
                        </span>
                      </div>
                      
                      {service.description && (
                        <p style={{color: '#666', marginBottom: '12px', lineHeight: '1.5'}}>
                          {service.description}
                        </p>
                      )}
                      
                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', fontSize: '14px'}}>
                        <p><strong>💰 Цена:</strong> {service.price || 0}₽</p>
                        <p><strong>⏱️ Длительность:</strong> {service.duration || 0} мин</p>
                        <p><strong>📝 Категория:</strong> {service.category || 'Не указана'}</p>
                        <p><strong>📅 Подготовка:</strong> {service.preparation_days || 0} дн.</p>
                      </div>
                    </div>
                    
                    <div style={{display: 'flex', gap: '10px', marginLeft: '20px'}}>
                      <button
                        onClick={() => handleEditService(service)}
                        style={{
                          background: '#3B82F6',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => deleteService(service.id)}
                        style={{
                          background: '#EF4444',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== ВКЛАДКА ЗАПИСИ ==================== */}
      {activeTab === 'appointments' && (
        <div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h2 style={{fontSize: '22px', fontWeight: '600'}}>Управление записями</h2>
          </div>

          {/* Фильтры записей */}
          <div style={{
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            <div>
              <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>Статус:</label>
              <select
                value={appointmentFilters.status}
                onChange={(e) => setAppointmentFilters({...appointmentFilters, status: e.target.value})}
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
              <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>Исполнитель:</label>
              <select
                value={appointmentFilters.executor_id}
                onChange={(e) => setAppointmentFilters({...appointmentFilters, executor_id: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '4px'
                }}
              >
                <option value="">Все исполнители</option>
                {executors.map((executor) => (
                  <option key={executor.id} value={executor.id}>
                    {executor.name || executor.email}
                  </option>
                ))}
              </select>
            </div>
            <div style={{display: 'flex', alignItems: 'end'}}>
              <button
                onClick={fetchAppointments}
                style={{
                  background: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Применить фильтры
              </button>
            </div>
          </div>

          {/* Список записей */}
          {appointments.length === 0 ? (
            <div style={{textAlign: 'center', color: '#666', padding: '40px'}}>
              Записи не найдены
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
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                    <div style={{flex: 1}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px'}}>
                        <h3 style={{fontSize: '18px', fontWeight: '600'}}>
                          {appointment.service_name || 'Услуга не указана'}
                        </h3>
                        <span style={{
                          background: getStatusColor(appointment.status),
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {getStatusText(appointment.status)}
                        </span>
                      </div>
                      
                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '14px', color: '#666'}}>
                        <p><strong>👤 Клиент:</strong> {appointment.user_name || 'Не указан'}</p>
                        <p><strong>📞 Телефон:</strong> {appointment.user_phone || 'Не указан'}</p>
                        <p><strong>📧 Email:</strong> {appointment.user_email || 'Не указан'}</p>
                        <p><strong>👨‍🔧 Исполнитель:</strong> {appointment.executor_name || 'Не назначен'}</p>
                        <p><strong>📅 Дата:</strong> {appointment.appointment_date ? new Date(appointment.appointment_date).toLocaleDateString('ru-RU') : 'Не указана'}</p>
                        <p><strong>⏰ Время:</strong> {appointment.appointment_time || 'Не указано'}</p>
                        <p><strong>💰 Цена:</strong> {appointment.price || 0}₽</p>
                        <p><strong>⏱️ Длительность:</strong> {appointment.duration || 0} мин</p>
                      </div>
                      
                      {appointment.notes && (
                        <div style={{
                          marginTop: '12px',
                          padding: '8px',
                          background: '#F3F4F6',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}>
                          <strong>📝 Заметки:</strong> {appointment.notes}
                        </div>
                      )}
                    </div>
                    
                    <div style={{display: 'flex', gap: '8px', marginLeft: '20px', flexWrap: 'wrap'}}>
                      <button
                        onClick={() => handleEditAppointment(appointment)}
                        style={{
                          background: '#3B82F6',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
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
                          fontSize: '12px'
                        }}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== МОДАЛЬНЫЕ ОКНА ==================== */}

      {/* Модальное окно для создания/редактирования пользователя */}
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
            
            <div style={{display: 'grid', gap: '15px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                  Имя <span style={{color: '#EF4444'}}>*</span>
                </label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  placeholder="Введите имя пользователя"
                />
              </div>

              <div>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                  Email <span style={{color: '#EF4444'}}>*</span>
                </label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  placeholder="email@example.com"
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
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  placeholder="+7 (999) 123-45-67"
                />
              </div>

              <div>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                  Пароль {!selectedUser && <span style={{color: '#EF4444'}}>*</span>}
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  placeholder={selectedUser ? "Оставьте пустым, чтобы не менять" : "Введите пароль"}
                />
              </div>

              <div>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                  Роль <span style={{color: '#EF4444'}}>*</span>
                </label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="client">Клиент</option>
                  <option value="executor">Исполнитель</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
            </div>

            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '25px'}}>
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

      {/* Модальное окно для создания/редактирования услуги */}
      {showServiceModal && (
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
              {selectedService ? 'Редактировать услугу' : 'Создать услугу'}
            </h3>
            
            <div style={{display: 'grid', gap: '15px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                  Название <span style={{color: '#EF4444'}}>*</span>
                </label>
                <input
                  type="text"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                  placeholder="Например: Комплексная мойка автомобиля"
                />
              </div>

              <div>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                  Описание
                </label>
                <textarea
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    fontSize: '14px',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="Подробное описание услуги..."
                />
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                    Цена (₽) <span style={{color: '#EF4444'}}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({...serviceForm, price: parseFloat(e.target.value) || 0})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                    Длительность (мин) <span style={{color: '#EF4444'}}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={serviceForm.duration}
                    onChange={(e) => setServiceForm({...serviceForm, duration: parseInt(e.target.value) || 0})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    placeholder="60"
                  />
                </div>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                    Категория
                  </label>
                  <input
                    type="text"
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({...serviceForm, category: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    placeholder="Например: Мойка, Детейлинг"
                  />
                </div>

                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                    Дни подготовки
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={serviceForm.preparation_days}
                    onChange={(e) => setServiceForm({...serviceForm, preparation_days: parseInt(e.target.value) || 0})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
                  <input
                    type="checkbox"
                    checked={serviceForm.is_active}
                    onChange={(e) => setServiceForm({...serviceForm, is_active: e.target.checked})}
                    style={{cursor: 'pointer'}}
                  />
                  <span style={{fontWeight: '500'}}>Активная услуга</span>
                </label>
                <p style={{fontSize: '12px', color: '#666', marginTop: '4px'}}>
                  Неактивные услуги не отображаются клиентам при бронировании
                </p>
              </div>
            </div>

            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '25px'}}>
              <button
                onClick={() => setShowServiceModal(false)}
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
                onClick={submitServiceForm}
                disabled={!serviceForm.name || serviceForm.price < 0 || serviceForm.duration < 0}
                style={{
                  background: (!serviceForm.name || serviceForm.price < 0 || serviceForm.duration < 0) 
                    ? '#9CA3AF' : '#10B981',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                                    cursor: (!serviceForm.name || serviceForm.price < 0 || serviceForm.duration < 0) 
                    ? 'not-allowed' : 'pointer'
                }}
              >
                {selectedService ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для редактирования записи */}
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
              Редактировать запись
            </h3>

            <div style={{
              background: '#F3F4F6',
              padding: '15px',
              borderRadius: '6px',
              marginBottom: '20px'
            }}>
              <h4 style={{fontWeight: '600', marginBottom: '8px'}}>Информация о записи:</h4>
              <p><strong>Услуга:</strong> {selectedAppointment.service_name}</p>
              <p><strong>Клиент:</strong> {selectedAppointment.user_name}</p>
              <p><strong>Email:</strong> {selectedAppointment.user_email}</p>
              <p><strong>Телефон:</strong> {selectedAppointment.user_phone}</p>
            </div>
            
            <div style={{display: 'grid', gap: '15px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                  Исполнитель
                </label>
                <select
                  value={appointmentForm.executor_id}
                  onChange={(e) => setAppointmentForm({...appointmentForm, executor_id: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Не назначен</option>
                  {executors.map((executor) => (
                    <option key={executor.id} value={executor.id}>
                      {executor.name || executor.email}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                    Дата записи
                  </label>
                  <input
                    type="date"
                    value={appointmentForm.appointment_date}
                    onChange={(e) => setAppointmentForm({...appointmentForm, appointment_date: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                    Время записи
                  </label>
                  <input
                    type="time"
                    value={appointmentForm.appointment_time}
                    onChange={(e) => setAppointmentForm({...appointmentForm, appointment_time: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                  Статус записи
                </label>
                <select
                  value={appointmentForm.status}
                  onChange={(e) => setAppointmentForm({...appointmentForm, status: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Выберите статус</option>
                  <option value="booked">Забронировано</option>
                  <option value="in_progress">В работе</option>
                  <option value="completed">Выполнено</option>
                  <option value="cancelled">Отменено</option>
                </select>
              </div>
            </div>

            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '25px'}}>
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
                Сохранить изменения
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
