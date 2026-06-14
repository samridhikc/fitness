const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const CalorieLog = require('../models/CalorieLog');
const auth = require('../middleware/auth');

// Helper function for BMI, BMR, TDEE
function calculateStats(user, totalCalories) {
    let stats = { 
        user: { id: user._id, name: user.name, email: user.email, role: user.role, weight: user.weight, height: user.height, age: user.age, gender: user.gender, activityLevel: user.activityLevel, fitnessGoal: user.fitnessGoal, subscription: user.subscription }, 
        todayCalories: totalCalories, 
        currentWeight: user.weight,
        subscription: user.subscription
    };

    if (user.weight && user.height && user.age && user.gender) {
        const w = user.weight;
        const h = user.height;
        const a = user.age;

        stats.bmi = (w / ((h/100) * (h/100))).toFixed(1);

        let bmr;
        if (user.gender === 'male') bmr = (10 * w) + (6.25 * h) - (5 * a) + 5;
        else bmr = (10 * w) + (6.25 * h) - (5 * a) - 161;
        stats.bmr = Math.round(bmr);

        const factors = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
        const tdee = bmr * (factors[user.activityLevel] || 1.2);
        stats.tdee = Math.round(tdee);

        if (user.fitnessGoal === 'lose') stats.targetCalories = Math.round(tdee - 500);
        else if (user.fitnessGoal === 'gain') stats.targetCalories = Math.round(tdee + 500);
        else stats.targetCalories = Math.round(tdee);
    }
    return stats;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const hash = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hash, role: role || 'customer' });
        await user.save();
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'supersecret');
        // IMPORTANT: Added subscription here so frontend knows they are 'free'
        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, subscription: user.subscription } });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'supersecret');
    // IMPORTANT: Added subscription here so frontend knows if they are 'pro' or 'free'
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, subscription: user.subscription } });
});

// GET /api/user/stats
router.get('/stats', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayLog = await CalorieLog.findOne({ 
            userId: req.user.id, 
            date: { $gte: today } 
        });

        const totalCalories = todayLog ? todayLog.totalCalories : 0;
        res.json(calculateStats(user, totalCalories));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/user/profile
router.put('/profile', auth, async (req, res) => {
    try {
        const updates = req.body;
        const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayLog = await CalorieLog.findOne({ 
            userId: req.user.id, 
            date: { $gte: today } 
        });

        const totalCalories = todayLog ? todayLog.totalCalories : 0;
        res.json(calculateStats(user, totalCalories));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
