import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
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
    
    if (formData.password !== formData.confirmPassword) {
      alert('Пароли не совпадают');
      return;
    }

    if (formData.password.length < 6) {
      alert('Пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);

    try {
      const result = await authAPI.register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });

      if (result.message === 'User created successfully') {
        alert('Регистрация успешна! Теперь вы можете войти.');
        navigate('/login');
      } else {
        alert(result.message || 'Ошибка регистрации');
      }
    } catch (error) {
      alert('Ошибка соединения с сервером');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Регистрация</h2>
      
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label className="form-label">Имя:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="form-input"
            required
            disabled={loading}
          />
        </div>
        
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
          <label className="form-label">Телефон:</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
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
            minLength="6"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Подтвердите пароль:</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
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
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
        
        <p className="text-center">
          Уже есть аккаунт? <Link to="/login" className="text-link">Войдите</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;