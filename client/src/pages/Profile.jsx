import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

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
      default: return '#6B7280'; // серый
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
      <div className="card" style={{marginBottom: '30px'}}>
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
      <div className="card">
        <h2 style={{fontSize: '20px', fontWeight: '600', marginBottom: '20px'}}>
          Мои записи
        </h2>

        {appointments.length === 0 ? (
          <div style={{textAlign: 'center', color: '#666', padding: '40px'}}>
            <p style={{marginBottom: '20px'}}>У вас пока нет записей</p>
            <Link to="/services" className="btn">Записаться на услугу</Link>
          </div>
        ) : (
          <div style={{display: 'grid', gap: '15px'}}>
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '20px',
                  background: 'white'
                }}
              >
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px'}}>
                  <div>
                    <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '5px'}}>
                      {appointment.service_name}
                    </h3>
                    <p style={{color: '#666', marginBottom: '5px'}}>
                      {new Date(appointment.appointment_date).toLocaleDateString('ru-RU')} в {appointment.appointment_time}
                    </p>
                    <p style={{color: '#666'}}>Цена: {appointment.price} ₽</p>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <span
                      style={{
                        background: getStatusColor(appointment.status),
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        display: 'inline-block',
                        marginBottom: '10px'
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
                {appointment.notes && (
                  <div style={{marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #E5E7EB'}}>
                    <strong>Примечания:</strong> {appointment.notes}
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
