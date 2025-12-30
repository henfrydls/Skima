# SETTINGS & REPORTS — UX/UI Ultra-Think Analysis
**Skills Matrix FOSS — Pure UX/UI Strategy**

> **Enfoque:** 100% Experiencia de Usuario e Interfaz
> **Principios:** Corporate Zen + Don't Make Me Think + Nielsen Heuristics
> **Stakeholders:** Team Manager, Director, HR

---

## I. EXECUTIVE SUMMARY — UX Problems & Opportunities

### Settings Page (Actualmente Vacía)

**Problema UX Central:**
El usuario no puede gestionar los maestros del sistema (Colaboradores, Skills, Categorías) sin editar archivos o base de datos. Esto viola:
- ✗ **Nielsen #3:** User control and freedom
- ✗ **Nielsen #7:** Flexibility and efficiency of use
- ✗ **Krug's Law:** "Don't make me think" → obliga a pensar en SQL

**Oportunidad:**
Crear una experiencia de configuración que sea **tan intuitiva que un Team Manager sin skills técnicos pueda gestionar todo el sistema en < 5 minutos**.

---

### Reports Page (Implementada Parcialmente)

**Problemas UX Identificados:**

1. **Inconsistencia Visual con Dashboard/Matrix**
   - QuickExportCard usa hover-lift + color transitions complejas
   - Dashboard usa transiciones simples de border
   - GapAnalysisSection usa border-left-4 + background + badge (3× el mismo color)
   - Viola **Nielsen #4:** Consistency and standards

2. **Falta Contexto Temporal**
   - Usuario no sabe si está viendo datos actuales o históricos
   - SnapshotSelector existe en Dashboard pero no en Reports
   - Viola **Nielsen #1:** Visibility of system status

3. **Información Genérica (One-Size-Fits-All)**
   - Team Manager ve las mismas métricas que un Director
   - Un CTO no necesita ver lista de colaboradores con gaps
   - Un HR no necesita ver investment ROI
   - Viola **Nielsen #7:** Flexibility and efficiency

4. **Verbosidad Innecesaria**
   - Textos largos en cards: "Resumen para presentar a stakeholders"
   - Headers con emojis: "📊 Exportación Rápida"
   - Viola **Krug:** Menos texto = menos carga cognitiva

**Oportunidad:**
Rediseñar Reports como un **hub inteligente** que adapta métricas según el rol del usuario y el contexto temporal.

---

## II. SETTINGS PAGE — UX/UI Design

### 2.1 Mental Model del Usuario

**¿Qué espera el usuario al entrar a Settings?**

**Usuario Tipo:** Team Manager o HR que necesita:
1. Ver lista de colaboradores
2. Agregar nuevo colaborador (rápido, sin fricción)
3. Editar información existente (inline, sin modals)
4. Organizar skills en categorías lógicas
5. Cambiar orden de categorías (drag-drop)

**NO espera:**
- ❌ Formularios complejos multi-paso
- ❌ Modals que interrumpen flujo
- ❌ Confirmaciones excesivas
- ❌ Navegación profunda (más de 2 niveles)

---

### 2.2 Information Architecture

**Propuesta: Flat Tabs (1 nivel, sin sub-navegación)**

```
┌─────────────────────────────────────────────────────┐
│ Settings                                             │
│ Gestiona colaboradores, skills y categorías         │
├─────────────────────────────────────────────────────┤
│ ┌───────────────┐  ┌──────┐  ┌────────────┐        │
│ │ Colaboradores │  │Skills│  │ Categorías │        │  ← Tabs (siempre visibles)
│ └───────────────┘  └──────┘  └────────────┘        │
├─────────────────────────────────────────────────────┤
│                                                      │
│  [CONTENT AREA - Cambio instantáneo al hacer click] │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Por qué Tabs y no Sidebar?**
- ✅ Menos clicks (0 vs 1 para cambiar de sección)
- ✅ Visibilidad (siempre ves las 3 opciones)
- ✅ Estándar web (Configuración = Tabs)
- ✅ Progressive disclosure (solo ves 1 contenido a la vez)

---

### 2.3 Tab 1: Colaboradores — UX Flow

#### Visual Hierarchy (Wireframe ASCII)

```
┌──────────────────────────────────────────────────────────────┐
│  Colaboradores                    [Búsqueda]      [+ Nuevo]  │  ← Header
│  ─────────────────────────────────────────────────────────── │
│                                                               │
│  Filtro: [Todos ▾]              5 colaboradores activos      │  ← Controls
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ [▢] Avatar  Nombre           Rol           Email    ⋮  │ │  ← Table Header
│  ├────────────────────────────────────────────────────────┤ │
│  │ [▢]  MG    María González   Product Mgr    ✉    ⚙  ⋮  │ │
│  │ [▢]  CM    Carlos Mendez    Arquitecto     ✉    ⚙  ⋮  │ │
│  │ [▢]  AR    Ana Rodríguez    Consultora     ✉    ⚙  ⋮  │ │
│  │ [▢]  PS    Pedro Sánchez    Líder Plataf.  ✉    ⚙  ⋮  │ │
│  │ [▢]  LT    Laura Torres     Jr Developer   ✉    ⚙  ⋮  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  Mostrando 5 de 5                                            │  ← Pagination
└──────────────────────────────────────────────────────────────┘

Leyenda:
[▢] = Checkbox (bulk actions)
⚙  = Settings icon (inline actions)
⋮  = Menu icon (more actions)
✉  = Email presente/ausente
```

#### Interaction Patterns

**Pattern 1: Inline Editing (Quick Edit)**
```
Estado normal:
│  MG    María González   Product Manager    maria@co.com  ⋮  │

On hover row:
│  MG    [María González]   [Product Manager]   [maria@...]  ⋮  │
       ↑ Campos con border sutil (indican editabilidad)

On click field:
│  MG    [María González▮]  Product Manager    maria@...   ⋮  │
       ↑ Cursor activo, puede escribir inmediatamente

On blur (click fuera):
│  MG    María González M.  Product Manager    maria@...   ⋮  │
       ↑ Auto-save (sin botón "Guardar")
       ↑ Toast discreto: "Actualizado ✓"
