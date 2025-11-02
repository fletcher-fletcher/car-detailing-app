import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const Booking = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    appointment_date: '',
    appointment_time: '10:00',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchService();
  }, [serviceId]);

  const fetchService = async () => {
    try {
      console.log('🔄 Loading service with ID:', serviceId);
      const response = await fetch('http://localhost:5000/api/services');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const services = await response.json();
      console.log('✅ All services:', services);
      
      const currentService = services.find(s => s.id === serviceId);
      console.log('🔍 Found service:', currentService);
      
      if (!currentService) {
        setError('Услуга не найдена');
      } else {
        setService(currentService);
      }
    } catch (error) {
      console.error('❌ Error fetching service:', error);
      setError('Ошибка загрузки услуги');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      alert('Пожалуйста, войдите в систему для записи');
      navigate('/login');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('http://localhost:5000/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          service_id: serviceId,
          ...formData
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert('Запись успешно создана!');
        navigate('/services');
      } else {
        alert(result.message || 'Ошибка при создании записи');
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Ошибка соединения с сервером');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Рассчитываем минимальную дату для записи
  const getMinDate = () => {
    if (!service) return '';
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + service.preparation_days);
    return minDate.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="container py-8 text-center">
        <div style={{fontSize: '18px', color: '#666'}}>Загрузка услуги...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8 text-center">
        <div style={{color: 'red', fontSize: '18px', marginBottom: '16px'}}>{error}</div>
        <Link to="/services" className="btn">
          Вернуться к услугам
        </Link>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container py-8 text-center">
        <div style={{color: 'red', fontSize: '18px', marginBottom: '16px'}}>Услуга не найдена</div>
        <Link to="/services" className="btn">
          Вернуться к услугам
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div style={{maxWidth: '600px', margin: '0 auto'}}>
        <h1 style={{fontSize: '28px', fontWeight: 'bold', textAlign: 'center', marginBottom: '30px'}}>
          Запись на услугу
        </h1>

        {/* Информация об услуге */}
        <div className="card" style={{marginBottom: '30px', padding: '20px'}}>
          <h2 style={{fontSize: '22px', fontWeight: '600', marginBottom: '10px'}}>
            {service.name}
          </h2>
          <p style={{color: '#666', marginBottom: '10px'}}>{service.description}</p>
          <div style={{display: 'flex', gap: '20px', fontSize: '14px', color: '#555'}}>
            <div><strong>Цена:</strong> {service.price} ₽</div>
            <div><strong>Длительность:</strong> {service.duration} мин.</div>
            <div><strong>Подготовка:</strong> {service.preparation_days} дн.</div>
          </div>
        </div>

        {/* Форма записи */}
        <form onSubmit={handleSubmit} className="form" style={{background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>
          <div style={{marginBottom: '16px'}}>
            <label style={{display: 'block', color: '#374151', marginBottom: '8px', fontWeight: '500'}}>
              Дата записи:
            </label>
            <input
              type="date"
              name="appointment_date"
              value={formData.appointment_date}
              onChange={handleChange}
              style={{width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px'}}
              min={getMinDate()}
              required
            />
            <small style={{color: '#666', display: 'block', marginTop: '5px'}}>
              * Минимальная дата: {getMinDate()}
            </small>
          </div>

          <div style={{marginBottom: '16px'}}>
            <label style={{display: 'block', color: '#374151', marginBottom: '8px', fontWeight: '500'}}>
              Время записи:
            </label>
            <select
              name="appointment_time"
              value={formData.appointment_time}
              onChange={handleChange}
              style={{width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px'}}
              required
            >
              <option value="09:00">09:00</option>
              <option value="10:00">10:00</option>
              <option value="11:00">11:00</option>
              <option value="12:00">12:00</option>
              <option value="13:00">13:00</option>
              <option value="14:00">14:00</option>
              <option value="15:00">15:00</option>
              <option value="16:00">16:00</option>
              <option value="17:00">17:00</option>
            </select>
          </div>

          <div style={{marginBottom: '24px'}}>
            <label style={{display: 'block', color: '#374151', marginBottom: '8px', fontWeight: '500'}}>
              Дополнительные пожелания:
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              style={{width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px', minHeight: '80px'}}
              placeholder="Любые дополнительные пожелания или комментарии..."
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '16px',
              cursor: submitting || !formData.appointment_date ? 'not-allowed' : 'pointer',
              opacity: submitting || !formData.appointment_date ? 0.6 : 1
            }}
            disabled={submitting || !formData.appointment_date}
          >
            {submitting ? 'Создание записи...' : 'Записаться'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Booking;
