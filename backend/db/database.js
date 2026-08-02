const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'dev_os.db');
const db = new Database(dbPath);

const SchemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(SchemaPath, 'utf-8');
db.exec(schema);

// --- Safely add missing columns to existing database tables ---
const alterQueries = [
    `ALTER TABLE projects ADD COLUMN stars INTEGER DEFAULT 0;`,
    `ALTER TABLE projects ADD COLUMN repo_url TEXT;`,
    `ALTER TABLE projects ADD COLUMN progress INTEGER DEFAULT 0;`,
    `ALTER TABLE projects ADD COLUMN tags TEXT DEFAULT '';`,
    `ALTER TABLE hackathons ADD COLUMN milestones TEXT DEFAULT '[]';`
];

// In backend/db/database.js (or db setup file)
try {
    db.prepare("ALTER TABLE hackathons ADD COLUMN tags TEXT DEFAULT ''").run();
} catch (e) {
    // Column already exists, ignore error
}

try {
    db.prepare("ALTER TABLE hackathons ADD COLUMN event_url TEXT DEFAULT ''").run();
} catch (e) {
    // Column already exists, ignore error
}

alterQueries.forEach(query => {
    try {
        db.exec(query);
    } catch (e) {
        // Ignore error if column already exists
    }
});

console.log('Database Connected and Initialised....');
module.exports = db;