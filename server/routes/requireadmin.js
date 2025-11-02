// server/routes/adminRoutes.js
import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Получить всех пользователей
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, phone, role, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить все записи
router.get('/appointments', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.name as user_name, u.phone as user_phone, s.name as service_name
       FROM appointments a
       JOIN users u ON a.user_id = u.id
       JOIN services s ON a.service_id = s.id
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновить статус записи
router.patch('/appointments/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      'UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Запись не найдена' });
    }

    res.json({ message: 'Статус обновлен', appointment: result.rows[0] });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Блокировать дату
router.post('/block-date', async (req, res) => {
  try {
    const { date, reason } = req.body;

    // Создаем таблицу для заблокированных дат если ее нет
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blocked_dates (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        reason TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const result = await pool.query(
      'INSERT INTO blocked_dates (date, reason) VALUES ($1, $2) RETURNING *',
      [date, reason]
    );

    res.status(201).json({ message: 'Дата заблокирована', blocked_date: result.rows[0] });
  } catch (error) {
    console.error('Error blocking date:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;