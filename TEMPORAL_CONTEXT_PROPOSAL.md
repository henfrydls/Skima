# 🕐 Propuesta: Indicadores de Contexto Temporal

**Fecha:** 29 de Diciembre, 2024  
**Objetivo:** Señalizar claramente cuando el Dashboard muestra datos históricos vs. tiempo real  
**Principio:** "Gritar sutilmente" sin romper el Corporate Zen

---

## 🎯 Problema Actual

El `SnapshotSelector` actual muestra dropdowns pero:
- ❌ No hay distinción visual entre "Actualidad" y un snapshot histórico
- ❌ El usuario puede confundir datos de Q1 2023 con el estado actual
- ❌ La fecha de corte no es lo suficientemente prominente

---

## 🎨 Propuesta de Solución

### Opción A: Banner Superior "Modo Histórico" (Recomendada)

```
┌──────────────────────────────────────────────────────────────────┐
│ ⏰ MODO HISTÓRICO — Viendo datos de: Septiembre 2024            │
│    Los datos mostrados reflejan el estado del equipo hace 3 meses│
│                                          [↩ Volver a Actualidad] │
└──────────────────────────────────────────────────────────────────┘
```

**Diseño:**
- Background: `bg-warning/10` (Ocre al 10%)
- Border-left: `border-l-4 border-warning`
- Typography: `text-warning` para el badge, `text-gray-700` para el texto
- Posición: Debajo del header, arriba del Snapshot Selector
- Animación: `animate-fade-in` sutil al activarse

**Implementación CSS:**
```jsx
<div className={`
  ${isHistoricalMode 
    ? 'bg-warning/10 border-l-4 border-warning' 
    : 'bg-transparent'
  }
  p-3 rounded-lg transition-all duration-300
`}>
```

---

### Opción B: Badge Flotante + Borde del Dashboard

```
┌─ Borde warning ──────────────────────────────────────────────────┐
│                                                                   │
│   [📅 Sep 2024]  ← Badge flotante en esquina                     │
│   Dashboard Ejecutivo                                             │
│   ...                                                             │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

**Diseño:**
- Badge: Posición absoluta, `bg-warning text-white`, esquina superior derecha
- Borde: Todo el contenedor del Dashboard con `ring-2 ring-warning`
- Menos intrusivo pero menos obvio

---

## 🔄 Selector de Contexto Temporal Mejorado

### Diseño Actual vs. Propuesto

**Actual:**
```
[Snapshot Actual ▼]  vs  [Comparar con ▼]  [Crear Snapshot]
```

**Propuesto:**
```
┌──────────────────────────────────────────────────────────────────┐
│  📊 CONTEXTO                                                      │
│  ┌─────────────────────────────────────┐                         │
│  │ ● Actualidad (Diciembre 2024)       │ ← Radio button activo   │
│  │ ○ Histórico:  [Septiembre 2024 ▼]   │ ← Radio + dropdown      │
│  └─────────────────────────────────────┘                         │
│                                                                   │
│  📈 COMPARANDO CON                                                │
│  [Junio 2024 ▼] ← Solo si se selecciona comparación              │
│                                                                   │
│  ─────────────────────────────────────────────────                │
│  📅 Fecha de corte: 30 de Septiembre, 2024                       │
│  ⏱️ Hace 3 meses                                                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📐 Especificación del Componente

### Props

```typescript
interface SnapshotSelectorProps {
  currentSnapshot: Snapshot;           // Snapshot actual seleccionado
  compareSnapshot?: Snapshot;          // Snapshot de comparación
  availableSnapshots: Snapshot[];      // Lista de snapshots disponibles
  isLiveMode: boolean;                 // true = Actualidad, false = Histórico
  onModeChange: (isLive: boolean) => void;
  onSnapshotChange: (snapshot: Snapshot) => void;
  onCompareChange: (snapshot: Snapshot | null) => void;
  onCreateSnapshot?: () => void;
}

interface Snapshot {
  id: string;
  label: string;                       // "Diciembre 2024"
  date: Date;                          // Fecha exacta
  value: string;                       // "2024-12"
  isCurrent: boolean;                  // Es el más reciente?
}
```

### Estados Visuales

| Estado | Indicador Visual |
|--------|------------------|
| **Actualidad** | Badge verde "En vivo", sin borde especial |
| **Histórico** | Banner ocre, badge "Modo Histórico", borde warning |
| **Comparando** | Texto secundario "vs [fecha]" en gris |

