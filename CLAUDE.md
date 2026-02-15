# Skima - Contexto del Proyecto

## 1. CONTEXTO DEL PROYECTO SKIMA

- **Producto:** App full-stack FOSS de gestion de competencias tecnicas para equipos
- **Stack:** React 19 + Vite 7 + Tailwind CSS 3.4 + Express 5 + Prisma 6 + SQLite
- **Monorepo:** `client/` (SPA) + `server/` (API REST) + `src-tauri/` (desktop, pendiente)
- **Estado actual:** Final de Fase 1.5 (CI/CD) en rama `feature/phase-1.5-cicd` (30 commits adelante de `main`)
- **Objetivo MVP:** Estabilizar, testear al 80-90%, empaquetar como app desktop con Tauri v2 (Windows, Linux, macOS)
- **Licencia:** MIT

### Instrucciones del repo
- Nunca realizar merge de PR en Github
- No colocar en los commits, issues o PR que fue creado por claude

---

## 2. DECISIONES ARQUITECTONICAS CLAVE

| Decision | Elegido | Alternativa (backlog) |
|----------|---------|----------------------|
| Desktop packaging | Tauri v2 con sidecar (pkg) para backend Node.js | Tauri SQL Plugin (Rust nativo) - futuro |
| SkillsDashboard.jsx (94KB) | Refactorizar ANTES de tests | Tests primero |
| Subagentes | 4 custom + 3 cherry-picked de awesome-claude-code-subagents | Todos genericos |
| Coverage target | 80% lines/functions/statements, 70% branches | - |
| TypeScript | Fuera de scope MVP | Migracion gradual futura |

---

## 3. PLAN APROBADO (5 FASES)

### FASE A: Setup de Subagentes (~1 dia)
- **Objetivo:** Crear 4 agentes custom + instalar 3 genericos en `.claude/agents/`
- **Archivos a crear:** `skima-test-agent.md`, `skima-refactor-agent.md`, `skima-tauri-agent.md`, `skima-qa-agent.md`, `code-reviewer.md`, `documentation-engineer.md`, `devops-engineer.md`
- **Validacion:** Agentes accesibles desde Claude Code

### FASE B: Estabilizacion y Refactoring (~3-4 dias)
- **Objetivo:** Verificar funcionalidad, refactorizar monolito, limpiar deuda tecnica
- **B1:** Verificar cada ruta funciona (`/setup`, `/`, `/team-matrix`, `/evolution`, `/settings`, `/profile`)
- **B2:** Descomponer `client/src/SkillsDashboard.jsx` (94KB) en componentes modulares (<500 lineas)
- **B3:** Actualizar README, ROADMAP, limpiar legacy code
- **Archivos criticos:** `SkillsDashboard.jsx`, `DashboardView.jsx`, `dashboardLogic.js`, `skillsLogic.js`
- **Validacion:** Todas las rutas funcionan, tests existentes pasan, cero regresiones

### FASE C: Testing al 80-90% (~5-7 dias)
- **Objetivo:** Cobertura de tests >80% en todo el codebase
- **C1:** Configurar coverage reporting en client + server
- **C2:** Tests lib/ (TIER 1): `dashboardLogic.js`, `skillsLogic.js`, `evolutionLogic.js`
- **C3:** Tests contextos/hooks (TIER 1): `AuthContext`, `ConfigContext`, `useEvolutionData`
- **C4:** Tests componentes (TIER 2): common/, dashboard/, matrix/, evolution/, settings/, auth/, layout/
- **C5:** Tests paginas (TIER 2): 6 paginas principales
- **C6:** Tests servidor (TIER 1): auth routes, evolution routes, middleware, expandir api.test.js
- **C7:** Actualizar CI/CD con coverage threshold
- **Validacion:** `npm run test:coverage` reporta >80% en todas las metricas

