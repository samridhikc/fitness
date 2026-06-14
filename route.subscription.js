const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// POST /api/subscription/upgrade
router.post('/upgrade', auth, async (req, res) => {
    try {
        const { plan } = req.body; // Expecting 'pro' or 'elite'
        const user = await User.findByIdAndUpdate(
            req.user.id, 
            { subscription: { plan: plan, status: 'active' } }, 
            { new: true }
        );
        res.json({ plan: user.subscription.plan });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
