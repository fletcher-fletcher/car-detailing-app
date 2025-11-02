import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      console.log('🔄 Fetching services...');
      const response = await fetch('http://localhost:5000/api/services');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Services loaded:', data);
      setServices(data);
    } catch (error) {
      console.error('❌ Error fetching services:', error);
      setError('Ошибка загрузки услуг');
    } finally {
      setLoading(false);
    }
  };

  // Ограничиваем длину описания
  const truncateDescription = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="container py-8 text-center">
        <div style={{fontSize: '18px', color: '#666'}}>Загрузка услуг...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8 text-center">
        <div style={{color: 'red', fontSize: '18px'}}>{error}</div>
        <button 
          onClick={fetchServices}
          className="btn"
          style={{marginTop: '16px'}}
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-center mb-8" style={{fontSize: '30px', fontWeight: 'bold'}}>
        Наши услуги
      </h1>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {services.map(service => (
          <div key={service.id} style={{
            background: 'white',
            padding: '24px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            transition: 'transform 0.2s'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#1F2937'
            }}>
              {service.name}
            </h3>
            
            <p style={{
              color: '#6B7280',
              marginBottom: '16px',
              lineHeight: '1.5',
              flex: '1',
              minHeight: '72px'
            }}>
              {truncateDescription(service.description)}
            </p>
            
            <div style={{
              marginBottom: '20px',
              fontSize: '14px',
              color: '#4B5563'
            }}>
              <div style={{marginBottom: '4px'}}>
                <strong>Цена:</strong> {service.price} ₽
              </div>
              <div style={{marginBottom: '4px'}}>
                <strong>Длительность:</strong> {service.duration} мин.
              </div>
              <div>
                <strong>Подготовка:</strong> {service.preparation_days} дней
              </div>
            </div>
            
            <div style={{marginTop: 'auto'}}>
              <Link 
                to={`/booking/${service.id}`} 
                style={{
                  display: 'block',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '12px 20px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  textAlign: 'center',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
              >
                Записаться
              </Link>
            </div>
          </div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center">
          <p style={{color: '#666', fontSize: '18px'}}>Услуги временно недоступны</p>
        </div>
      )}
    </div>
  );
};

export default Services;