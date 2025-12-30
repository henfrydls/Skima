# PRODUCT STRATEGY — UX/UI Phasing Approach
**Skills Matrix FOSS — Build vs Design Strategy**

> **Question:** ¿Diseñar toda la UX/UI ahora (incluyendo IDPs, Succession, Courses, OKRs) y luego implementar? O ¿diseñar en fases alineadas con desarrollo?
>
> **TL;DR:** NO diseñar todo ahora. Ir por fases validadas. Razón: evitar desperdicio, validar con usuarios reales, mantener momentum.

---

## I. ANÁLISIS DEL PROBLEMA

### 1.1 Lo que tienes HOY (Implementado)

**✅ Funcional:**
- Dashboard con KPIs básicos
- Team Matrix (matriz transpuesta, vistas por persona/categoría)
- SnapshotSelector (contexto temporal)
- Reports parcial (exports CSV/JSON, gap analysis)
- Navigation sidebar

**❌ Faltante (Blocking):**
- **Settings** (CRÍTICO: sin esto, no hay CRUD de colaboradores/skills/categorías)

**🟡 Incompleto:**
- Reports (stakeholder views diseñadas pero no implementadas)
- Snapshot creation (botón existe, sin funcionalidad)

---

### 1.2 Features Avanzadas Mencionadas en Reporte

**Categoría A: Talent Management**
- IDPs (Individual Development Plans)
- Succession Planning
- High/Low Performer identification
- Career pathing

**Categoría B: Learning & Development**
- Course catalog integration
- Training assignments
- Course completion tracking
- Learning paths
- Budget tracking (training ROI)

**Categoría C: Performance Management**
- OKR tracking
- KPI dashboards
- Performance reviews
- Goal setting

**Categoría D: Advanced Analytics**
- Predictive analytics (quién necesitará training)
- Benchmark vs industria
- Team composition optimization
- AI recommendations (ML-based)

---

## II. APPROACH STRATEGIES — Pros & Cons

### Strategy 1: Big Design Upfront (BDUF)

**Descripción:**
Diseñar TODA la UX/UI ahora (incluyendo IDPs, OKRs, Courses, etc.) en Figma/wireframes, luego implementar en fases.

**✅ Pros:**
1. **Visión completa:** Arquitectura de información coherente desde el inicio
2. **Consistency:** Patrones de diseño uniformes en todas las features
3. **Stakeholder buy-in:** Presentar visión completa para aprobación/fundraising
4. **Design reuse:** Componentes diseñados una vez, reutilizados en implementación

**❌ Cons (CRÍTICOS):**
1. **Desperdicio:** 70% de features diseñadas nunca se usan (dato: Standish Group)
2. **Assumptions no validadas:** Diseñas IDPs asumiendo necesidad, pero usuarios tal vez quieren otra cosa
3. **Rework costoso:** Si cambias arquitectura después, redesign masivo
4. **Parálisis por análisis:** Meses diseñando, 0 usuarios reales probando
5. **Momentum loss:** Equipo pierde motivación esperando a "terminar diseño"
6. **Technical debt ignorado:** Diseños que son imposibles/costosos de implementar
7. **Context switching:** Cuando implementes Feature Z (6 meses después), habrás olvidado por qué diseñaste así

**Verdict:** ❌ NO RECOMENDADO para productos FOSS/SaaS modernos

---

### Strategy 2: Iterative Design (Agile/Lean UX)

**Descripción:**
Diseñar en "oleadas" (waves) alineadas con sprints de desarrollo. Diseño → Build → Validate → Next wave.

**✅ Pros:**
1. **User validation temprana:** Usuarios prueban MVP, das feedback, ajustas antes de seguir
2. **Reduced waste:** Solo diseñas lo que realmente se construirá en próximos 2-4 semanas
3. **Flexibility:** Puedes cambiar prioridades basado en feedback real
4. **Faster time-to-value:** Usuarios obtienen valor en semanas, no meses
5. **Team momentum:** Ciclos cortos mantienen energía alta
6. **Technical feasibility:** Diseñadores y devs trabajan juntos, evitan diseños imposibles
7. **Learning compuesto:** Cada wave informa la siguiente