### FASE D: Integracion Tauri (~3-4 dias)
- **Objetivo:** App desktop multiplataforma con Tauri v2
- **D1:** Setup Tauri v2 + configuracion (`src-tauri/`, `tauri.conf.json`)
- **D2:** Compilar backend como sidecar con `pkg` (3 plataformas)
- **D3:** Resolver Prisma bundling (engine binaries, migraciones, SQLite path en app data dir)
- **D4:** Startup: spawn sidecar, health check, graceful shutdown
- **D5:** Builds: `.exe` (Win), AppImage (Linux), `.dmg` (macOS) + GitHub Actions matrix
- **Validacion:** `npm run tauri build` genera ejecutables funcionales

### FASE E: MVP Launch Polish (~1-2 dias)
- **Objetivo:** Documentacion final, release v1.0.0
- **E1:** Actualizar README, ROADMAP, TODO, docs de instalacion por plataforma
- **E2:** PR a main, tag v1.0.0, GitHub Release con binarios
- **Validacion:** Release publicado con binarios para 3 plataformas

---

## 4. SUBAGENTES DEL PROYECTO

### Custom (stack-aware)
| Agente | Rol | Modelo |
|--------|-----|--------|
| `skima-test-agent` | Testing: Vitest + React Testing Library + Supertest. Conoce schema Prisma y componentes | sonnet |
| `skima-refactor-agent` | Refactoring: descomponer monolitos, extraer hooks, crear service layer | sonnet |
| `skima-tauri-agent` | Tauri v2: sidecar con pkg, config, builds multiplataforma | sonnet |
| `skima-qa-agent` | QA: validar flujos E2E, detectar bugs, verificar UX | sonnet |

### Genericos (cherry-picked de awesome-claude-code-subagents)
| Agente | Rol | Modelo |
|--------|-----|--------|
| `code-reviewer` | Reviews de seguridad y calidad (OWASP, SOLID) | opus |
| `documentation-engineer` | Actualizar README, ROADMAP, docs | haiku |
| `devops-engineer` | CI/CD para Tauri builds multiplataforma | sonnet |

---

## 5. ARCHIVOS CRITICOS Y ESTRUCTURA

### Estructura del proyecto
```
skills-dashboard/
├── client/src/
│   ├── SkillsDashboard.jsx    ← MONOLITO 94KB (refactorizar en Fase B)
│   ├── App.jsx                 (Router + guards)
│   ├── components/
│   │   ├── auth/               (LoginModal, ProtectedRoute)
│   │   ├── common/             (Button, Card, Badge, StatCard, etc. - 13+ componentes)
│   │   ├── dashboard/          (ExecutiveKPIGrid, DashboardHeader, SnapshotSelector, StrategicInsights)
│   │   ├── evolution/          (EvolutionChart, EvolutionList)
│   │   ├── layout/             (Layout, SidebarUser)
│   │   ├── matrix/             (TransposedMatrixTable, CollaboratorList, etc.)
│   │   └── settings/           (CategoriesTab, CollaboratorsTab, SkillsTab, EvaluationsTab, RoleProfilesTab)
│   ├── pages/                  (DashboardView, TeamMatrixPage, EvolutionPage, SettingsPage, ProfilePage, SetupView)
│   ├── contexts/               (AuthContext, ConfigContext)
│   ├── hooks/                  (useEvolutionData)
│   ├── lib/                    (dashboardLogic, skillsLogic, evolutionLogic, timeLogic)
│   └── data/                   (richSeedData.js)
├── server/src/
│   ├── index.js                (rutas, middleware, config endpoints)
│   ├── routes/                 (auth.js, evolution.js)
│   ├── middleware/             (auth.js - JWT)
│   └── prisma/                 (schema.prisma, seed.js, skills.db)
├── .github/workflows/          (build.yml, quality.yml)
└── docs/                       (visual-identity.md)
```

### Rutas del frontend
- `/setup` → SetupView (SetupPageGuard)
- `/` → DashboardView (Layout)
- `/team-matrix` → TeamMatrixPage (Layout, 3 vistas: matriz/persona/area)
- `/evolution` → EvolutionPage (Layout)
- `/settings` → SettingsPage (Layout + ProtectedRoute)
- `/profile` → ProfilePage (Layout + ProtectedRoute)

### DB Schema (Prisma - 8 modelos)
Category, Skill, Collaborator, Assessment, Snapshot, RoleProfile, EvaluationSession, SystemConfig

