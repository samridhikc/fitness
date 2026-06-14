const express = require('express');
const router = express.Router();
const CalorieLog = require('../models/CalorieLog');
const auth = require('../middleware/auth');

const FOOD_DATABASE = [
  { name: 'Brown Rice (1 cup)', calories: 216, protein: 5, carbs: 45, fat: 1.8, category: 'grains' },
  { name: 'Chicken Breast (100g)', calories: 165, protein: 31, carbs: 0, fat: 3.6, category: 'protein' },
  { name: 'Egg (1 large)', calories: 78, protein: 6, carbs: 0.6, fat: 5, category: 'protein' },
  { name: 'Banana (1 medium)', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, category: 'fruits' },
  { name: 'Oatmeal (1 cup)', calories: 154, protein: 5, carbs: 27, fat: 2.6, category: 'grains' },
  { name: 'Greek Yogurt (170g)', calories: 100, protein: 17, carbs: 6, fat: 0.7, category: 'dairy' },
  { name: 'Salmon (100g)', calories: 208, protein: 20, carbs: 0, fat: 13, category: 'protein' },
  { name: 'Sweet Potato (1 medium)', calories: 103, protein: 2, carbs: 24, fat: 0.1, category: 'vegetables' },
  { name: 'Almonds (28g)', calories: 164, protein: 6, carbs: 6, fat: 14, category: 'nuts' },
  { name: 'Broccoli (1 cup)', calories: 55, protein: 4, carbs: 11, fat: 0.6, category: 'vegetables' },
  { name: 'Paneer (100g)', calories: 265, protein: 18, carbs: 1.2, fat: 21, category: 'dairy' },
  { name: 'Dal (1 cup)', calories: 150, protein: 9, carbs: 24, fat: 1.5, category: 'legumes' },
  { name: 'Roti (1 piece)', calories: 71, protein: 3, carbs: 15, fat: 0.4, category: 'grains' }
];

router.post('/log', auth, async (req, res) => {
    try {
        const { name, calories, protein, carbs, fat, mealType } = req.body;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        let log = await CalorieLog.findOne({ userId: req.user.id, date: { $gte: today } });
        if (!log) { log = new CalorieLog({ userId: req.user.id, date: today, meals: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }); }
        log.meals.push({ name, calories, protein: protein || 0, carbs: carbs || 0, fat: fat || 0, mealType });
        log.totalCalories += calories; log.totalProtein += protein || 0; log.totalCarbs += carbs || 0; log.totalFat += fat || 0;
        await log.save(); res.json(log);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

router.get('/today', auth, async (req, res) => {
    try {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const log = await CalorieLog.findOne({ userId: req.user.id, date: { $gte: today } });
        res.json(log || { meals: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// THIS IS THE CHART DATA ROUTE
router.get('/history', auth, async (req, res) => {
    try {
        const logs = await CalorieLog.find({ userId: req.user.id }).sort({ date: -1 }).limit(30);
        res.json(logs);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// THIS IS THE AI FOOD ROUTE
router.get('/recommend', auth, async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.user.id);
        if (!user.weight || !user.height || !user.age || !user.gender || !user.fitnessGoal) return res.status(400).json({ message: 'Profile incomplete' });

        let bmr = user.gender === 'male' ? 10 * user.weight + 6.25 * user.height - 5 * user.age + 5 : 10 * user.weight + 6.25 * user.height - 5 * user.age - 161;
        const factors = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
        const tdee = Math.round(bmr * (factors[user.activityLevel] || 1.2));
        let targetCalories = tdee;
        if (user.fitnessGoal === 'lose') targetCalories = tdee - 500;
        else if (user.fitnessGoal === 'gain') targetCalories = tdee + 500;

        const pickFoods = (calBudget, preferCategory) => {
            const pool = [...FOOD_DATABASE.filter(f => f.category === preferCategory), ...FOOD_DATABASE];
            const selected = []; let remaining = calBudget;
            for (const food of pool) { if (food.calories <= remaining + 50) { selected.push(food); remaining -= food.calories; if (remaining <= 0) break; } }
            return selected;
        };

        res.json({ targetCalories, tdee, meals: {
            breakfast: { calorieTarget: Math.round(targetCalories * 0.25), foods: pickFoods(targetCalories * 0.25, user.fitnessGoal === 'gain' ? 'protein' : 'grains') },
            lunch: { calorieTarget: Math.round(targetCalories * 0.35), foods: pickFoods(targetCalories * 0.35, 'protein') },
            dinner: { calorieTarget: Math.round(targetCalories * 0.30), foods: pickFoods(targetCalories * 0.30, 'protein') }
        }});
    } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;
