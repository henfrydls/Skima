# 📊 Propuesta de Rediseño: Dashboard Ejecutivo "Time-Aware"

**Fecha:** 29 de Diciembre, 2024
**Proyecto:** Skills Matrix FOSS
**Autor:** UX/UI Audit Team
**Filosofía:** "Don't Make Me Think" + Corporate Zen + Local-First

---

## 🎯 Resumen Ejecutivo

El Dashboard actual tiene un **antipatrón común en productos B2B**: confunde "Dashboard Ejecutivo" con "Reporte Completo". Esta propuesta reestructura completamente el Dashboard para aprovechar la **feature diferenciadora** del producto: **Time Travel**.

### Cambios Principales

| Aspecto | Actual | Propuesto |
|---------|--------|-----------|
| **Data points visibles** | ~35 números | 8-10 métricas clave |
| **Time to insight** | 30-45 seg | 5-10 seg |
| **Aprovecha Time Travel** | ❌ No | ✅ Sí (selector + comparativa) |
| **Actionable** | ❌ Informativo | ✅ Quick actions + priorización |
| **Mobile-friendly** | ❌ Tabla ilegible | ✅ Cards responsivas |
| **Scroll requerido** | ✅ Sí (> 2 pantallas) | ❌ No (todo en viewport) |

---

## 🔍 Diagnóstico: Problemas del Dashboard Actual

### Análisis del Contenido Actual

| Widget | Líneas de Código | Información Mostrada | Veredicto |
|--------|------------------|----------------------|-----------|
| **KPI Gigante** | 62-85 | Promedio 2.8 + fortalezas/gaps count | ✅ **MANTENER** (core value) |
| **Áreas de Mejora** | 88-117 | Lista detallada: "Cloud & DevOps: 1.8" | ❌ **DEMASIADO ESPECÍFICO** |
| **Tabla Perfil Equipo** | 121-180 | 5 colaboradores × 6 categorías = 30 data points | ❌ **SATURACIÓN COGNITIVA** |

**Total de datos en pantalla:** ~35 números individuales
**Benchmark de la industria** (Linear, Notion, Asana dashboards): 6-8 métricas clave máximo.

### Problemas Identificados

1. **Falta de contexto temporal**: No se aprovecha el Time Travel (feature diferenciadora)
2. **Sobrecarga cognitiva**: Tabla con 30+ data points no es "glanceable"
3. **No actionable**: Usuario piensa "¿Y ahora qué hago con esta info?"
4. **Información mal ubicada**: Detalles granulares pertenecen a Team Matrix, no al Dashboard

---

## 🎯 Jobs to be Done: ¿Qué necesita un Manager?

Basado en el contexto "Local-First + Time Travel", el usuario tiene **3 objetivos primarios**:

### 1. Health Check (5 segundos)
> "¿Cómo está mi equipo AHORA?"

**Métricas necesarias:**
- ✅ Promedio general (ya existe)
- ✅ Número de brechas críticas (cantidad, no detalles)
- ❌ Distribución de competencias (cuántos son junior/mid/senior) - **FALTA**

### 2. Trend Analysis (10 segundos)
> "¿Estamos mejorando o empeorando?"

**Métricas necesarias:**
- ❌ Comparación vs snapshot anterior - **FALTA COMPLETAMENTE**
- ❌ Visualización de evolución histórica (mini-gráfico) - **FALTA**
- ❌ Top 3 mejoras / Top 3 retrocesos - **FALTA**

### 3. Action Planning (15 segundos)
> "¿Qué debo hacer HOY?"

**Métricas necesarias:**
- ❌ Áreas priorizadas por Criticidad × Frecuencia - **FALTA**
- ❌ Próximos pasos sugeridos - **FALTA**
- ❌ Quick actions (Crear snapshot, Evaluar colaborador) - **FALTA**

---

## 📐 Arquitectura Propuesta del Dashboard

### Principios de Diseño

