const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://nebula-dev-os-api.onrender.com/api'; // Make sure /api is added at the end!

// Global State
let globalHackathons = [];
let allProjects = [];
let currentFilterTag = 'all';

// --- GLOBAL DELETE HANDLERS ---
async function deleteHackathon(id) {
    if (!confirm("Are you sure you want to delete this hackathon?")) return;

    try {
        const res = await fetch(`${API_URL}/hackathons/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            await loadHackathons();
            await loadStats();
        } else {
            const data = await res.json();
            alert(`Error deleting hackathon: ${data.error || 'Server error'}`);
        }
    } catch (err) {
        console.error("Error deleting hackathon:", err);
    }
}

async function deleteIdea(id) {
    if (!confirm("Are you sure you want to delete this idea?")) return;

    try {
        const res = await fetch(`${API_URL}/ideas/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            await loadIdeas();
            await loadStats();
        } else {
            const data = await res.json();
            alert(`Error deleting idea: ${data.error || 'Server error'}`);
        }
    } catch (err) {
        console.error("Error deleting idea:", err);
    }
}

// --- STATS ENGINE ---
async function loadStats() {
    try {
        const res = await fetch(`${API_URL}/stats`);
        const stats = await res.json();
        
        document.getElementById('stat-repos').textContent = stats.totalRepos || 0;
        document.getElementById('stat-active').textContent = stats.activeBuilds || 0;
        document.getElementById('stat-wins').textContent = stats.hackathonWins || 0;
        document.getElementById('stat-ideas').textContent = stats.ideasCount || 0;
    } catch (err) {
        console.error("Error loading stats:", err);
    }
}

// --- PROJECTS ENGINE ---
function getProjectTags(p) {
    const raw = `${p.tags || ''},${p.tech_stack || ''}`;
    const tags = raw
        .split(/[,/]+/)
        .map(t => t.trim())
        .filter(t => t.length > 0 && t.toLowerCase() !== 'code');

    return tags.length > 0 ? tags : ['Project'];
}

async function loadProjects() {
    try {
        const res = await fetch(`${API_URL}/projects`);
        allProjects = await res.json();
        
        renderTagFilters();
        renderProjects();
    } catch (err) {
        console.error("Error loading projects:", err);
    }
}

function renderTagFilters() {
    const filterContainer = document.getElementById('tag-filters');
    if (!filterContainer) return;

    const tagSet = new Set();
    allProjects.forEach(p => {
        getProjectTags(p).forEach(tag => tagSet.add(tag));
    });

    const uniqueTags = Array.from(tagSet);

    let html = `
        <button 
            onclick="filterByTag('all')" 
            class="px-3 py-1 text-xs rounded-full transition-all ${
                currentFilterTag === 'all' 
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' 
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }"
        >
            All (${allProjects.length})
        </button>
    `;

    uniqueTags.forEach(tag => {
        const isSelected = currentFilterTag.toLowerCase() === tag.toLowerCase();
        html += `
            <button 
                onclick="filterByTag('${tag}')" 
                class="px-3 py-1 text-xs rounded-full transition-all ${
                    isSelected 
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' 
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                }"
            >
                ${tag}
            </button>
        `;
    });

    filterContainer.innerHTML = html;
}

function filterByTag(tag) {
    currentFilterTag = tag;
    renderTagFilters();
    renderProjects();
}

