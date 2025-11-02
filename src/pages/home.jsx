import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Добро пожаловать в студию детейлинга!
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-3">🚿 Мойка авто</h3>
          <p className="text-gray-600 mb-4">Комплексная мойка и уборка салона</p>
          <Link to="/register" className="text-blue-600 hover:text-blue-800">
            Записаться →
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-3">🛡️ Оклейка пленкой</h3>
          <p className="text-gray-600 mb-4">Защитные и декоративные пленки</p>
          <Link to="/register" className="text-blue-600 hover:text-blue-800">
            Записаться →
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-3">✨ Детейлинг</h3>
          <p className="text-gray-600 mb-4">Полная подготовка и полировка</p>
          <Link to="/register" className="text-blue-600 hover:text-blue-800">
            Записаться →
          </Link>
        </div>
      </div>

      <div className="text-center">
        <Link 
          to="/register" 
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block"
        >
          Начать запись
        </Link>
      </div>
    </div>
  );
};

export default Home;