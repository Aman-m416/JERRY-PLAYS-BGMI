const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    teamName: { type: String, required: true },
    // IGL / Leader Details
    leaderIGN: { type: String, required: true }, 
    leaderID: { type: String, required: true },
    
    // Squad Members (Names Only)
    player2Name: { type: String, required: true },
    player3Name: { type: String, required: true },
    player4Name: { type: String, required: true },

    whatsapp: { type: String, required: true },
    paymentScreenshot: String, 
    slotNumber: { type: Number, default: 1 }, // Ismein ab 1, 2, 3, ya 4 store hoga
    status: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Team', teamSchema);