**❌ Cons:**
1. **Requiere disciplina:** Fácil perder visión global si no hay roadmap claro
2. **Potential inconsistencies:** Si no hay design system, cada wave puede divergir
3. **Stakeholder uncertainty:** "¿Cuándo estará listo TODO?" → respuesta: nunca, es continuo

**Verdict:** ✅ RECOMENDADO para Skills Matrix (product moderno, equipo pequeño)

---

### Strategy 3: Hybrid (Vision + Iteration)

**Descripción:**
Tener una **visión de alto nivel** (roadmap visual) pero **diseñar en detalle** solo lo que se construirá en próximas 2-4 semanas.

**Estructura:**
```
Vision Layer (High-Level)
└─ Roadmap visual: Qué features existirán (sin detalles)
└─ IA general: Cómo se conectan las secciones
└─ Design principles: Guías para mantener consistencia

Detailed Design Layer (Tactical)
└─ Wave 1: Settings CRUD (wireframes hi-fi + specs)
└─ Wave 2: Stakeholder Reports (layouts detallados)
└─ Wave 3: [TBD basado en feedback de Waves 1-2]
```

**✅ Pros:**
- Combina lo mejor de ambos mundos
- Visión para stakeholders, agilidad para equipo
- Evita desperdicio pero mantiene coherencia

**❌ Cons:**
- Requiere actualizar visión periódicamente
- Puede ser confuso si no se comunica bien

**Verdict:** ✅✅ **RECOMENDADO FUERTEMENTE** para Skills Matrix

---

## III. RECOMENDACIÓN: HYBRID APPROACH

### 3.1 Principio Guía

**"Design just enough, just in time"**

```
┌─────────────────────────────────────────────────┐
│ VISION LAYER (Alta nivel)                       │
│ ├─ Product Roadmap (12-18 meses)                │
│ ├─ Feature Categories (Talent, L&D, Perf)       │
│ └─ IA skeleton (cómo se conecta todo)           │
│                                                  │
│     ↓ Se actualiza cada 3 meses                 │
│                                                  │
├─────────────────────────────────────────────────┤
│ DETAILED DESIGN (Próximas 2-4 semanas)          │
│ ├─ Wireframes hi-fi                             │
│ ├─ Component specs                              │
│ ├─ Interaction flows                            │
│ ├─ Edge cases                                   │
│ └─ Responsive layouts                           │
│                                                  │
│     ↓ Actualizado cada sprint                   │
│                                                  │
├─────────────────────────────────────────────────┤
│ BUILT & VALIDATED                                │
│ └─ Features en producción con usuarios reales   │
└─────────────────────────────────────────────────┘
```

---

### 3.2 Roadmap Propuesto (12 meses)

#### PHASE 1: MVP Core (MES 1-2)
**Objetivo:** Sistema usable para 1 team manager con 5-10 personas

**Features:**
- ✅ Settings (CRUD completo: Colaboradores, Skills, Categorías)
- ✅ Dashboard básico (ya existe, mantener)
- ✅ Team Matrix (ya existe, mantener)
- ✅ Reports básico (exports + gap analysis)

**UX/UI Work:**
- Diseñar: Settings completo (tabs, forms, validations)
- Refinar: Reports consistency (ExportButton, spacing, typography)
- Mantener: Dashboard y Matrix (no tocar)

**Validation Gate:**
- ✓ ¿Un team manager puede evaluar a su equipo sin ayuda técnica?
- ✓ ¿Puede exportar un reporte para su director en < 2 min?

**NO incluir aún:**
- ❌ IDPs
- ❌ Course tracking
- ❌ Succession planning
- ❌ OKRs

---

#### PHASE 2: Analytics & Insights (MES 3-4)
**Objetivo:** Managers toman decisiones basadas en datos

**Features:**
- ✅ Stakeholder views (Manager/Director/HR)
- ✅ Trend analysis (comparación temporal real, no mock)
- ✅ Bus Factor detection
- ✅ Recommendations engine (básico: reglas if/then)

**UX/UI Work:**
- Diseñar: 3 stakeholder layouts (Manager, Director, HR)
- Diseñar: TrendComparisonChart component
- Diseñar: RecommendationsWidget

