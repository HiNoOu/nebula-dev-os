const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/ideas - Strict Priority Order (High -> Medium -> Low)
router.get('/', (req, res) => {
    try {
        const ideas = db.prepare(`
            SELECT * FROM ideas 
            ORDER BY 
                CASE LOWER(TRIM(priority))
                    WHEN 'high' THEN 1
                    WHEN 'medium' THEN 2
                    WHEN 'low' THEN 3
                    ELSE 4
                END ASC, id DESC
        `).all();
        
        res.json(ideas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/ideas - Add new idea
router.post('/', (req, res) => {
    try {
        const { title, priority, note } = req.body;
        const stmt = db.prepare('INSERT INTO ideas (title, priority, note) VALUES (?, ?, ?)');
        const result = stmt.run(title, priority || 'Medium', note || '');
        
        const newIdea = db.prepare('SELECT * FROM ideas WHERE id = ?').get(result.lastInsertRowid);
        res.status(201).json(newIdea);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/ideas/:id
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const result = db.prepare('DELETE FROM ideas WHERE id = ?').run(id);

        if (result.changes === 0) {
            return res.status(404).json({ error: "Idea not found" });
        }

        res.json({ message: "Idea deleted successfully" });
    } catch (error) {
        console.error("Delete Idea Error:", error);
        res.status(500).json({ error: error.message });
    }
});
// POST /api/ideas - Create new idea
router.post('/', (req, res) => {
    try {
        const { title, note, priority } = req.body;

        if (!title) {
            return res.status(400).json({ error: "Title is required" });
        }

        const stmt = db.prepare(`
            INSERT INTO ideas (title, note, priority)
            VALUES (?, ?, ?)
        `);

        const result = stmt.run(title, note || '', priority || 'Medium');
        const created = db.prepare('SELECT * FROM ideas WHERE id = ?').get(result.lastInsertRowid);

        res.status(201).json(created);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;