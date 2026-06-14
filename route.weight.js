const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const WeightLog = require('../models/WeightLog');
const User = require('../models/User');

router.post('/log', auth, async (req, res) => {
    try {
        const log = new WeightLog({ userId: req.user.id, ...req.body });
        await log.save();
        await User.findByIdAndUpdate(req.user.id, { weight: req.body.weight });
        res.json(log);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// THIS IS THE CHART DATA ROUTE
router.get('/history', auth, async (req, res) => {
    try {
        const history = await WeightLog.find({ userId: req.user.id }).sort({ date: 1 }).limit(30);
        res.json(history);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