**Validation Gate:**
- ✓ ¿Diferentes roles encuentran valor en "su" vista?
- ✓ ¿Las recomendaciones son accionables?

**NO incluir aún:**
- ❌ IDPs (necesita primero validar que recomendations son útiles)
- ❌ Course catalog
- ❌ OKRs

---

#### PHASE 3: Action Layer (MES 5-7)
**Objetivo:** Managers pueden ACTUAR sobre insights (no solo verlos)

**Features:**
- ✅ Training Recommendations → Course assignments
- ✅ Gap → IDP creation (básico)
- ✅ Notification system (email/in-app)

**UX/UI Work:**
- **AHORA SÍ diseñar IDPs** (porque ya validaste que gaps + recommendations funcionan)
- Diseñar: Course assignment flow
- Diseñar: Notification center

**Validation Gate:**
- ✓ ¿Managers realmente crean IDPs desde la app?
- ✓ ¿Colaboradores completan trainings asignados?

**NO incluir aún:**
- ❌ OKRs (diferente dominio)
- ❌ Succession planning (requiere IDPs maduros)

---

#### PHASE 4: Talent Management (MES 8-10)
**Objetivo:** HR usa el sistema para talent planning

**Features:**
- ✅ Succession Planning
- ✅ Career Pathing
- ✅ High/Low Performer tracking
- ✅ 9-Box Grid

**UX/UI Work:**
- Diseñar: Succession planning matrix
- Diseñar: Career path visualizations
- Diseñar: 9-Box interface

**Validation Gate:**
- ✓ ¿HR puede identificar sucesores en < 5 min?
- ✓ ¿Data de skills informa decisiones de promoción?

---

#### PHASE 5: Performance Management (MES 11-12)
**Objetivo:** Conectar skills con performance (OKRs/KPIs)

**Features:**
- ✅ OKR tracking
- ✅ Goal setting
- ✅ Performance reviews (integración con skills)

**UX/UI Work:**
- Diseñar: OKR module (nueva sección)
- Diseñar: Skills ↔ Goals mapping

**Validation Gate:**
- ✓ ¿Managers usan OKRs O prefieren solo skills?
- ✓ ¿Integración añade valor o complejidad?

---

### 3.3 Visual Roadmap

```
TIMELINE (12 meses)

│ M1-2  │ M3-4  │ M5-7      │ M8-10     │ M11-12   │
├───────┼───────┼───────────┼───────────┼──────────┤
│ MVP   │Analytics│ Action   │  Talent   │ Perform  │
│ Core  │Insights │ Layer    │   Mgmt    │   Mgmt   │
│       │        │          │           │          │
│Settings│Stakehldr│IDPs     │Succession │OKRs      │
│Reports │Views   │Courses   │9-Box      │Goals     │
│       │Trends  │Notifs    │Career Path│Reviews   │
│       │BusFctr │          │           │          │
└───────┴────────┴──────────┴───────────┴──────────┘
   ↓        ↓         ↓           ↓          ↓
 DESIGN   DESIGN    DESIGN     DESIGN     DESIGN
   NOW    IN M2     IN M4      IN M7      IN M10

Legend:
━━━ Design now (detailed)
┄┄┄ Design later (vision only)
```

---

## IV. QUÉ DISEÑAR AHORA vs DESPUÉS

### 4.1 DISEÑAR AHORA (Próximas 2-4 semanas)

**Priority P0 (Blocking):**
1. **Settings Page completo**
   - Wireframes hi-fi (Figma)
   - Tabs: Colaboradores, Skills, Categorías
   - Forms: Create/Edit modals
   - Tables: Inline editing patterns
   - Drag-drop: Category reordering
   - Empty states
   - Error states
   - Responsive layouts

**Priority P1 (High value):**
2. **Reports Consistency Fixes**
   - ExportButton redesign (5 states)
   - GapAnalysisSection (background neutral)
   - Typography standardization
   - Spacing fixes

3. **Stakeholder Toggle + Basic Layouts**
   - StakeholderToggle component
   - Manager view layout (sin IDPs, solo gaps + recommendations)
   - Director view layout (Health Score + heatmap)
   - HR view layout (distribution, SIN succession planning)