```

**Por qué inline editing?**
- ✅ 0 clicks extras (vs abrir modal)
- ✅ Mantiene contexto (ves toda la tabla)
- ✅ Instant feedback (auto-save)
- ✅ Familiar (Excel, Notion, Airtable)

**Pattern 2: Action Menu (⋮)**
```
Click en ⋮ → Dropdown abre:

┌─────────────────────────┐
│ ✏️  Editar completo      │  ← Abre modal para campos avanzados
│ 👁️  Ver evaluaciones     │  ← Navigate a Team Matrix filtrado
│ 📧  Enviar notificación  │
│ ──────────────────────  │
│ 🗑️  Desactivar           │  ← Soft delete (no elimina data)
└─────────────────────────┘

```

**Pattern 3: Bulk Actions**
```
User selecciona 3 checkboxes:

┌──────────────────────────────────────────────────────────┐
│  3 seleccionados                    [Deshacer selección] │
│  ───────────────────────────────────────────────────────│
│  [📥 Exportar]  [📧 Enviar email]  [🗑️ Desactivar]      │
└──────────────────────────────────────────────────────────┘
    ↑ Bar flotante aparece en top
```

#### User Flow: Crear Nuevo Colaborador

```
1. User clicks [+ Nuevo]
   ↓
2. Modal compacto abre (Centro de pantalla)

   ┌─────────────────────────────────────┐
   │  Nuevo Colaborador            [✕]   │
   ├─────────────────────────────────────┤
   │                                      │
   │  Nombre completo *                   │
   │  [___________________________]       │
   │                                      │
   │  Rol / Posición *                    │
   │  [___________________________]       │
   │                                      │
   │  Email (opcional)                    │
   │  [___________________________]       │
   │                                      │
   │  ┌───────────────────────────────┐  │
   │  │ Campos opcionales (click aquí)│  │  ← Progressive disclosure
   │  └───────────────────────────────┘  │
   │                                      │
   │  [Cancelar]          [Crear] ←─────┼─ Primary action
   │                                      │
   └─────────────────────────────────────┘

   ↓
3. User llena Nombre + Rol (mínimo requerido)
   ↓
4. Click [Crear]
   ↓
5. Modal cierra con fade-out
   ↓
6. Tabla actualiza (nuevo row aparece en top con highlight)
   ↓
7. Toast notification (esquina superior derecha):

   ┌─────────────────────────────────┐
   │ ✓  María González creada        │  ← Auto-dismiss en 3s
   └─────────────────────────────────┘
```

**Tiempo total:** < 10 segundos

**Friction points eliminados:**
- ❌ NO pide campos innecesarios upfront (email, depto, fecha ingreso)
- ❌ NO requiere confirmación doble
- ❌ NO navega a otra página

---

### 2.4 Tab 2: Skills — UX Flow

#### Visual Hierarchy

```
┌──────────────────────────────────────────────────────────────┐
│  Skills                                          [+ Nueva]    │
│  ─────────────────────────────────────────────────────────── │
│                                                               │
│  📊 6 categorías  •  42 skills totales                        │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ▼ Innovación & Diseño               6 skills         ⋮  ││  ← Collapsible
│  ├─────────────────────────────────────────────────────────┤│
│  │   • Design Thinking                                  ✏️ ││
│  │   • Service Design                                   ✏️ ││
│  │   • Lean Startup / Experimentación ágil              ✏️ ││
│  │   • User Research & HCD                              ✏️ ││
│  │   • Customer Journey Mapping                         ✏️ ││
│  │   • Stage-Gate Methodology                           ✏️ ││
│  │   [+ Agregar skill a esta categoría]                    ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ▶ Desarrollo & Plataforma                11 skills    ⋮  ││  ← Collapsed
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ▶ Liderazgo del Cambio                  4 skills      ⋮  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ... (resto de categorías colapsadas)                        │
└──────────────────────────────────────────────────────────────┘
```

#### Interaction Pattern: Accordion

**Default State:**
- Primera categoría expandida
- Resto colapsadas (reducir scroll)

**On click header:**
```
Estado colapsado:
│ ▶ Desarrollo & Plataforma    11 skills    ⋮  │
  ↑ Arrow indica "click para expandir"

Click en header:
│ ▼ Desarrollo & Plataforma    11 skills    ⋮  │
├───────────────────────────────────────────────┤
│   • Cloud Infrastructure & DevOps        ✏️  │
│   • Arquitectura de Sistemas             ✏️  │
│   • Desarrollo Backend (Django, APIs)    ✏️  │
│   ... (11 skills totales)                    │
│   [+ Agregar skill]                          │
└───────────────────────────────────────────────┘
  ↑ Smooth expand animation (300ms)
```

**Micro-interaction:**
- Hover en skill → background cambia a gray-50
- Click en ✏️ → Modal "Editar Skill" (incluye rubrica de niveles)

#### User Flow: Definir Rúbrica (Niveles 1, 3, 5)

**Pain Point Actual:**
Usuario no sabe qué significa nivel 2.5 vs 3.2 en una skill.

**Solución UX:**
Modal de rúbrica donde el usuario define descriptores por nivel.

```
Click ✏️ en "Design Thinking"
   ↓
Modal abre:

┌──────────────────────────────────────────────────────┐
│  Editar: Design Thinking                      [✕]    │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Nombre de la skill                                   │
│  [Design Thinking_________________]                   │
│                                                       │
│  Categoría                                            │
│  [Innovación & Diseño ▾]                              │
│                                                       │
│  ┌───────────────────────────────────────────────┐  │
│  │ 📏 Definir Rúbrica de Evaluación             │  │  ← Expandible section
│  │                                                │  │
│  │  Nivel 1 — Principiante  ●○○○○                │  │
│  │  ┌─────────────────────────────────────────┐ │  │
│  │  │ Conoce conceptos básicos de DT.        │ │  │  ← Textarea
│  │  │ Ha participado en workshops.           │ │  │
│  │  │ Requiere guía constante.               │ │  │
│  │  └─────────────────────────────────────────┘ │  │
│  │                                                │  │
│  │  Nivel 3 — Competente    ●●●○○                │  │
│  │  ┌─────────────────────────────────────────┐ │  │
│  │  │ Facilita sesiones de DT autónomamente. │ │  │
│  │  │ Aplica herramientas correctamente.     │ │  │
│  │  └─────────────────────────────────────────┘ │  │
│  │                                                │  │
│  │  Nivel 5 — Experto       ●●●●●                │  │
│  │  ┌─────────────────────────────────────────┐ │  │
│  │  │ Diseña nuevas metodologías de DT.      │ │  │
│  │  │ Entrena a otros facilitadores.         │ │  │
│  │  │ Referente externo en la materia.       │ │  │
│  │  └─────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────┘  │
│                                                       │
│  [Cancelar]                    [Guardar Cambios]     │
│                                                       │
└──────────────────────────────────────────────────────┘
```

**UX Benefits:**
- ✅ Evaluadores saben exactamente qué buscar en cada nivel
- ✅ Consistencia entre evaluadores (menos subjetividad)
- ✅ Colaboradores entienden qué deben mejorar para subir de nivel

---

### 2.5 Tab 3: Categorías — UX Flow

#### Visual Hierarchy

```
┌──────────────────────────────────────────────────────────────┐
│  Categorías                                      [+ Nueva]    │
│  ─────────────────────────────────────────────────────────── │
│                                                               │
│  Arrastra para reordenar                                      │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ⋮⋮  🔵  Innovación & Diseño               6 skills   ⋮  ││  ← Draggable
│  ├─────────────────────────────────────────────────────────┤│
│  │ ⋮⋮  🟢  Desarrollo & Plataforma           11 skills  ⋮  ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ ⋮⋮  🟡  Liderazgo del Cambio              4 skills   ⋮  ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ ⋮⋮  🟠  Negocio & Estrategia              8 skills   ⋮  ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ ⋮⋮  🟣  Entrega & Portafolio              6 skills   ⋮  ││
│  ├─────────────────────────────────────────────────────────┤│
│  │ ⋮⋮  🔴  Tecnologías Emergentes            3 skills   ⋮  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
└──────────────────────────────────────────────────────────────┘

Leyenda:
⋮⋮ = Drag handle (visual cue de arrastre)
🔵 = Color picker (click para cambiar)
```

#### Interaction Pattern: Drag & Drop

**Flow:**
```
1. User hover en row
   ↓
   │ ⋮⋮  🔵  Innovación & Diseño    6 skills    ⋮  │
      ↑ Cursor cambia a "grab" (mano abierta)

2. User mousedown en ⋮⋮
   ↓
   │ ⋮⋮  🔵  Innovación & Diseño    6 skills    ⋮  │ ← Shadow aumenta
      ↑ Cursor cambia a "grabbing" (mano cerrada)
      ↑ Row se eleva (z-index + box-shadow)

3. User arrastra hacia abajo
   ↓
   │ ⋮⋮  🟢  Desarrollo & Plataforma ...          │
   ├──────────────────────────────────────────────┤ ← Línea guía (dropzone)
   │ ⋮⋮  🔵  Innovación & Diseño    ...           │ ← Arrastrado (50% opacity)
   ├──────────────────────────────────────────────┤
   │ ⋮⋮  🟡  Liderazgo del Cambio ...             │

4. User suelta (mouseup)
   ↓
   │ ⋮⋮  🟢  Desarrollo & Plataforma ...          │
   │ ⋮⋮  🔵  Innovación & Diseño    ...           │ ← Nuevo orden
   │ ⋮⋮  🟡  Liderazgo del Cambio ...             │
      ↑ Smooth reordering animation (200ms)
      ↑ Toast: "Orden actualizado ✓"
```

**Micro-interactions:**
- Drag handle (⋮⋮) solo visible on hover row
- Durante drag, otros rows hacen "split" para mostrar dropzone
- On drop, todos los rows animan a su nueva posición

#### Color Picker Interaction

```
Click en 🔵 color dot:

