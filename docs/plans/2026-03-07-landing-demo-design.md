# Skima Landing Page + Online Demo — Design Document

**Date:** 2026-03-07
**Status:** Approved
**Goal:** Take Skima from desktop-only v1.0.0 to an online presence with landing page + playable demo at `skima.henfrydls.com`

---

## 1. Architecture Overview

```
skima.henfrydls.com/       -> LandingPage (if no cookie demo_active)
                           -> DashboardView (if cookie demo_active exists)
skima.henfrydls.com/demo   -> Seed data + set cookie + redirect to /
skima.henfrydls.com/*      -> Normal app (matrix, evolution, settings, etc.)
```

- Same repo, same Docker container
- `DEMO_MODE=true` env var controls everything
- Desktop/self-hosted users are completely unaffected

---

## 2. Server: Demo Mode Middleware

### New file: `server/src/middleware/demo.js`

Blocklist-based middleware registered as `app.use()` before all routes.
When `DEMO_MODE !== 'true'`, passes everything through (zero impact on desktop/self-hosted).

### Blocked endpoints (return 403)

| Category | Method | Path | Reason |
|----------|--------|------|--------|
| Hard delete | DELETE | `/api/skills/:id` | Permanent, cascades to assessments |
| Hard delete | DELETE | `/api/evaluations/:uuid` | Permanent |
| Hard delete | DELETE | `/api/role-profiles/:rol` | Permanent |
| Soft delete | DELETE | `/api/categories/:id` | Cascades to skills visibility |
| Soft delete | DELETE | `/api/collaborators/:id` | Breaks demo dataset |
| Nuclear | POST | `/api/reset-database` | Wipes everything |
| Setup | POST | `/api/setup` | Can wipe demo data |
| Seed | POST | `/api/seed-demo` | Should only run via cron |
| Reset | POST | `/api/reset-demo` | Degrades to empty state |
| Import | POST | `/api/import` | Wipes before importing |
| Credentials | PUT | `/api/config` | Could lock everyone out |

### Allowed

Everything else: all GETs, create, edit, login, evaluations, export, verify.

### Config endpoint change

`GET /api/config` adds `isOnlineDemo: process.env.DEMO_MODE === 'true'` to response.
Client reads it via `ConfigContext`.

---

## 3. Client: Routing with Cookie Guard

### App.jsx logic for route `/`

1. Read `isOnlineDemo` from ConfigContext
2. Check for cookie `demo_active`
3. If `isOnlineDemo && !demo_active` -> render `<LandingPage />`
4. If cookie exists -> render `<DashboardView />` as normal

### New route `/demo`

1. Call `POST /api/seed-demo` if data doesn't exist
2. Set cookie `demo_active=true` (24h expiry)
3. Redirect to `/`

### Cookie behavior

- Expires in 24h or with browser session
- Reset cron (every 6h) doesn't affect cookies
- User returns after reset -> has cookie -> sees dashboard with fresh data
- User returns after 24h -> no cookie -> sees landing again

---

## 4. Landing Page Design

### Sections (in order)

```
NAV:      Logo | GitHub star badge (shields.io) | [Try Demo]

HERO:     "Open source skills matrix for technical teams"
          "Track competencies, identify gaps, and measure growth.
           Desktop app. Local-first. Your data stays yours."
          [Try the Demo ->]  [Download on GitHub]
          [Dashboard screenshot]

WHY:      "Why not a spreadsheet?"
          - No history tracking
          - No visualization
          - No gap analysis
          "Skima gives you that without the enterprise price."

FEATURES: 4 cards (icon + title + one line)
          - Team Matrix
          - Evolution Tracking
          - Executive Dashboard
          - Role Profiles

TECH:     Badges: React | SQLite | Tauri | Win/Mac/Linux
          "One binary. No cloud. No tracking."

LICENSE:  "Free for personal use. Commercial license for businesses."

FOOTER:   [Try Demo] [Star on GitHub]
          "Made by DLSLabs"
```

### Visual style

- Reuse existing components: Button, Card, Badge
- Brand color: `#2d676e` (primary teal)
- Animations: `fade-in`, `hover-lift`, `animate-stagger`
- Screenshots from `docs/*.png`
- No illustrations, no stock photos
- System fonts (matches app)

---

## 5. UI Translation to English

Hardcoded string replacement (~30 strings). NOT i18n.

Examples:
- Navigation labels, page headers, buttons, placeholders
- "Evaluaciones" -> "Evaluations"
- "Colaboradores" -> "Collaborators"
- "Categorias" -> "Categories"

DemoBanner updated:
- "Demo mode - Data resets every 6 hours. Download for persistent data."
- CTA: "Download" -> GitHub Releases link
- "Configure my workspace" only visible if `!isOnlineDemo`

---

## 6. Infrastructure

### Docker

