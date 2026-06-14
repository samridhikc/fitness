const mongoose = require('mongoose');
const weightLogSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, weight: { type: Number, required: true }, date: { type: Date, required: true }, note: { type: String, default: '' } }, { timestamps: true });
module.exports = mongoose.model('WeightLog', weightLogSchema);
