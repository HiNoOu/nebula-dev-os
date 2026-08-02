CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    status TEXT CHECK (status IN ('ongoing','paused','shipped')) DEFAULT 'ongoing',
    type TEXT CHECK (type IN ('mini','resume')) DEFAULT 'mini',
    description TEXT,
    tech_stack TEXT,
    tags TEXT DEFAULT '',
    progress_type TEXT CHECK (progress_type IN ('manual','checklist','velocity')) DEFAULT 'manual',
    progress_percent INTEGER DEFAULT 0,
    repo_link TEXT,
    demo_link TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hackathons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    platform TEXT CHECK (platform IN ('devfolio','devpost','unstop','other')),
    start_date DATE,
    end_date DATE,
    is_archived INTEGER DEFAULT 0,
    placement TEXT,
    stage TEXT DEFAULT 'Idea Validation',
    tags TEXT,
    milestones TEXT DEFAULT '[]',
    event_link TEXT,
    repo_link TEXT,
    demo_link TEXT,
    project_built TEXT
);

CREATE TABLE IF NOT EXISTS ideas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    note TEXT,
    tags TEXT,
    priority TEXT CHECK(priority IN ('Low','Medium','High')) DEFAULT 'Medium',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);