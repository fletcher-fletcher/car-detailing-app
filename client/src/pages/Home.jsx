import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="container py-12">
      {/* Герой-секция */}
      <div style={{textAlign: 'center', marginBottom: '100px'}}>
        <h1 style={{
          fontSize: '42px', 
          fontWeight: 'bold', 
          lineHeight: '1.2',
          marginBottom: '30px'
        }}>
          Детейлинг Центр Премиум Класса
        </h1>
        <p style={{
          fontSize: '20px', 
          color: '#666', 
          maxWidth: '800px', 
          margin: '0 auto 40px',
          lineHeight: '1.6'
        }}>
          Комплексное преображение и защита вашего автомобиля с гарантией качества
        </p>
        <Link 
          to="/services" 
          className="btn" 
          style={{
            fontSize: '18px', 
            padding: '14px 40px',
            textDecoration: 'none'
          }}
        >
          Выбрать услугу
        </Link>
      </div>

      {/* О компании */}
      <div style={{
        maxWidth: '900px', 
        margin: '0 auto 80px', 
        lineHeight: '1.7'
      }}>
        <h2 style={{
          fontSize: '28px', 
          fontWeight: 'bold', 
          marginBottom: '30px', 
          textAlign: 'center'
        }}>
          О нашем детейлинг центре
        </h2>
        <div style={{fontSize: '16px', color: '#555'}}>
          <p style={{marginBottom: '25px'}}>
            Мы не ограничиваемся только услугами по детейлингу. В нашем детейлинг центре мы оказываем 
            комплекс услуг по оклейке автомобилей виниловыми пленками, винилографией, тонировке и 
            ремонту автомобильных стекол.
          </p>
          <p style={{marginBottom: '25px'}}>
            Именно такой комплексный подход к преображению вашего автомобиля позволяет полностью 
            удовлетворить потребности в детейлинге и стайлинге. Наша команда профессионалов 
            использует только сертифицированные материалы и современное оборудование.
          </p>
          <p style={{marginBottom: '25px'}}>
            Каждому клиенту мы обеспечиваем индивидуальный подход, консультируем по выбору услуг 
            и предоставляем гарантию на все виды работ. Ваш автомобиль заслуживает лучшего ухода, 
            и мы готовы его обеспечить.
          </p>
        </div>
      </div>

      {/* Преимущества */}
      <div style={{
        background: '#f8fafc', 
        padding: '60px 30px', 
        borderRadius: '12px', 
        textAlign: 'center',
        marginBottom: '80px'
      }}>
        <h2 style={{
          fontSize: '28px', 
          fontWeight: 'bold', 
          marginBottom: '20px'
        }}>
          Почему выбирают нас?
        </h2>
        <p style={{
          fontSize: '18px', 
          color: '#666', 
          marginBottom: '40px', 
          maxWidth: '700px', 
          margin: '0 auto 40px'
        }}>
          Более 5 лет мы дарим автомобилям вторую жизнь с помощью современных технологий и европейских материалов
        </p>
        
        <div style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '40px', 
          maxWidth: '1000px', 
          margin: '0 auto'
        }}>
          <div>
            <h3 style={{fontSize: '20px', fontWeight: '600', marginBottom: '15px'}}>🚀 Опытные мастера</h3>
            <p style={{color: '#666', lineHeight: '1.5'}}>Специалисты с опытом работы от 3 лет, регулярно повышающие квалификацию</p>
          </div>
          <div>
            <h3 style={{fontSize: '20px', fontWeight: '600', marginBottom: '15px'}}>🛡️ Гарантия качества</h3>
            <p style={{color: '#666', lineHeight: '1.5'}}>Предоставляем гарантию на все виды работ и используемые материалы</p>
          </div>
          <div>
            <h3 style={{fontSize: '20px', fontWeight: '600', marginBottom: '15px'}}>⚡ Современное оборудование</h3>
            <p style={{color: '#666', lineHeight: '1.5'}}>Работаем на профессиональном оборудовании ведущих мировых брендов</p>
          </div>
          <div>
            <h3 style={{fontSize: '20px', fontWeight: '600', marginBottom: '15px'}}>💎 Премиум материалы</h3>
            <p style={{color: '#666', lineHeight: '1.5'}}>Используем только сертифицированные материалы от проверенных поставщиков</p>
          </div>
        </div>
      </div>

      {/* CTA секция */}
      <div style={{textAlign: 'center'}}>
        <h2 style={{
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '20px'
        }}>
          Готовы преобразить ваш автомобиль?
        </h2>
        <p style={{
          color: '#666', 
          marginBottom: '30px', 
          fontSize: '18px'
        }}>
          Запишитесь на бесплатную консультацию и получите индивидуальное предложение
        </p>
        <div style={{
          display: 'flex', 
          gap: '20px', 
          justifyContent: 'center', 
          flexWrap: 'wrap'
        }}>
          <Link 
            to="/services" 
            className="btn" 
            style={{
              fontSize: '16px', 
              padding: '12px 30px',
              textDecoration: 'none'
            }}
          >
            Смотреть услуги
          </Link>
          <Link 
            to="/register" 
            className="btn" 
            style={{
              fontSize: '16px', 
              padding: '12px 30px', 
              background: '#059669',
              textDecoration: 'none'
            }}
          >
            Записаться онлайн
          </Link>
        </div>
      </div>

      {/* Временные кнопки для тестирования ролей */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: '#f8fafc',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <p style={{margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold', color: '#374151'}}>
          Тестовый доступ:
        </p>

        <button
          onClick={async () => {
            try {
              // Пытаемся войти через API
              const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: 'admin@detailing.ru',
                  password: '123456'
                })
              });

              if (response.ok) {
                const result = await response.json();
                localStorage.setItem('user', JSON.stringify(result.user));
                localStorage.setItem('token', result.token);
                
                alert('Успешный вход как администратор! Переходите на /admin');
                window.location.href = '/admin';
              } else {
                const error = await response.json();
                alert(`Ошибка входа: ${error.message}\n\nИспользуйте:\nEmail: admin@detailing.ru\nПароль: 123456`);
                
                // Показываем альтернативный способ
                if (confirm('Создать тестового администратора?')) {
                  const testAdmin = {
                    id: 'admin-real-id',
                    name: 'Администратор',
                    email: 'admin@detailing.ru',
                    role: 'admin'
                  };
                  
                  localStorage.setItem('user', JSON.stringify(testAdmin));
                  localStorage.setItem('token', 'test-admin-token-real');
                  window.location.href = '/admin';
                }
              }
            } catch (error) {
              alert('Ошибка соединения с сервером. Создаю тестового администратора...');
              
              const testAdmin = {
                id: 'admin-real-id',
                name: 'Администратор',
                email: 'admin@detailing.ru',
                role: 'admin'
              };
              
              localStorage.setItem('user', JSON.stringify(testAdmin));
              localStorage.setItem('token', 'test-admin-token-real');
              window.location.href = '/admin';
            }
          }}
          style={{
            background: '#dc2626',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500'
          }}
        >
          Войти как Админ
        </button>

        <button
          onClick={() => {
            const testExecutor = {
              id: 'executor-test-id',
              name: 'Исполнитель Тест',
              email: 'executor@detailing.ru',
              role: 'executor'
            };
            
            localStorage.setItem('user', JSON.stringify(testExecutor));
            localStorage.setItem('token', 'test-executor-token');
            
            alert('Тестовый исполнитель создан! Переходите на /executor');
            window.location.href = '/executor';
          }}
          style={{
            background: '#059669',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500'
          }}
        >
          Войти как Исполнитель
        </button>

        <button
          onClick={() => {
            const testClient = {
              id: 'client-test-id',
              name: 'Клиент Тест',
              email: 'client@detailing.ru',
              role: 'client'
            };
            
            localStorage.setItem('user', JSON.stringify(testClient));
            localStorage.setItem('token', 'test-client-token');
            
            alert('Тестовый клиент создан!');
            window.location.reload();
          }}
          style={{
            background: '#2563eb',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500'
          }}
        >
          Войти как Клиент
        </button>
      </div>
    </div>
  );
};

export default Home;