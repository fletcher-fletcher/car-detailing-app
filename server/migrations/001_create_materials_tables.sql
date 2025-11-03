-- Миграция: Добавление функционала материалов
-- Описание: Создание таблиц для управления расходными материалами

-- 1. Таблица материалов
CREATE TABLE IF NOT EXISTS materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  unit VARCHAR(50) NOT NULL, -- шт, л, кг, м2
  quantity_in_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_stock_level DECIMAL(10,2) DEFAULT 0,
  price_per_unit DECIMAL(10,2) DEFAULT 0,
  supplier VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Связка услуг с материалами
CREATE TABLE IF NOT EXISTS service_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  quantity_required DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(service_id, material_id)
);

-- 3. История использования материалов
CREATE TABLE IF NOT EXISTS material_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  executor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quantity_used DECIMAL(10,2) NOT NULL,
  cost_per_unit DECIMAL(10,2),
  total_cost DECIMAL(10,2) GENERATED ALWAYS AS (quantity_used * cost_per_unit) STORED,
  notes TEXT,
  used_at TIMESTAMP DEFAULT NOW()
);

-- 4. Индексы
CREATE INDEX IF NOT EXISTS idx_materials_active ON materials(is_active);
CREATE INDEX IF NOT EXISTS idx_service_materials_service_id ON service_materials(service_id);
CREATE INDEX IF NOT EXISTS idx_material_usage_appointment_id ON material_usage(appointment_id);

-- 5. Тестовые данные
INSERT INTO materials (name, description, unit, quantity_in_stock, min_stock_level, price_per_unit) VALUES
('Автошампунь', 'Концентрированный шампунь для мойки', 'л', 50.00, 10.00, 250.00),
('Воск защитный', 'Защитный воск для покрытия кузова', 'л', 20.00, 5.00, 850.00),
('Микрофибровые салфетки', 'Салфетки для полировки', 'шт', 100.00, 20.00, 150.00)
ON CONFLICT DO NOTHING;