---

## 🎨 Paleta de Colores Aplicada

| Elemento | Color | Variable Tailwind |
|----------|-------|-------------------|
| Banner Histórico (bg) | `#da8a0c` al 10% | `bg-warning/10` |
| Banner Histórico (borde) | `#da8a0c` | `border-warning` |
| Badge "Histórico" | `#da8a0c` | `bg-warning text-white` |
| Badge "En vivo" | `#a6ae3d` | `bg-competent text-white` |
| Fecha de corte (texto) | `#6b7280` | `text-gray-500` |
| Tiempo relativo | `#9ca3af` | `text-gray-400` |

---

## 📱 Wireframe Responsive

### Desktop (> 1024px)
```
┌─────────────────────────────────────────────────────────────────┐
│  [● Actualidad]  [○ Histórico: Sep 2024 ▼]  │  vs  [Jun 2024 ▼] │
│                                              │  [📸 Crear]       │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile (< 768px)
```
┌─────────────────────────────────────┐
│  [● Actualidad] [○ Histórico ▼]     │
├─────────────────────────────────────┤
│  Comparando con: [Jun 2024 ▼]       │
├─────────────────────────────────────┤
│  📅 Corte: 30 Sep 2024 (hace 3m)    │
└─────────────────────────────────────┘
```

---

## ⚡ Micro-Interacciones

### Transición Actualidad → Histórico

```css
/* Al cambiar a modo histórico */
.historical-mode-enter {
  animation: historical-pulse 0.5s ease-out;
}

@keyframes historical-pulse {
  0% { 
    background-color: transparent; 
    border-color: transparent;
  }
  50% { 
    background-color: rgba(218, 138, 12, 0.2); /* warning/20 */
    border-color: #da8a0c;
  }
  100% { 
    background-color: rgba(218, 138, 12, 0.1); /* warning/10 */
    border-color: #da8a0c;
  }
}
```

### Hover en Badge "Volver a Actualidad"

```css
.return-to-live:hover {
  background-color: rgba(166, 174, 61, 0.1); /* competent/10 */
  color: #a6ae3d; /* competent */
  transform: translateX(-2px);
}
```

---

## 📋 Checklist de Implementación

### Fase 1: Banner Modo Histórico
- [ ] Crear componente `HistoricalModeBanner.jsx`
- [ ] Agregar estado `isHistoricalMode` a Dashboard
- [ ] Implementar lógica de comparación de fechas
- [ ] Agregar animación de entrada

### Fase 2: Selector Mejorado
- [ ] Rediseñar `SnapshotSelector.jsx` con radio buttons
- [ ] Agregar display de fecha de corte
- [ ] Agregar tiempo relativo ("hace 3 meses")
- [ ] Implementar botón "Volver a Actualidad"

### Fase 3: Propagación
- [ ] Aplicar indicador en Team Matrix cuando se usa snapshot histórico
- [ ] Aplicar indicador en Reports cuando se usa snapshot histórico
- [ ] Almacenar preferencia de contexto en localStorage

---

## 🎯 Resultado Esperado

### Antes:
> El usuario ve "2.5" como promedio y no sabe si es actual o de hace 6 meses.

### Después:
> El usuario ve un banner ocre que dice "Viendo datos de Septiembre 2024 - Hace 3 meses" y sabe exactamente qué está mirando.

---

## 💡 Ejemplo Visual Final

```
┌─────────────────────────────────────────────────────────────────┐
│ ⏰ MODO HISTÓRICO                                               │
│ Viendo: Septiembre 2024 (hace 3 meses)    [↩ Volver a hoy]     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 📊 CONTEXTO TEMPORAL                                            │
│ ┌───────────────────┐  ┌───────────────────┐                    │
│ │ ○ Actualidad      │  │ ● Septiembre 2024 │                    │
│ └───────────────────┘  └───────────────────┘                    │
│                                                                  │
│ 📈 Comparando con: [Junio 2024 ▼]       [📸 Crear Snapshot]    │
│                                                                  │
│ ────────────────────────────────────────                        │
│ 📅 Fecha de corte: 30 de Septiembre, 2024                       │
│ Los deltas mostrados comparan Sep 2024 vs Jun 2024              │
└─────────────────────────────────────────────────────────────────┘
```

---

**Próximo paso:** ¿Implementar el Banner Modo Histórico (Opción A) o el Selector mejorado primero?
