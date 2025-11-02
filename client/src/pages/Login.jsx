import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await authAPI.login({
        email: formData.email,
        password: formData.password
      });

      if (result.message === 'Login successful') {
        // Сохраняем токен в localStorage
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        
        alert('Вход выполнен успешно!');
        
        // Перенаправляем на главную страницу
        navigate('/');
      } else {
        alert(result.message || 'Ошибка входа');
      }
    } catch (error) {
      alert('Ошибка соединения с сервером');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Вход в систему</h2>
      
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label className="form-label">Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="form-input"
            required
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Пароль:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="form-input"
            required
            disabled={loading}
          />
        </div>
        
        <button
          type="submit"
          className="btn btn-full mb-4"
          disabled={loading}
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
        
        <p className="text-center">
          Нет аккаунта? <Link to="/register" className="text-link">Зарегистрируйтесь</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;