# Identidad Visual - Skills Dashboard

Este documento describe el sistema de diseño y la identidad visual de la aplicación Skills Dashboard.

## 🎨 Paleta de Colores

### Colores Primarios

| Token | Hex | RGB | Uso |
|-------|-----|-----|-----|
| **Primary** | `#2d676e` | `45, 103, 110` | Color principal, headers, CTAs, indicador de fortalezas |
| **Competent** | `#a6ae3d` | `166, 174, 61` | Nivel "competente" (2.5 - 3.5) |
| **CompetentDark** | `#7d8530` | `125, 133, 48` | Texto sobre fondos claros (WCAG AA) |

### Colores de Estado

| Token | Hex | RGB | Uso |
|-------|-----|-----|-----|
| **Warning** | `#da8a0c` | `218, 138, 12` | Alertas, brechas, áreas de mejora |
| **Critical** | `#ef4444` | `239, 68, 68` | Riesgos críticos, brechas severas |
| **Success** | `#10b981` | `16, 185, 129` | Éxito, crecimiento positivo |

### Colores de Fondo

| Token | Hex | RGB | Uso |
|-------|-----|-----|-----|
| **Background** | `#f5f5f5` | `245, 245, 245` | Fondo de página |
| **Surface** | `#ffffff` | `255, 255, 255` | Fondo de cards y componentes |

### Semántica de Colores en Métricas

```
Nivel >= 3.5  → Primary (Fortaleza)
Nivel >= 2.5  → Competent (Competente)
Nivel < 2.5   → Warning (Requiere Atención)
Brecha Crítica → Critical (Urgente)
```

---

## 🔤 Tipografía

### Familia Tipográfica

```css
font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
```

Se utiliza la fuente del sistema para máxima compatibilidad y rendimiento.

### Jerarquía de Headers

| Elemento | Peso | Tamaño | Color | Uso |
|----------|------|--------|-------|-----|
| `h1` | `font-light` | `text-4xl` (2.25rem) | Primary | Títulos de página |
| `h2` | `font-light` | `text-2xl` (1.5rem) | Primary | Secciones principales |
| `h3` | `font-medium` | `text-xl` (1.25rem) | Primary | Sub-secciones |

### Texto de Datos

- **Números grandes**: `font-light` para elegancia
- **Etiquetas**: `text-xs`, `text-gray-400`, `uppercase`, `tracking-wide`
- **Datos importantes**: `font-medium` (clase `.data-text`)

---

## ✨ Animaciones

### Transiciones Básicas

| Clase | Duración | Efecto |
|-------|----------|--------|
| `.animate-fade-in` | 0.3s | Entrada con opacity + translateY(8px → 0) |
| `.animate-fade-in-slow` | 0.5s | Versión lenta para cards |
| `.animate-progress` | 0.6s | Crecimiento de barras de progreso |

### Animaciones Interactivas

| Clase | Efecto |
|-------|--------|
| `.hover-lift` | Elevación sutil en hover (`shadow-md`, `translateY(-2px)`) |
| `.tooltip-delayed` | Tooltip con delay de 0.3s para evitar apariciones accidentales |

### Animación Escalonada (Stagger)

```css
.animate-stagger > * {
  animation: fade-in 0.3s ease-out backwards;
}
/* Delay incremental: 0ms, 50ms, 100ms, 150ms, 200ms, 250ms, 300ms+ */
```

Usar en listas y grids para efecto cascada.

---

## 📐 Principios de Diseño

### 1. Minimalismo
- Fuentes ligeras (`font-light`) para headers
- Espaciado generoso
- Pocos colores, uso consistente

### 2. Semántica de Color
- **Verde/Teal**: Positivo, fortaleza, meta alcanzada
- **Oliva**: Competente, neutral
- **Ámbar**: Atención requerida
- **Rojo**: Crítico, acción inmediata

### 3. Jerarquía Visual
- Números grandes y prominentes para métricas clave
- Etiquetas pequeñas en gris para contexto
- Badges con bordes sutiles y fondos translúcidos

### 4. Micro-interacciones
- Transiciones suaves (200-300ms)
- Feedback visual inmediato en hover
- Estados de carga con skeletons

---

## 🧩 Componentes Clave

### StatCard
Tarjeta de métrica con:
- Título en uppercase tracking-wide
- Valor grande font-light
- Subtexto en gris
- Indicador de tendencia (↑ ↓ →)

### Badge
```html
<span class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border bg-{color}/10 text-{color} border-{color}/20">
```

### Progress Bar
```html
<div class="h-2 bg-gray-100 rounded-full overflow-hidden">
  <div class="h-full bg-{color} animate-progress" style="width: X%"></div>
</div>
```

---

## 📁 Archivos de Configuración

- **Tailwind Config**: `client/tailwind.config.js`
- **CSS Global**: `client/src/index.css`

---

## 🎯 Accesibilidad

- **Contraste**: CompetentDark (`#7d8530`) cumple WCAG AA para texto
- **Focus states**: Usar `focus:ring-2 focus:ring-primary`
- **Semántica**: Usar elementos HTML apropiados (`button`, `nav`, `main`)
