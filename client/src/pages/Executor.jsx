import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { executorAPI } from '../services/api';

const Executor = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [stockAlerts, setStockAlerts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('appointments');
  
  // Для работы с заказами
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  
  // Для работы с материалами
  const [materialsToUse, setMaterialsToUse] = useState([]);

  useEffect(() => {
    checkExecutorAccess();
  }, []);

  useEffect(() => {
    if (activeTab === 'appointments') {
      fetchAppointments();
    } else if (activeTab === 'materials') {
      fetchMaterialsAndAlerts();
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

  const fetchAppointments = async () => {
    try {
      const data = await executorAPI.getAppointments();
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      alert('Ошибка загрузки заказов: ' + error.message);
    }
  };

  const fetchMaterialsAndAlerts = async () => {
    try {
      const [materialsData, alertsData] = await Promise.all([
        executorAPI.getMaterials(),
        executorAPI.getStockAlerts()
      ]);
      setMaterials(materialsData);
      setStockAlerts(alertsData);
    } catch (error) {
      console.error('Error fetching materials:', error);
      alert('Ошибка загрузки материалов: ' + error.message);
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId, status) => {
    try {
      await executorAPI.updateAppointment(appointmentId, { status });
      alert('Статус обновлен');
      fetchAppointments();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Ошибка обновления статуса: ' + error.message);
    }
  };

  const handleUseMaterials = async (appointment) => {
  try {
    console.log('Загружаем материалы для модального окна...');
    
    // Загружаем материалы если они еще не загружены или массив пустой
    if (materials.length === 0) {
      console.log('Материалы не загружены, загружаем...');
      await fetchMaterialsAndAlerts();
    }
    
    setSelectedAppointment(appointment);
    setMaterialsToUse([]);
    setShowMaterialsModal(true);
    
    console.log('Материалы для выбора:', materials);
  } catch (error) {
    console.error('Ошибка загрузки материалов:', error);
    alert('Ошибка загрузки материалов: ' + error.message);
  }
};

  const addMaterialToUse = () => {
    setMaterialsToUse([...materialsToUse, {
      material_id: '',
      quantity_used: 0,
      notes: ''
    }]);
  };

  const updateMaterialToUse = (index, field, value) => {
    const updated = [...materialsToUse];
    updated[index][field] = value;
    setMaterialsToUse(updated);
  };

  const removeMaterialToUse = (index) => {
    setMaterialsToUse(materialsToUse.filter((_, i) => i !== index));
  };

  const submitMaterialUsage = async () => {
    if (!selectedAppointment || materialsToUse.length === 0) return;

    try {
      await executorAPI.useMaterials(selectedAppointment.id, materialsToUse);
      alert('Материалы успешно использованы');
      setShowMaterialsModal(false);
      fetchMaterialsAndAlerts();
      fetchAppointments();
    } catch (error) {
      console.error('Error using materials:', error);
      alert('Ошибка использования материалов: ' + error.message);
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

  const getStatusText = (status) => {
    switch (status) {
      case 'booked': return 'Забронировано';
      case 'in_progress': return 'В работе';
      case 'completed': return 'Выполнено';
      case 'cancelled': return 'Отменено';
      default: return status;
    }
  };

  const getStockStatusColor = (stockStatus) => {
    switch (stockStatus) {
      case 'low': return '#EF4444';
      case 'warning': return '#F59E0B';
      case 'ok': return '#10B981';
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
        Панель исполнителя
      </h1>

      {/* Уведомления о низких запасах */}
      {stockAlerts && (stockAlerts.alerts.low_stock_count > 0 || stockAlerts.alerts.warning_stock_count > 0) && (
        <div style={{
          background: '#FEF3C7',
          border: '1px solid #F59E0B',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h3 style={{color: '#92400E', fontWeight: '600', marginBottom: '10px'}}>
            ⚠️ Предупреждения о запасах
          </h3>
          {stockAlerts.alerts.low_stock_count > 0 && (
            <p style={{color: '#92400E', marginBottom: '5px'}}>
              🔴 Критически низкий запас: {stockAlerts.alerts.low_stock_count} материалов
            </p>
          )}
          {stockAlerts.alerts.warning_stock_count > 0 && (
            <p style={{color: '#92400E'}}>
              🟡 Требует внимания: {stockAlerts.alerts.warning_stock_count} материалов
            </p>
          )}
        </div>
      )}

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
          Мои заказы ({appointments.length})
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

      {/* Вкладка "Мои заказы" */}
      {activeTab === 'appointments' && (
        <div>
          {appointments.length === 0 ? (
            <div style={{textAlign: 'center', color: '#666', padding: '40px'}}>
              Вам пока не назначены заказы
            </div>
          ) : (
            <div style={{display: 'grid', gap: '20px'}}>
              {appointments.map((appointment) => (
                <div key={appointment.id} style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '20px',
                  background: 'white'
                }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px'}}>
                    <div>
                      <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '5px'}}>
                        {appointment.service_name || 'Услуга не указана'}
                      </h3>
                      <p style={{color: '#666', marginBottom: '5px'}}>
                        Клиент: {appointment.user_name || 'Не указан'}
                      </p>
                      <p style={{color: '#666', marginBottom: '5px'}}>
                        Дата: {new Date(appointment.appointment_date).toLocaleDateString('ru-RU')} в {appointment.appointment_time}
                      </p>
                      <p style={{color: '#666'}}>
                        Цена: {appointment.price || 0}₽
                      </p>
                    </div>
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
                  </div>

                  <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                    {appointment.status === 'booked' && (
                      <>
                        <button
                          onClick={() => handleUpdateAppointmentStatus(appointment.id, 'in_progress')}
                          style={{
                            background: '#F59E0B',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          Начать работу
                        </button>
                      </>
                    )}

                    {appointment.status === 'in_progress' && (
                      <>
                                                <button
                          onClick={() => handleUseMaterials(appointment)}
                          style={{
                            background: '#8B5CF6',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          Использовать материалы
                        </button>
                        <button
                          onClick={() => handleUpdateAppointmentStatus(appointment.id, 'completed')}
                          style={{
                            background: '#10B981',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          Завершить
                        </button>
                        <button
                          onClick={() => handleUpdateAppointmentStatus(appointment.id, 'cancelled')}
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
                          Отменить
                        </button>
                      </>
                    )}

                    {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
                      <span style={{color: '#666', fontSize: '14px', padding: '8px 0'}}>
                        Заказ {appointment.status === 'completed' ? 'выполнен' : 'отменен'}
                      </span>
                    )}
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
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h2 style={{fontSize: '22px', fontWeight: '600'}}>
              Расходные материалы
            </h2>
          </div>

          {/* Сводка по запасам */}
          {stockAlerts && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px',
              marginBottom: '30px'
            }}>
              <div style={{
                background: '#FEE2E2',
                border: '1px solid #FECACA',
                borderRadius: '8px',
                padding: '15px',
                textAlign: 'center'
              }}>
                <div style={{fontSize: '24px', fontWeight: 'bold', color: '#DC2626'}}>
                  {stockAlerts.alerts.low_stock_count}
                </div>
                <div style={{color: '#7F1D1D', fontSize: '14px'}}>Критически низкий запас</div>
              </div>
              <div style={{
                background: '#FEF3C7',
                border: '1px solid #FDE68A',
                borderRadius: '8px',
                padding: '15px',
                textAlign: 'center'
              }}>
                <div style={{fontSize: '24px', fontWeight: 'bold', color: '#D97706'}}>
                  {stockAlerts.alerts.warning_stock_count}
                </div>
                <div style={{color: '#92400E', fontSize: '14px'}}>Требует внимания</div>
              </div>
              <div style={{
                background: '#D1FAE5',
                border: '1px solid #A7F3D0',
                borderRadius: '8px',
                padding: '15px',
                textAlign: 'center'
              }}>
                <div style={{fontSize: '24px', fontWeight: 'bold', color: '#059669'}}>
                  {materials.filter(m => m.stock_status === 'ok').length}
                </div>
                <div style={{color: '#064E3B', fontSize: '14px'}}>В норме</div>
              </div>
            </div>
          )}

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
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                    <div style={{flex: 1}}>
                      <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '5px'}}>
                        {material.name}
                      </h3>
                      {material.description && (
                        <p style={{color: '#666', marginBottom: '10px'}}>
                          {material.description}
                        </p>
                      )}
                      <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
                        <span style={{fontSize: '16px', fontWeight: '500'}}>
                          На складе: <strong>{material.quantity_in_stock} {material.unit}</strong>
                        </span>
                        <span style={{fontSize: '14px', color: '#666'}}>
                          Мин. уровень: {material.min_stock_level} {material.unit}
                        </span>
                        {material.price_per_unit > 0 && (
                          <span style={{fontSize: '14px', color: '#666'}}>
                            Цена: {material.price_per_unit}₽/{material.unit}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{
                      background: getStockStatusColor(material.stock_status),
                      color: 'white',
                      padding: '5px 12px',
                      borderRadius: '15px',
                      fontSize: '14px',
                      fontWeight: '500',
                      whiteSpace: 'nowrap'
                    }}>
                      {material.stock_status === 'low' ? 'Критично' :
                       material.stock_status === 'warning' ? 'Внимание' : 'Норма'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Модальное окно для использования материалов */}
      {showMaterialsModal && selectedAppointment && (
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
            maxWidth: '700px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{fontSize: '20px', fontWeight: '600', marginBottom: '20px'}}>
              Использовать материалы для заказа
            </h3>
            
            <div style={{marginBottom: '20px', padding: '15px', background: '#F3F4F6', borderRadius: '6px'}}>
              <h4 style={{fontWeight: '600', marginBottom: '5px'}}>Заказ:</h4>
              <p>{selectedAppointment.service_name} - {selectedAppointment.user_name}</p>
              <p>{new Date(selectedAppointment.appointment_date).toLocaleDateString('ru-RU')} в {selectedAppointment.appointment_time}</p>
            </div>

            <div style={{marginBottom: '20px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                <h4 style={{fontWeight: '600'}}>Используемые материалы:</h4>
                <button
                  onClick={addMaterialToUse}
                  style={{
                    background: '#10B981',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  + Добавить материал
                </button>
              </div>

              {materialsToUse.length === 0 ? (
                <p style={{color: '#666', fontStyle: 'italic'}}>
                  Материалы не выбраны. Нажмите "Добавить материал" для начала.
                </p>
              ) : (
                <div style={{display: 'grid', gap: '15px'}}>
                  {materialsToUse.map((materialToUse, index) => (
                    <div key={index} style={{
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                      padding: '15px',
                      background: '#F9FAFB'
                    }}>
                      <div style={{display: 'grid', gap: '10px', marginBottom: '10px'}}>
                        <div>
                          <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                            Материал:
                          </label>
                          <select
                            value={materialToUse.material_id}
                            onChange={(e) => updateMaterialToUse(index, 'material_id', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #D1D5DB',
                              borderRadius: '4px'
                            }}
                          >
                            <option value="">Выберите материал</option>
                            {materials.map((material) => (
                              <option key={material.id} value={material.id}>
                                {material.name} (доступно: {material.quantity_in_stock} {material.unit})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                          <div>
                            <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                              Количество:
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={materialToUse.quantity_used}
                              onChange={(e) => updateMaterialToUse(index, 'quantity_used', parseFloat(e.target.value) || 0)}
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
                              onClick={() => removeMaterialToUse(index)}
                              style={{
                                background: '#EF4444',
                                color: 'white',
                                border: 'none',
                                padding: '8px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px'
                              }}
                            >
                              Удалить
                            </button>
                          </div>
                        </div>

                        <div>
                          <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>
                            Заметки (необязательно):
                          </label>
                          <textarea
                            value={materialToUse.notes}
                            onChange={(e) => updateMaterialToUse(index, 'notes', e.target.value)}
                            placeholder="Дополнительные заметки об использовании материала..."
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #D1D5DB',
                              borderRadius: '4px',
                              minHeight: '60px',
                              resize: 'vertical'
                            }}
                          />
                        </div>
                      </div>

                      {/* Предупреждение о недостатке материала */}
                      {materialToUse.material_id && materialToUse.quantity_used > 0 && (() => {
                        const selectedMaterial = materials.find(m => m.id === materialToUse.material_id);
                        if (selectedMaterial && materialToUse.quantity_used > selectedMaterial.quantity_in_stock) {
                          return (
                            <div style={{
                              background: '#FEE2E2',
                              border: '1px solid #FECACA',
                              borderRadius: '4px',
                              padding: '8px',
                              color: '#DC2626',
                              fontSize: '14px'
                            }}>
                              ⚠️ Недостаточно материала на складе! 
                              Доступно: {selectedMaterial.quantity_in_stock} {selectedMaterial.unit}, 
                              требуется: {materialToUse.quantity_used} {selectedMaterial.unit}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </div>

                        <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
              <button
                onClick={() => setShowMaterialsModal(false)}
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
                onClick={submitMaterialUsage}
                disabled={materialsToUse.length === 0 || materialsToUse.some(m => !m.material_id || m.quantity_used <= 0)}
                style={{
                  background: materialsToUse.length === 0 || materialsToUse.some(m => !m.material_id || m.quantity_used <= 0) 
                    ? '#9CA3AF' : '#10B981',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: materialsToUse.length === 0 || materialsToUse.some(m => !m.material_id || m.quantity_used <= 0) 
                    ? 'not-allowed' : 'pointer'
                }}
              >
                Использовать материалы
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Executor;
                
