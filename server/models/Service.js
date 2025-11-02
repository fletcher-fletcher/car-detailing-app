import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  duration: {
    type: Number, // в минутах
    required: true
  },
  category: {
    type: String,
    enum: ['detailing', 'wrap', 'maintenance'],
    required: true
  },
  preparationDays: {
    type: Number, // дней подготовки
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Service', serviceSchema);