**Deliverables UX:**
- ✅ Figma file con 10-15 screens
- ✅ Component specs document
- ✅ Interaction flows (Create collab, Edit skill, etc.)
- ✅ Design system tokens (colors, spacing, typography)

**Tiempo estimado:** 1-2 semanas de diseño

---

### 4.2 VISIÓN (Alta nivel) - NO Detailed Design

**Para incluir en roadmap visual, pero SIN wireframes detallados:**

1. **IDPs (Phase 3)**
   - Concepto: "Manager podrá crear plan de desarrollo desde gap"
   - Mock simple: [Gap] → [Button: Crear IDP] → [Form: 3 skills + timeline]
   - NO diseñar: Formularios completos, workflows multi-paso, integraciones

2. **Course Tracking (Phase 3)**
   - Concepto: "Asignar cursos a colaboradores"
   - Mock simple: [Recommendation] → [Button: Asignar curso] → [Course library]
   - NO diseñar: Course catalog UI, completion tracking, certificates

3. **Succession Planning (Phase 4)**
   - Concepto: "Identificar sucesores para roles críticos"
   - Mock simple: [Rol crítico] → [Lista candidatos ordenados por readiness]
   - NO diseñar: Succession matrix, readiness criteria editor, notifications

4. **OKRs (Phase 5)**
   - Concepto: "Trackear objetivos y vincular con skills"
   - Mock simple: [Skill gap] → [Related OKR] → [Progress bar]
   - NO diseñar: OKR creation flow, check-ins, alignments

**Deliverables UX:**
- ✅ 1 slide por feature (concepto + 1 sketch simple)
- ✅ User stories (Como [rol], quiero [acción] para [beneficio])
- ✅ Questions to validate con usuarios

**Tiempo estimado:** 2-3 horas (no más)

---

### 4.3 NO DISEÑAR (Aún no hay claridad)

**Features que requieren más research:**
1. **AI/ML Recommendations**
   - Requiere data histórica (no existe aún)
   - Algoritmos por definir
   - Demasiado especulativo

2. **Benchmark vs Industria**
   - Requiere partnerships con otras organizaciones
   - Data externa no disponible

3. **Mobile App**
   - Requiere validar primero desktop usage
   - Diferentes constraints

4. **Integrations (Slack, Teams, HRIS)**
   - Depende de qué sistemas usan los clientes
   - Prematuro sin usuarios reales

---

## V. VALIDATION GATES — Evitar Desperdicio

### 5.1 Cómo Validar Cada Phase

**Phase 1 (MVP Core) - Validation:**
```
Pregunta: ¿El sistema es usable sin soporte técnico?

Test:
1. Reclutar 3 team managers (no técnicos)
2. Darles 30 min con la app (sin tutorial)
3. Tasks:
   - Agregar 2 colaboradores
   - Crear 3 skills
   - Evaluar a 1 persona
   - Exportar reporte CSV

Success Criteria:
✓ 3/3 completan todas las tasks
✓ Tiempo promedio < 20 min
✓ SUS Score > 70 (System Usability Scale)
```

**Phase 2 (Analytics) - Validation:**
```
Pregunta: ¿Las vistas por rol son útiles?

Test:
1. Entrevistar a 1 Manager, 1 Director, 1 HR
2. Mostrar wireframes de su vista
3. Preguntar:
   - "¿Qué decisión tomarías con esta info?"
   - "¿Falta algo crítico?"
   - "¿Hay algo que sobra?"

Success Criteria:
✓ Cada rol identifica 1+ decisión accionable
✓ No piden features de Phase 3+ (validation que el scope es correcto)
```

**Phase 3 (Action Layer) - Validation:**
```
Pregunta: ¿Managers realmente crean IDPs?

Test:
1. 2 semanas después de lanzar feature
2. Analytics: ¿Cuántos IDPs creados?

Success Criteria:
✓ > 50% de managers con gaps críticos crearon al menos 1 IDP
✓ Colaboradores ven los IDPs y completan actions

Si falla:
→ Rediseñar flujo (tal vez es muy complejo)
→ O pivotar: Tal vez IDPs no son la solución correcta
```

