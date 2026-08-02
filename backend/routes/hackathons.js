const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/hackathons - Fetch all
router.get('/', (req, res) => {
    try {
        const hackathons = db.prepare('SELECT * FROM hackathons ORDER BY start_date ASC').all();
        res.json(hackathons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', (req, res) => {
    try {
        const { name, platform, start_date, end_date, tags, event_url } = req.body;
        
        if (!name || !start_date) {
            return res.status(400).json({ error: "Name and Start Date are required" });
        }

        // Exact 5 default stages from design mockup
        const defaultMilestones = JSON.stringify([
            { title: "1. Idea Validation", done: false },
            { title: "2. Architecture", done: false },
            { title: "3. Core Features", done: false },
            { title: "4. Polish", done: false },
            { title: "5. Video / Submission", done: false }
        ]);

        const stmt = db.prepare(`
            INSERT INTO hackathons (name, platform, start_date, end_date, milestones, tags, event_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            name,
            platform || 'devfolio',
            start_date,
            end_date || start_date,
            defaultMilestones,
            tags || '',
            event_url || ''
        );

        const created = db.prepare('SELECT * FROM hackathons WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json(created);
    } catch (error) {
        console.error("Hackathon POST Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// PATCH /api/hackathons/:id/milestones - Toggle milestone state
router.patch('/:id/milestones', (req, res) => {
    try {
        const { id } = req.params;
        const { milestones } = req.body;

        db.prepare('UPDATE hackathons SET milestones = ? WHERE id = ?')
          .run(JSON.stringify(milestones), id);

        res.json({ message: "Milestones updated" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/hackathons/:id - Delete a hackathon
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const result = db.prepare('DELETE FROM hackathons WHERE id = ?').run(id);

        if (result.changes === 0) {
            return res.status(404).json({ error: "Hackathon not found" });
        }

        res.json({ message: "Hackathon deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;