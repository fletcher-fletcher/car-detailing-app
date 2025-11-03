import express from 'express';
import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// ==================== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ====================

// Получить всех пользователей с фильтрацией
router.get('/users', async (req, res) => {
  try {
    const { role, search, limit = 50, offset = 0 } = req.query;

    let whereClause = 'WHERE 1=1';
    let params = [];
    let paramIndex = 1;

    if (role) {
      whereClause += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const result = await pool.query(
      `SELECT id, name, email, phone, role, created_at, updated_at
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    );

    res.json({
      users: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создать пользователя
router.post('/users', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Все поля обязательны для заполнения' });
    }

    const validRoles = ['admin', 'executor', 'client'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Неверная роль пользователя' });
    }

    // Проверяем уникальность email
    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, phone, password, role)
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, name, email, phone, role, created_at`,
      [name, email, phone, hashedPassword, role]
    );

    res.status(201).json({ message: 'Пользователь создан', user: result.rows[0] });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновить пользователя
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, password } = req.body;

    // Проверяем существование пользователя
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Проверяем уникальность email (если изменяется)
    if (email) {
      const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Email уже используется другим пользователем' });
      }
    }

    let updateQuery = `UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), phone = COALESCE($3, phone), role = COALESCE($4, role)`;
    let params = [name, email, phone, role];
    let paramIndex = 5;

    // Если передан пароль, добавляем его в обновление
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += `, password = $${paramIndex}`;
      params.push(hashedPassword);
      paramIndex++;
    }

    updateQuery += `, updated_at = NOW() WHERE id = $${paramIndex} RETURNING id, name, email, phone, role, created_at, updated_at`;
    params.push(id);

    const result = await pool.query(updateQuery, params);

    res.json({ message: 'Пользователь обновлен', user: result.rows[0] });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удалить пользователя
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Проверяем, есть ли активные заказы у пользователя
    const appointmentsCheck = await pool.query(
      "SELECT COUNT(*) as count FROM appointments WHERE (user_id = $1 OR executor_id = $1) AND status NOT IN ('completed', 'cancelled')",
      [id]
    );

    if (parseInt(appointmentsCheck.rows[0].count) > 0) {
      return res.status(400).json({ message: 'Нельзя удалить пользователя с активными заказами' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'Пользователь удален' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ==================== УПРАВЛЕНИЕ УСЛУГАМИ ====================

// Получить все услуги
router.get('/services', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM services ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создать услугу
router.post('/services', async (req, res) => {
  try {
    const { name, description, price, duration, category, preparation_days, is_active } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Название услуги обязательно' });
    }

    const result = await pool.query(
      `INSERT INTO services (name, description, price, duration, category, preparation_days, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [name, description, price || 0, duration || 60, category, preparation_days || 0, is_active !== false]
    );

    res.status(201).json({ message: 'Услуга создана', service: result.rows[0] });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновить услугу
router.put('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, duration, category, preparation_days, is_active } = req.body;

    const result = await pool.query(
      `UPDATE services 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           duration = COALESCE($4, duration),
           category = COALESCE($5, category),
           preparation_days = COALESCE($6, preparation_days),
           is_active = COALESCE($7, is_active),
           updated_at = NOW()
       WHERE id = $8 
       RETURNING *`,
      [name, description, price, duration, category, preparation_days, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Услуга не найдена' });
    }

    res.json({ message: 'Услуга обновлена', service: result.rows[0] });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удалить услугу
router.delete('/services/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Проверяем, есть ли активные записи на эту услугу
    const appointmentsCheck = await pool.query(
      "SELECT COUNT(*) as count FROM appointments WHERE service_id = $1 AND status NOT IN ('completed', 'cancelled')",
      [id]
    );

    if (parseInt(appointmentsCheck.rows[0].count) > 0) {
      return res.status(400).json({ message: 'Нельзя удалить услугу с активными записями' });
    }

    await pool.query('DELETE FROM services WHERE id = $1', [id]);
    res.json({ message: 'Услуга удалена' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ==================== УПРАВЛЕНИЕ ЗАПИСЯМИ ====================

// Получить все записи с фильтрацией
router.get('/appointments', async (req, res) => {
  try {
    const { status, executor_id, user_id, service_id, date_from, date_to, limit = 50, offset = 0 } = req.query;

    let whereClause = 'WHERE 1=1';
    let params = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (executor_id) {
      whereClause += ` AND a.executor_id = $${paramIndex}`;
      params.push(executor_id);
      paramIndex++;
    }

    if (user_id) {
      whereClause += ` AND a.user_id = $${paramIndex}`;
      params.push(user_id);
      paramIndex++;
    }

    if (service_id) {
      whereClause += ` AND a.service_id = $${paramIndex}`;
      params.push(service_id);
      paramIndex++;
    }

    if (date_from) {
      whereClause += ` AND a.appointment_date >= $${paramIndex}`;
      params.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      whereClause += ` AND a.appointment_date <= $${paramIndex}`;
      params.push(date_to);
      paramIndex++;
    }

    const result = await pool.query(
      `SELECT a.*, 
              u.name as user_name, u.email as user_email, u.phone as user_phone,
              e.name as executor_name,
              s.name as service_name, s.price, s.duration
       FROM appointments a
       JOIN users u ON a.user_id = u.id
       LEFT JOIN users e ON a.executor_id = e.id
       JOIN services s ON a.service_id = s.id
       ${whereClause}
       ORDER BY a.appointment_date DESC, a.appointment_time DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM appointments a ${whereClause}`,
      params
    );

    res.json({
      appointments: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновить запись
router.put('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { executor_id, appointment_date, appointment_time, status, notes } = req.body;

    // Проверяем существование записи
    const appointmentCheck = await pool.query('SELECT id FROM appointments WHERE id = $1', [id]);
    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Запись не найдена' });
    }

    // Если назначается исполнитель, проверяем что он существует и имеет правильную роль
    if (executor_id) {
      const executorCheck = await pool.query('SELECT id FROM users WHERE id = $1 AND role = $2', [executor_id, 'executor']);
      if (executorCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Указанный исполнитель не найден или не имеет роли исполнителя' });
      }
    }

    const result = await pool.query(
      `UPDATE appointments 
       SET executor_id = COALESCE($1, executor_id),
           appointment_date = COALESCE($2, appointment_date),
           appointment_time = COALESCE($3, appointment_time),
           status = COALESCE($4, status),
           notes = COALESCE($5, notes),
           updated_at = NOW()
       WHERE id = $6 
       RETURNING *`,
      [executor_id, appointment_date, appointment_time, status, notes, id]
    );

    res.json({ message: 'Запись обновлена', appointment: result.rows[0] });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удалить запись
router.delete('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Проверяем существование записи
    const appointmentCheck = await pool.query('SELECT id, status FROM appointments WHERE id = $1', [id]);
    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Запись не найдена' });
    }

    // Возвращаем материалы на склад если они были использованы
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Получаем использованные материалы
      const usedMaterials = await client.query(
        'SELECT material_id, quantity_used FROM material_usage WHERE appointment_id = $1',
        [id]
      );

      // Возвращаем материалы на склад
      for (const usage of usedMaterials.rows) {
        await client.query(
          'UPDATE materials SET quantity_in_stock = quantity_in_stock + $1 WHERE id = $2',
          [usage.quantity_used, usage.material_id]
        );
      }

      // Удаляем записи использования материалов
      await client.query('DELETE FROM material_usage WHERE appointment_id = $1', [id]);

      // Удаляем запись
      await client.query('DELETE FROM appointments WHERE id = $1', [id]);

      await client.query('COMMIT');
      res.json({ message: 'Запись удалена, материалы возвращены на склад' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Назначить исполнителя на запись
router.patch('/appointments/:id/assign-executor', async (req, res) => {
  try {
    const { id } = req.params;
    const { executor_id } = req.body;

    // Проверяем, что исполнитель существует и имеет нужную роль
    const executorCheck = await pool.query(
      'SELECT id, name FROM users WHERE id = $1 AND role = $2',
      [executor_id, 'executor']
    );

    if (executorCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Исполнитель не найден' });
    }

    const result = await pool.query(
      'UPDATE appointments SET executor_id = $1 WHERE id = $2 RETURNING *',
      [executor_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Запись не найдена' });
    }

    res.json({ 
      message: 'Исполнитель назначен', 
      appointment: result.rows[0],
      executor: executorCheck.rows[0]
    });
  } catch (error) {
    console.error('Error assigning executor:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Перенести запись
router.patch('/appointments/:id/reschedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { appointment_date, appointment_time } = req.body;

    // Валидация даты
    const newDate = new Date(appointment_date);
    const today = new Date();
    
    if (newDate < today) {
      return res.status(400).json({ message: 'Нельзя перенести запись на прошедшую дату' });
    }

    const result = await pool.query(
      'UPDATE appointments SET appointment_date = $1, appointment_time = $2 WHERE id = $3 RETURNING *',
      [appointment_date, appointment_time, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Запись не найдена' });
    }

    res.json({ message: 'Запись перенесена', appointment: result.rows[0] });
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ==================== ИСПОЛНИТЕЛИ ====================

// Получить всех исполнителей
router.get('/executors', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, phone FROM users WHERE role = $1 ORDER BY name',
      ['executor']
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching executors:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ==================== УПРАВЛЕНИЕ МАТЕРИАЛАМИ ====================

// Получить все материалы с фильтрацией
router.get('/materials', async (req, res) => {
  try {
    const { search, low_stock_only, limit = 100, offset = 0 } = req.query;

    let whereClause = 'WHERE 1=1';
    let params = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (low_stock_only === 'true') {
      whereClause += ` AND quantity_in_stock <= min_stock_level`;
    }

    const result = await pool.query(
      `SELECT *, 
              CASE 
                WHEN quantity_in_stock <= min_stock_level THEN 'low'
                WHEN quantity_in_stock <= min_stock_level * 1.5 THEN 'warning'
                ELSE 'ok'
              END as stock_status
       FROM materials
       ${whereClause}
       ORDER BY name
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM materials ${whereClause}`,
      params
    );

    res.json({
      materials: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создать новый материал
router.post('/materials', async (req, res) => {
  try {
    const { name, description, unit, quantity_in_stock, min_stock_level, price_per_unit, supplier } = req.body;

    if (!name || !unit) {
      return res.status(400).json({ message: 'Название и единица измерения обязательны' });
    }

    const result = await pool.query(
      `INSERT INTO materials (name, description, unit, quantity_in_stock, min_stock_level, price_per_unit, supplier)
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [name, description, unit, quantity_in_stock || 0, min_stock_level || 0, price_per_unit || 0, supplier]
    );

    res.status(201).json({ message: 'Материал создан', material: result.rows[0] });
  } catch (error) {
    console.error('Error creating material:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Редактировать материал
router.put('/materials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, unit, quantity_in_stock, min_stock_level, price_per_unit, supplier, is_active } = req.body;

    const result = await pool.query(
      `UPDATE materials 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           unit = COALESCE($3, unit),
           quantity_in_stock = COALESCE($4, quantity_in_stock),
           min_stock_level = COALESCE($5, min_stock_level),
           price_per_unit = COALESCE($6, price_per_unit),
           supplier = COALESCE($7, supplier),
           is_active = COALESCE($8, is_active),
           updated_at = NOW()
       WHERE id = $9 
       RETURNING *`,
      [name, description, unit, quantity_in_stock, min_stock_level, price_per_unit, supplier, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Материал не найден' });
    }

    res.json({ message: 'Материал обновлен', material: result.rows[0] });
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удалить материал
router.delete('/materials/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Проверяем, используется ли материал в активных заказах
    const usageCheck = await pool.query(
      `SELECT COUNT(*) as count FROM material_usage mu
       JOIN appointments a ON mu.appointment_id = a.id
       WHERE mu.material_id = $1 AND a.status NOT IN ('completed', 'cancelled')`,
      [id]
    );

    if (parseInt(usageCheck.rows[0].count) > 0) {
      return res.status(400).json({ message: 'Нельзя удалить материал, который используется в активных заказах' });
    }

    await pool.query('DELETE FROM materials WHERE id = $1', [id]);
    res.json({ message: 'Материал удален' });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Пополнить склад материала
router.post('/materials/:id/restock', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, cost_per_unit, supplier_info } = req.body;

  if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Количество должно быть больше 0' });
    }

    const result = await pool.query(
      `UPDATE materials 
       SET quantity_in_stock = quantity_in_stock + $1,
           price_per_unit = COALESCE($2, price_per_unit),
           supplier = COALESCE($3, supplier),
           updated_at = NOW()
       WHERE id = $4 
       RETURNING *`,
      [quantity, cost_per_unit, supplier_info, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Материал не найден' });
    }

    res.json({ 
      message: `Склад пополнен на ${quantity} единиц`, 
      material: result.rows[0] 
    });
  } catch (error) {
    console.error('Error restocking material:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ==================== СТАТИСТИКА И ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ====================

// Получить статистику
router.get('/stats', async (req, res) => {
  try {
    const [users, services, appointments, revenue] = await Promise.all([
      // Количество пользователей
      pool.query('SELECT COUNT(*) as count FROM users'),
      
      // Количество услуг
      pool.query('SELECT COUNT(*) as count FROM services WHERE is_active = true'),
      
      // Статистика записей
      pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'booked') as booked,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
        FROM appointments
        WHERE appointment_date >= CURRENT_DATE - INTERVAL '30 days'
      `),
      
      // Выручка за последние 30 дней
      pool.query(`
        SELECT COALESCE(SUM(s.price), 0) as revenue
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        WHERE a.status = 'completed' 
        AND a.appointment_date >= CURRENT_DATE - INTERVAL '30 days'
      `)
    ]);

    res.json({
      users: parseInt(users.rows[0].count),
      services: parseInt(services.rows[0].count),
      appointments: {
        total: parseInt(appointments.rows[0].total),
        booked: parseInt(appointments.rows[0].booked),
        completed: parseInt(appointments.rows[0].completed),
        cancelled: parseInt(appointments.rows[0].cancelled)
      },
      revenue: parseFloat(revenue.rows[0].revenue)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Блокировать дату
router.post('/block-date', async (req, res) => {
  try {
    const { date, reason } = req.body;

    // Валидация даты
    const blockDate = new Date(date);
    const today = new Date();
    
    if (blockDate < today) {
      return res.status(400).json({ message: 'Нельзя блокировать прошедшую дату' });
    }

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
    
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Эта дата уже заблокирована' });
    }
    
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить заблокированные даты
router.get('/blocked-dates', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM blocked_dates WHERE date >= CURRENT_DATE ORDER BY date'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching blocked dates:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Разблокировать дату
router.delete('/blocked-dates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM blocked_dates WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Заблокированная дата не найдена' });
    }

    res.json({ message: 'Дата разблокирована', blocked_date: result.rows[0] });
  } catch (error) {
    console.error('Error unblocking date:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;
