const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const CalorieLog = require('../models/CalorieLog');
const WeightLog = require('../models/WeightLog');

router.get('/coach', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.weight || !user.height || !user.fitnessGoal) {
            return res.json({ insight: "Please complete your profile (weight, height, goal) so the AI Coach can analyze your data." });
        }
        const bmi = (user.weight / ((user.height/100) * (user.height/100))).toFixed(1);
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
        const weekCalories = await CalorieLog.find({ userId: req.user.id, date: { $gte: weekAgo } });
        const recentWeights = await WeightLog.find({ userId: req.user.id }).sort({ date: -1 }).limit(3);

        let avgCalories = 0;
        if (weekCalories.length > 0) { avgCalories = weekCalories.reduce((sum, log) => sum + log.totalCalories, 0) / weekCalories.length; }
        let weightTrend = "stable";
        if (recentWeights.length >= 2) {
            const oldest = recentWeights[recentWeights.length - 1].weight;
            const newest = recentWeights[0].weight;
            if (newest < oldest - 0.5) weightTrend = "losing";
            else if (newest > oldest + 0.5) weightTrend = "gaining";
        }

        let aiMessage = `🤖 **AI Coach Analysis for ${user.name}:**\n\n`;
        aiMessage += `📊 **Current Status:** Your BMI is ${bmi}. You are currently ${weightTrend} weight. `;

        if (user.fitnessGoal === 'lose') {
            aiMessage += `\n\n🔥 **Fat Loss Protocol:** Since your goal is weight loss, you need a calorie deficit. `;
            if (avgCalories > 0 && avgCalories > (user.weight * 25)) { aiMessage += `Your average intake of ${Math.round(avgCalories)} cal is too high. The AI recommends cutting 400 calories by removing sugary drinks and reducing portion sizes.`; }
            else if (weightTrend !== "losing") { aiMessage += `Even though you are eating less, your weight isn't dropping. The AI suggests adding 30 mins of daily cardio to boost your metabolism.`; }
            else { aiMessage += `Great job! You are in a calorie deficit and losing weight. Keep it up!`; }
        } else if (user.fitnessGoal === 'gain') {
            aiMessage += `\n\n💪 **Muscle Gain Protocol:** You need a calorie surplus and high protein. `;
            if (avgCalories > 0 && avgCalories < (user.weight * 30)) { aiMessage += `Your average intake of ${Math.round(avgCalories)} cal is too low for muscle growth. The AI recommends adding a protein shake and complex carbs post-workout.`; }
            else { aiMessage += `You are eating well. Ensure you are doing progressive overload in your strength training to turn those calories into muscle!`; }
        } else {
            aiMessage += `\n\n⚖️ **Maintenance Protocol:** Focus on consistency and balanced macros. The AI recommends keeping your daily calories around ${Math.round(user.weight * 28)} to maintain your current physique.`;
        }
        res.json({ insight: aiMessage });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;
