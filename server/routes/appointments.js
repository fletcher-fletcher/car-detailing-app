import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Создать новую запись
router.post('/', async (req, res) => {
  try {
    const { user_id, service_id, appointment_date, appointment_time, notes } = req.body;

    console.log('📅 Creating appointment:', { user_id, service_id, appointment_date, appointment_time });

    // Проверяем что услуга существует
    const serviceResult = await pool.query(
      'SELECT * FROM services WHERE id = $1 AND is_active = true',
      [service_id]
    );

    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ message: 'Услуга не найдена' });
    }

    const service = serviceResult.rows[0];

    // Проверяем что дата соответствует preparation_days
    const appointmentDate = new Date(appointment_date);
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + service.preparation_days);

    if (appointmentDate < minDate) {
      return res.status(400).json({ 
        message: `На данную услугу можно записаться не ранее ${minDate.toLocaleDateString('ru-RU')}` 
      });
    }

// 🔴 3. ПРОВЕРКА: не заблокирована ли дата?
    const blockedCheck = await pool.query(
      'SELECT 1 FROM blocked_dates WHERE date = $1',
      [appointment_date] // передаём как строку 'YYYY-MM-DD'
    );
    if (blockedCheck.rows.length > 0) {
      return res.status(400).json({
        message: `Запись на ${appointment_date} невозможна: дата заблокирована администратором`
      });
    }

    // Создаем запись
    const result = await pool.query(
      `INSERT INTO appointments (user_id, service_id, appointment_date, appointment_time, notes) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [user_id, service_id, appointment_date, appointment_time, notes || '']
    );

    console.log('✅ Appointment created:', result.rows[0]);

    res.status(201).json({
      message: 'Запись успешно создана',
      appointment: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error creating appointment:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить записи пользователя
router.get('/user/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    console.log('📋 Fetching appointments for user:', user_id);

    const result = await pool.query(
      `SELECT a.*, s.name as service_name, s.price, s.duration
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.user_id = $1
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [user_id]
    );

    console.log(`✅ Found ${result.rows.length} appointments for user`);

    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching user appointments:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/executor/:executor_id', async (req, res) => {
  try {
    const { executor_id } = req.params;

    const result = await pool.query(
      `SELECT a.*, u.name as user_name, u.phone as user_phone, s.name as service_name, s.price
       FROM appointments a
       JOIN users u ON a.user_id = u.id
       JOIN services s ON a.service_id = s.id
       WHERE a.executor_id = $1 OR a.executor_id IS NULL
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [executor_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching executor appointments:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Отменить запись
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('❌ Cancelling appointment:', id);

    const result = await pool.query(
      'UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *',
      ['cancelled', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Запись не найдена' });
    }

    console.log('✅ Appointment cancelled:', result.rows[0]);

    res.json({ message: 'Запись отменена', appointment: result.rows[0] });
  } catch (error) {
    console.error('❌ Error cancelling appointment:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;