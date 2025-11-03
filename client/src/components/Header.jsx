import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
    window.location.reload();
  };

  // Проверяем активную страницу
  const isActive = (path) => location.pathname === path;

  return (
    <header className="header">
      <div className="container">
        <div className="nav">
          <Link to="/" className="nav-link logo">
            🚗 Студия детейлинга
          </Link>
          <nav className="nav-links">
            {/* Основная навигация - всегда видна */}
            <Link 
              to="/" 
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
              style={isActive('/') ? {color: '#bfdbfe', fontWeight: 'bold'} : {}}
            >
              Главная
            </Link>
            <Link 
              to="/services" 
              className={`nav-link ${isActive('/services') ? 'active' : ''}`}
              style={isActive('/services') ? {color: '#bfdbfe', fontWeight: 'bold'} : {}}
            >
              Услуги
            </Link>

            {/* Правая часть - авторизация */}
            {user ? (
              <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                {/* Разные ссылки в зависимости от роли пользователя */}
                {user.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                    style={isActive('/admin') ? {color: '#bfdbfe', fontWeight: 'bold'} : {}}
                  >
                    Админ панель
                  </Link>
                )}
                {user.role === 'executor' && (
                  <Link 
                    to="/executor" 
                    className={`nav-link ${isActive('/executor') ? 'active' : ''}`}
                    style={isActive('/executor') ? {color: '#bfdbfe', fontWeight: 'bold'} : {}}
                  >
                    Панель исполнителя
                  </Link>
                )}
                {user.role === 'user' && (
                  <Link 
                    to="/profile" 
                    className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
                    style={isActive('/profile') ? {color: '#bfdbfe', fontWeight: 'bold'} : {}}
                  >
                    Личный кабинет
                  </Link>
                )}
                
                <span className="nav-link">
                  Привет, {user.name}!
                  {user.role === 'admin' && ' (Администратор)'}
                  {user.role === 'executor' && ' (Исполнитель)'}
                </span>
                
                <button 
                  onClick={handleLogout} 
                  className="nav-link"
                  style={{background: 'none', border: 'none', color: 'white', cursor: 'pointer'}}
                >
                  Выйти
                </button>
              </div>
            ) : (
              <div style={{display: 'flex', gap: '16px'}}>
                <Link 
                  to="/login" 
                  className={`nav-link ${isActive('/login') ? 'active' : ''}`}
                  style={isActive('/login') ? {color: '#bfdbfe', fontWeight: 'bold'} : {}}
                >
                  Вход
                </Link>
                <Link 
                  to="/register" 
                  className={`nav-link ${isActive('/register') ? 'active' : ''}`}
                  style={isActive('/register') ? {color: '#bfdbfe', fontWeight: 'bold'} : {}}
                >
                  Регистрация
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