1. **Glanceable**: Toda la info crítica en una pantalla sin scroll
2. **Actionable**: Cada widget debe tener un "¿Y ahora qué?"
3. **Time-Aware**: El Time Travel debe estar VISIBLE (no enterrado en settings)
4. **Progressive Disclosure**: Dashboard → Drill-down (Team Matrix)

### Wireframe en ASCII

```
┌─────────────────────────────────────────────────────────────┐
│ 📅 SNAPSHOT SELECTOR (Top Bar)                              │
│ [Q3 2024 ▼] Compare with: [Q1 2024 ▼]  [📸 New Snapshot]  │
└─────────────────────────────────────────────────────────────┘

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🎯 HEALTH CHECK (Hero Section)                             ┃
┃ ┌─────────────────────────────────────────────────────┐   ┃
┃ │   Promedio General del Equipo                       │   ┃
┃ │   ┌─────────────────┐                               │   ┃
┃ │   │      2.8        │  ⬆️ +0.3 vs Q1 2024          │   ┃
┃ │   │    de 5.0       │  🎯 Objetivo: 3.2            │   ┃
┃ │   └─────────────────┘                               │   ┃
┃ └─────────────────────────────────────────────────────┘   ┃
┃                                                             ┃
┃ ┌──────────────┬──────────────┬──────────────┐            ┃
┃ │ ⚠️ Brechas    │ 📊 Competent │ ⭐ Fortalezas │            ┃
┃ │   Críticas   │              │              │            ┃
┃ │      12      │      18      │      5       │            ┃
┃ │ [Ver detalles]│             │ [Ver detalles]│            ┃
┃ └──────────────┴──────────────┴──────────────┘            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┌─────────────────────────────────────────────────────────────┐
│ 📈 TREND ANALYSIS                                           │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Evolución del Equipo (últimos 6 meses)                │  │
│ │ [Line chart: 2.5 → 2.6 → 2.6 → 2.7 → 2.8 → 2.8]     │  │
│ │ Jan   Feb   Mar   Apr   May   Jun                     │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌────────────────────────┬──────────────────────────────┐  │
│ │ ⬆️ Top 3 Mejoras       │ ⬇️ Áreas en Riesgo           │  │
│ │ • Backend: +1.2       │ • Cloud & DevOps: -0.3      │  │
│ │ • Liderazgo: +0.8     │ • Ciberseguridad: 0.0       │  │
│ │ • Testing: +0.5       │ • IoT: -0.2                 │  │
│ └────────────────────────┴──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 🎯 ACTION PLANNING                                          │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ Áreas que Requieren Atención Inmediata                │  │
│ │ (Ordenadas por: Criticidad × Frecuencia × Gaps)      │  │
│ │                                                        │  │
│ │ 1. 🔴 Cloud & DevOps                                  │  │
│ │    3 colaboradores debajo del umbral crítico          │  │
│ │    [Ver matriz →]                                      │  │
│ │                                                        │  │
│ │ 2. 🟡 Ciberseguridad                                  │  │
│ │    2 colaboradores sin evaluación en skill crítica    │  │
│ │    [Evaluar ahora →]                                   │  │
│ │                                                        │  │
│ │ 3. 🟡 Arquitectura de Sistemas                        │  │
│ │    4 colaboradores con nivel 1-2 (necesitan training) │  │
│ │    [Planificar capacitación →]                         │  │
│ └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 💡 INSIGHTS AUTOMÁTICOS (Powered by Criticidad × Frecuencia)│
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 🎓 Talento Subutilizado                               │  │
│ │ • Carlos Mendez tiene alto nivel en "Low-Code" (4.2) │  │
│ │   pero esa skill tiene baja criticidad para su rol.   │  │
│ │   Considera reasignarle proyectos de Backend.         │  │
│ └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ⚡ QUICK ACTIONS                                             │
│ [📸 Crear Snapshot]  [👥 Ver Matriz Completa]               │
│ [➕ Evaluar Colaborador]  [📊 Exportar Reporte]             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Especificación de Componentes

### ✅ MANTENER (del dashboard actual)

#### 1. KPI Gigante: Promedio General

**Ubicación:** `DashboardView.jsx:62-85`
**Cambios:** Agregar trend indicator y barra de progreso

```jsx
<div className="bg-surface p-12 rounded-lg shadow-sm text-center">
  <p className="text-sm uppercase tracking-wide text-gray-500 mb-2">
    Promedio General del Equipo
  </p>

  {/* Hero Number + Trend */}
  <div className="flex items-baseline justify-center gap-4">
    <p className="text-7xl font-light text-primary">2.8</p>
    <div className="flex flex-col items-start">
      <span className="text-lg font-medium text-competent flex items-center gap-1">
        <TrendingUp size={20} />
        +0.3
      </span>
      <span className="text-xs text-gray-400">vs Q1 2024</span>
    </div>
  </div>

  {/* NUEVO: Barra de progreso hacia objetivo */}
  <div className="mt-4 max-w-md mx-auto">
    <div className="flex justify-between text-xs text-gray-500 mb-1">
      <span>Actual: 2.8</span>
      <span>Objetivo Q4: 3.2</span>
    </div>
    <div className="h-2 bg-gray-200 rounded-full">
      <div
        className="h-2 bg-primary rounded-full transition-all"
        style={{ width: '70%' }}
      />
    </div>
  </div>

  {/* Métricas secundarias */}
  <div className="flex items-center justify-center gap-8 text-sm mt-6">
    <div>
      <span className="text-gray-400">de</span>
      <span className="font-semibold text-gray-600 ml-1">5.0</span>
    </div>
    <div className="text-gray-300">|</div>
    <div>
      <span className="font-semibold text-primary">2</span>
      <span className="text-gray-500 ml-1">fortalezas</span>
    </div>
    <div className="text-gray-300">|</div>
    <div>
      <span className="font-semibold text-warning">2</span>
      <span className="text-gray-500 ml-1">gaps críticos</span>
    </div>
  </div>
