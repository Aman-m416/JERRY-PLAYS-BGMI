const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    teamName: String,
    leaderIGN: String,
    leaderID: String,
    whatsapp: String,
    paymentScreenshot: String, 
    slotNumber: { type: Number, default: 1 },
    status: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Team', teamSchema);