### Libs a testear (TIER 1 - funciones puras)
- `lib/dashboardLogic.js` → calculateDelta, getTopChanges, calculateDistribution, prioritizeGaps, calculateExecutiveMetrics
- `lib/skillsLogic.js` → evaluarSkill, calculateSessionAverage, identifyGaps, identifyStrengths, getSkillLevelStatus
- `lib/evolutionLogic.js` → transformChartData, transformEmployeesForList, getTopImprover, getSupportCount
- `lib/timeLogic.js` → generateTimePeriods, getSnapshotData, getPreviousPeriodDate (YA TIENE TESTS)

### Contextos a testear (TIER 1)
- `AuthContext` → login, logout, token persistence, authFetch 401 handling, cross-tab sync
- `ConfigContext` → fetch config, isSetup state, onSetupComplete
- `useEvolutionData` → fetch, loading/error states, refetch, timeRange change

---

## 6. CRITERIOS DE EXITO MVP

- [ ] Todas las rutas funcionan sin errores en consola
- [ ] `npm run test:coverage` reporta >80% en lines/functions/statements, >70% branches
- [ ] `npm run build` exitoso sin warnings criticos
- [ ] `npm run tauri build` genera ejecutables para Win/Linux/macOS
- [ ] PR a main pasa todos los checks (lint, test, build, coverage)
- [ ] Desktop app abre correctamente
- [ ] Backend sidecar arranca automaticamente
- [ ] Datos persisten entre sesiones (SQLite en app data dir)
- [ ] Release v1.0.0 publicado con binarios

---

## 7. BACKLOG FUERA DE SCOPE MVP

- Migracion a Tauri SQL Plugin (Rust nativo) para reducir tamano de app
- TypeScript migration
- Fase 2: Admin Power (CRUD real de Skills/Categorias, Auth avanzada)
- Fase 2.1: Demo Mode (datos de ejemplo, flujo de bienvenida)
- Fase 3: Time Travel (historial de snapshots, comparacion temporal)
- Fases 4-5: Talent Management, Performance Management
- i18n, Mobile App, AI/ML, Integraciones (Slack/Teams)
- Electron Desktop App → reemplazado por Tauri
- In-App Help Phase 2: GlossaryDrawer (cajón lateral con glosario completo, accesible desde icono ? en nav)
- In-App Help Phase 2: FormulaExplainer (visualización interactiva: nivel × frecuencia × criticidad = score)
- In-App Help Phase 2: HelpBanner (banner contextual dismissible en primera visita a cada página)
- In-App Help Phase 2: Tour guiado en Demo (botón "Iniciar Tour" en DemoBanner que resalta features)

---

## 8. COMANDOS UTILES

```bash
# Desarrollo
npm install                  # Instala root + client + server
npm run dev                  # Client (5173) + Server (3001) en paralelo
npm run dev:client           # Solo frontend
npm run dev:server           # Solo backend

# Database
npm run db:migrate           # Prisma migrations
npm run db:push              # Sync schema
npm run db:seed              # Cargar datos demo

# Testing
npm test                     # Todos los tests
npm run test:client          # React tests
npm run test:server          # API tests
npm run lint                 # ESLint client

# Build
npm run build                # Client + Server production builds
npm run build:client         # Frontend dist/
```

---

## 9. PATRONES DEL PROYECTO

- **State management:** Context API (AuthContext, ConfigContext, DataContext) - no Redux/Zustand
- **Data fetching:** fetch() directo en componentes/hooks (sin service layer aun)
- **Styling:** Tailwind CSS con paleta custom (primary: #2d676e)
- **Animations:** Framer Motion (200-300ms transitions)
- **Icons:** Lucide React
- **Charts:** Recharts
- **Testing:** Vitest + React Testing Library (client), Vitest + Supertest (server)
- **Auth:** JWT en localStorage, authFetch() wrapper, cross-tab sync
- **Barrel exports:** `index.js` en carpetas de componentes
- **Skill evaluation:** Weighted formula (nivel x frecuencia x criticidad)
- **Thresholds:** COMPETENT >= 2.5, STRENGTH >= 3.5, GOAL = 4.0