---

### 5.2 Red Flags (Cuándo Pausar)

**🚩 Red Flag 1: Feature no se usa**
```
Síntoma: Lanzaste Stakeholder Views pero 100% de users siguen en Manager view

Acción:
❌ NO diseñar Phase 3 (Action Layer) todavía
✅ SÍ investigar: ¿Por qué no usan Director/HR views?
   - ¿No las descubren? (problema de UX)
   - ¿No son útiles? (problema de product)
   - ¿No tienen ese rol? (problema de target audience)
```

**🚩 Red Flag 2: Users piden features no planeadas**
```
Síntoma: 5 usuarios piden "Comparar 2 colaboradores lado a lado"

Acción:
❌ NO ignorar porque "no está en roadmap"
✅ SÍ pivotar: Diseñar comparison view ANTES de IDPs
   - Validar que es realmente útil
   - Tal vez es más importante que succession planning
```

**🚩 Red Flag 3: Complejidad aumenta sin valor**
```
Síntoma: IDPs requieren 15 campos obligatorios, users abandonan flujo

Acción:
❌ NO seguir con succession planning (más complejo aún)
✅ SÍ simplificar: Reducir IDP a 3 campos
   - Validar versión simple primero
   - Iterar hacia complejidad solo si necesario
```

---

## VI. RIESGOS DE CADA APPROACH

### 6.1 Riesgo: Diseñar TODO ahora

**Escenario:**
Pasas 2 meses diseñando en Figma:
- Settings ✓
- Reports con stakeholder views ✓
- IDPs completos ✓
- Course catalog ✓
- Succession planning ✓
- OKRs ✓

Luego implementas en 6 meses.

**Qué puede salir mal:**

1. **Desperdicio (Probabilidad: 80%)**
   ```
   Mes 8: Lanzas IDPs
   Resultado: Nadie los usa
   Razón: Descubres que managers prefieren exportar a Excel y gestionar offline

   Consecuencia:
   - 2 semanas de diseño desperdiciadas
   - 1 mes de desarrollo desperdiciado
   - $$ perdidos
   ```

2. **Rework (Probabilidad: 60%)**
   ```
   Mes 3: Construyendo Settings
   Descubres: Inline editing es difícil de implementar (constraints técnicas)

   Consecuencia:
   - Vuelves a diseñar con modal editing
   - Developer frustrado ("¿Por qué no validaste antes?")
   - Timeline se extiende 2 semanas
   ```

3. **Parálisis (Probabilidad: 40%)**
   ```
   Mes 2: Aún diseñando
   Stakeholder: "¿Cuándo podremos probar algo?"
   Tú: "Falta 1 mes de diseño, luego 6 meses de build"
   Stakeholder: "Es mucho tiempo sin feedback"

   Consecuencia:
   - Stakeholder pierde interés
   - Funding en riesgo
   - Equipo desmotivado
   ```

---

### 6.2 Riesgo: NO tener visión clara

**Escenario:**
Vas sprint a sprint sin roadmap:
- Sprint 1: Settings
- Sprint 2: Reports fixes
- Sprint 3: ¿? (decidimos después)

**Qué puede salir mal:**

1. **Inconsistencia (Probabilidad: 70%)**
   ```
   Sprint 1: Diseñaste Settings con modals
   Sprint 5: Diseñando IDPs, usas inline editing
   Sprint 8: Stakeholder: "¿Por qué no es consistente?"

   Consecuencia:
   - Tienes que rediseñar Settings O IDPs
   - Usuarios confundidos (diferentes patterns)
   ```

2. **Architectural regret (Probabilidad: 50%)**
   ```
   Sprint 1-4: Construiste Reports sin tabs
   Sprint 5: Quieres agregar OKRs
   Problema: No cabe en el layout actual

   Consecuencia:
   - Tienes que refactorizar Reports layout
   - 1 semana de trabajo extra
   ```

3. **Scope creep (Probabilidad: 80%)**
   ```
   Sprint 3: Stakeholder pide "Course tracking"
   Tú: "Ok, lo agregamos al sprint"
   Sprint 4: Pide "Notifications"
   Sprint 5: Pide "Email digests"

   Consecuencia:
   - Nunca terminas MVP
   - No tienes tiempo para validar
   - Burnout
   ```