Inline color picker abre:
┌────────────────────┐
│ 🔵 🟢 🟡 🟠 🟣 🔴 │  ← Preset colors (Corporate Zen palette)
│                    │
│ [#2d676e______] ✓  │  ← Custom hex input
└────────────────────┘
  ↑ Popover posicionado cerca del dot
  ↑ Click fuera cierra
```

**Por qué color picker?**
- ✅ Categorías visualmente diferenciables en gráficas
- ✅ Color-coding ayuda a escanear rápido (Gestalt: similarity)
- ✅ Personalización (ownership del sistema)

---

### 2.6 Empty States

**Primera vez en Colaboradores (sin datos):**
```
┌──────────────────────────────────────────────────────────────┐
│  Colaboradores                                               │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│                          👥                                   │  ← Icon grande
│                                                               │
│              No hay colaboradores aún                         │  ← Headline
│                                                               │
│      Agrega a los miembros del equipo que evaluarás.         │  ← Description
│      Puedes importar desde CSV o crear manualmente.          │
│                                                               │
│      ┌──────────────┐     ┌──────────────────┐              │
│      │ + Crear uno  │     │ 📥 Importar CSV  │              │  ← Primary CTAs
│      └──────────────┘     └──────────────────┘              │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**UX Principles Applied:**
- ✅ **Educación contextual:** Explica para qué sirve sin ser verboso
- ✅ **Clear next steps:** 2 opciones claras (crear vs importar)
- ✅ **No intimida:** Tono amigable, icon ilustrativo

---

## III. REPORTS PAGE — UX/UI Problems Deep Dive

### 3.1 Análisis Heurístico (Nielsen's 10)

**Heurística #1: Visibility of System Status**

❌ **PROBLEMA:**
```jsx
// Usuario ve esto en Reports:
<h1>Reportes y Análisis</h1>
<p>Exporta, analiza y genera insights del equipo</p>

// ¿Pero qué datos está viendo?
// ¿Snapshot actual? ¿Histórico? ¿Cuál?
// NO HAY INDICADOR VISIBLE
```

✅ **SOLUCIÓN:**
```
┌─────────────────────────────────────────────────────┐
│ Reportes y Análisis                                  │
│ Exporta, analiza y genera insights                  │
├─────────────────────────────────────────────────────┤
│ ⚡ Viendo datos en vivo  |  Última actualización: Hoy│  ← Status visible
│                                                      │
│ O si es histórico:                                   │
│ 🕐 Modo Histórico: Q2 2024  [Volver a hoy]          │  ← Warning + action
└─────────────────────────────────────────────────────┘
```

---

**Heurística #4: Consistency and Standards**

❌ **PROBLEMA: QuickExportCard vs Dashboard Cards**

**Dashboard (correcto):**
```css
.card {
  border: 1px solid gray-200;
  transition: border-color 200ms;
}
.card:hover {
  border-color: primary/30;
}
```

**Reports QuickExportCard (inconsistente):**
```css
.card {
  border: 1px solid gray-100;
  transform: none;
}
.card:hover {
  transform: translateY(-2px);  /* ← NO usado en Dashboard */
  box-shadow: ...;              /* ← Shadow extra */
  border-color: primary/30;
}
```

**Violación:**
- ❌ Hover-lift solo en Reports (no en Dashboard ni Matrix)
- ❌ Crea expectativa errónea (usuario espera navegación, pero solo dispara export)

✅ **SOLUCIÓN:**
Uniformar interacciones:
```css
.export-button {
  border: 1px solid gray-200;
  transition: border-color 200ms;
}
.export-button:hover {
  border-color: primary/30;  /* Solo border, SIN lift */
}
```

---

**Heurística #8: Aesthetic and Minimalist Design**

❌ **PROBLEMA: Visual Clutter en GapAnalysisSection**

**Actual:**
```
┌────────────────────────────────────────────────────┐
│ ⚠️ Categorías con Mayor Impacto                    │
├────────────────────────────────────────────────────┤
│                                                     │
│ ┌───────────────────────────────────────────────┐ │
│ │ ⓵  Innovación & Diseño                        │ │  ← Border-left: critical
│ │    3 personas | 8 skills                      │ │  ← Background: critical/5
│ │    María, Carlos, Ana                         │ │  ← Badge: critical
│ └───────────────────────────────────────────────┘ │     3× color crítico
│                                                     │
│ ┌───────────────────────────────────────────────┐ │
│ │ ⓶  Desarrollo Backend                         │ │
│ │    2 personas | 5 skills                      │ │
│ │    Laura, Pedro                               │ │
│ └───────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

**Problemas:**
- ❌ Border-left-4 + Background coloreado + Badge de número = 3× redundancia
- ❌ Lista de nombres truncada (usa espacio, aporta poco)
- ❌ Icon ⚠️ en header + color en cards = doble énfasis

✅ **SOLUCIÓN: Minimalist Redesign**
```
┌────────────────────────────────────────────────────┐
│ Categorías con Mayor Impacto                       │  ← Sin icon, más limpio
├────────────────────────────────────────────────────┤
│                                                     │
│ ┌───────────────────────────────────────────────┐ │
│ │ ⓵  Innovación & Diseño          3 personas    │ │  ← Background: gray-50
│ │    8 skills con gap                           │ │  ← Solo badge numerado tiene color
│ └───────────────────────────────────────────────┘ │
│                                                     │
│ ┌───────────────────────────────────────────────┐ │
│ │ ⓶  Desarrollo Backend           2 personas    │ │
│ │    5 skills con gap                           │ │
│ └───────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

**Mejoras:**
- ✅ Background neutro (gray-50) en todas las cards
- ✅ Color solo en badge numerado (jerarquía clara)
- ✅ Sin border-left (menos ruido)
- ✅ Sin lista de nombres (no aporta acción, usa espacio)

---

**Heurística #7: Flexibility and Efficiency**

❌ **PROBLEMA: One-Size-Fits-All Metrics**

**User Story:**
```
Como Team Manager:
- Necesito ver gaps críticos de MI equipo
- Necesito recomendaciones accionables
- NO necesito ver ROI financiero (eso es para Director)

Como Director:
- Necesito ver Health Score global
- Necesito ver prioridades de inversión
- NO necesito ver lista detallada de colaboradores

Como HR:
- Necesito ver planes de desarrollo individual
- Necesito identificar high/low performers
- NO necesito ver detalles técnicos de skills
```

**Problema Actual:**
Reports muestra las MISMAS métricas a todos (genéricas, poco útiles).

✅ **SOLUCIÓN: Stakeholder Toggle**
```
┌─────────────────────────────────────────────────────┐
│ Reportes y Análisis                                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Vista:  [Team Manager] [Director] [HR]              │  ← Toggle
│                                                      │
│ [Contenido dinámico según rol seleccionado]         │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

### 3.2 Visual Design Problems

#### Problema 1: Typography Inconsistency

**Encontrado en Reports:**
```jsx
// Header de sección
<h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
  📊 Exportación Rápida
</h2>
```

**Encontrado en Dashboard:**
```jsx
// Header de sección
<h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
  Acciones Rápidas
</h4>
```

**Problemas:**
- ❌ Mismo estilo visual, diferente tag semántico (h2 vs h4)
- ❌ Emoji en Reports, no en Dashboard
- ❌ font-semibold demasiado enfático para Corporate Zen

**Solución:**
```jsx
// Estandarizar en TODO el sistema
<h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
  Exportación Rápida
</h3>
```

Cambios:
- ✅ Siempre h3 para section headers
- ✅ font-medium (menos enfático que semibold)
- ✅ text-gray-500 (más sutil que gray-700)
- ✅ Sin emojis

---

#### Problema 2: Spacing Inconsistency

**Reports - Quick Export Grid:**
```jsx
<div className="grid md:grid-cols-2 gap-4">
```

**Reports - Analysis Grid:**
```jsx
<div className="grid lg:grid-cols-2 gap-6">
```

**Dashboard - Metrics Grid:**
```jsx
<div className="grid grid-cols-3 gap-4">
```

**Problema:**
- ❌ gap-4 (16px) vs gap-6 (24px) sin criterio consistente
- ❌ Crea ritmo visual irregular

**Solución - Sistema unificado:**
```css
/* Dentro de cards/sections pequeñas */
gap-4 (16px)

/* Entre sections principales */
gap-6 (24px)

/* Page-level spacing */
space-y-6 (24px)
```

**Regla:**
- Grids horizontales (cards lado a lado): `gap-6`
- Grids de métricas pequeñas (números): `gap-4`
- Vertical spacing entre secciones: `space-y-6`

---

#### Problema 3: Color Over-Usage

**Ejemplos en Reports:**

```jsx
// QuickExportCard - Icon background
<div className="bg-primary/10 group-hover:bg-primary group-hover:text-white">
  <Icon />
</div>

// GapAnalysisSection - Card
<div className="border-l-4 border-critical bg-critical/5">
  <div className="bg-critical/20 text-critical">1</div>
</div>

// TrendAnalysisSection - Background
<div className="bg-gray-50 rounded-lg">
```

**Problema:**
- ❌ Algunos componentes usan backgrounds de color (primary/10, critical/5)
- ❌ Otros usan gray-50
- ❌ Inconsistencia crea jerarquía visual confusa

**Solución Corporate Zen:**
```jsx
// REGLA: Backgrounds siempre neutros
<div className="bg-gray-50">  /* O bg-surface (white) */

// Color SOLO en:
// 1. Iconos
<Icon className="text-primary" />

// 2. Badges
<Badge variant="critical">3 personas</Badge>

// 3. Borders (hover states)
<div className="border-gray-200 hover:border-primary/30">
```

---

### 3.3 Interaction Design Problems

#### Problema 1: ChevronRight en Export Cards

**Actual:**
```
┌─────────────────────────────────────────────┐
│  📄  Reporte Ejecutivo PDF                  │
│      Resumen para presentar...          →  │  ← ChevronRight
└─────────────────────────────────────────────┘
```

**Implicación para usuario:**
- ❌ ChevronRight = "Navegarás a otra página"
- ❌ Pero al hacer click, descarga archivo (NO navega)
- ❌ Viola affordance esperado

**Solución:**
```
┌─────────────────────────────────────────────┐
│  📄  Reporte Ejecutivo PDF                  │
│      Resumen para stakeholders              │  ← Sin arrow
└─────────────────────────────────────────────┘

// O si necesitas indicar acción:
┌─────────────────────────────────────────────┐
│  📄  Reporte Ejecutivo PDF              ↓   │  ← Download icon
│      Resumen para stakeholders              │
└─────────────────────────────────────────────┘
```

---

#### Problema 2: No Feedback on Export

**Actual:**
```javascript
const handleExportCSV = () => {
  // Crea CSV
  // Descarga
  // FIN (sin feedback visual)
}
```

**User Experience:**
```
User clicks "Exportar CSV"
   ↓
... nada pasa visualmente ...
   ↓
(2 segundos después)
Browser descarga archivo
   ↓
User confundido: "¿Funcionó? ¿Dónde está?"
```

**Solución - States Visualization:**
```
Estado inicial:
┌─────────────────────────────────────────────┐
│  📊  Exportar CSV                           │
└─────────────────────────────────────────────┘

Click:
┌─────────────────────────────────────────────┐
│  ⏳  Generando CSV...                       │  ← Loading state
└─────────────────────────────────────────────┘

Success (2s):
┌─────────────────────────────────────────────┐
│  ✓  CSV exportado                           │  ← Success feedback
└─────────────────────────────────────────────┘
   ↑ Green tint background
   ↑ Auto-revert a estado inicial después de 2s
```

---

## IV. REPORTS REDESIGN — UX Proposals

### 4.1 Information Architecture Rediseñada

**Propuesta: 3-Layer IA**

```
┌────────────────────────────────────────────────────┐
│ LAYER 1: CONTEXTO TEMPORAL                         │
│ ┌────────────────────────────────────────────────┐│
│ │ ⚡ Viendo datos en vivo | vs Q2 2024           ││  ← SnapshotSelector
│ └────────────────────────────────────────────────┘│
├────────────────────────────────────────────────────┤
│ LAYER 2: PERSPECTIVA (ROL)                         │
│ ┌────────────────────────────────────────────────┐│
│ │ Vista: [Manager] [Director] [HR]              ││  ← Stakeholder Toggle
│ └────────────────────────────────────────────────┘│
├────────────────────────────────────────────────────┤
│ LAYER 3: CONTENIDO DINÁMICO                        │
│ ┌────────────────────────────────────────────────┐│
│ │ [Métricas específicas del rol seleccionado]   ││
│ │ [Exports universales]                          ││
│ │ [Análisis contextual según snapshot]          ││
│ └────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────┘
```

**Jerarquía Visual:**
1. **Temporal Context** (más importante): Banner con color si es histórico
2. **Role Toggle** (segundo): Tabs compactos
3. **Content** (tercero): Métricas que cambian según 1 y 2

---

### 4.2 Stakeholder Toggle — Component Design

```
┌────────────────────────────────────────────────────┐
│ Vista:  ┌──────────┐  ┌─────────┐  ┌─────┐        │
│         │ 👤 Manager│  │Director │  │ HR  │        │
│         └──────────┘  └─────────┘  └─────┘        │
│             ↑ Active                               │
└────────────────────────────────────────────────────┘

Estado activo:
- Background: surface (white)
- Border: 1px solid primary
- Text: primary
- Shadow: sm

Estado inactivo:
- Background: transparent
- Border: none
- Text: gray-600
- Shadow: none

Hover (inactivo):
- Background: gray-50
- Text: gray-800

```

**Interacción:**
```
Click en "Director"
   ↓
Smooth transition (200ms):
- Manager tab: primary → gray-600
- Director tab: gray-600 → primary
   ↓
Content area:
- Fade out old metrics (150ms)
- Fade in new metrics (150ms, delayed 100ms)
   ↓
Total time: 350ms (imperceptible pero smooth)
```

---

### 4.3 Team Manager View — Wireframe

```
┌──────────────────────────────────────────────────────────┐
│ Reportes y Análisis                                       │
│ ─────────────────────────────────────────────────────────│
│ ⚡ Viendo datos en vivo  |  vs Q2 2024                    │
│ Vista: [👤 Manager] [Director] [HR]                      │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ 🔍 Tu Equipo en Números                                   │  ← Section
│ ┌─────────────┐ ┌─────────────┐ ┌──────────────┐        │
│ │   8         │ │   2.8       │ │      2       │        │
│ │ Gaps        │ │ Promedio    │ │ Bus Factor   │        │
│ │ Críticos    │ │ vs 3.5 meta │ │ Risks        │        │
│ │ ↓ -2        │ │ ↑ +0.2      │ │ ⚠️           │        │
│ └─────────────┘ └─────────────┘ └──────────────┘        │
│                                                           │
│ 💡 Acciones Recomendadas                                  │
│ ┌───────────────────────────────────────────────────────┐│
│ │ ① Capacitar a Laura Torres en Cloud (Gap crítico)    ││
│ │    Impacto: Alto  |  Urgencia: Alta                  ││
│ │    [Ver detalles] [Crear plan]                       ││
│ └───────────────────────────────────────────────────────┘│
│ ┌───────────────────────────────────────────────────────┐│
│ │ ② Cross-training en Backend (Bus factor risk)        ││
│ │    Solo Carlos domina → entrenar a Pedro             ││
│ │    [Ver detalles]                                     ││
│ └───────────────────────────────────────────────────────┘│
│                                                           │
│ 📊 Exportación                                            │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│ │ PDF      │ │ Excel    │ │ CSV      │ │ JSON     │    │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│                                                           │
│ 📈 Evolución por Categoría                                │
│ [Gráfica de barras comparando snapshot actual vs anterior]│
│                                                           │
└──────────────────────────────────────────────────────────┘
```

**UX Principles:**
- ✅ **Scannable:** 3 KPIs grandes arriba (F-pattern)
- ✅ **Actionable:** Recomendaciones con botones claros
- ✅ **Contextual:** Deltas muestran progreso (motivacional)
- ✅ **Progressive:** Exports abajo (menos prioritario)

---

### 4.4 Director View — Wireframe

```
┌──────────────────────────────────────────────────────────┐
│ Reportes y Análisis                                       │
│ ─────────────────────────────────────────────────────────│
│ ⚡ Viendo datos en vivo  |  vs Q2 2024                    │
│ Vista: [Manager] [📊 Director] [HR]                      │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ 🎯 Health Score                                           │  ← Hero metric
│ ┌───────────────────────────────────────────────────────┐│
│ │          2.9 / 5.0                                    ││
│ │      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 58%              ││
│ │                                                       ││
│ │      ↑ +0.3 vs Q2 2024                                ││
│ │      Meta Q4: 3.5  (faltan 0.6)                       ││
│ └───────────────────────────────────────────────────────┘│
│                                                           │
│ 🗺️ Mapa de Competencias                                   │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│ │ Innovación   │ │ Desarrollo   │ │ Liderazgo    │      │
│ │    🟢 3.8    │ │    🟡 2.9    │ │    🟡 2.9    │      │
│ │  Fortaleza   │ │  Competente  │ │  Competente  │      │
│ └──────────────┘ └──────────────┘ └──────────────┘      │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│ │ Negocio      │ │ Entrega      │ │ Emergentes   │      │
│ │    🟡 2.9    │ │    🟡 3.0    │ │    🔴 2.0    │      │
│ │  Competente  │ │  Competente  │ │  Atención    │      │
│ └──────────────┘ └──────────────┘ └──────────────┘      │
│                                                           │
│ 💰 Prioridades de Inversión                               │
│ ┌───────────────────────────────────────────────────────┐│
│ │ ① Cloud & DevOps                                      ││
│ │    Impacto: 4/5 colaboradores (80%)                   ││
│ │    ROI estimado: Reducción 30% en deploy time         ││
│ │    [Ver detalles]                                     ││
│ └───────────────────────────────────────────────────────┘│
│                                                           │
│ 📊 Exportación                                            │
│ [PDF Ejecutivo] [Excel] [CSV] [JSON]                     │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

**UX Principles:**
- ✅ **Single Number Focus:** Health Score domina (CXOs aman 1 métrica)
- ✅ **Visual Heatmap:** Color-coding inmediato (rojo = problema)
- ✅ **ROI Language:** "Inversión" no "capacitación" (business mindset)
- ✅ **Minimal Clutter:** Solo lo esencial

---

### 4.5 HR View — Wireframe

```
┌──────────────────────────────────────────────────────────┐
│ Reportes y Análisis                                       │
│ ─────────────────────────────────────────────────────────│
│ ⚡ Viendo datos en vivo  |  vs Q2 2024                    │
│ Vista: [Manager] [Director] [👤 HR]                      │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ 👥 Distribución de Talento                                │
│ ┌─────────────┐ ┌─────────────┐ ┌──────────────┐        │
│ │     2       │ │      2      │ │       1      │        │
│ │ High        │ │ Solid       │ │ Needs        │        │
│ │ Performers  │ │ Contributors│ │ Development  │        │
│ │ > 3.5       │ │ 2.5 - 3.5   │ │ < 2.5        │        │
│ └─────────────┘ └─────────────┘ └──────────────┘        │
│                                                           │
│ 📋 Estado de Desarrollo Individual                        │
│ ┌───────────────────────────────────────────────────────┐│
│ │ MG  María González   Product Manager     [Ver IDP]   ││
│ │     Promedio: 3.2  •  2 objetivos activos             ││
│ │     Próxima evaluación: 15 Ene 2025                   ││
│ ├───────────────────────────────────────────────────────┤│
│ │ CM  Carlos Mendez    Arquitecto          [Ver IDP]   ││
│ │     Promedio: 2.9  •  3 objetivos activos             ││
│ ├───────────────────────────────────────────────────────┤│
│ │ LT  Laura Torres     Jr Developer        ⚠️ Sin IDP   ││
│ │     Promedio: 1.3  •  15 gaps críticos                ││
│ │     [Crear IDP]                                       ││
│ └───────────────────────────────────────────────────────┘│
│                                                           │
│ 🔄 Planificación de Sucesión                              │
│ ┌───────────────────────────────────────────────────────┐│
│ │ Arquitecto Cloud (Carlos Mendez)                      ││
│ │   Backup: ⚠️ No disponible                            ││
│ │   [Identificar sucesor]                               ││
│ └───────────────────────────────────────────────────────┘│
│                                                           │
│ 📊 Exportación                                            │
│ [Lista empleados] [Gaps detallados] [IDPs] [JSON]        │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

**UX Principles:**
- ✅ **People-Centric:** Cards por persona (no por skill)
- ✅ **IDP Visibility:** Estado de planes de desarrollo prominente
- ✅ **Alerts:** ⚠️ para personas sin IDP o backup
- ✅ **Action-Oriented:** Botones para crear IDPs directamente

---

## V. COMPONENT DESIGN SYSTEM — UX Specs

### 5.1 ExportButton — Redesigned

**States:**

```
1. DEFAULT (idle)
┌─────────────────────────────────────────────┐
│                                             │
│          📄                                 │  ← Icon (28px)
│                                             │
│      PDF Ejecutivo                          │  ← Title (font-medium)
│      Para stakeholders                      │  ← Description (text-sm)
│                                             │
└─────────────────────────────────────────────┘
- Border: 1px solid gray-200
- Background: surface (white)
- Cursor: pointer

2. HOVER
┌─────────────────────────────────────────────┐
│          📄                                 │
│      PDF Ejecutivo                          │
│      Para stakeholders                      │
└─────────────────────────────────────────────┘
- Border: 1px solid primary/30
- Background: surface
- Transition: border-color 200ms

3. LOADING
┌─────────────────────────────────────────────┐
│          ⏳                                 │  ← Spinning icon
│      Generando PDF...                       │
│                                             │
└─────────────────────────────────────────────┘
- Border: 1px solid gray-200
- Background: surface
- Cursor: not-allowed

4. SUCCESS (2s)
┌─────────────────────────────────────────────┐
│          ✓                                  │  ← Checkmark
│      PDF exportado                          │
│                                             │
└─────────────────────────────────────────────┘
- Border: 1px solid competent/30
- Background: competent/5
- Auto-revert a DEFAULT después de 2s

5. DISABLED (próximamente)
┌─────────────────────────────────────────────┐
│          📄                                 │  ← Icon gray-300
│      PDF Ejecutivo                          │  ← Text gray-400
│      [Próximamente]                         │  ← Badge
└─────────────────────────────────────────────┘
- Border: 1px solid gray-200
- Background: gray-50
- Cursor: not-allowed
- Opacity: 0.6
```

**No Icons:**
- ❌ ChevronRight (sugiere navegación, pero es export)
- ❌ Download icon redundante (ya está en el main icon)

---

### 5.2 StakeholderToggle — Component Spec

**Layout:**
```
┌────────────────────────────────────────────────┐
│ Vista:                                         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │👤 Manager│ │📊Director│ │👥 HR     │        │
│ └──────────┘ └──────────┘ └──────────┘        │
└────────────────────────────────────────────────┘
```

**States:**

```
ACTIVE:
┌──────────┐
│👤 Manager│
└──────────┘
- Background: surface (white)
- Border: 1px solid primary
- Text: primary
- Font: medium
- Shadow: sm
- Padding: 8px 16px

INACTIVE:
┌──────────┐
│📊Director│
└──────────┘
- Background: transparent
- Border: none
- Text: gray-600
- Font: medium
- Padding: 8px 16px

HOVER (inactive):
┌──────────┐
│👥 HR     │
└──────────┘
- Background: gray-50
- Text: gray-800
- Transition: background 150ms
```

**Responsive:**
```
Desktop (> 640px):
[👤 Manager] [📊 Director] [👥 HR]
↑ Icon + Label

Mobile (< 640px):
[👤] [📊] [👥]
↑ Solo icon (label hidden)
```

---

### 5.3 SnapshotSelector — Minimal Mode for Reports

**Actual en Dashboard:** Demasiado complejo (banner + dropdown expandible)

**Propuesta para Reports:** Modo compacto

```
┌────────────────────────────────────────────────┐
│ ⚡ En vivo  |  vs Q2 2024  [Cambiar]           │
│    ↑          ↑              ↑                 │
│  Status   Comparing     Expand toggle          │
└────────────────────────────────────────────────┘
```

**Click en [Cambiar]:**
```
┌────────────────────────────────────────────────┐
│ Ver datos de:     vs:           [📸 Crear]     │
│ [Q3 2024 ▾]       [Q2 2024 ▾]                  │
└────────────────────────────────────────────────┘
↑ Dropdowns inline (no modal)
```

**Modo Histórico:**
```
┌────────────────────────────────────────────────┐
│ 🕐 Histórico: Q2 2024  |  [Volver a hoy]      │
└────────────────────────────────────────────────┘
- Background: warning/10
- Border-left: 4px solid warning
- Text: warning (darker shade)
```

---

## VI. DESIGN TOKENS — Standardization

### 6.1 Color System (Final)

```javascript
// tailwind.config.js
colors: {
  // Brand
  primary: {
    DEFAULT: '#2d676e',
    light: '#e6eff0',     // Backgrounds sutiles
    hover: 'rgba(45, 103, 110, 0.3)',  // Border hovers
  },

  // Status
  competent: {
    DEFAULT: '#a6ae3d',
    light: '#f3f4e6',
  },
  warning: {
    DEFAULT: '#da8a0c',
    light: '#fef3e6',
  },
  critical: {
    DEFAULT: '#ef4444',
    light: '#fef2f2',
  },

  // Neutrals (Corporate Zen)
  surface: '#ffffff',
  background: '#f5f5f5',
  gray: {
    50: '#f9fafb',   // Backgrounds de cards
    100: '#f3f4f6',
    200: '#e5e7eb',  // Borders default
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',  // Text secondary
    600: '#4b5563',  // Text default
    700: '#374151',
    800: '#1f2937',  // Headlines
  }
}
```

**REGLA DE ORO:**
- Backgrounds → SIEMPRE gray-50, surface, o background
- Color → SOLO en icons, badges, borders (hover)

---

### 6.2 Typography Scale

```javascript
// Font Families
font-family: 'Inter', -apple-system, system-ui, sans-serif;

// Scale
h1: text-3xl (30px) font-light text-primary
    → Page titles

h2: text-lg (18px) font-medium text-gray-800
    → Card titles

h3: text-sm (14px) font-medium text-gray-500 uppercase tracking-wide
    → Section headers

h4: text-xs (12px) font-medium text-gray-600 uppercase tracking-wide
    → Labels

body: text-base (16px) font-normal text-gray-700
      → Default text

body-sm: text-sm (14px) font-normal text-gray-600
         → Secondary text

caption: text-xs (12px) font-normal text-gray-400
         → Captions, timestamps
```

**REGLA:**
- 1 página = 1 h1 (máximo)
- Section headers = SIEMPRE h3 (no h2, h4, o span)
- Evitar bold (usar medium)
- Evitar múltiples tamaños en misma sección

---

### 6.3 Spacing System

```javascript
// Base: 4px (0.25rem)
space-1: 4px
space-2: 8px   // Tight (dentro de componentes)
space-3: 12px
space-4: 16px  // Default (entre cards en grid)
space-5: 20px
space-6: 24px  // Sections
space-8: 32px  // Page-level

// Grid Gaps
gap-4: 16px    // Métricas pequeñas (KPI cards)
gap-6: 24px    // Cards principales (export buttons, analysis sections)

// Vertical Rhythm
space-y-4: 16px  // Dentro de sections
space-y-6: 24px  // Entre sections
```

**REGLA:**
- Usar SOLO múltiplos de 4
- Preferir 4, 6, 8 (evitar 3, 5, 7)

---

### 6.4 Border Radius

```javascript
rounded-lg: 8px     // Cards, buttons
rounded-md: 6px     // Inputs, badges pequeños
rounded-full: 9999px // Pills, avatars
```

**REGLA:**
- Cards principales → rounded-lg
- Buttons/Inputs → rounded-md
- Badges → rounded-full

---

### 6.5 Shadows

```javascript
// Solo 2 niveles (Corporate Zen = minimal)
shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05)
           → Cards, dropdowns

shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07)
           → Modals, elevated states
```

**REGLA:**
- Default cards → shadow-sm
- NO usar shadow en hover (solo border transition)
- Modals → shadow-md

---

## VII. NEXT STEPS — UX Priority

### Phase 1: Settings (BLOCKING)
**¿Qué construir?**
1. Tab navigation (Colaboradores, Skills, Categorías)
2. CollaboratorsTable con inline editing
3. SkillsManager con accordion
4. CategoriesManager con drag-drop
5. Modals: Crear colaborador, Editar skill con rubrica
6. Empty states para cada tab

**UX Deliverables:**
- ✅ Wireframes hi-fi (Figma)
- ✅ Interaction flows documentados
- ✅ Component specs (estados, transitions)

---

### Phase 2: Reports Consistency
**¿Qué arreglar?**
1. ExportButton redesign (sin hover-lift, con states)
2. GapAnalysisSection (background neutral, sin border-left)
3. Typography estandarización (h3 para section headers)
4. Spacing unificación (gap-6 para grids principales)
5. Color cleanup (backgrounds → gray-50)

**UX Deliverables:**
- ✅ Before/After comparisons
- ✅ Updated component specs
- ✅ Visual regression tests (manual)

---

### Phase 3: Stakeholder Views
**¿Qué agregar?**
1. StakeholderToggle component
2. TeamManagerMetrics layout
3. ExecutiveMetrics layout
4. HRMetrics layout
5. Content switching logic (sin re-fetch)

**UX Deliverables:**
- ✅ 3 wireframes (Manager, Director, HR)
- ✅ User flows por rol
- ✅ Content matrix (qué ve cada rol)

---

## VIII. MÉTRICAS DE ÉXITO UX

### Settings Page

**Metric 1: Time to Create Collaborator**
- Target: < 15 segundos
- Measurement: Time desde click [+ Nuevo] hasta toast "Creado"

**Metric 2: Error Rate**
- Target: < 5% de intentos fallan
- Measurement: % de modals cerrados sin guardar

**Metric 3: Discoverability**
- Target: 100% de users encuentran cómo editar inline
- Measurement: User testing (5 users, task: "Cambia el rol de María")

---

### Reports Page

**Metric 1: Scan Time (F-pattern)**
- Target: User identifica KPIs principales en < 3 segundos
- Measurement: Eye-tracking (si disponible) o user testing

**Metric 2: Role Clarity**
- Target: 100% de users entienden para qué sirve cada toggle
- Measurement: Survey post-uso: "¿Cuál vista usarías como Team Manager?"

**Metric 3: Export Success Rate**
- Target: 100% de exports completan sin confusión
- Measurement: Analytics (clicks vs downloads completados)

---

## IX. CONCLUSIÓN — UX Strategy

### Problemas Core Resueltos

1. **Settings vacío → Gestión completa de maestros**
   - Inline editing (0 friction)
   - Drag-drop (organización visual)
   - Progressive disclosure (no abrumar)

2. **Reports inconsistente → Diseño unificado**
   - Corporate Zen aplicado (backgrounds neutros, color minimal)
   - Typography/spacing estandarizado
   - Estados visuales claros (loading, success, error)

3. **Métricas genéricas → Vistas por stakeholder**
   - Toggle de roles (Manager/Director/HR)
   - Contenido dinámico según contexto
   - Métricas accionables (no solo informativas)

---

### Principios UX Aplicados

**Don't Make Me Think:**
- ✅ Inline editing (no modals innecesarios)
- ✅ Tabs flat (no sub-navegación)
- ✅ Actions visibles (no menús ocultos)

**Nielsen Heuristics:**
- ✅ #1 Visibility: Modo histórico claramente marcado
- ✅ #4 Consistency: Un solo patrón de hover (border, no lift)
- ✅ #7 Flexibility: Vistas por rol
- ✅ #8 Aesthetics: Minimal, sin clutter

**Corporate Zen:**
- ✅ Backgrounds neutros (gray-50, surface)
- ✅ Color solo en acentos (icons, badges, borders)
- ✅ Typography sutil (medium, no bold)
- ✅ Spacing rítmico (múltiplos de 6)

---

**Documento generado:** 29 Diciembre 2024
**Enfoque:** 100% UX/UI (sin consideraciones de backend/API)
**Próximo paso:** Validar wireframes con stakeholders reales
