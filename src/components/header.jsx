import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">
            🚗 Студия Детейлинга
          </Link>
          <nav className="space-x-4">
            <Link to="/" className="hover:text-blue-200">Главная</Link>
            <Link to="/login" className="hover:text-blue-200">Вход</Link>
            <Link to="/register" className="hover:text-blue-200">Регистрация</Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;