</div>
```

---

### ❌ ELIMINAR (del dashboard actual)

#### 2. Tabla "Perfil del Equipo" (líneas 121-180)

**Por qué eliminar:**
- 30+ data points = sobrecarga cognitiva
- Viola el principio "Dashboard ≠ Data Grid"
- Esta información pertenece a **Team Matrix Page**

**Reemplazo:** Widget "Distribución de Competencias"

```jsx
// NUEVO: Distribución de Competencias (reemplaza tabla completa)
<div className="bg-surface p-6 rounded-lg shadow-sm">
  <h3 className="text-lg font-medium text-primary mb-4">
    Distribución de Competencias
  </h3>
  <div className="grid grid-cols-3 gap-4">
    <div className="text-center p-4 bg-gray-50 rounded-lg">
      <p className="text-3xl font-light text-warning">2</p>
      <p className="text-sm text-gray-600 mt-1">Principiantes</p>
      <p className="text-xs text-gray-400">(promedio &lt; 2.5)</p>
    </div>
    <div className="text-center p-4 bg-gray-50 rounded-lg">
      <p className="text-3xl font-light text-competent">18</p>
      <p className="text-sm text-gray-600 mt-1">Competentes</p>
      <p className="text-xs text-gray-400">(2.5 - 3.5)</p>
    </div>
    <div className="text-center p-4 bg-gray-50 rounded-lg">
      <p className="text-3xl font-light text-primary">5</p>
      <p className="text-sm text-gray-600 mt-1">Expertos</p>
      <p className="text-xs text-gray-400">(promedio &gt; 3.5)</p>
    </div>
  </div>
  <button className="mt-4 w-full text-sm text-primary hover:underline">
    Ver matriz completa →
  </button>
