import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('date_desc'); // Добавляем состояние сортировки

  // Функции для форматирования даты и времени (как в админке)
  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Неверная дата';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Не указано';
    if (timeString.includes(':')) {
      const parts = timeString.split(':');
      if (parts.length >= 2) {
        const hours = parts[0].padStart(2, '0');
        const minutes = parts[1].padStart(2, '0');
        return `${hours}:${minutes}`;
      }
    }
    return timeString;
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUser(userData);
      fetchAppointments(userData.id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchAppointments = async (userId) => {
    try {
      const response = await fetch(`https://car-detailing-app-14qu.onrender.com/api/appointments/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Функция для сортировки заказов (как в админке)
  const getSortedAppointments = () => {
    const appointmentsCopy = [...appointments];
    
    switch (sortOrder) {
      case 'date_asc':
        // От ближайших к дальним
        return appointmentsCopy.sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
      case 'date_desc':
        // От дальних к ближайшим
        return appointmentsCopy.sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date));
      case 'created_asc':
        // От старых к новым (по дате создания)
        return appointmentsCopy.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'created_desc':
        // От новых к старым (по дате создания)
        return appointmentsCopy.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case 'price_asc':
        // От дешевых к дорогим
        return appointmentsCopy.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price_desc':
        // От дорогих к дешевым
        return appointmentsCopy.sort((a, b) => (b.price || 0) - (a.price || 0));
      default:
        return appointmentsCopy;
    }
  };

  const cancelAppointment = async (appointmentId) => {
    if (!window.confirm('Вы уверены, что хотите отменить запись?')) {
      return;
    }

    try {
      const response = await fetch(`https://car-detailing-app-14qu.onrender.com/api/appointments/${appointmentId}/cancel`, {
        method: 'PATCH',
      });

      if (response.ok) {
        // Обновляем список записей
        fetchAppointments(user.id);
        alert('Запись успешно отменена');
      } else {
        alert('Ошибка при отмене записи');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Ошибка соединения с сервером');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'booked': return '#3B82F6'; // синий
      case 'completed': return '#10B981'; // зеленый
      case 'cancelled': return '#EF4444'; // красный
      case 'in_progress': return '#F59E0B'; // желтый для статуса "в работе"
      default: return '#6B7280'; // серый
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

  if (loading) {
    return (
      <div className="container py-8 text-center">
        <div style={{fontSize: '18px', color: '#666'}}>Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-8 text-center">
        <div style={{fontSize: '18px', color: '#666', marginBottom: '20px'}}>
          Пожалуйста, войдите в систему
        </div>
        <Link to="/login" className="btn">Войти</Link>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 style={{fontSize: '28px', fontWeight: 'bold', marginBottom: '30px'}}>
        Личный кабинет
      </h1>

      {/* Информация о пользователе */}
      <div style={{
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '20px',
        background: 'white',
        marginBottom: '30px'
      }}>
        <h2 style={{fontSize: '20px', fontWeight: '600', marginBottom: '15px'}}>
          Информация о пользователе
        </h2>
        <div style={{display: 'grid', gap: '10px'}}>
          <div><strong>Имя:</strong> {user.name}</div>
          <div><strong>Email:</strong> {user.email}</div>
          <div><strong>Роль:</strong> {user.role === 'client' ? 'Клиент' : user.role}</div>
        </div>
      </div>

      {/* Мои записи */}
      <div style={{
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '20px',
        background: 'white'
      }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
          <h2 style={{fontSize: '20px', fontWeight: '600'}}>
            История заказов ({appointments.length})
          </h2>
          
          {/* Сортировка */}
          <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
            <label style={{fontSize: '14px', fontWeight: '500'}}>Сортировка:</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{
                padding: '6px 10px',
                border: '1px solid #D1D5DB',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="date_desc">📅 Сначала новые</option>
              <option value="date_asc">📅 Сначала старые</option>
              <option value="created_desc">🆕 По дате создания (новые)</option>
              <option value="created_asc">🕐 По дате создания (старые)</option>
              <option value="price_desc">💰 Сначала дорогие</option>
              <option value="price_asc">💰 Сначала дешевые</option>
            </select>
          </div>
        </div>

        {appointments.length === 0 ? (
          <div style={{textAlign: 'center', color: '#666', padding: '40px'}}>
            <p style={{marginBottom: '20px'}}>У вас пока нет записей</p>
            <Link 
              to="/services" 
              style={{
                background: '#3B82F6',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              Записаться на услугу
            </Link>
          </div>
        ) : (
          <div style={{display: 'grid', gap: '15px'}}>
            {getSortedAppointments().map((appointment) => (
              <div
                key={appointment.id}
                style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '20px',
                  background: 'white'
                }}
              >
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px'}}>
                  <div style={{flex: 1}}>
                    <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '8px'}}>
                      {appointment.service_name}
                    </h3>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '14px', color: '#666'}}>
                      <p><strong>📅 Дата:</strong> {formatDate(appointment.appointment_date)}</p>
                      <p><strong>⏰ Время:</strong> {formatTime(appointment.appointment_time)}</p>
                      <p><strong>💰 Цена:</strong> {appointment.price || 0} ₽</p>
                      {appointment.executor_name && (
                        <p><strong>👨‍🔧 Исполнитель:</strong> {appointment.executor_name}</p>
                      )}
                    </div>
                  </div>
                  <div style={{textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '10px'}}>
                    <span
                      style={{
                        background: getStatusColor(appointment.status),
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      {getStatusText(appointment.status)}
                    </span>
                    {appointment.status === 'booked' && (
                      <button
                        onClick={() => cancelAppointment(appointment.id)}
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
                        Отменить
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Дополнительная информация */}
                {appointment.notes && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    background: '#F3F4F6',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    <strong>📝 Примечания:</strong> {appointment.notes}
                  </div>
                )}

                {/* Использованные материалы (если есть) */}
                {appointment.used_materials && appointment.used_materials.length > 0 && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}>
                    <strong>📦 Использованные материалы:</strong>
                    <div style={{marginTop: '5px'}}>
                      {appointment.used_materials.map((material, index) => (
                        <div key={index} style={{display: 'flex', justifyContent: 'space-between'}}>
                          <span>{material.material_name}</span>
                          <span>{material.quantity_used} {material.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
