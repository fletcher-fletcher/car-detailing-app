import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import servicesRoutes from './routes/services.js';
import appointmentsRoutes from './routes/appointments.js';
import adminRoutes from './routes/adminRoutes.js';
import authenticateToken from './middleware/auth.js';
import requireAdmin from './middleware/requireAdmin.js';
import executorRoutes from './routes/executorroutes.js';

dotenv.config();

const app = express();

// Middleware - ИСПРАВЛЕННЫЙ CORS
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173', 
    'https://car-detailing-app.netlify.app'
  ],
  credentials: true
}));

app.use(express.json());

// Проверка подключения к базе данных
console.log('🔗 Database URL:', process.env.DATABASE_URL ? 'Configured' : 'Not configured');

// Основные маршруты
app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/executor', executorRoutes);

// Защищенные маршруты админа
app.use('/api/admin', authenticateToken, requireAdmin, adminRoutes);

// Тестовый маршрут
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
