# 📊 Dashboard Ejecutivo — Propuesta Final Consolidada

**Proyecto:** Skills Matrix FOSS  
**Fecha:** 29 de Diciembre, 2024  
**Versión:** 2.0 (Combinada)

---

## 🎯 Resumen Ejecutivo

| Aspecto | Actual | Propuesto |
|---------|--------|-----------|
| **Data points** | ~35 | 8-10 |
| **Time to insight** | 30-45 seg | 5-10 seg |
| **Time Travel visible** | ❌ | ✅ |
| **Actionable** | ❌ | ✅ |
| **Scroll** | 2 pantallas | 0 |

---

## 📐 Layout Final

```
┌─────────────────────────────────────────────────────────────┐
│ 📅 SNAPSHOT SELECTOR                                        │
│ [Q3 2024 ▼] vs [Q1 2024 ▼]       [📸 Crear Snapshot]      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 🎯 HERO: HEALTH SCORE                                       │
│         2.8 / 5.0   ⬆️ +0.3 vs Q1 2024                     │
│         ████████░░░░ Objetivo: 3.2                          │
│                                                             │
│  ⚠️ 12 Críticas  │  📊 18 Competentes  │  ⭐ 5 Fortalezas   │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────┬──────────────────────────────┐
│ 📈 EVOLUCIÓN (6 meses)       │ ⬆️ TOP MEJORAS / ⬇️ RIESGOS │
│ [Sparkline chart]            │ Backend +1.2 | Cloud -0.3   │
└──────────────────────────────┴──────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 🎯 ÁREAS DE ATENCIÓN (Top 3)                                │
│ Ordenadas por: Criticidad × Frecuencia × Afectados         │
│                                                             │
│ 1. 🔴 Cloud & DevOps — 3 personas [Ver matriz →]           │
│ 2. 🟡 Ciberseguridad — 2 sin evaluar [Evaluar →]           │
│ 3. 🟡 Arquitectura — Nivel bajo [Planificar →]              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ � INSIGHT AUTOMÁTICO                                       │
│ Carlos Mendez: Alto en Low-Code (4.2) pero baja criticidad. │
│ Reasignar a Backend donde hay gaps.  [Ver análisis →]       │
└─────────────────────────────────────────────────────────────┘

┌────────────┬────────────┬────────────┬────────────┐
│ � Snapshot│ � Matriz  │ ➕ Evaluar │ 📊 Exportar│
└────────────┴────────────┴────────────┴────────────┘
```

---

## ✅ MANTENER

1. **KPI Gigante (Promedio General)** — Agregar:
   - Trend indicator (+0.3)
   - Progress bar hacia objetivo
   - Comparación con snapshot anterior

---

## ❌ ELIMINAR

| Elemento | Razón | Nueva ubicación |
|----------|-------|-----------------|
| Tabla Perfil Equipo | 30+ data points = sobrecarga | Team Matrix |
| Lista detallada gaps | Sin priorización, muy granular | Team Matrix (filtro) |

---

## 🆕 AGREGAR

### 1. Snapshot Selector (Top Bar global)
Siempre visible. El Time Travel es el diferenciador del producto.

### 2. Widget Evolución (Sparkline)
Mini-chart de 6 meses + Top 3 mejoras / retrocesos.

### 3. Áreas de Atención Priorizadas
Ordenadas por `Criticidad × Frecuencia × Afectados`.  
Máximo 3 items con CTAs claros.

### 4. Insight Automático
Detectar:
- Talento subutilizado
- Riesgo de bus factor
- Skills sin evaluar

### 5. Quick Actions Bar
`[Snapshot] [Matriz] [Evaluar] [Exportar]`

---

## 🔧 Utilidades Necesarias

```js
// src/lib/dashboardLogic.js

// 1. Calcular delta entre snapshots
export function calculateDelta(current, previous) {
  return {
    delta: (current - previous).toFixed(1),
    trend: current > previous ? 'up' : current < previous ? 'down' : 'stable'
  };
}

// 2. Priorizar gaps
const PRIORITY_WEIGHTS = { C: 3, I: 2, D: 1 };
export function prioritizeGaps(gaps) {
  return gaps
    .map(g => ({ ...g, score: g.criticidad * g.frecuencia * g.afectados }))
    .sort((a, b) => b.score - a.score);
}

// 3. Detectar talento subutilizado
export function detectUnderutilized(collaborators) {
  return collaborators.filter(c => 
    c.skills.some(s => s.nivel >= 4 && s.criticidad === 'D')
  );
}
```

---

## 📋 Plan de Implementación

### Fase 1: Limpieza (1 día)
- [x] Eliminar tabla completa
- [x] Eliminar lista detallada gaps
- [ ] Mantener solo KPI con trend

### Fase 2: Time Travel (2-3 días)
- [ ] `SnapshotSelector.jsx`
- [ ] API comparación snapshots
- [ ] Cálculo de deltas

### Fase 3: Visualizaciones (2 días)
- [ ] Sparkline de evolución
- [ ] Widget Top Mejoras/Retrocesos
- [ ] Widget Distribución (3 niveles)

### Fase 4: Insights (2 días)
- [ ] Algoritmo priorización
- [ ] Widget Áreas Atención
- [ ] Widget Insight Automático
- [ ] Quick Actions

---

## 🎨 Filosofía

> *"En 10 segundos debo saber: ¿Vamos bien? ¿Qué necesita atención? ¿Qué hago ahora?"*

**Jerarquía:**
1. **Dashboard** = 60 segundos de lectura máximo
2. **Team Matrix** = Exploración detallada
3. **Colaborador** = Drill-down individual

---

**Listo para aprobación e implementación** ✅
