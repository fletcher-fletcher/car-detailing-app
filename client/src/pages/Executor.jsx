import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Executor = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('appointments');

  useEffect(() => {
    checkExecutorAccess();
  }, []);

  useEffect(() => {
    if (activeTab === 'appointments') {
      fetchExecutorAppointments();
    } else if (activeTab === 'materials') {
      fetchMaterials();
    }
  }, [activeTab]);

  const checkExecutorAccess = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    if (!user || user.role !== 'executor' || !token) {
      alert('Доступ запрещен. Требуются права исполнителя.');
      navigate('/');
      return;
    }
    setLoading(false);
  };

  const fetchExecutorAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Получаем записи, назначенные этому исполнителю
      const response = await fetch(`http://localhost:5000/api/appointments/executor/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      } else {
        alert('Ошибка загрузки записей');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      alert('Ошибка соединения');
    }
  };

  const fetchMaterials = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/materials', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMaterials(data);
      } else {
        // Если API нет, покажем тестовые данные
        setMaterials([
          { id: 1, name: 'Антигравийная пленка', stock_quantity: 50, min_quantity: 10 },
          { id: 2, name: 'Керамическое покрытие', stock_quantity: 25, min_quantity: 5 },
          { id: 3, name: 'Полироль', stock_quantity: 15, min_quantity: 3 },
          { id: 4, name: 'Шампунь для мойки', stock_quantity: 30, min_quantity: 8 }
        ]);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      // Покажем тестовые данные при ошибке
      setMaterials([
        { id: 1, name: 'Антигравийная пленка', stock_quantity: 50, min_quantity: 10 },
        { id: 2, name: 'Керамическое покрытие', stock_quantity: 25, min_quantity: 5 },
        { id: 3, name: 'Полироль', stock_quantity: 15, min_quantity: 3 },
        { id: 4, name: 'Шампунь для мойки', stock_quantity: 30, min_quantity: 8 }
      ]);
    }
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        alert('Статус обновлен');
        fetchExecutorAppointments();
      } else {
        alert('Ошибка обновления статуса');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Ошибка соединения');
    }
  };

  const updateMaterialQuantity = async (materialId, newQuantity) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/materials/${materialId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stock_quantity: newQuantity })
      });

      if (response.ok) {
        alert('Количество обновлено');
        fetchMaterials();
      } else {
        alert('Ошибка обновления количества');
      }
    } catch (error) {
      console.error('Error updating material:', error);
      alert('Ошибка соединения');
    }
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
        Панель исполнителя
      </h1>

      {/* Навигация по вкладкам */}
      <div style={{display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid #E5E7EB'}}>
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
          Мои записи
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
          Расходные материалы
        </button>
      </div>

      {/* Вкладка "Мои записи" */}
      {activeTab === 'appointments' && (
        <div>
          <h2 style={{fontSize: '22px', fontWeight: '600', marginBottom: '20px'}}>
            Записи, назначенные мне ({appointments.length})
          </h2>
          
          {appointments.length === 0 ? (
            <div style={{textAlign: 'center', color: '#666', padding: '40px'}}>
              Вам пока не назначены записи
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
                    <div style={{flex: 1}}>
                      <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '5px'}}>
                        {appointment.service_name}
                      </h3>
                      <p style={{color: '#666', marginBottom: '5px'}}>
                        <strong>Клиент:</strong> {appointment.user_name} ({appointment.user_phone})
                      </p>
                      <p style={{color: '#666', marginBottom: '5px'}}>
                        <strong>Дата и время:</strong> {new Date(appointment.appointment_date).toLocaleDateString('ru-RU')} в {appointment.appointment_time}
                      </p>
                      <p style={{color: '#666', marginBottom: '5px'}}>
                        <strong>Цена:</strong> {appointment.price} ₽
                      </p>
                      {appointment.notes && (
                        <p style={{color: '#666'}}>
                          <strong>Примечания клиента:</strong> {appointment.notes}
                        </p>
                      )}
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
                        <div style={{display: 'flex', gap: '5px', flexDirection: 'column'}}>
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                            style={{
                              background: '#10B981',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Отметить выполненным
                          </button>
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
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
                            Отменить запись
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Вкладка "Расходные материалы" */}
      {activeTab === 'materials' && (
        <div>
          <h2 style={{fontSize: '22px', fontWeight: '600', marginBottom: '20px'}}>
            Управление расходными материалами
          </h2>
          
          <div style={{display: 'grid', gap: '15px'}}>
            {materials.map((material) => (
              <div
                key={material.id}
                style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '20px',
                  background: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '5px'}}>
                    {material.name}
                  </h3>
                  <p style={{color: '#666', marginBottom: '5px'}}>
                    Текущий остаток: <strong>{material.stock_quantity}</strong> шт.
                  </p>
                  <p style={{color: '#666'}}>
                    Минимальный запас: {material.min_quantity} шт.
                  </p>
                </div>
                
                <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                  <input
                    type="number"
                    defaultValue={material.stock_quantity}
                    style={{
                      width: '80px',
                      padding: '5px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px'
                    }}
                    onBlur={(e) => updateMaterialQuantity(material.id, parseInt(e.target.value))}
                  />
                  <span
                    style={{
                      color: material.stock_quantity <= material.min_quantity ? '#EF4444' : '#10B981',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    {material.stock_quantity <= material.min_quantity ? '⚠️ Низкий запас' : '✓ В норме'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Executor;