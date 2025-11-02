import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Services from './pages/Services';
import Booking from './pages/Booking';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import './App.css';
import Executor from './pages/Executor';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/booking/:serviceId" element={<Booking />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
		  <Route path="/executor" element={<Executor />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;