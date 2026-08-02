# Nebula DevOS

Nebula DevOS is a sleek, full-stack developer workspace designed to centralize project tracking, hackathon pipelines, and idea management into a single reactive interface.

Live Demo: https://nebula-dev-os.vercel.app

---

## Features

* **Real-time Stats Dashboard:** Displays total repositories, active builds, hackathon wins, and vaulted ideas at a glance.
* **Interactive Project & Idea Management:** Dynamic stage tracking with a 5-stage progress pipeline, custom tagging, and status toggles.
* **Hackathon Organizer:** Keep track of upcoming hackathons, event dates, project submissions, and placement results.
* **GitHub Integration Ready:** Configured to sync directly with GitHub user profile metrics.

---

## Tech Stack

### Frontend
* HTML5
* Modern CSS3 (Glassmorphism UI, CSS Grid/Flexbox)
* Vanilla JavaScript (ES6+)

### Backend
* Node.js
* Express.js (RESTful API)

### Database & Deployment
* SQLite (`better-sqlite3`)
* **Frontend Hosting:** Vercel
* **Backend Hosting:** Render

---

## Project Structure

```text
nebula-devos/
├── package.json
├── README.md
├── backend/
│   ├── server.js
│   ├── db/
│   └── routes/
└── frontend/
    ├── index.html
    ├── app.js
    └── styles.css