function renderProjects() {
    const container = document.getElementById('projects-container');
    if (!container) return;

    let filtered = allProjects;
    if (currentFilterTag !== 'all') {
        filtered = allProjects.filter(p => {
            const tags = getProjectTags(p);
            return tags.some(t => t.toLowerCase() === currentFilterTag.toLowerCase());
        });
    }

    if (filtered.length === 0) {
        container.innerHTML = `<p class="text-slate-400 text-sm">No projects found for tag "${currentFilterTag}".</p>`;
        return;
    }

    container.innerHTML = filtered.map(p => {
        const projectTags = getProjectTags(p);

        return `
            <div class="p-5 rounded-2xl bg-glass border border-glassBorder space-y-3 mb-3">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="flex items-center gap-2">
                            <h3 class="font-bold text-base text-slate-100">${p.title}</h3>
                            ${p.stars ? `<span class="text-xs text-amber-400 font-bold">⭐ ${p.stars}</span>` : ''}
                        </div>
                        <p class="text-xs text-slate-400 mt-1">${p.description || ''}</p>
                    </div>

                    <select 
                        onchange="updateProjectStatus(${p.id}, this.value)" 
                        class="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none"
                    >
                        <option value="ongoing" ${p.status === 'ongoing' ? 'selected' : ''}>🟢 Ongoing</option>
                        <option value="shipped" ${p.status === 'shipped' ? 'selected' : ''}>🚀 Shipped</option>
                        <option value="paused" ${p.status === 'paused' ? 'selected' : ''}>🟡 Paused</option>
                    </select>
                </div>

                <div class="flex gap-2 items-center flex-wrap">
                    ${projectTags.map(t => `
                        <span class="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-medium">${t}</span>
                    `).join('')}
                    ${p.repo_link || p.repo_url ? `<a href="${p.repo_link || p.repo_url}" target="_blank" class="text-xs text-slate-400 hover:text-cyan-400 ml-auto">🔗 Repo</a>` : ''}
                </div>

                <div class="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div class="bg-gradient-to-r from-cyan-400 to-pink-500 h-2 rounded-full transition-all duration-500" style="width: ${p.progress_percent || p.progress || 50}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

async function updateProjectStatus(id, newStatus) {
    try {
        await fetch(`${API_URL}/projects/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        await loadProjects();
        await loadStats();
    } catch (err) {
        console.error("Error updating status:", err);
    }
}

// --- HACKATHONS ENGINE (UPGRADED UI & STAGES) ---
function formatDate(isoStr) {
    if (!isoStr) return '';
    return isoStr.split('T')[0];
}

function renderTimerBubbles(startDateStr, endDateStr) {
    if (!startDateStr) return '';

    const now = new Date().getTime();
    const start = new Date(startDateStr).getTime();
    const end = new Date(endDateStr).getTime();
    const target = now < start ? start : end;

    const diff = Math.max(0, target - now);

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    return `
        <div class="grid grid-cols-4 gap-3 text-center my-2">
            <div class="bg-slate-800/40 backdrop-blur-md p-3 rounded-2xl border border-slate-700/50 shadow-inner">
                <span class="block text-2xl font-extrabold text-slate-100">${d}</span>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DAYS</span>
            </div>
            <div class="bg-slate-800/40 backdrop-blur-md p-3 rounded-2xl border border-slate-700/50 shadow-inner">
                <span class="block text-2xl font-extrabold text-slate-100">${h}</span>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">HRS</span>
            </div>
            <div class="bg-slate-800/40 backdrop-blur-md p-3 rounded-2xl border border-slate-700/50 shadow-inner">
                <span class="block text-2xl font-extrabold text-slate-100">${m}</span>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MIN</span>
            </div>
            <div class="bg-slate-800/40 backdrop-blur-md p-3 rounded-2xl border border-slate-700/50 shadow-inner">
                <span class="block text-2xl font-extrabold text-cyan-400">${s}</span>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SEC</span>
            </div>
        </div>
    `;
}

async function loadHackathons() {
    try {
        const res = await fetch(`${API_URL}/hackathons`);
        globalHackathons = await res.json();
        const container = document.getElementById('hackathons-container');

        if (!container) return;

        if (globalHackathons.length === 0) {
            container.innerHTML = '<p class="text-slate-400 text-sm">No hackathons scheduled.</p>';
            return;
        }

        container.innerHTML = globalHackathons.map(h => {
            // 5 Default stages matching design mockup
            let milestones = [
                { title: "1. Idea Validation", done: false },
                { title: "2. Architecture", done: false },
                { title: "3. Core Features", done: false },
                { title: "4. Polish", done: false },
                { title: "5. Video / Submission", done: false }
            ];

            try {
                if (h.milestones) milestones = JSON.parse(h.milestones);
            } catch (e) {}

            const completedCount = milestones.filter(m => m.done).length;
            const progressPercent = Math.round((completedCount / milestones.length) * 100);

            const platformName = h.platform ? (h.platform.charAt(0).toUpperCase() + h.platform.slice(1)) : 'Devfolio';
            const userTags = h.tags ? h.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

            return `
                <div class="p-6 rounded-3xl bg-gradient-to-b from-slate-900/80 to-slate-900/40 border border-slate-800/80 space-y-5 mb-5 shadow-2xl backdrop-blur-lg">
                    
                    <!-- Header Bar -->
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="font-extrabold text-xl text-slate-100 tracking-tight">${h.name}</h3>
                            <p class="text-xs text-slate-400 mt-1 flex items-center gap-1 font-medium">
                                <span>📅</span> ${platformName} · ${formatDate(h.start_date)} → ${formatDate(h.end_date || h.start_date)}
                            </p>
                        </div>
                        <div class="flex items-center gap-3">
                            <button 
                                type="button"
                                onclick="deleteHackathon(${h.id})" 
                                title="Delete Event"
                                class="text-slate-500 hover:text-rose-400 transition-colors p-1 text-sm"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>

                    <!-- 4 Circular Bubble Countdown Timers -->
                    <div id="timer-${h.id}">
                        ${renderTimerBubbles(h.start_date, h.end_date || h.start_date)}
                    </div>

                    <!-- Stage Progress Bar -->
                    <div class="space-y-1.5">
                        <div class="flex justify-between items-center text-[11px] font-semibold text-slate-400">
                            <span>Stage Progress</span>
                            <span class="text-cyan-400">${progressPercent}%</span>
                        </div>
                        <div class="w-full bg-slate-950/80 rounded-full h-1.5 overflow-hidden border border-slate-800">
                            <div class="bg-gradient-to-r from-cyan-400 to-indigo-500 h-1.5 rounded-full transition-all duration-300" style="width: ${progressPercent}%"></div>
                        </div>
                    </div>

                    <!-- 5 Stage Buttons (Turns Cyan/Blue when active) -->
                    <div class="flex flex-wrap gap-2 pt-1">
                        ${milestones.map((m, idx) => `
                            <button 
                                type="button"
                                onclick="toggleMilestone(${h.id}, ${idx})" 
                                class="text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 border ${
                                    m.done 
                                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-sm shadow-cyan-500/20' 
                                        : 'bg-slate-950/50 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200'
                                }"
                            >
                                ${m.done ? '✓ ' : ''}${m.title}
                            </button>
                        `).join('')}
                    </div>

                    <!-- Manual User Tags -->
                    ${userTags.length > 0 ? `
                        <div class="flex flex-wrap gap-2 pt-1">
                            ${userTags.map(tag => `
                                <span class="text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                                    ${tag}
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}

                    <!-- Event Page Link -->
                    ${h.event_url ? `
                        <div class="pt-1">
                            <a href="${h.event_url}" target="_blank" class="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                                ↗ Event page
                            </a>
                        </div>
                    ` : ''}

                </div>
            `;
        }).join('');

    } catch (err) {
        console.error("Error loading hackathons:", err);
    }
}

async function toggleMilestone(hackathonId, index) {
    const hackathon = globalHackathons.find(h => h.id === hackathonId);
    if (!hackathon) return;

    let milestones = [
        { title: "1. Idea Validation", done: false },
        { title: "2. Architecture", done: false },
        { title: "3. Core Features", done: false },
        { title: "4. Polish", done: false },
        { title: "5. Video / Submission", done: false }
    ];

    try {
        if (hackathon.milestones) milestones = JSON.parse(hackathon.milestones);
    } catch (e) {}

    milestones[index].done = !milestones[index].done;

    try {
        await fetch(`${API_URL}/hackathons/${hackathonId}/milestones`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ milestones })
        });
        await loadHackathons();
    } catch (err) {
        console.error("Error toggling milestone:", err);
    }
}

