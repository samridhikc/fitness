const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');

// GET /api/trainer/trainers - Customer gets list of trainers
router.get('/trainers', auth, async (req, res) => {
    try {
        // BLOCK FREE USERS FROM SEEING TRAINERS
        if (req.user.role === 'customer') {
            const user = await User.findById(req.user.id);
            if (!user.subscription || user.subscription.plan === 'free') {
                return res.status(403).json({ message: 'Pro subscription required to chat with trainers.' });
            }
        }
        const trainers = await User.find({ role: 'trainer' }).select('name email');
        res.json(trainers);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/trainer/my-clients - Trainer gets list of clients who messaged them
router.get('/my-clients', auth, async (req, res) => {
    try {
        if (req.user.role !== 'trainer') return res.status(403).json({ message: 'Access denied' });
        const clientIds = await Message.distinct('senderId', { receiverId: req.user.id });
        const clients = await User.find({ _id: { $in: clientIds } }).select('name email');
        res.json(clients);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/trainer/history/:userId - Get chat history with a specific person
router.get('/history/:userId', auth, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { senderId: req.user.id, receiverId: req.params.userId },
                { senderId: req.params.userId, receiverId: req.user.id }
            ]
        }).sort({ timestamp: 1 });
        res.json(messages);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/trainer/send - Send a message
router.post('/send', auth, async (req, res) => {
    try {
        // BLOCK FREE USERS FROM SENDING MESSAGES
        if (req.user.role === 'customer') {
            const user = await User.findById(req.user.id);
            if (!user.subscription || user.subscription.plan === 'free') {
                return res.status(403).json({ message: 'Pro subscription required to chat with trainers.' });
            }
        }

        const { receiverId, content } = req.body;
        const message = new Message({ senderId: req.user.id, receiverId, content });
        await message.save();
        res.json(message);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
