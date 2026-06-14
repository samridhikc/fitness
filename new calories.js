const mongoose = require('mongoose');

const calorieLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  calories: { type: Number, required: true },
  mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CalorieLog', calorieLogSchema);