function initDateDropdowns() {
    const startDay = document.getElementById('start-day');
    const endDay = document.getElementById('end-day');
    if (!startDay || !endDay) return;

    let options = '<option value="">Day</option>';
    for (let i = 1; i <= 31; i++) {
        const val = i < 10 ? `0${i}` : `${i}`;
        options += `<option value="${val}">${i}</option>`;
    }
    startDay.innerHTML = options;
    endDay.innerHTML = options;
}

// --- IDEAS ENGINE ---
async function loadIdeas() {
    try {
        const res = await fetch(`${API_URL}/ideas`);
        const ideas = await res.json();

        const container = document.getElementById('ideas-container');
        if (!container) return;

        container.innerHTML = '';

        if (ideas.length === 0) {
            container.innerHTML = '<p class="text-slate-500 text-sm">No ideas saved yet.</p>';
            return;
        }

        ideas.forEach(idea => {
            const badgeColor = 
                idea.priority?.toLowerCase() === 'high' ? 'bg-pink-500/20 text-pink-300 border-pink-500/30' :
                idea.priority?.toLowerCase() === 'medium' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                'bg-slate-500/20 text-slate-300 border-slate-500/30';

            const ideaCard = `
                <div class="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 mb-2">
                    <div>
                        <h4 class="text-sm font-semibold text-slate-200">${idea.title}</h4>
                        ${idea.note ? `<p class="text-xs text-slate-400 mt-0.5">${idea.note}</p>` : ''}
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${badgeColor}">
                            ${idea.priority}
                        </span>
                        <button 
                            type="button"
                            onclick="deleteIdea(${idea.id})" 
                            title="Delete Idea"
                            class="text-xs text-slate-500 hover:text-rose-400 transition-colors px-1"
                        >
                            🗑️
                        </button>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', ideaCard);
        });
    } catch (err) {
        console.error("Error loading ideas:", err);
    }
}

// --- DOM INITIALIZATION & EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    initDateDropdowns();

    // Initial Data Fetching
    loadStats();
    loadProjects();
    loadHackathons();
    loadIdeas();

    // Live Second Clock Ticker
    setInterval(() => {
        if (globalHackathons.length > 0) {
            globalHackathons.forEach(h => {
                const timerEl = document.getElementById(`timer-${h.id}`);
                if (timerEl) {
                    timerEl.innerHTML = renderTimerBubbles(h.start_date, h.end_date || h.start_date);
                }
            });
        }
    }, 1000);

    // GitHub Sync Listener
    document.getElementById('github-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const usernameInput = document.getElementById('github-username');
        const username = usernameInput ? usernameInput.value.trim() : '';

        if (!username) return;

        try {
            const res = await fetch(`${API_URL}/projects/github-sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });

            const data = await res.json();
            
            if (res.ok) {
                usernameInput.value = '';
                await loadProjects();
                await loadStats();
            } else {
                alert(data.error || 'Failed to sync GitHub repos.');
            }
        } catch (err) {
            console.error("Error syncing GitHub:", err);
        }
    });

    // Hackathon Add Listener
    document.getElementById('hackathon-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nameEl = document.getElementById('hackathon-name');
        const platformEl = document.getElementById('hackathon-platform');
        const tagsEl = document.getElementById('hackathon-tags');
        const urlEl = document.getElementById('hackathon-url');

        const name = nameEl ? nameEl.value.trim() : '';
        const platform = platformEl ? platformEl.value.toLowerCase() : 'devfolio';
        const tags = tagsEl ? tagsEl.value.trim() : '';
        const event_url = urlEl ? urlEl.value.trim() : '';

        const directStart = document.getElementById('hackathon-start')?.value;
        const directEnd = document.getElementById('hackathon-end')?.value;

        let start_date = '';
        let end_date = '';

        if (directStart) {
            start_date = `${directStart}T00:00:00`;
            end_date = directEnd ? `${directEnd}T23:59:59` : `${directStart}T23:59:59`;
        } else {
            const startD = document.getElementById('start-day')?.value;
            const startM = document.getElementById('start-month')?.value;
            const startY = document.getElementById('start-year')?.value;

            const endD = document.getElementById('end-day')?.value;
            const endM = document.getElementById('end-month')?.value;
            const endY = document.getElementById('end-year')?.value;

            if (!startD || !startM || !startY || !endD || !endM || !endY) {
                return alert("Please select a valid Start and End date!");
            }

            start_date = `${startY}-${startM}-${startD}T00:00:00`;
            end_date = `${endY}-${endM}-${endD}T23:59:59`;
        }

        if (!name) return alert("Please enter a hackathon name!");

        try {
            const res = await fetch(`${API_URL}/hackathons`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, platform, start_date, end_date, tags, event_url })
            });

            if (res.ok) {
                nameEl.value = '';
                if (tagsEl) tagsEl.value = '';
                if (urlEl) urlEl.value = '';
                if (document.getElementById('hackathon-start')) document.getElementById('hackathon-start').value = '';
                if (document.getElementById('hackathon-end')) document.getElementById('hackathon-end').value = '';
                
                await loadHackathons();
                await loadStats();
            } else {
                const errorMsg = await res.json();
                alert(`Server error: ${errorMsg.error}`);
            }
        } catch (err) {
            console.error("Failed to post hackathon:", err);
        }
    });

    // Idea Add Listener
    document.getElementById('idea-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const titleInput = document.getElementById('idea-title');
        const noteInput = document.getElementById('idea-note');
        const priorityInput = document.getElementById('idea-priority');

        const newIdea = {
            title: titleInput ? titleInput.value.trim() : '',
            note: noteInput ? noteInput.value.trim() : '',
            priority: priorityInput ? priorityInput.value : 'Medium'
        };

        if (!newIdea.title) return alert("Please enter an idea title!");

        try {
            const res = await fetch(`${API_URL}/ideas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newIdea)
            });

            if (res.ok) {
                if (titleInput) titleInput.value = '';
                if (noteInput) noteInput.value = '';
                await loadIdeas();
                await loadStats();
            } else {
                const errData = await res.json();
                alert(`Error adding idea: ${errData.error || 'Server error'}`);
            }
        } catch (err) {
            console.error("Error adding idea:", err);
        }
    });
});