---

## VII. RECOMMENDED APPROACH (Final)

### 7.1 Strategy

**HYBRID: Vision + Iteration**

```
┌─────────────────────────────────────────────────┐
│ 1. CREATE VISION ROADMAP (1 día)                │
│    ├─ Sketch features en 12 meses               │
│    ├─ Priorizar con stakeholders                │
│    └─ Comunicar a equipo                        │
│                                                  │
│ 2. DESIGN WAVE 1 (1-2 semanas)                  │
│    ├─ Settings completo (hi-fi)                 │
│    ├─ Reports fixes                             │
│    └─ Stakeholder layouts (basic, sin IDPs)     │
│                                                  │
│ 3. BUILD WAVE 1 (2-4 semanas)                   │
│    └─ Implementar designs                       │
│                                                  │
│ 4. VALIDATE WAVE 1 (1 semana)                   │
│    ├─ User testing                              │
│    ├─ Analytics                                 │
│    └─ Interviews                                │
│                                                  │
│ 5. ADJUST ROADMAP basado en learnings           │
│    └─ Tal vez IDPs no son prioridad, cambiar    │
│                                                  │
│ 6. DESIGN WAVE 2 (basado en feedback Wave 1)    │
│    └─ Ahora sí diseñas con data real            │
│                                                  │
│ 7. REPEAT...                                    │
└─────────────────────────────────────────────────┘
```

---

### 7.2 Concrete Next Steps (Próximas 4 semanas)

**SEMANA 1: Vision + Wave 1 Design**
```
Lunes-Martes: Vision Roadmap
├─ 2 horas: Sketch roadmap 12 meses (papel/Figjam)
├─ 1 hora: Priorizar con stakeholder (si existe)
└─ 30 min: Crear slide con roadmap

Miércoles-Viernes: Settings Design
├─ Wireframes hi-fi (Figma)
├─ Component specs
└─ Interaction flows
```

**SEMANA 2: Wave 1 Design (cont.) + Build inicio**
```
Lunes-Martes: Terminar Settings + Reports fixes
├─ Responsive layouts
├─ Edge cases
└─ Design QA

Miércoles-Viernes: Start building
├─ Dev empieza Settings
└─ Designer hace support (responder dudas)
```

**SEMANA 3-4: Build Wave 1**
```
Designer:
├─ 50% tiempo: Support developers (responder preguntas)
├─ 30% tiempo: Design system documentation
└─ 20% tiempo: Preparar user testing

Developer:
└─ Implementar Settings CRUD
```

**SEMANA 5: Validate + Adjust**
```
├─ User testing (3-5 users)
├─ Analizar feedback
├─ Decidir: ¿Seguimos con Wave 2 (stakeholder views)? O ¿pivotamos?
└─ Actualizar roadmap si necesario
```

---

### 7.3 Artifacts per Phase

**Phase 1 (NOW):**
- ✅ Roadmap visual (1 slide, alta nivel)
- ✅ Settings wireframes hi-fi (Figma, 8-10 screens)
- ✅ Component specs (markdown/Notion, 5-10 components)
- ✅ Design tokens (colors, spacing, typography)

**Phase 2 (Después de validar Phase 1):**
- ✅ Stakeholder views wireframes (3 layouts)
- ✅ TrendChart component spec
- ✅ Updated design system

**Phase 3+ (TBD):**
- 🔲 IDPs wireframes (SOLO si Phase 2 validó que recommendations son útiles)
- 🔲 Course assignment flows
- 🔲 Notification patterns

---

## VIII. ADDRESSING YOUR SPECIFIC FEATURES

### 8.1 IDPs (Individual Development Plans)

**¿Cuándo diseñar?**
→ **Phase 3** (después de validar que gap analysis + recommendations funcionan)

**¿Por qué esperar?**
- IDPs son complejos (goals, timelines, resources, follow-ups)
- Primero necesitas validar que managers USAN las recomendaciones
- Si nadie actúa sobre gaps, IDPs serán ignorados también

