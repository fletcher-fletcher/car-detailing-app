import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Получить все услуги
router.get('/', async (req, res) => {
  try {
    console.log('📦 Fetching services from PostgreSQL...');
    
    const result = await pool.query(`
      SELECT * FROM services 
      WHERE is_active = true 
      ORDER BY created_at DESC
    `);
    
    console.log(`✅ Found ${result.rows.length} services`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching services:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Создать услугу (для администратора)
router.post('/', async (req, res) => {
  try {
    const { name, description, price, duration, category, preparation_days } = req.body;
    
    const result = await pool.query(
      `INSERT INTO services (name, description, price, duration, category, preparation_days) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [name, description, price, duration, category, preparation_days || 0]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(400).json({ message: error.message });
  }
});

export default router;