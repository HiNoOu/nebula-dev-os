const express = require('express');
const cors = require('cors');
const db = require('./db/database');

// 1. Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

// 2. Configure Global Middleware (MUST come before routes)
app.use(cors({
    origin: '*' // Allows requests from your live frontend domain
}));
app.use(express.json());

// 3. Import Routes
const ProjectRoutes = require('./routes/projects.js');
const hackathonRoutes = require('./routes/hackathons');
const ideaRoutes = require('./routes/ideas');
const statsRoutes = require('./routes/stats');

// 4. Mount API Routes
app.use('/api/projects', ProjectRoutes);
app.use('/api/hackathons', hackathonRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/stats', statsRoutes);

// Root Endpoint
app.get('/', (req, res) => {
    res.send('Nebula Dev OS Backend Running...');
});

// 5. Start Server (at the very end of the file)
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});