**Qué hacer ahora:**
- ✅ En Manager view, agregar botón "Crear plan" (disabled, próximamente)
- ✅ Capturar analytics: ¿Cuántos clicks en ese botón?
- ✅ Si > 50% de managers clickean → validación de demanda → diseñar IDPs

---

### 8.2 Succession Planning

**¿Cuándo diseñar?**
→ **Phase 4** (después de validar IDPs)

**¿Por qué esperar?**
- Succession planning requiere data de:
  - Skills actuales (ya tienes)
  - Skills requeridas por rol (necesitas definir)
  - Readiness de candidatos (viene de IDPs + performance)
- Sin IDPs maduros, succession planning es solo "guess work"

**Qué hacer ahora:**
- ✅ En HR view, mencionar "Succession planning: próximamente"
- ✅ Entrevistar a 1-2 HRs: "¿Cómo haces succession planning hoy?"
- ✅ Validar que es realmente necesario (tal vez no para equipos < 20 personas)

---

### 8.3 Course Tracking

**¿Cuándo diseñar?**
→ **Phase 3** (junto con IDPs)

**¿Por qué esperar?**
- Course tracking solo tiene sentido si hay assignments (nadie trackea cursos random)
- Assignments vienen de recommendations → IDP creation
- Flow completo: Gap → Recommendation → Assign course → Track completion

**Qué hacer ahora:**
- ✅ En recommendations, agregar link a external course (Udemy, Coursera)
- ✅ Validar que managers SÍ envían esos links a sus colaboradores
- ✅ Si sí → entonces diseñar tracking interno

---

### 8.4 OKRs / KPIs

**¿Cuándo diseñar?**
→ **Phase 5** (último)

**¿Por qué esperar?**
- OKRs son un dominio diferente (performance management vs talent management)
- Skills Matrix puede ser valioso SIN OKRs
- Riesgo: Feature creep hace que la app sea "todo para todos" y pierde foco

**Qué hacer ahora:**
- ✅ Validar primero que Skills Matrix es útil standalone
- ✅ Después, entrevistar: "¿Te gustaría vincular skills con OKRs?"
- ✅ Si > 70% dicen "sí" → diseñar integración
- ❌ Si dicen "meh" → NO lo hagas, mantén foco

---

## IX. DECISION FRAMEWORK

### 9.1 Cuándo Diseñar una Feature

**Checklist (deben cumplirse TODAS):**

1. **□ User need validated**
   - Entrevistaste a 3+ usuarios que piden esto
   - O analytics muestran clicks en "próximamente"

2. **□ Dependencies satisfied**
   - Features previas están construidas Y validadas
   - Ej: NO diseñes succession sin IDPs primero

3. **□ Technical feasibility confirmed**
   - Hablaste con developer
   - No hay blockers técnicos obvios

4. **□ Capacity available**
   - Tienes 1-2 semanas para diseñar
   - Developer tendrá 2-4 semanas para build

5. **□ Success criteria defined**
   - Sabes cómo medirás si funciona
   - Ej: "> 50% de managers crean IDPs"

**Si falta 1+ items → NO diseñes aún**

---

### 9.2 Red Flags (NO diseñar)

**🚩 "Sería cool si..."**
- Fuente: Brainstorming interno sin validar con usuarios
- Acción: Agregar a backlog, investigar después

**🚩 "Todos lo tienen"**
- Fuente: Competitor tiene feature X
- Problema: Tal vez su contexto es diferente
- Acción: Entrevistar usuarios, ¿lo necesitan?

**🚩 "El stakeholder lo pidió"**
- Fuente: Director dice "necesitamos OKRs"
- Problema: Tal vez no lo necesitan, solo es "trendy"
- Acción: Preguntar "¿Qué problema resuelve para ti?"

---

## X. SUMMARY — What to Do

### ❌ NO HAGAS (Evitar desperdicio)

1. ❌ NO diseñes IDPs completos ahora
2. ❌ NO diseñes Succession planning ahora
3. ❌ NO diseñes Course catalog ahora
4. ❌ NO diseñes OKRs/KPIs ahora
5. ❌ NO pases 3 meses en Figma antes de codear

---

### ✅ SÍ HAGAS (Recommended)

