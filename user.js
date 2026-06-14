const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    age: Number,
    gender: String,
    weight: Number,
    height: Number,
    activityLevel: { type: String, enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'] },
    fitnessGoal: { type: String, enum: ['lose', 'maintain', 'gain'] },
    subscription: { plan: { type: String, default: 'free' }, status: { type: String, default: 'active' } },
    role: { type: String, enum: ['customer', 'trainer'], default: 'customer' }
});

module.exports = mongoose.model('User', userSchema);
