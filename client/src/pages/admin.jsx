import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('appointments');

  // Состояния данных
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [executors, setExecutors] = useState([]);
  const [stats, setStats] = useState(null);

  // Состояния форм
  const [loading, setLoading] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    category: '',
    preparation_days: 0,
    is_active: true
  });
  const [blockDateForm, setBlockDateForm] = useState({
    date: '',
    reason: ''
  });
  const [editingService, setEditingService] = useState(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showBlockDateModal, setShowBlockDateModal] = useState(false);

  // Проверка прав администратора
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    if (!user || user.role !== 'admin' || !token) {
      alert('Доступ запрещён. Требуются права администратора.');
      navigate('/');
    }
  }, [navigate]);

  // Загрузка данных при смене вкладки
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (activeTab === 'appointments') {
      fetchAppointments();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'services') {
      fetchServices();
    } else if (activeTab === 'blocked-dates') {
      fetchBlockedDates();
      fetchExecutors();
    } else if (activeTab === 'stats') {
      fetchStats();
    }
  }, [activeTab]);

  // ==================== API ЗАПРОСЫ ====================

  const apiCall = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/api/admin${url}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      },
      ...options
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Ошибка сервера');
    }
    return res.json();
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/appointments');
      setAppointments(data);
    } catch (err) {
      alert('Ошибка загрузки записей: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/users');
      setUsers(data);
    } catch (err) {
      alert('Ошибка загрузки пользователей: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/services');
      setServices(data);
    } catch (err) {
      alert('Ошибка загрузки услуг: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockedDates = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/blocked-dates');
      setBlockedDates(data);
    } catch (err) {
      alert('Ошибка загрузки заблокированных дат: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchExecutors = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/executors');
      setExecutors(data);
    } catch (err) {
      alert('Ошибка загрузки исполнителей: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/stats');
      setStats(data);
    } catch (err) {
      alert('Ошибка загрузки статистики: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (id, status) => {
    try {
      await apiCall(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      fetchAppointments();
      alert('Статус обновлён');
    } catch (err) {
      alert('Ошибка обновления статуса: ' + err.message);
    }
  };

  const assignExecutor = async (appointmentId, executorId) => {
    try {
      await apiCall(`/appointments/${appointmentId}/assign-executor`, {
        method: 'PATCH',
        body: JSON.stringify({ executor_id: executorId })
      });
      fetchAppointments();
      alert('Исполнитель назначен');
    } catch (err) {
      alert('Ошибка назначения: ' + err.message);
    }
  };

  const createService = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/services', {
        method: 'POST',
        body: JSON.stringify(serviceForm)
      });
      setServiceForm({
        name: '',
        description: '',
        price: '',
        duration: '',
        category: '',
        preparation_days: 0,
        is_active: true
      });
      setShowServiceModal(false);
      fetchServices();
      alert('Услуга создана');
    } catch (err) {
      alert('Ошибка создания услуги: ' + err.message);
    }
  };

  const updateService = async (e) => {
    e.preventDefault();
    try {
      await apiCall(`/services/${editingService.id}`, {
        method: 'PUT',
        body: JSON.stringify(serviceForm)
      });
      setEditingService(null);
      setShowServiceModal(false);
      fetchServices();
      alert('Услуга обновлена');
    } catch (err) {
      alert('Ошибка обновления услуги: ' + err.message);
    }
  };

  const deleteService = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить услугу?')) return;
    try {
      await apiCall(`/services/${id}`, { method: 'DELETE' });
      fetchServices();
      alert('Услуга удалена');
    } catch (err) {
      alert('Ошибка удаления: ' + err.message);
    }
  };

  const blockDate = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/block-date', {
        method: 'POST',
        body: JSON.stringify(blockDateForm)
      });
      setBlockDateForm({ date: '', reason: '' });
      setShowBlockDateModal(false);
      fetchBlockedDates();
      alert('Дата заблокирована');
    } catch (err) {
      alert('Ошибка блокировки даты: ' + err.message);
    }
  };

  const unblockDate = async (id) => {
    if (!confirm('Разблокировать дату?')) return;
    try {
      await apiCall(`/blocked-dates/${id}`, { method: 'DELETE' });
      fetchBlockedDates();
      alert('Дата разблокирована');
    } catch (err) {
      alert('Ошибка разблокировки: ' + err.message);
    }
  };

  // ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

  const handleServiceEdit = (service) => {
    setServiceForm({
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      category: service.category,
      preparation_days: service.preparation_days,
      is_active: service.is_active
    });
    setEditingService(service);
    setShowServiceModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'booked': return '#3B82F6';
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'booked': return 'Забронировано';
      case 'completed': return 'Выполнено';
      case 'cancelled': return 'Отменено';
      default: return status;
    }
  };

  // ==================== РЕНДЕР ====================

  return (
    <div className="container py-8">
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '30px' }}>
        Панель администратора
      </h1>

      {/* Навигация */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '30px',
        borderBottom: '1px solid #E5E7EB'
      }}>
        {['appointments', 'users', 'services', 'blocked-dates', 'stats'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeTab === tab ? '#2563eb' : 'transparent',
              color: activeTab === tab ? 'white' : '#6B7280',
              cursor: 'pointer',
              borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent'
            }}
          >
            {tab === 'appointments' && 'Все записи'}
            {tab === 'users' && 'Пользователи'}
            {tab === 'services' && 'Услуги'}
            {tab === 'blocked-dates' && 'Блокировка дат'}
            {tab === 'stats' && 'Статистика'}
          </button>
        ))}
      </div>

      {/* Кнопки действий */}
      {activeTab === 'services' && (
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => {
              setEditingService(null);
              setServiceForm({
                name: '',
                description: '',
                price: '',
                duration: '',
                category: '',
                preparation_days: 0,
                is_active: true
              });
              setShowServiceModal(true);
            }}
            style={{
              background: '#10B981',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            + Добавить услугу
          </button>
        </div>
      )}

      {activeTab === 'blocked-dates' && (
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setShowBlockDateModal(true)}
            style={{
              background: '#EF4444',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            + Заблокировать дату
          </button>
        </div>
      )}

      {/* Содержимое вкладок */}
      {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Загрузка...</div>}

      {activeTab === 'appointments' && !loading && (
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '20px' }}>
            Все записи ({appointments.length})
          </h2>
          {appointments.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Записей нет</div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {appointments.map(appt => (
                <div key={appt.id} style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '20px',
                  background: 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '5px' }}>{appt.service_name}</h3>
                      <p><strong>Клиент:</strong> {appt.user_name} ({appt.user_phone})</p>
                      <p><strong>Дата:</strong> {new Date(appt.appointment_date).toLocaleDateString('ru-RU')} в {appt.appointment_time}</p>
                      {appt.executor_name && <p><strong>Исполнитель:</strong> {appt.executor_name}</p>}
                      {appt.notes && <p><strong>Примечания:</strong> {appt.notes}</p>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        background: getStatusColor(appt.status),
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        display: 'inline-block',
                        marginBottom: '10px'
                      }}>
                        {getStatusText(appt.status)}
                      </span>
                      {appt.status === 'booked' && (
                        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                          <button
                            onClick={() => updateAppointmentStatus(appt.id, 'completed')}
                            style={{ background: '#10B981', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Выполнено
                          </button>
                          <button
                            onClick={() => updateAppointmentStatus(appt.id, 'cancelled')}
                            style={{ background: '#EF4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Отменить
                          </button>
                        </div>
                      )}
                      {executors.length > 0 && (
                        <select
                          onChange={(e) => assignExecutor(appt.id, e.target.value)}
                          value={appt.executor_id || ''}
                          style={{ marginTop: '8px', fontSize: '12px', padding: '4px' }}
                        >
                          <option value="">Назначить исполнителя</option>
                          {executors.map(ex => (
                            <option key={ex.id} value={ex.id}>{ex.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && !loading && (
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '20px' }}>
            Все пользователи ({users.length})
          </h2>
          {users.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Пользователей нет</div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {users.map(user => (
                <div key={user.id} style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '20px',
                  background: 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{user.name}</h3>
                      <p><strong>Email:</strong> {user.email}</p>
                      <p><strong>Телефон:</strong> {user.phone}</p>
                      <p><strong>Роль:</strong> {user.role === 'admin' ? 'Администратор' : user.role === 'executor' ? 'Исполнитель' : 'Клиент'}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        background: user.is_active ? '#10B981' : '#EF4444',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        display: 'inline-block'
                      }}>
                        {user.is_active ? 'Активен' : 'Заблокирован'}
                      </span>
                      <p style={{ color: '#666', fontSize: '12px', marginTop: '5px' }}>
                        Зарегистрирован: {new Date(user.created_at).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'services' && !loading && (
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '20px' }}>
            Услуги ({services.length})
          </h2>
          {services.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Услуг нет</div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {services.map(s => (
                <div key={s.id} style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '20px',
                  background: 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '5px' }}>{s.name}</h3>
                      <p>{s.description}</p>
                      <p><strong>Цена:</strong> {s.price} ₽</p>
                      <p><strong>Длительность:</strong> {s.duration} мин</p>
                      <p><strong>Подготовка:</strong> {s.preparation_days} дн.</p>
                      <p><strong>Категория:</strong> {s.category}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        background: s.is_active ? '#10B981' : '#6B7280',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '14px'
                      }}>
                        {s.is_active ? 'Активна' : 'Неактивна'}
                      </span>
                      <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleServiceEdit(s)}
                          style={{ background: '#3B82F6', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Редактировать
                        </button>
                        <button
                          onClick={() => deleteService(s.id)}
                          style={{ background: '#EF4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
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

      {activeTab === 'blocked-dates' && !loading && (
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '20px' }}>
            Заблокированные даты ({blockedDates.length})
          </h2>
          {blockedDates.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Нет заблокированных дат</div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {blockedDates.map(bd => (
                <div key={bd.id} style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '15px',
                  background: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <strong>{new Date(bd.date).toLocaleDateString('ru-RU')}</strong>
                    {bd.reason && <div style={{ color: '#666', fontSize: '14px' }}>{bd.reason}</div>}
                  </div>
                  <button
                    onClick={() => unblockDate(bd.id)}
                    style={{ background: '#10B981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Разблокировать
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'stats' && !loading && stats && (
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '20px' }}>Статистика</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{ background: '#f0f9ff', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0284c7' }}>{stats.users}</div>
              <div>Активных пользователей</div>
            </div>
            <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>{stats.services}</div>
              <div>Активных услуг</div>
            </div>
            <div style={{ background: '#fffbeb', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ca8a04' }}>{stats.appointments.booked}</div>
              <div>Активных записей</div>
            </div>
            <div style={{ background: '#fef2f2', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>{stats.revenue.toFixed(2)} ₽</div>
              <div>Выручка (30 дн.)</div>
            </div>
          </div>
        </div>
      )}

      {/* Модалка: Управление услугой */}
      {showServiceModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '8px',
            width: '500px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginBottom: '16px', fontSize: '20px' }}>
              {editingService ? 'Редактировать услугу' : 'Добавить услугу'}
            </h3>
            <form onSubmit={editingService ? updateService : createService}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>Название *</label>
                <input
                  type="text"
                  value={serviceForm.name}
                  onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>Описание *</label>
                <textarea
                  value={serviceForm.description}
                  onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
                  required
                  rows="3"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px' }}>Цена (₽) *</label>
                  <input
                    type="number"
                    value={serviceForm.price}
                    onChange={e => setServiceForm({ ...serviceForm, price: e.target.value })}
                    required
                    min="0"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px' }}>Длительность (мин) *</label>
                  <input
                    type="number"
                    value={serviceForm.duration}
                    onChange={e => setServiceForm({ ...serviceForm, duration: e.target.value })}
                    required
                    min="1"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px' }}>Категория *</label>
                  <input
                    type="text"
                    value={serviceForm.category}
                    onChange={e => setServiceForm({ ...serviceForm, category: e.target.value })}
                    required
                    placeholder="wrap, maintenance и т.д."
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px' }}>Подготовка (дн.)</label>
                  <input
                    type="number"
                    value={serviceForm.preparation_days}
                    onChange={e => setServiceForm({ ...serviceForm, preparation_days: parseInt(e.target.value) || 0 })}
                    min="0"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label>
                  <input
                    type="checkbox"
                    checked={serviceForm.is_active}
                    onChange={e => setServiceForm({ ...serviceForm, is_active: e.target.checked })}
                  />
                  Активна
                </label>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  {editingService ? 'Сохранить' : 'Создать'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  style={{ background: '#ccc', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модалка: Блокировка даты */}
      {showBlockDateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '8px',
            width: '400px'
          }}>
            <h3 style={{ marginBottom: '16px' }}>Заблокировать дату</h3>
            <form onSubmit={blockDate}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>Дата *</label>
                <input
                  type="date"
                  value={blockDateForm.date}
                  onChange={e => setBlockDateForm({ ...blockDateForm, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '4px' }}>Причина</label>
                <textarea
                  value={blockDateForm.reason}
                  onChange={e => setBlockDateForm({ ...blockDateForm, reason: e.target.value })}
                  rows="2"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  style={{ background: '#dc2626', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Заблокировать
                </button>
                <button
                  type="button"
                  onClick={() => setShowBlockDateModal(false)}
                  style={{ background: '#ccc', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;