</div>
```

**Impacto:** Reduce de 30 números a 3 métricas agregadas (90% menos densidad, misma información estratégica).

---

#### 3. Lista Detallada de Gaps (líneas 88-117)

**Por qué eliminar:**
- "Cloud & DevOps: 1.8" es demasiado granular para un dashboard
- No hay contexto de **prioridad** (¿cuál atiendo primero?)

**Reemplazo:** Widget "Áreas de Atención Prioritarias"

```jsx
// NUEVO: Áreas de Atención Prioritarias
<div className="bg-surface p-6 rounded-lg shadow-sm">
  <h3 className="text-lg font-medium text-primary mb-4 flex items-center gap-2">
    <AlertTriangle size={20} />
    Áreas que Requieren Atención
  </h3>

  {prioritizedGaps.slice(0, 3).map((gap, idx) => (
    <div
      key={gap.id}
      className="flex items-start gap-4 p-4 border-l-4 border-critical bg-critical/5 rounded-r mb-3"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-critical text-white flex items-center justify-center font-bold">
        {idx + 1}
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-gray-800">{gap.categoria}</h4>
        <p className="text-sm text-gray-600 mt-1">
          <strong>{gap.afectados}</strong> colaboradores con nivel crítico
        </p>
        <div className="flex gap-2 mt-2">
          <span className="px-2 py-0.5 bg-warning/20 text-warning text-xs rounded-full">
            Criticidad: Alta
          </span>
          <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">
            Uso: Diario
          </span>
        </div>
      </div>
      <button className="text-sm text-primary hover:underline flex-shrink-0">
        Ver detalles →
      </button>
    </div>
  ))}
</div>
```

**Fórmula de priorización:**
```js
// Calcular score de impacto
const prioritizedGaps = gaps.map(gap => ({
  ...gap,
  impactScore: gap.criticidad * gap.frecuencia * gap.afectados
})).sort((a, b) => b.impactScore - a.impactScore);
```

---

### 🆕 NUEVOS COMPONENTES

#### 4. Snapshot Selector (Top Bar)

**Justificación:** El Time Travel es la **feature diferenciadora**. Debe estar visible 24/7.

```jsx
// NUEVO: Control de Time Travel (siempre visible)
<div className="bg-surface p-4 rounded-lg shadow-sm mb-6 flex items-center justify-between">
  <div className="flex items-center gap-4">
    <div>
      <label className="text-xs text-gray-500 uppercase tracking-wide">
        Snapshot Actual
      </label>
      <select className="mt-1 block w-48 rounded-md border-gray-300 text-sm">
        <option>Q3 2024 (Actual)</option>
        <option>Q2 2024</option>
        <option>Q1 2024</option>
        <option>Q4 2023</option>
      </select>
    </div>

    <span className="text-gray-300">vs.</span>

    <div>
      <label className="text-xs text-gray-500 uppercase tracking-wide">
        Comparar con
      </label>
      <select className="mt-1 block w-48 rounded-md border-gray-300 text-sm">
        <option>Q1 2024</option>
        <option>Q2 2024</option>
        <option>Q4 2023</option>
      </select>
    </div>
  </div>

  <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
    <Camera size={16} />
    Crear Snapshot
  </button>
