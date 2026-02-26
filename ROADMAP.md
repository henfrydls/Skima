# Product Roadmap — Skima (Skills Management App)

> Last Updated: 2026-02-21

## Vision
Sistema de gestion de competencias tecnicas para equipos, desde evaluacion basica hasta talent management completo. Empaquetado como app desktop multiplataforma con Tauri v2.

---

## Phase Map

```
 Phase 1    Phase 1.5     Phase 2       Phase 3       Phase 4-5
┌────────┬───────────┬───────────┬───────────┬───────────┐
│  MVP   │  Polish   │ Analytics │  Action   │  Talent & │
│  Core  │  Desktop  │ Insights  │  Layer    │  Perform  │
├────────┼───────────┼───────────┼───────────┼───────────┤
│ ✅Done │ ✅ v1.0.0 │ ⏳Planned │ ⏳Planned │ ⏳Planned │
└────────┴───────────┴───────────┴───────────┴───────────┘
```

---

## ✅ Phase 1: MVP Core (Completado)

**Objetivo:** Sistema usable para 1 manager con 5-10 personas

| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard KPIs | ✅ | Promedio, distribucion, alertas, executive metrics |
| Team Matrix | ✅ | Vista transpuesta, por persona, por area |
| Settings CRUD | ✅ | Colaboradores, Skills, Categorias, Role Profiles, Evaluaciones |
| Snapshot Selector | ✅ | Contexto temporal con comparacion |
| Evolution Page | ✅ | Graficas de evolucion, lista de mejora, metricas |
| Auth System | ✅ | JWT, bcrypt passwords, rate limiting, cross-tab sync |
| Profile Page | ✅ | Cambio de password, roles, preferencias |
| Demo Mode | ✅ | Modo de demo con datos de ejemplo |
| Contextual Help | ✅ | InfoPopovers en KPIs y metricas clave |

---

## ✅ Phase 1.5: Polish, Testing, Desktop & CI/CD (v1.0.0)

**Objetivo:** Estabilizar, testear, empaquetar como desktop app

| Feature | Status | Notes |
|---------|--------|-------|
| Component Refactoring | ✅ | SkillsDashboard monolito descompuesto en modulos |
| Test Coverage 80%+ | ✅ | 696 tests, 86/87/82/87 coverage |
| Tauri v2 Setup | ✅ | Desktop app con sidecar Node.js |
| Sidecar Lifecycle | ✅ | Spawn, health check, graceful shutdown |
| Dynamic DB Path | ✅ | SQLite en app data dir via --db-path |
| CI/CD Pipelines | ✅ | quality.yml (lint+test+coverage+audit) |
| Release Pipeline | ✅ | release.yml (Tauri matrix build Win/Linux/macOS) |
| Version Management | ✅ | v1.0.0 unificado, bump script |
| Security Hardening | ✅ | bcrypt passwords, rate limiting auth endpoints |
| README + Docs | ✅ | Screenshots, instalacion, arquitectura |

---

## ⏳ Phase 2: Analytics & Insights

**Objetivo:** Managers toman decisiones basadas en datos

| Feature | Status | Notes |
|---------|--------|-------|
| Stakeholder Views | ✅ | Manager/Director/HR toggle (MVP) |
| Manager Metrics | ✅ | Gaps, Bus Factor, Acciones (MVP) |
| Director Metrics | ✅ | Health Score, Competency Map (MVP) |
| HR Metrics (basico) | ✅ | Distribucion de talento (MVP) |
| Trend Analysis | 🔲 | Comparacion temporal real |
| Recommendations Engine | 🔲 | Reglas basicas if/then |
| PDF Export | 🔲 | Export evaluation as PDF from history |

---

## ⏳ Phase 3: Action Layer

**Objetivo:** Managers pueden ACTUAR sobre insights

| Feature | Status | Priority |
|---------|--------|----------|
| Course Assignments | 🔲 | P0 |
| Course Completion Tracking | 🔲 | P0 |
| IDPs (Individual Development Plans) | 🔲 | P1 |
| Notification System | 🔲 | P1 |
| Training Recommendations → Actions | 🔲 | P1 |

---

## ⏳ Phase 4: Talent Management

**Objetivo:** HR usa el sistema para planificacion de talento

| Feature | Status | Priority |
|---------|--------|----------|
| Succession Planning | 🔲 | P0 |
| Career Pathing | 🔲 | P1 |
| 9-Box Grid | 🔲 | P2 |
| High/Low Performer Tracking | 🔲 | P2 |

---

## ⏳ Phase 5: Performance Management

**Objetivo:** Conectar skills con performance (OKRs/KPIs)

| Feature | Status | Priority |
|---------|--------|----------|
| OKR Tracking | 🔲 | P1 |
| Goal Setting | 🔲 | P1 |
| Skills <-> Goals Mapping | 🔲 | P2 |
| Performance Reviews | 🔲 | P2 |

---

## Post v1.0.0 — UX Audit Findings

**Origen:** Auditoria UX/UI + Roleplay de 7 personas corporativas

| Feature | Solicitado por | Priority |
|---------|---------------|----------|
| Export/PDF (evaluaciones, reportes, dashboard) | Todos (7/7) | P0 |
| Vista personal "My Skills" (individual contributor) | Technician, HR, Engineering | P0 |
| Role-based access control (RBAC) | HR, Ops, CEO | P1 |
| Bulk operations (evaluaciones, colaboradores) | Forms audit, Ops, HR | P1 |
| Comparacion entre departamentos | CEO, CFO, Ops | P2 |
| Contexto financiero/costo de brechas | CFO, CEO | P2 |

---

## Future Considerations (No Committed)

- TypeScript migration
- Tauri SQL Plugin (Rust nativo, eliminar sidecar Node.js)
- AI/ML Recommendations
- Benchmark vs Industria
- Mobile App
- i18n (internationalization)
- Integrations (Slack, Teams, HRIS)
- In-App Help Phase 2 (GlossaryDrawer, FormulaExplainer, guided tour)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Completado |
| 🔄 | En progreso |
| 🔲 | Planificado |
| ⏳ | Fase futura |
