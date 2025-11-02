import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Middleware для проверки роли исполнителя
const requireExecutor = (req, res, next) => {
  if (req.user && req.user.role === 'executor') {
    next();
  } else {
    res.status(403).json({ message: 'Доступ запрещен. Требуется роль исполнителя.' });
  }
};

// Применяем middleware ко всем маршрутам
router.use(requireExecutor);

// ==================== ЗАПИСИ ИСПОЛНИТЕЛЯ ====================

// Получить все записи исполнителя
router.get('/appointments', async (req, res) => {
  try {
    const { status } = req.query;
    const executor_id = req.user.id;
    
    let query = `
      SELECT a.*, 
             u.name as user_name, u.phone as user_phone, u.email as user_email,
             s.name as service_name, s.price, s.duration, s.category, s.description as service_description
      FROM appointments a
      JOIN users u ON a.user_id = u.id
      JOIN services s ON a.service_id = s.id
      WHERE a.executor_id = $1
    `;
    
    const params = [executor_id];
    
    if (status) {
      query += ` AND a.status = $2`;
      params.push(status);
    }
    
    query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching executor appointments:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить сегодняшние записи исполнителя
router.get('/appointments/today', async (req, res) => {
  try {
    const executor_id = req.user.id;
    
    const result = await pool.query(
      `SELECT a.*, 
              u.name as user_name, u.phone as user_phone,
              s.name as service_name, s.duration, s.category
       FROM appointments a
       JOIN users u ON a.user_id = u.id
       JOIN services s ON a.service_id = s.id
       WHERE a.executor_id = $1 
       AND a.appointment_date = CURRENT_DATE
       AND a.status = 'booked'
       ORDER BY a.appointment_time ASC`,
      [executor_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching today appointments:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновить статус записи (выполнено/отменено)
router.patch('/appointments/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const executor_id = req.user.id;

    const validStatuses = ['completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Неверный статус. Допустимые значения: completed, cancelled' });
    }

    // Проверяем, что запись принадлежит исполнителю
    const appointmentCheck = await pool.query(
      'SELECT id FROM appointments WHERE id = $1 AND executor_id = $2',
      [id, executor_id]
    );

    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Запись не найдена или у вас нет прав для ее изменения' });
    }

    const result = await pool.query(
      'UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    res.json({ message: `Запись ${status === 'completed' ? 'выполнена' : 'отменена'}`, appointment: result.rows[0] });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Добавить заметку к записи
router.patch('/appointments/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const executor_id = req.user.id;

    // Проверяем, что запись принадлежит исполнителю
    const appointmentCheck = await pool.query(
      'SELECT id FROM appointments WHERE id = $1 AND executor_id = $2',
      [id, executor_id]
    );

    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Запись не найдена или у вас нет прав для ее изменения' });
    }

    const result = await pool.query(
      'UPDATE appointments SET notes = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [notes, id]
    );

    res.json({ message: 'Заметка добавлена', appointment: result.rows[0] });
  } catch (error) {
    console.error('Error adding appointment notes:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ==================== СКЛАД И МАТЕРИАЛЫ ДЛЯ ИСПОЛНИТЕЛЯ ====================

// Получить все материалы
router.get('/materials', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM materials ORDER BY name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновить количество материала (расход)
router.patch('/materials/:id/quantity', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity_used } = req.body;

    if (!quantity_used || quantity_used <= 0) {
      return res.status(400).json({ message: 'Количество должно быть положительным числом' });
    }

    const result = await pool.query(
      'UPDATE materials SET quantity = quantity - $1 WHERE id = $2 AND quantity >= $1 RETURNING *',
      [quantity_used, id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Недостаточно материала на складе или материал не найден' });
    }

    // Записываем историю расхода
    await pool.query(
      `INSERT INTO material_usage (material_id, executor_id, quantity_used, notes) 
       VALUES ($1, $2, $3, $4)`,
      [id, req.user.id, quantity_used, req.body.notes || 'Расход исполнителем']
    );

    res.json({ message: 'Количество материала обновлено', material: result.rows[0] });
  } catch (error) {
    console.error('Error updating material quantity:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ==================== СТАТИСТИКА ИСПОЛНИТЕЛЯ ====================

// Получить статистику исполнителя
router.get('/stats', async (req, res) => {
  try {
    const executor_id = req.user.id;

    const [todayStats, weekStats, totalStats] = await Promise.all([
      // Статистика за сегодня
      pool.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
         FROM appointments 
         WHERE executor_id = $1 AND appointment_date = CURRENT_DATE`,
        [executor_id]
      ),
      
      // Статистика за неделю
      pool.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
         FROM appointments 
         WHERE executor_id = $1 AND appointment_date >= CURRENT_DATE - INTERVAL '7 days'`,
        [executor_id]
      ),
      
      // Общая статистика
      pool.query(
        `SELECT 
          COUNT(*) as total_appointments,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_appointments,
          COALESCE(SUM(s.price) FILTER (WHERE a.status = 'completed'), 0) as total_revenue
         FROM appointments a
         JOIN services s ON a.service_id = s.id
         WHERE a.executor_id = $1`,
        [executor_id]
      )
    ]);

    res.json({
      today: {
        total: parseInt(todayStats.rows[0].total),
        completed: parseInt(todayStats.rows[0].completed),
        cancelled: parseInt(todayStats.rows[0].cancelled)
      },
      week: {
        total: parseInt(weekStats.rows[0].total),
        completed: parseInt(weekStats.rows[0].completed),
        cancelled: parseInt(weekStats.rows[0].cancelled)
      },
      total: {
        appointments: parseInt(totalStats.rows[0].total_appointments),
        completed: parseInt(totalStats.rows[0].completed_appointments),
        revenue: parseFloat(totalStats.rows[0].total_revenue)
      }
    });
  } catch (error) {
    console.error('Error fetching executor stats:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ==================== ПРОФИЛЬ ИСПОЛНИТЕЛЯ ====================

// Получить профиль исполнителя
router.get('/profile', async (req, res) => {
  try {
    const executor_id = req.user.id;

    const result = await pool.query(
      `SELECT id, name, email, phone, created_at,
              (SELECT COUNT(*) FROM appointments WHERE executor_id = $1) as total_appointments,
              (SELECT COUNT(*) FROM appointments WHERE executor_id = $1 AND status = 'completed') as completed_appointments
       FROM users 
       WHERE id = $1`,
      [executor_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Профиль не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching executor profile:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновить профиль исполнителя
router.put('/profile', async (req, res) => {
  try {
    const executor_id = req.user.id;
    const { name, phone } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET name=$1, phone=$2 
       WHERE id=$3 
       RETURNING id, name, email, phone, created_at`,
      [name, phone, executor_id]
    );

    res.json({ message: 'Профиль обновлен', profile: result.rows[0] });
  } catch (error) {
    console.error('Error updating executor profile:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;