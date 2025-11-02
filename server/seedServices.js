import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Service from './models/Service.js';

dotenv.config();

const services = [
  {
    name: 'Комплексная мойка',
    description: 'Полная наружная мойка и уборка салона',
    price: 1500,
    duration: 60,
    category: 'maintenance',
    preparationDays: 0
  },
  {
    name: 'Детейлинг химчистка',
    description: 'Глубокая чистка салона с защитной обработкой',
    price: 5000,
    duration: 180,
    category: 'detailing',
    preparationDays: 1
  },
  {
    name: 'Оклейка антигравийной пленкой',
    description: 'Защита кузова от сколов и царапин',
    price: 15000,
    duration: 480,
    category: 'wrap',
    preparationDays: 30
  },
  {
    name: 'Полировка кузова',
    description: 'Восстановление лакового покрытия',
    price: 8000,
    duration: 240,
    category: 'detailing',
    preparationDays: 2
  }
];

const seedServices = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Очищаем существующие услуги
    await Service.deleteMany({});
    
    // Добавляем тестовые услуги
    await Service.insertMany(services);
    
    console.log('Services seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding services:', error);
    process.exit(1);
  }
};

seedServices();