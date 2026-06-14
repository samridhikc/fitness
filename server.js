const express = require('express');
const User = require('../models/User');
const CalorieLog = require('../models/CalorieLog');
const Workout = require('../models/Workout');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.post('/coach', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const today = new Date(); today.setHours(0,0,0,0);
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);

    const [recentCalories, recentWorkouts] = await Promise.all([
      CalorieLog.find({ userId: req.userId, date: { $gte: weekAgo } }),
      Workout.find({ userId: req.userId, date: { $gte: weekAgo } })
    ]);

    const totalCalWeek = recentCalories.reduce((s, c) => s + c.calories, 0);
    const totalWorkoutCal = recentWorkouts.reduce((s, w) => s + (w.calories || 0), 0);

    // Rule-based fallback if no OpenAI key is provided
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-your-openai-key-here') {
      const goal = user.fitnessGoal === 'lose' ? 'weight loss' : user.fitnessGoal === 'gain' ? 'muscle gain' : 'maintenance';
      const bmi = (user.weight && user.height) ? (user.weight / ((user.height/100)**2)).toFixed(1) : 'N/A';
      const proteinTarget = Math.round((user.weight || 75) * 1.8);
      const insight = `**Based on your profile:**\n\n🔹 You're on a **${goal}** plan.\n🔹 Your BMI of ${bmi} is looking good!\n🔹 You've logged **${recentWorkouts.length} workouts** this week, burning **${totalWorkoutCal} calories**.\n🔹 Your intake was **${totalCalWeek} calories** over 7 days (avg ${Math.round(totalCalWeek/7)}/day).\n🔹 For ${goal}, aim for ~${proteinTarget}g protein daily.\n\n💡 *Tip: Add a 15-min stretching session after strength training for better recovery.*`;
      return res.json({ insight });
    }

    // If OpenAI key is provided, use GPT
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `You are an expert fitness coach AI. Analyze this user data and give personalized, concise advice (4-5 bullet points max):\n\nUser: ${user.name}, Age: ${user.age || 'N/A'}, Gender: ${user.gender || 'N/A'}, Weight: ${user.weight || 'N/A'}kg, Height: ${user.height || 'N/A'}cm, Goal: ${user.fitnessGoal || 'maintain'}\nThis week: ${recentWorkouts.length} workouts, ${totalWorkoutCal} cal burned, ${totalCalWeek} cal consumed.\n\nGive actionable fitness and nutrition advice.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400
    });

    res.json({ insight: completion.choices[0].message.content });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
