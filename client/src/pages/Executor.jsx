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
  const [materialsLoading, setMaterialsLoading] = useState(false);
  
  // Сортировка заказов (как в админке)
  const [appointmentsSort, setAppointmentsSort] = useState('date_asc');
  
  // Для работы с заказами
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  
  // Для работы с материалами
  const [materialsToUse, setMaterialsToUse] = useState([]);
  const [usedMaterialsData, setUsedMaterialsData] = useState({}); // Используемые материалы по заказам

  // Функция для надежного преобразования в целое число
  const toInt = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    const num = parseInt(value);
    return isNaN(num) ? 0 : num;
  };

  // Функция для надежного преобразования в число с плавающей точкой
  const toFloat = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // Функции для определения статуса запасов (аналогичные админским)
  const getStockStatusColor = (material) => {
    if (toInt(material.quantity_in_stock) <= toInt(material.min_stock_level)) return '#EF4444';
    if (toInt(material.quantity_in_stock) <= toInt(material.min_stock_level) * 1.5) return '#F59E0B';
    return '#10B981';
  };

  const getStockStatusText = (material) => {
    if (toInt(material.quantity_in_stock) <= toInt(material.min_stock_level)) return 'Критично низкий';
    if (toInt(material.quantity_in_stock) <= toInt(material.min_stock_level) * 1.5) return 'Требует внимания';
    return 'В норме';
  };

  // Функция для сортировки заказов (как в админке)
  const getSortedAppointments = () => {
    const appointmentsCopy = [...appointments];
    
    switch (appointmentsSort) {
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
      default:
        return appointmentsCopy;
    }
  };

  // Функция для форматирования даты в российском формате
  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  useEffect(() => {
    checkExecutorAccess();
  }, []);

  useEffect(() => {
    if (activeTab === 'appointments') {
      fetchAppointments();
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

  const fetchAppointments = async () => {
    try {
      console.log('=== Загружаем заказы ===');
      const data = await executorAPI.getAppointments();
      console.log('Загружены заказы:', data);
      setAppointments(data);
      
      // Загружаем детали для каждого заказа (включая использованные материалы)
      const usedMaterials = {};
      for (const appointment of data) {
        try {
          const details = await executorAPI.getAppointmentDetails(appointment.id);
          if (details.used_materials && details.used_materials.length > 0) {
            usedMaterials[appointment.id] = details.used_materials;
          }
        } catch (error) {
          console.error(`Ошибка загрузки деталей для заказа ${appointment.id}:`, error);
        }
      }
      setUsedMaterialsData(usedMaterials);
      
    } catch (error) {
      console.error('Error fetching appointments:', error);
      alert('Ошибка загрузки заказов: ' + error.message);
    }
  };

  const fetchMaterials = async () => {
    setMaterialsLoading(true);
    try {
      console.log('Начинаем загрузку материалов...');
      
      const data = await executorAPI.getMaterials();
      console.log('Загружены материалы:', data);
      
      let materialsData = [];
      
      if (Array.isArray(data)) {
        materialsData = data;
      } else if (data && Array.isArray(data.materials)) {
        materialsData = data.materials;
      } else if (data && data.data && Array.isArray(data.data)) {
        materialsData = data.data;
      } else {
        materialsData = [];
      }
      
      setMaterials(materialsData);
      
      // Загружаем алерты если нужно
      try {
        const alertsData = await executorAPI.getStockAlerts();
        setStockAlerts(alertsData);
      } catch (alertError) {
        console.warn('Не удалось загрузить алерты:', alertError);
      }
      
    } catch (error) {
      console.error('Error fetching materials:', error);
      alert('Ошибка загрузки материалов: ' + error.message);
      setMaterials([]);
    } finally {
      setMaterialsLoading(false);
    }
  };

  const handleEditAppointment = async (appointment) => {
    try {
      const details = await executorAPI.getAppointmentDetails(appointment.id);
      setAppointmentDetails(details);
      setSelectedAppointment(appointment);
      setShowAppointmentModal(true);
    } catch (error) {
      console.error('Error fetching appointment details:', error);
      alert('Ошибка загрузки деталей заказа');
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот заказ?')) return;
    
    try {
      await executorAPI.deleteAppointment(appointmentId);
      alert('Заказ удален');
      fetchAppointments();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Ошибка удаления заказа');
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId, status) => {
    try {
      await executorAPI.updateAppointment(appointmentId, { status });
      alert('Статус обновлен');
      fetchAppointments();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Ошибка обновления статуса');
    }
  };

  const handleUseMaterials = async (appointment) => {
    try {
      console.log('Загружаем материалы для модального окна...');
      
      // Загружаем материалы если они еще не загружены или массив пустой
      if (materials.length === 0) {
        console.log('Материалы не загружены, загружаем...');
        await fetchMaterials();
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
      fetchMaterials();
      fetchAppointments(); // Обновляем заказы, чтобы показать использованные материалы
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
      {stockAlerts && (stockAlerts.alerts?.low_stock_count > 0 || stockAlerts.alerts?.warning_stock_count > 0) && (
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
            padding: '12px 24px',
            border: 'none',
            background: activeTab === 'appointments' ? '#2563eb' : 'transparent',
            color: activeTab === 'appointments' ? 'white' : '#6B7280',
            cursor: 'pointer',
            borderRadius: '8px 8px 0 0',
            fontWeight: activeTab === 'appointments' ? '600' : 'normal'
          }}
        >
          📅 Мои заказы ({appointments.length})
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: activeTab === 'materials' ? '#2563eb' : 'transparent',
            color: activeTab === 'materials' ? 'white' : '#6B7280',
            cursor: 'pointer',
            borderRadius: '8px 8px 0 0',
            fontWeight: activeTab === 'materials' ? '600' : 'normal'
          }}
        >
          📦 Склад материалов ({materials.length})
        </button>
      </div>

      {/* ==================== ВКЛАДКА МОИ ЗАКАЗЫ ==================== */}
      {activeTab === 'appointments' && (
        <div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h2 style={{fontSize: '22px', fontWeight: '600'}}>
              Мои заказы
            </h2>
          </div>

          {/* Сортировка заказов (как в админке) */}
          <div style={{
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px'
          }}>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px'}}>
              <div>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>Сортировка:</label>
                <select
                  value={appointmentsSort}
                  onChange={(e) => setAppointmentsSort(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px'
                  }}
                >
                  <option value="date_asc">📅 Ближайшие даты</option>
                  <option value="date_desc">📅 Дальние даты</option>
                  <option value="created_desc">🆕 Сначала новые</option>
                  <option value="created_asc">🕐 Сначала старые</option>
                </select>
              </div>
            </div>
          </div>
          
          {appointments.length === 0 ? (
            <div style={{textAlign: 'center', color: '#666', padding: '40px'}}>
              Вам пока не назначены заказы
            </div>
          ) : (
            <div style={{display: 'grid', gap: '20px'}}>
              {getSortedAppointments().map((appointment) => (
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
                        Дата: {formatDate(appointment.appointment_date)} в {appointment.appointment_time}
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

                  {appointment.notes && (
                    <div style={{
                      background: '#F3F4F6',
                      padding: '10px',
                      borderRadius: '6px',
                      marginBottom: '15px'
                    }}>
                      <strong>Заметки:</strong> {appointment.notes}
                    </div>
                  )}

                  {/* Показываем использованные материалы */}
                  {usedMaterialsData[appointment.id] && usedMaterialsData[appointment.id].length > 0 && (
                    <div style={{
                      background: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      padding: '10px',
                      borderRadius: '6px',
                      marginBottom: '15px'
                    }}>
                      <h4 style={{fontWeight: '600', marginBottom: '10px', color: '#059669'}}>
                        📦 Использованные материалы:
                      </h4>
                      <div style={{display: 'grid', gap: '5px'}}>
                        {usedMaterialsData[appointment.id].map((usage) => (
                          <div key={usage.id} style={{
                            display: 'flex', 
                            justifyContent: 'space-between',
                            padding: '5px 0',
                            fontSize: '14px'
                          }}>
                            <span>{usage.material_name}</span>
                            <span style={{fontWeight: '500'}}>
                              {usage.quantity_used} {usage.unit}
                              {usage.total_cost && ` (${usage.total_cost}₽)`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
                        <button
                          onClick={() => handleEditAppointment(appointment)}
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
                          onClick={() => handleDeleteAppointment(appointment.id)}
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

      {/* ==================== ВКЛАДКА СКЛАД МАТЕРИАЛОВ ==================== */}
      {activeTab === 'materials' && (
        <div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
            <h2 style={{fontSize: '22px', fontWeight: '600'}}>Склад материалов</h2>
          </div>

          {/* Уведомления о низких запасах (как в админке) */}
          {materials.some(m => toInt(m.quantity_in_stock) <= toInt(m.min_stock_level)) && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <h3 style={{color: '#DC2626', fontWeight: '600', marginBottom: '10px'}}>
                ⚠️ Внимание: низкий запас материалов
              </h3>
              <p style={{color: '#DC2626'}}>
                Некоторые материалы имеют критически низкий запас. Сообщите администратору.
              </p>
            </div>
          )}

          {/* Список материалов */}
          {materialsLoading ? (
            <div style={{textAlign: 'center', color: '#666', padding: '40px'}}>
              Загрузка материалов...
            </div>
          ) : materials.length === 0 ? (
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
                      <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '8px'}}>
                        {material.name}
                      </h3>
                      {material.description && (
                        <p style={{color: '#666', marginBottom: '12px'}}>
                          {material.description}
                        </p>
                      )}
                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', fontSize: '14px'}}>
                        <p><strong>Остаток:</strong> {toInt(material.quantity_in_stock)} {material.unit}</p>
                        <p><strong>Мин. уровень:</strong> {toInt(material.min_stock_level)} {material.unit}</p>
                        <p><strong>Цена:</strong> {toFloat(material.price_per_unit)}₽/{material.unit}</p>
                        {material.supplier && <p><strong>Поставщик:</strong> {material.supplier}</p>}
                      </div>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '10px'}}>
                      <div style={{
                        background: getStockStatusColor(material),
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {getStockStatusText(material)}
                      </div>
                      {/* У исполнителя убраны все кнопки управления */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Модальное окно для редактирования заказа */}
      {showAppointmentModal && selectedAppointment && appointmentDetails && (
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
              Детали заказа
            </h3>
            
            <div style={{marginBottom: '20px'}}>
              <h4 style={{fontWeight: '600', marginBottom: '10px'}}>Информация о заказе:</h4>
              <p><strong>Услуга:</strong> {appointmentDetails.appointment.service_name}</p>
              <p><strong>Клиент:</strong> {appointmentDetails.appointment.user_name}</p>
              <p><strong>Телефон:</strong> {appointmentDetails.appointment.user_phone}</p>
              <p><strong>Email:</strong> {appointmentDetails.appointment.user_email}</p>
              <p><strong>Дата:</strong> {formatDate(appointmentDetails.appointment.appointment_date)}</p>
              <p><strong>Время:</strong> {appointmentDetails.appointment.appointment_time}</p>
              <p><strong>Цена:</strong> {appointmentDetails.appointment.price}₽</p>
            </div>

            {appointmentDetails.required_materials && appointmentDetails.required_materials.length > 0 && (
              <div style={{marginBottom: '20px'}}>
                <h4 style={{fontWeight: '600', marginBottom: '10px'}}>Необходимые материалы:</h4>
                {appointmentDetails.required_materials.map((material) => (
                  <div key={material.id} style={{
                    padding: '10px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    marginBottom: '10px',
                    background: material.available ? '#F0FDF4' : '#FEF2F2'
                  }}>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                      <span>{material.name}</span>
                      <span>
                        {material.quantity_required} {material.unit}
                        {material.available ? ' ✅' : ' ❌'}
                      </span>
                    </div>
                    {!material.available && (
                      <div style={{color: '#DC2626', fontSize: '12px', marginTop: '5px'}}>
                        Недостаточно на складе (доступно: {material.quantity_in_stock})
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {appointmentDetails.used_materials && appointmentDetails.used_materials.length > 0 && (
              <div style={{marginBottom: '20px'}}>
                <h4 style={{fontWeight: '600', marginBottom: '10px'}}>Использованные материалы:</h4>
                {appointmentDetails.used_materials.map((usage) => (
                  <div key={usage.id} style={{
                    padding: '10px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    marginBottom: '10px',
                    background: '#F9FAFB'
                  }}>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                      <span>{usage.material_name}</span>
                      <span>{usage.quantity_used} {usage.unit}</span>
                    </div>
                    <div style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
                      Использовано: {new Date(usage.used_at).toLocaleString('ru-RU')}
                    </div>
                    {usage.notes && (
                      <div style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
                        Заметки: {usage.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

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
                Закрыть
              </button>
            </div>
          </div>
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
              <p>{formatDate(selectedAppointment.appointment_date)} в {selectedAppointment.appointment_time}</p>
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
                                {material.name} (на складе: {material.quantity_in_stock} {material.unit})
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
