import express from 'express';
import pool from '../config/database.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Применяем middleware аутентификации ко всем маршрутам
router.use(auth);

// ==================== УПРАВЛЕНИЕ ЗАКАЗАМИ ====================

// Получить все заказы исполнителя
router.get('/appointments', async (req, res) => {
  try {
    const executor_id = req.user.id;

    const result = await pool.query(
      `SELECT a.*, 
              u.name as user_name, u.email as user_email, u.phone as user_phone,
              s.name as service_name, s.price, s.duration, s.category
       FROM appointments a
       JOIN users u ON a.user_id = u.id
       JOIN services s ON a.service_id = s.id
       WHERE a.executor_id = $1
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [executor_id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить детали конкретного заказа с материалами
router.get('/appointments/:id/details', async (req, res) => {
  try {
    const { id } = req.params;
    const executor_id = req.user.id;

    // Получаем основную информацию о заказе
    const appointmentResult = await pool.query(
      `SELECT a.*, 
              u.name as user_name, u.phone as user_phone, u.email as user_email,
              s.name as service_name, s.price, s.duration, s.category, s.description as service_description
       FROM appointments a
       JOIN users u ON a.user_id = u.id
       JOIN services s ON a.service_id = s.id
       WHERE a.id = $1 AND a.executor_id = $2`,
      [id, executor_id]
    );

    if (appointmentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Заказ не найден или у вас нет прав доступа' });
    }

    // Получаем необходимые материалы для этой услуги
    const materialsResult = await pool.query(
      `SELECT m.*, sm.quantity_required,
              (m.quantity_in_stock >= sm.quantity_required) as available
       FROM service_materials sm
       JOIN materials m ON sm.material_id = m.id
       WHERE sm.service_id = $1 AND m.is_active = true`,
      [appointmentResult.rows[0].service_id]
    );

    // Получаем историю использованных материалов
    const usedMaterialsResult = await pool.query(
      `SELECT mu.*, m.name as material_name, m.unit
       FROM material_usage mu
       JOIN materials m ON mu.material_id = m.id
       WHERE mu.appointment_id = $1`,
      [id]
    );

    res.json({
      appointment: appointmentResult.rows[0],
      required_materials: materialsResult.rows,
      used_materials: usedMaterialsResult.rows
    });
  } catch (error) {
    console.error('Error fetching appointment details:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Редактировать заказ
router.put('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { appointment_date, appointment_time, notes, status } = req.body;
    const executor_id = req.user.id;

    // Проверяем права доступа
    const appointmentCheck = await pool.query(
      'SELECT id, status FROM appointments WHERE id = $1 AND executor_id = $2',
      [id, executor_id]
    );

    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Заказ не найден или у вас нет прав доступа' });
    }

    // Нельзя редактировать завершенные или отмененные заказы
    const currentStatus = appointmentCheck.rows[0].status;
    if (currentStatus === 'completed' || currentStatus === 'cancelled') {
      return res.status(400).json({ message: 'Нельзя редактировать завершенный или отмененный заказ' });
    }

    const result = await pool.query(
      `UPDATE appointments 
       SET appointment_date = COALESCE($1, appointment_date),
           appointment_time = COALESCE($2, appointment_time),
           notes = COALESCE($3, notes),
           status = COALESCE($4, status),
           updated_at = NOW()
       WHERE id = $5 
       RETURNING *`,
      [appointment_date, appointment_time, notes, status, id]
    );

    res.json({ message: 'Заказ обновлен', appointment: result.rows[0] });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удалить заказ (только если не начат)
router.delete('/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const executor_id = req.user.id;

    // Проверяем права и статус
    const appointmentCheck = await pool.query(
      'SELECT id, status FROM appointments WHERE id = $1 AND executor_id = $2',
      [id, executor_id]
    );

    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Заказ не найден или у вас нет прав доступа' });
    }

    const currentStatus = appointmentCheck.rows[0].status;
    if (currentStatus !== 'booked') {
      return res.status(400).json({ message: 'Можно удалить только забронированные заказы' });
    }

    await pool.query('DELETE FROM appointments WHERE id = $1', [id]);

    res.json({ message: 'Заказ удален' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ==================== УПРАВЛЕНИЕ МАТЕРИАЛАМИ ====================

// Получить материалы с предупреждениями о запасах
router.get('/materials', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *, 
              CASE 
                WHEN quantity_in_stock <= min_stock_level THEN 'low'
                WHEN quantity_in_stock <= min_stock_level * 1.5 THEN 'warning'
                ELSE 'ok'
              END as stock_status
       FROM materials 
       WHERE is_active = true
       ORDER BY 
         CASE 
           WHEN quantity_in_stock <= min_stock_level THEN 1
           WHEN quantity_in_stock <= min_stock_level * 1.5 THEN 2
           ELSE 3
         END,
         name`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить остатки материалов с предупреждениями
router.get('/materials/stock-alerts', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *, 
              CASE 
                WHEN quantity_in_stock <= min_stock_level THEN 'low'
                WHEN quantity_in_stock <= min_stock_level * 1.5 THEN 'warning'
                ELSE 'ok'
              END as stock_status
       FROM materials 
       WHERE is_active = true
       ORDER BY 
         CASE 
           WHEN quantity_in_stock <= min_stock_level THEN 1
           WHEN quantity_in_stock <= min_stock_level * 1.5 THEN 2
           ELSE 3
         END,
         name`
    );

    const lowStockItems = result.rows.filter(item => item.stock_status === 'low');
    const warningStockItems = result.rows.filter(item => item.stock_status === 'warning');

    res.json({
      materials: result.rows,
      alerts: {
        low_stock_count: lowStockItems.length,
        warning_stock_count: warningStockItems.length,
        low_stock_items: lowStockItems.map(item => ({ 
          id: item.id,
          name: item.name, 
          quantity: item.quantity_in_stock,
          min_level: item.min_stock_level
        })),
        warning_stock_items: warningStockItems.map(item => ({ 
          id: item.id,
          name: item.name, 
          quantity: item.quantity_in_stock,
          min_level: item.min_stock_level
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching stock alerts:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Использовать материалы для заказа
router.post('/appointments/:id/use-materials', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id: appointment_id } = req.params;
    const { materials } = req.body; // [{ material_id, quantity_used, notes }]
    const executor_id = req.user.id;

    // Проверяем права доступа к заказу
    const appointmentCheck = await client.query(
      'SELECT id, status FROM appointments WHERE id = $1 AND executor_id = $2',
      [appointment_id, executor_id]
    );

    if (appointmentCheck.rows.length === 0) {
      throw new Error('Заказ не найден или у вас нет прав доступа');
    }

    const results = [];

    for (const material of materials) {
      const { material_id, quantity_used, notes } = material;

      // Проверяем наличие материала
      const materialCheck = await client.query(
        'SELECT id, name, quantity_in_stock, price_per_unit FROM materials WHERE id = $1 AND is_active = true',
        [material_id]
      );

      if (materialCheck.rows.length === 0) {
        throw new Error(`Материал с ID ${material_id} не найден`);
      }

      const materialData = materialCheck.rows[0];
      
      if (materialData.quantity_in_stock < quantity_used) {
        throw new Error(`Недостаточно материала "${materialData.name}" на складе. Доступно: ${materialData.quantity_in_stock}, требуется: ${quantity_used}`);
      }

      // Списываем материал со склада
      await client.query(
        'UPDATE materials SET quantity_in_stock = quantity_in_stock - $1, updated_at = NOW() WHERE id = $2',
        [quantity_used, material_id]
      );

      // Записываем в историю использования
      const usageResult = await client.query(
        `INSERT INTO material_usage (material_id, appointment_id, executor_id, quantity_used, cost_per_unit, notes)
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [material_id, appointment_id, executor_id, quantity_used, materialData.price_per_unit, notes || '']
      );

      results.push({
        material_name: materialData.name,
        quantity_used,
        remaining_stock: materialData.quantity_in_stock - quantity_used,
        usage_record: usageResult.rows[0]
      });
    }

    await client.query('COMMIT');

    res.json({ 
      message: 'Материалы успешно использованы', 
      results 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error using materials:', error);
    res.status(400).json({ message: error.message || 'Ошибка при использовании материалов' });
  } finally {
    client.release();
  }
});

// История использования материалов по исполнителю
router.get('/materials/usage-history', async (req, res) => {
  try {
    const executor_id = req.user.id;
    const { limit = 50, offset = 0, material_id, appointment_id } = req.query;

    let whereClause = 'WHERE mu.executor_id = $1';
    let params = [executor_id];
    let paramIndex = 2;

    if (material_id) {
      whereClause += ` AND mu.material_id = $${paramIndex}`;
      params.push(material_id);
      paramIndex++;
    }

    if (appointment_id) {
      whereClause += ` AND mu.appointment_id = $${paramIndex}`;
      params.push(appointment_id);
      paramIndex++;
    }

    const result = await pool.query(
      `SELECT mu.*, 
              m.name as material_name, m.unit,
              a.appointment_date, a.appointment_time,
              u.name as client_name,
              s.name as service_name
       FROM material_usage mu
       JOIN materials m ON mu.material_id = m.id
       JOIN appointments a ON mu.appointment_id = a.id
       JOIN users u ON a.user_id = u.id
       JOIN services s ON a.service_id = s.id
       ${whereClause}
       ORDER BY mu.used_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

        res.json({
      usage_history: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('Error fetching usage history:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;
