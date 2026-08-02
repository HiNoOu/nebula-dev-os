const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/stats - Aggregate count metrics from SQLite
router.get('/', (req, res) => {
    try {
        // 1. Total repos (projects)
        const totalRepos = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;

        // 2. Active builds (projects with status = 'ongoing')
        const activeBuilds = db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'ongoing'").get().count;

        // 3. Hackathon wins (where placement is filled or stage contains 'winner'/'1st')
        const hackathonWins = db.prepare("SELECT COUNT(*) as count FROM hackathons WHERE placement IS NOT NULL AND placement != ''").get().count;

        // 4. Ideas vault (all entries in ideas table using COUNT(*))
        const ideasCount = db.prepare('SELECT COUNT(*) as count FROM ideas').get().count;

        res.json({
            totalRepos,
            activeBuilds,
            hackathonWins,
            ideasCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;