**Immediate (Próximas 2 semanas):**

1. ✅ **Crea roadmap visual (1 día)**
   - 1 slide con timeline 12 meses
   - Features por phase (alta nivel)
   - Comparte con stakeholders

2. ✅ **Diseña Settings completo (1 semana)**
   - Wireframes hi-fi en Figma
   - Component specs
   - Interaction flows
   - Responsive layouts

3. ✅ **Diseña Reports consistency fixes (2 días)**
   - ExportButton redesign
   - GapAnalysisSection
   - Typography/spacing

4. ✅ **Diseña Stakeholder Toggle + layouts básicos (3 días)**
   - StakeholderToggle component
   - Manager view (sin IDPs, solo gaps + recommendations básicas)
   - Director view (Health Score + heatmap)
   - HR view (distribution, sin succession)

**After Wave 1 Built (Semana 5+):**

5. ✅ **Valida con usuarios (1 semana)**
   - User testing de Settings
   - Analytics: ¿Qué stakeholder view es más usada?
   - Interviews: ¿Qué falta?

6. ✅ **Ajusta roadmap basado en feedback**
   - Tal vez Phase 2 cambia
   - Tal vez descubres nueva feature priority

7. ✅ **Diseña Wave 2 (solo entonces)**

---

### 🎯 Success Criteria (Cómo sabrás que vas bien)

**Mes 1:**
- ✓ Settings funcional
- ✓ 3 team managers pueden usarlo sin ayuda
- ✓ Exportan reportes CSV sin errores

**Mes 2:**
- ✓ Stakeholder views live
- ✓ > 60% de usuarios usan su vista específica (no todos en Manager)
- ✓ 1+ decision accionable por rol

**Mes 3:**
- ✓ Feedback de 10+ usuarios
- ✓ Roadmap ajustado basado en learnings
- ✓ Feature adoption > 70%

---

## XI. FINAL RECOMMENDATION

**Para Skills Matrix, recomiendo:**

### APPROACH: Hybrid (Vision + Iteration)

**Week 1:**
1. Crear roadmap visual (12 meses, alta nivel)
2. Diseñar Settings completo (hi-fi)
3. Diseñar Reports fixes
4. Diseñar Stakeholder views BÁSICAS (sin IDPs/succession)

**Week 2-4:**
Build Settings + Reports fixes

**Week 5:**
Validate con usuarios

**Week 6+:**
Decidir Phase 2 basado en feedback

---

### WHAT NOT TO DESIGN NOW:

**❌ NO diseñar (hasta después de validar Phase 1-2):**
- IDPs completos
- Succession planning
- Course catalog / tracking
- OKRs / KPIs
- AI recommendations
- Mobile app
- Integrations

**✅ Tener en roadmap (visión), pero sin detalles**

---

### WHY THIS APPROACH?

1. **Reduces waste:** Solo diseñas lo que build en próximos 4 weeks
2. **Enables learning:** Cada phase informa la siguiente
3. **Maintains momentum:** Team ve progreso cada sprint
4. **Allows pivoting:** Si IDPs no funcionan, no perdiste 1 mes diseñándolos
5. **Keeps quality:** Diseñas con contexto fresco (no 6 meses antes)

---

### EXPECTED OUTCOMES (6 meses)

**Con este approach:**
- ✅ MVP funcional en 2 meses
- ✅ 10+ usuarios validando en mes 3
- ✅ 2-3 features validadas y usadas (vs 10 features diseñadas pero no validadas)
- ✅ Team motivado (ven usuarios reales usando su trabajo)
- ✅ Roadmap ajustado con data real (no assumptions)

**vs Big Design Upfront:**
- ❌ 0 usuarios hasta mes 6
- ❌ 50% de features diseñadas nunca se usan
- ❌ Team cansado esperando feedback
- ❌ Rework cuando descubres que assumptions eran incorrectos

---

**Documento generado:** 29 Diciembre 2024
**Contexto:** Product Strategy para Skills Matrix FOSS
**Recomendación:** Hybrid approach (Vision + Iteration)
**Next step:** Crear roadmap 12 meses (1 día) + diseñar Settings (1 semana)
