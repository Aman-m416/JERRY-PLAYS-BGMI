const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Team = require('./models/team');
require('dotenv').config();

// --- NEW CLOUDINARY STUFF ---
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'BATTLEZ_PAYMENTS',
        allowed_formats: ['jpg', 'png', 'jpeg']
    },
});
const upload = multer({ storage: storage });
// ----------------------------

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("🔥 Database Connected!"))
    .catch(err => console.log("❌ DB Error:", err));

const LIMIT = 25; 


// Update: added 'upload.single' middleware
app.post('/register', upload.single('screenshot'), async (req, res) => {
    try {
        const totalTeams = await Team.countDocuments();
        if (totalTeams >= (LIMIT * 2)) {
            return res.status(400).json({ success: false, message: "All slots are full!" });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: "Payment screenshot is required!" });
        }

        let assignedSlot = totalTeams < LIMIT ? 1 : 2;

        const newTeam = new Team({
            teamName: req.body.teamName,
            leaderIGN: req.body.leaderIGN,
            leaderID: req.body.leaderID,
            whatsapp: req.body.whatsapp,
            birthYear: req.body.birthYear,
            paymentScreenshot: req.file.path, // Cloudinary URL saved here
            slotNumber: assignedSlot,
            status: 'Pending'
        });
        
        await newTeam.save();
        res.json({ success: true, slot: assignedSlot });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error!" });
    }
});

// --- ADMIN ROUTES ---

// 1. Dashboard Page Serve Karna
app.get('/admin-dashboard', (req, res) => {
    res.sendFile(__dirname + '/public/admin-dashboard.html');
});

// 2. Sabhi Teams ka Data Fetch Karna (Sorted by Time)
app.get('/admin/teams', async (req, res) => {
    try {
        const teams = await Team.find().sort({ createdAt: 1 });
        res.json(teams);
    } catch (err) {
        res.status(500).json({ message: "Error fetching data" });
    }
});

// 3. Status Update (Approve) OR Delete (Reject)
app.post('/admin/update-status', async (req, res) => {
    const { id, status } = req.body;
    try {
        if (status === 'Rejected') {
            const team = await Team.findById(id);
            if (team) {
                // Cloudinary se image delete karo
                const parts = team.paymentScreenshot.split('/');
                const fileName = parts[parts.length - 1].split('.')[0];
                await cloudinary.uploader.destroy(`BATTLEZ_PAYMENTS/${fileName}`);

                // Database se entry delete karo
                await Team.findByIdAndDelete(id);
                return res.json({ success: true, message: "Team Deleted" });
            }
        } else {
            // Approve logic: Sirf status badlo
            await Team.findByIdAndUpdate(id, { status: status });
            res.json({ success: true });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

// 4. Reset Tournament (Full Clear)
app.post('/admin/clear-all-data', async (req, res) => {
    try {
        const teams = await Team.find();
        const publicIds = teams.map(team => {
            const parts = team.paymentScreenshot.split('/');
            const fileName = parts[parts.length - 1].split('.')[0];
            return `BATTLEZ_PAYMENTS/${fileName}`;
        });

        if (publicIds.length > 0) {
            await cloudinary.api.delete_resources(publicIds);
        }

        await Team.deleteMany({});
        res.json({ success: true, message: "Tournament Reset Successful!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});

// Naya Schema Match Details ke liye
const settingsSchema = new mongoose.Schema({
    slot1Time: { type: String, default: "TBA" },
    slot2Time: { type: String, default: "TBA" },
    isMaintenance: { type: Boolean, default: false }
});
const Settings = mongoose.model('Settings', settingsSchema);

// --- SETTINGS ROUTES ---

// 1. Get All Settings
app.get('/get-settings', async (req, res) => {
    let s = await Settings.findOne();
    if (!s) s = await Settings.create({}); 
    res.json(s);
});

// 2. Update Match Schedule
app.post('/admin/update-schedule', async (req, res) => {
    const { slot1, slot2 } = req.body;
    await Settings.findOneAndUpdate({}, { slot1Time: slot1, slot2Time: slot2 }, { upsert: true });
    res.json({ success: true });
});

// 3. Maintenance Toggle
app.post('/admin/toggle-maintenance', async (req, res) => {
    const { status } = req.body;
    await Settings.findOneAndUpdate({}, { isMaintenance: status }, { upsert: true });
    res.json({ success: true });
});

// --- UPDATE EXISTING GET-STATUS ---
app.get('/get-status', async (req, res) => {
    try {
        // Yahan se { status: 'Approved' } hata diya hai
        // Ab pending + approved dono count honge progress bar ke liye
        const count = await Team.countDocuments(); 
        
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({ slot1Time: "TBA", slot2Time: "TBA", isMaintenance: false });
        }

        res.json({ 
            count: count, 
            limit: 25, 
            schedule1: settings.slot1Time,
            schedule2: settings.slot2Time,
            maintenance: settings.isMaintenance
        });
    } catch (err) { 
        res.status(500).json({ count: 0, maintenance: false }); 
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Running on http://localhost:${PORT}`));

