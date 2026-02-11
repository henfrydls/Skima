# Product Roadmap — Skills Matrix

> Last Updated: 2025-12-30

## Vision
Sistema de gestión de competencias técnicas para equipos, desde evaluación básica hasta talent management completo.

---

## Phase Map

```
 M1-2      M3-4         M5-7         M8-10       M11-12
┌──────┬──────────┬──────────┬──────────┬──────────┐
│ MVP  │ Analytics│  Action  │  Talent  │ Perform  │
│ Core │ Insights │  Layer   │  Mgmt    │  Mgmt    │
├──────┼──────────┼──────────┼──────────┼──────────┤
│✅Done│🔄Current │⏳Planned │⏳Planned │⏳Planned │
└──────┴──────────┴──────────┴──────────┴──────────┘
```

---

## ✅ Phase 1: MVP Core (Completado)

**Objetivo:** Sistema usable para 1 manager con 5-10 personas

| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard KPIs | ✅ | Promedio, distribución, alertas |
| Team Matrix | ✅ | Vista transpuesta, por persona, por área |
| Settings CRUD | ✅ | Colaboradores, Skills, Categorías |
| Reports básico | ✅ | Exports CSV/JSON, gap analysis |
| Snapshot Selector | ✅ | Contexto temporal |

---

## 🔄 Phase 2: Analytics & Insights (En Progreso)

**Objetivo:** Managers toman decisiones basadas en datos

| Feature | Status | Notes |
|---------|--------|-------|
| Stakeholder Views | ✅ | Manager/Director/HR toggle |
| Manager Metrics | ✅ | Gaps, Bus Factor, Acciones |
| Director Metrics | ✅ | Health Score, Competency Map |
| HR Metrics (básico) | ✅ | Distribución de talento |
| Evaluation Snapshots | ✅ | Collaborator name/role stored at eval time |
| Trend Analysis | 🔲 | Comparación temporal real |
| Recommendations Engine | 🔲 | Reglas básicas if/then |
| PDF Export | 🔲 | Export evaluation as PDF from history |

---

## ⏳ Phase 3: Action Layer (Q2 2025)

**Objetivo:** Managers pueden ACTUAR sobre insights

| Feature | Status | Priority |
|---------|--------|----------|
| Course Assignments | 🔲 | P0 |
| Course Completion Tracking | 🔲 | P0 |
| IDPs (Individual Development Plans) | 🔲 | P1 |
| Notification System | 🔲 | P1 |
| Training Recommendations → Actions | 🔲 | P1 |

**Validation Gate:**
- ¿Managers crean IDPs desde la app?
- ¿Colaboradores completan trainings asignados?

---

## ⏳ Phase 4: Talent Management (Q3 2025)

**Objetivo:** HR usa el sistema para planificación de talento

| Feature | Status | Priority |
|---------|--------|----------|
| Succession Planning | 🔲 | P0 |
| Career Pathing | 🔲 | P1 |
| 9-Box Grid | 🔲 | P2 |
| High/Low Performer Tracking | 🔲 | P2 |

**Dependencies:**
- Requiere IDPs maduros (Phase 3)
- Requiere skill requirements por rol

---

## ⏳ Phase 5: Performance Management (Q4 2025)

**Objetivo:** Conectar skills con performance (OKRs/KPIs)

| Feature | Status | Priority |
|---------|--------|----------|
| OKR Tracking | 🔲 | P1 |
| Goal Setting | 🔲 | P1 |
| Skills ↔ Goals Mapping | 🔲 | P2 |
| Performance Reviews | 🔲 | P2 |

**Validation Gate:**
- ¿Managers usan OKRs o prefieren solo skills?
- ¿Integración añade valor o complejidad?

---

## 🔮 Future Considerations (No Committed)

- AI/ML Recommendations
- Benchmark vs Industria
- Mobile App
- Integrations (Slack, Teams, HRIS)
- Usability Testing (Pruebas con usuarios reales)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Completado |
| 🔄 | En progreso |
| 🔲 | Planificado |
| ⏳ | Fase futura |