</div>
```

---

#### 5. Mini Timeline (Evolución Visual)

```jsx
// NUEVO: Gráfico de evolución
<div className="bg-surface p-6 rounded-lg shadow-sm">
  <h3 className="text-lg font-medium text-primary mb-4 flex items-center gap-2">
    <TrendingUp size={20} />
    Evolución del Equipo
  </h3>

  <div className="relative h-32">
    {/* Simple line chart con puntos */}
    <svg viewBox="0 0 600 100" className="w-full h-full">
      <polyline
        points="0,80 100,75 200,70 300,60 400,50 500,45"
        fill="none"
        stroke="#2d676e"
        strokeWidth="2"
      />
      {[
        { x: 0, y: 80, label: 'Ene', value: 2.5 },
        { x: 100, y: 75, label: 'Feb', value: 2.6 },
        { x: 200, y: 70, label: 'Mar', value: 2.6 },
        { x: 300, y: 60, label: 'Abr', value: 2.7 },
        { x: 400, y: 50, label: 'May', value: 2.8 },
        { x: 500, y: 45, label: 'Jun', value: 2.8 },
      ].map(point => (
        <g key={point.x}>
          <circle cx={point.x} cy={point.y} r="4" fill="#2d676e" />
          <text
            x={point.x}
            y="100"
            textAnchor="middle"
            className="text-xs fill-gray-500"
          >
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  </div>

  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
    <div>
      <p className="text-sm text-gray-500">Mayor mejora</p>
      <p className="font-medium text-competent">Abr → May: +0.1</p>
    </div>
    <div>
      <p className="text-sm text-gray-500">Tendencia</p>
      <p className="font-medium text-primary">⬆️ Crecimiento sostenido</p>
    </div>
  </div>
</div>
```

**Alternativa:** Usar librería ligera como **Chart.js** o **Recharts**.

---

#### 6. Top Mejoras / Retrocesos

```jsx
// NUEVO: Comparativa de cambios
<div className="grid md:grid-cols-2 gap-4">
  {/* Mejoras */}
  <div className="bg-surface p-6 rounded-lg shadow-sm border-l-4 border-competent">
    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
      <TrendingUp size={16} className="text-competent" />
      Top 3 Mejoras vs Q1 2024
    </h4>
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-700">Backend Development</span>
        <span className="font-semibold text-competent">+1.2</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-700">Liderazgo del Cambio</span>
        <span className="font-semibold text-competent">+0.8</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-700">Testing/QA</span>
        <span className="font-semibold text-competent">+0.5</span>
      </div>
    </div>
  </div>

  {/* Retrocesos */}
  <div className="bg-surface p-6 rounded-lg shadow-sm border-l-4 border-warning">
    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
      <TrendingDown size={16} className="text-warning" />
      Áreas en Riesgo
    </h4>
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-700">Cloud & DevOps</span>
        <span className="font-semibold text-warning">-0.3</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-700">IoT & Edge</span>
        <span className="font-semibold text-warning">-0.2</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-700">Ciberseguridad</span>
        <span className="font-semibold text-gray-500">0.0</span>
      </div>
    </div>
  </div>
</div>
```

---

#### 7. Insights Automáticos (Talento Subutilizado)

```jsx
// NUEVO: AI-like insights basados en Criticidad × Frecuencia
<div className="bg-gradient-to-r from-primary/5 to-competent/5 p-6 rounded-lg border border-primary/20">
  <div className="flex items-start gap-3">
    <Lightbulb className="text-primary flex-shrink-0 mt-1" size={24} />
    <div>
      <h4 className="font-semibold text-primary mb-2">
        💡 Insight Automático
      </h4>
      <p className="text-sm text-gray-700 leading-relaxed">
        <strong>Carlos Mendez</strong> tiene alto nivel en <strong>Low-Code (4.2)</strong>,
        pero esa skill tiene <span className="text-warning">baja criticidad</span> para su rol actual.
        Considera reasignarle tareas de <strong>Backend</strong> o <strong>Arquitectura</strong>,
        donde el equipo tiene gaps críticos.
      </p>
      <button className="mt-3 text-sm text-primary hover:underline">
        Ver análisis completo →
      </button>
    </div>
  </div>
</div>
```

**Lógica del insight:**
```js
// Detectar talento subutilizado
const underutilizedTalent = COLLABORATORS.flatMap(collab =>
  Object.entries(collab.skills)
    .filter(([skillId, data]) =>
      data.nivel >= 4 && // Alto nivel
      data.criticidad === 'D' // Baja criticidad
    )
    .map(([skillId, data]) => ({
      colaborador: collab.nombre,
      skill: SKILLS.find(s => s.id === skillId).nombre,
      nivel: data.nivel,
      sugerencia: `Reasignar a skills críticas donde tiene nivel bajo`
    }))
);
```

---

#### 8. Quick Actions Bar

```jsx
// NUEVO: CTAs contextuales
<div className="bg-surface p-6 rounded-lg shadow-sm">
  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
    Acciones Rápidas
  </h4>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center">
      <Camera className="mx-auto mb-2 text-primary" size={24} />
      <p className="text-sm font-medium text-gray-700">Crear Snapshot</p>
    </button>

    <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center">
      <Users className="mx-auto mb-2 text-primary" size={24} />
      <p className="text-sm font-medium text-gray-700">Ver Matriz</p>
    </button>

    <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center">
      <UserPlus className="mx-auto mb-2 text-primary" size={24} />
      <p className="text-sm font-medium text-gray-700">Evaluar Colaborador</p>
    </button>

    <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-all text-center">
      <Download className="mx-auto mb-2 text-primary" size={24} />
      <p className="text-sm font-medium text-gray-700">Exportar Reporte</p>
    </button>
  </div>
</div>
```

---

## 📋 Plan de Implementación

### Fase 1: Limpieza (Día 1)
- [ ] Eliminar tabla completa de colaboradores (DashboardView.jsx:121-180)
- [ ] Eliminar lista detallada de gaps (DashboardView.jsx:88-117)
- [ ] Mover esos componentes a `TeamMatrixPage.jsx` si se requieren

### Fase 2: Core Features Time Travel (Días 2-3)
- [ ] Crear componente `SnapshotSelector.jsx`
- [ ] Agregar lógica de comparación de snapshots en backend
- [ ] Implementar cálculo de deltas (+0.3, -0.2)
- [ ] Actualizar KPI gigante con trend indicator

### Fase 3: Visualizaciones (Días 4-5)
- [ ] Widget de evolución (timeline mini-chart)
- [ ] Widget Top Mejoras / Retrocesos
- [ ] Widget Distribución de Competencias

### Fase 4: Insights & Actions (Días 6-7)
- [ ] Algoritmo de priorización (Criticidad × Frecuencia)
- [ ] Widget "Áreas de Atención Prioritarias"
- [ ] Widget "Talento Subutilizado"
- [ ] Quick Actions Bar

### Fase 5: Testing & Refinamiento (Días 8-9)
- [ ] Testing responsive (mobile/tablet/desktop)
- [ ] Testing con datos reales (no mock)
- [ ] Ajustes de performance (lazy loading si es necesario)
- [ ] Validación de accesibilidad (WCAG AA)

---

## 🎯 Métricas de Éxito

### Cuantitativas
- **Time to Insight**: Reducir de 30-45 seg a < 10 seg
- **Data Points Visibles**: Reducir de 35 a 8-10
- **Scroll Requerido**: Eliminar completamente
- **Bounce Rate**: Medir si usuarios permanecen más tiempo en Dashboard

### Cualitativas
- **User Satisfaction**: Survey post-implementación (escala 1-5)
- **Feature Discovery**: Medir cuántos usuarios usan "Crear Snapshot" después del rediseño
- **Task Completion**: ¿Usuarios pueden identificar áreas críticas en < 15 seg?

---

## 🔧 Helpers y Utilidades Necesarias

### 1. Cálculo de Deltas entre Snapshots

```js
// src/utils/snapshotComparison.js
export function calculateDelta(currentSnapshot, previousSnapshot) {
  const currentAvg = calculateTeamAverage(currentSnapshot);
  const previousAvg = calculateTeamAverage(previousSnapshot);

  return {
    delta: (currentAvg - previousAvg).toFixed(1),
    percentage: ((currentAvg - previousAvg) / previousAvg * 100).toFixed(1),
    trend: currentAvg > previousAvg ? 'up' : currentAvg < previousAvg ? 'down' : 'stable'
  };
}

export function getTopChanges(currentSnapshot, previousSnapshot, limit = 3) {
  const changes = CATEGORIES.map(cat => {
    const currentAvg = calculateCategoryAverage(currentSnapshot, cat.id);
    const previousAvg = calculateCategoryAverage(previousSnapshot, cat.id);

    return {
      categoria: cat.nombre,
      delta: currentAvg - previousAvg,
      current: currentAvg,
      previous: previousAvg
    };
  });

  const improvements = changes
    .filter(c => c.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, limit);

  const regressions = changes
    .filter(c => c.delta < 0)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, limit);

  return { improvements, regressions };
}
```

### 2. Algoritmo de Priorización de Gaps

```js
// src/utils/gapPrioritization.js
const FREQUENCY_WEIGHTS = { D: 4, S: 3, M: 2, T: 1, N: 0 };
const CRITICALITY_WEIGHTS = { C: 3, I: 2, D: 1, N: 0 };

export function prioritizeGaps(collaborators, skills) {
  const gapsByCategory = {};

  CATEGORIES.forEach(cat => {
    const categorySkills = skills.filter(s => s.categoria === cat.id);
    let totalImpact = 0;
    let affectedCount = 0;

    categorySkills.forEach(skill => {
      collaborators.forEach(collab => {
        const skillData = collab.skills[skill.id];

        if (isCriticalGap(skillData)) {
          const freqWeight = FREQUENCY_WEIGHTS[skillData.frecuencia];
          const critWeight = CRITICALITY_WEIGHTS[skillData.criticidad];

          totalImpact += freqWeight * critWeight;
          affectedCount++;
        }
      });
    });

    if (affectedCount > 0) {
      gapsByCategory[cat.id] = {
        categoria: cat.nombre,
        afectados: affectedCount,
        impactScore: totalImpact,
        criticidad: totalImpact > 20 ? 'Alta' : totalImpact > 10 ? 'Media' : 'Baja'
      };
    }
  });

  return Object.values(gapsByCategory)
    .sort((a, b) => b.impactScore - a.impactScore);
}
```

### 3. Detección de Talento Subutilizado

```js
// src/utils/insights.js
export function detectUnderutilizedTalent(collaborators, skills) {
  const insights = [];

  collaborators.forEach(collab => {
    const highSkills = Object.entries(collab.skills)
      .filter(([skillId, data]) => data.nivel >= 4)
      .map(([skillId, data]) => ({
        skill: skills.find(s => s.id === parseInt(skillId)),
        ...data
      }));

    const lowCriticalityHighSkills = highSkills.filter(
      s => s.criticidad === 'D' || s.criticidad === 'N'
    );

    if (lowCriticalityHighSkills.length > 0) {
      insights.push({
        type: 'underutilized',
        colaborador: collab.nombre,
        skills: lowCriticalityHighSkills.map(s => s.skill.nombre),
        suggestion: `Reasignar a áreas críticas donde el equipo tiene gaps`
      });
    }
  });

  return insights;
}
```

---

## 🚀 Próximos Pasos Inmediatos

1. **Validar propuesta con stakeholders** (Product Owner, Tech Lead)
2. **Crear prototipo visual** (Figma/sketch) del nuevo Dashboard
3. **Implementar Fase 1** (limpieza) en branch separado
4. **Testing A/B** (si es posible): Dashboard actual vs nuevo

---

## 📚 Referencias y Benchmarks

### Productos Similares Analizados
- **Linear**: Dashboard con 4-6 métricas clave, heavy use of sparklines
- **Notion**: Dashboard minimalista con quick actions prominentes
- **Asana**: Time-aware dashboard con comparativas de progreso
- **Lattice**: HR analytics con insights automáticos

### Recursos de Diseño
- [Nielsen Norman Group: Dashboard Usability](https://www.nngroup.com/articles/dashboard-design/)
- [Gestalt Principles for Data Visualization](https://www.toptal.com/designers/data-visualization/dashboard-design-best-practices)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 🎨 Filosofía de Diseño: "Executive Summary"

> "Un buen dashboard responde las 3 preguntas clave en 10 segundos. Si el usuario necesita más, ofrece un enlace claro al siguiente nivel de detalle."

**Jerarquía de Información:**
1. **Dashboard** = Resumen ejecutivo de 60 segundos
2. **Team Matrix** = Exploración detallada (tabla completa)
3. **Colaborador Detail** = Drill-down individual

---

**Documento creado por:** UX/UI Audit Team
**Última actualización:** 29/12/2024
**Versión:** 1.0