- Same `Dockerfile`, no changes
- `docker-compose.yml` adds `DEMO_MODE=true` env var
- `template.db` generated once with seed, copied into container

### Reset mechanism

```bash
# crontab -e on EC2 host
0 */6 * * * docker exec skima-demo cp /app/data/template.db /app/data/skills.db
```

### DNS and proxy

- Cloudflare DNS proxy for `skima.henfrydls.com` -> EC2
- Caddy reverse proxy on EC2 routing to container
- Cloudflare analytics (free, no code)
- Skima independent from portfolio (henfrydls.com) - separate Caddy config

### Blocker

Sprint 4 (deploy) requires either:
- Portfolio fixed (CSRF, emails) to share EC2
- OR Caddy serving both independently (preferred, decoupled)

---

## 7. Analytics

- Cloudflare DNS proxy provides free basic analytics (no code)
- Umami later if detailed metrics needed
- No internal analytics implementation

---

## 8. Email Capture

- NOT at launch
- Primary engagement: Star on GitHub
- Add Buttondown email capture after 100+ stars
- No popups, no gates

---

## 9. Sprint Plan

### Sprint 1: Demo Mode Backend (~2-3 days)
- Create `server/src/middleware/demo.js` (blocklist middleware)
- Add `isOnlineDemo` to `GET /api/config`
- Register middleware in `createApp()`
- Tests for demo middleware
- Docker compose with `DEMO_MODE=true`
- Fix v1.0.0 bugs (reported by user)

### Sprint 2: Landing Page (~2-3 days)
- Create `LandingPage.jsx` with all sections
- Cookie guard in `App.jsx`
- `/demo` route (seed + cookie + redirect)
- Optimize screenshots for web
- GitHub star badge (shields.io)

### Sprint 3: UI Translation (~1-2 days)
- Translate ~30 visible strings to English
- Update DemoBanner copy + CTA
- Update README with GIF + Star CTA + demo link

### Sprint 4: Deploy + Distribution (~1-2 days)
- PREREQ: Caddy serving skima.henfrydls.com independently
- Configure Cloudflare DNS
- Deploy container + cron reset
- Generate template.db
- Publish: r/selfhosted, Show HN, Dev.to

**Total estimate: ~6-10 days**

---

## 10. Decisions Log

| Decision | Chosen | Alternative |
|----------|--------|-------------|
| Landing placement | Same repo, route `/` with guard | Separate repo |
| Demo isolation | Shared instance + blocked deletes + 6h reset | Per-user SQLite sessions |
| Reset mechanism | Cron on host with `docker exec` | Cron in container |
| Cookie strategy | `demo_active` 24h cookie | localStorage flag |
| Email capture | Stars first, Buttondown later | Buttondown at launch |
| Analytics | Cloudflare DNS proxy | Umami / GA |
| UI language | Translate to English (hardcoded) | i18n system |
| DNS strategy | Independent from portfolio (Caddy) | Dependent on portfolio fix |
| Positioning | vs spreadsheets | vs enterprise software |

---

## 11. Validation Checklist

Before publishing to r/selfhosted and HN:

### Demo Mode Backend
- [ ] All DELETE endpoints return 403 in demo mode
- [ ] POST /api/setup, /api/reset-database, /api/import blocked (403)
- [ ] PUT /api/config blocked (403)
- [ ] Create/edit operations work normally
- [ ] `GET /api/config` returns `isOnlineDemo: true`
- [ ] Desktop/self-hosted unaffected (no DEMO_MODE = everything works)

### Landing + Routing
- [ ] Landing shows at `/` without cookie
- [ ] "Try Demo" seeds data, sets cookie, redirects to dashboard
- [ ] Cookie persists across page refresh
- [ ] Cookie expiry (24h) returns user to landing

### Reset Cron
- [ ] `docker exec skima-demo cp /app/data/template.db /app/data/skills.db` resets data
- [ ] User with cookie sees dashboard with fresh data after reset

### UI Translation
- [ ] No Spanish strings visible in any page
- [ ] DemoBanner: "Demo mode - Data resets every 6 hours"
- [ ] All sidebar, headers, buttons in English

### Infrastructure
- [ ] `dig skima.henfrydls.com` resolves to EC2 IP
- [ ] HTTPS works via Cloudflare
- [ ] Caddy reverse proxy returns 200 (no 502/504)
- [ ] Cloudflare analytics dashboard shows traffic

### Cross-browser
- [ ] Chrome desktop
- [ ] Firefox
- [ ] Safari
- [ ] Mobile responsive (landing CTAs clickeable)

### Smoke Test (5 min)
- [ ] Open incognito -> see landing
- [ ] Click "Try Demo" -> see dashboard
- [ ] Navigate matrix, evolution
- [ ] Create an evaluation -> saved
- [ ] Try to delete -> 403 error
- [ ] Click "Star on GitHub" -> opens repo
- [ ] Refresh -> stays on dashboard (cookie works)
