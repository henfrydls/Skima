<p align="center">
  <img src="client/public/skima-full.svg" alt="Skima" width="280" />
</p>
<p align="center">
  A local-first talent intelligence platform for tracking team competencies.<br/>
  No account, no cloud, no tracking — all data stays on your device.
</p>
<p align="center">
  <a href="#installation">Install</a> &middot;
  <a href="#features">Features</a> &middot;
  <a href="#screenshots">Screenshots</a> &middot;
  <a href="#tech-stack">Tech Stack</a> &middot;
  <a href="#license">License</a>
</p>

---

## Features

- **Executive Dashboard** — KPIs, gap analysis, and trend tracking at a glance
- **Team Skills Matrix** — transposed heatmap view showing strengths and gaps across the team
- **Collaborator Profiles** — individual evolution sparklines and skill breakdowns
- **Evaluation System** — weighted formula (level x frequency x criticality) for objective scoring
- **Role Profiles** — define expected competencies per role and track alignment
- **Time Travel** — compare team state across quarters, semesters, and years
- **Demo Mode** — explore with rich sample data before configuring your own
- **Export / Import** — move data in and out as needed
- **Cross-platform Desktop** — Windows, macOS, and Linux via Tauri 2
- **Offline-first** — works 100% offline, all data stored locally in SQLite

---

## Screenshots

<p align="center">
  <img src="https://github.com/user-attachments/assets/d1f1dd4e-ad8a-48b5-aa3d-890d3cacd373" alt="Executive Dashboard" width="800" />
</p>
<p align="center">
  <em>Executive Dashboard — Team KPIs, gap analysis, and trend tracking</em>
</p>

---

## Installation

### Desktop App

Download the latest release for your platform from [GitHub Releases](https://github.com/henfrydls/skills-dashboard/releases):

| Platform | Format |
|----------|--------|
| Windows | `.exe` installer |
| macOS | `.dmg` disk image |
| Linux | `.deb` / `.AppImage` |

### From Source

Requires **Node.js 20+**. Optionally install **Rust** if you want to build the desktop app.

```bash
git clone https://github.com/henfrydls/skills-dashboard.git
cd skills-dashboard
npm install
```

Initialize the database on first run:

```bash
npm run db:migrate
npm run db:seed          # Optional: load demo data
```

Start the development server:

```bash
npm run dev
```

The frontend runs at `http://localhost:5173` and the API at `http://localhost:3001`.

---

<details>
<summary><strong>Development and Testing</strong></summary>

### Commands

```bash
npm install              # Install all dependencies (root + client + server)
npm run dev              # Start client (5173) + server (3001) concurrently
npm run dev:client       # Frontend only
npm run dev:server       # Backend only
npm run build            # Production build (client + server)
npm run tauri:build      # Build desktop installer (requires Rust)
```

### Database

```bash
npm run db:migrate       # Run Prisma migrations
npm run db:push          # Sync schema without migration
npm run db:seed          # Load demo data
```

### Testing

```bash
npm test                 # All tests (729 tests, 80%+ coverage)
npm run test:client      # React component and logic tests (668 tests)
npm run test:server      # API and middleware tests (61 tests)
npm run test:coverage    # Full coverage report (client + server)
```

### Project Structure

```
client/src/
  components/
    auth/                # LoginModal, ProtectedRoute
    common/              # Button, Card, Badge, StatCard, etc.
    dashboard/           # ExecutiveKPIGrid, DashboardHeader, StrategicInsights
    evolution/           # EvolutionChart, EvolutionList
    layout/              # Layout, Sidebar
    matrix/              # TransposedMatrixTable, CollaboratorList
    settings/            # CategoriesTab, CollaboratorsTab, SkillsTab
  contexts/              # AuthContext, ConfigContext
  hooks/                 # useEvolutionData
  lib/                   # dashboardLogic, skillsLogic, evolutionLogic
  pages/                 # DashboardView, TeamMatrixPage, EvolutionPage
  App.jsx

server/src/
  routes/                # auth.js, evolution.js, demo.js
  middleware/            # auth.js (JWT)
  data/                  # seedData.js
  db.js                  # Prisma client + dynamic DB path
  index.js               # Express app + all routes
```

</details>

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 7 |
| Styling | Tailwind CSS 3.4 |
| Backend | Express 5, Prisma 6 |
| Database | SQLite |
| Desktop | Tauri 2 |
| Testing | Vitest, React Testing Library (729 tests, 80%+ coverage) |
| CI/CD | GitHub Actions |

---

## License

[MIT](LICENSE) -- DLSLabs
