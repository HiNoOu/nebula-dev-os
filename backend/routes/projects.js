const express = require('express');
const router = express.Router();

const db = require('../db/database');

router.get('/', (req,res) =>{
    try{
        const statement = db.prepare('SELECT * FROM projects ORDER BY created_at DESC');
        const projects = statement.all();
        res.json(projects);
    } catch(error){
        res.status(500).json({error: error.message});
    }

    
});

router.get('/seed', (req, res) => {
    try {
        const statement = db.prepare(`
            INSERT INTO projects (title, description, status, type, progress_percent)
            VALUES ('Nebula Dev OS', 'Interactive portfolio dashboard', 'ongoing', 'resume', 40)
        `);
        statement.run();
        res.send('Seed Project Added --> refreshing...');} catch(error){
            res.status(500).json({error:error.message});
        }
    
});


router.post('/', (req,res) => {
    try{
        const {title, description, tech_stack, tags, repo_link, demo_link, type } = req.body;
        const statement = db.prepare('INSERT INTO projects (title, description, tech_stack, tags, repo_link, demo_link, type) VALUES (?, ?, ?, ?, ?, ?, ?)');
        const result = statement.run(title, 
            description || '', 
            tech_stack || '', 
            tags || '', 
            repo_link || '', 
            demo_link || '', 
            type || 'mini');
        
        res.status(201).json({ 
            message: 'Project created successfully!', 
            id: result.lastInsertRowid 
        });
    } catch(error){
        res.status(500).json({error: error.message});
    }
    });


// POST /api/projects/github-sync
router.post('/github-sync', async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) return res.status(400).json({ error: "Username is required" });

        const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=15`);
        if (!response.ok) throw new Error("Failed to fetch GitHub data");
        
        const repos = await response.json();

        // 1. Clear old projects so stale tags don't stick around
        db.prepare('DELETE FROM projects').run();

        // 2. Prepare fresh insert
        const insertStmt = db.prepare(`
            INSERT INTO projects (
                title, description, status, stars, repo_url, repo_link, 
                progress, progress_percent, tech_stack, tags
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        // 3. Batch insert fresh repos with real GitHub languages
        const insertMany = db.transaction((items) => {
            for (const repo of items) {
                // Get real primary language from GitHub API
                const realLanguage = repo.language ? repo.language.trim() : 'General';
                const status = repo.archived ? 'shipped' : 'ongoing';
                const progress = repo.archived ? 100 : Math.floor(Math.random() * 40) + 50;

                insertStmt.run(
                    repo.name,
                    repo.description || 'No description provided.',
                    status,
                    repo.stargazers_count || 0,
                    repo.html_url,
                    repo.html_url,
                    progress,
                    progress,
                    realLanguage, // tech_stack
                    realLanguage  // tags
                );
            }
        });

        insertMany(repos);
        res.json({ message: `Successfully synced ${repos.length} fresh repos for ${username}!` });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH /api/projects/:id/status - Update status & progress
router.patch('/:id/status', (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        let progress = 50;
        if (status === 'shipped') progress = 100;
        if (status === 'paused') progress = 25;

        db.prepare('UPDATE projects SET status = ?, progress = ? WHERE id = ?').run(status, progress, id);
        res.json({ message: 'Status updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
module.exports = router;