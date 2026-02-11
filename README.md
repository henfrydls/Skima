# Skills Matrix & Tracking Dashboard (FOSS)

Visualizador y gestor interactivo del marco de competencias. Transformado de un prototipo JSON a una aplicación robusta **Monorepo (React + Node.js)** con persistencia en **SQLite**.

![Dashboard Preview](https://github.com/user-attachments/assets/d1f1dd4e-ad8a-48b5-aa3d-890d3cacd373)

---

## 🚀 Arquitectura (v0.9)

El proyecto opera como un **Monorepo** con la siguiente estructura:

- **Root:** Gestión global y scripts concurrentes.
- **Client (`/client`):** SPA React 19 + Vite + TailwindCSS. Interfaz moderna y componentes modulares.
- **Server (`/server`):** API REST Node.js + Express + Prisma ORM. Persistencia en SQLite (`skills.db`).

---

## ✨ Funcionalidades

- **Dashboard Ejecutivo:** KPIs de equipo, brechas críticas y tendencias vs snapshots anteriores.
- **Matriz Transpuesta:** Vista de "Heatmap" para identificar fortalezas y debilidades del equipo de un vistazo.
- **Detalle de Colaborador:** Gráficos de evolución y lista de skills priorizada por criticidad.
- **API REST Real:** Endpoints `/api/collaborators`, `/api/skills`, etc., reemplazando el antiguo mock.
- **CI/CD Integrado:** Workflows de GitHub Actions para calidad (Lint/Test) y construcción (Build).

---

## 🛠️ Instalación y Ejecución

### Requisitos
- Node.js 20+
- npm

### Pasos Rápidos

1. **Clonar y preparar:**
   ```bash
   git clone https://github.com/henfrydls/skills-dashboard.git
   cd skills-dashboard
   npm install      # Instala dependencias en root, client y server
   ```

2. **Inicializar Base de Datos (Primera vez):**
   ```bash
   npm run db:migrate  # Ejecuta migraciones de Prisma
   cd server && node prisma/seed.js # (Opcional) Carga datos demo
   ```

3. **Arrancar entorno de desarrollo:**
   ```bash
   npm run dev
   ```
   - **Frontend:** http://localhost:5173
   - **Backend:** http://localhost:3001

---

## 🤖 Scripts Disponibles (Root)

- `npm run dev`: Inicia Cliente y Servidor en paralelo.
- `npm run build`: Construye ambos proyectos para producción.
- `npm test`: Ejecuta tests de integración (API) y unitarios.

---

## 🗺️ Roadmap Actual

- [x] **Fase 1:** Fundación y Persistencia (Monorepo, SQLite).
- [x] **Fase 1.1:** Nueva UX/UI (Dashboard Pro, Matriz Visual).
- [x] **Fase 1.5:** DevOps & CI/CD Pipelines.
- [ ] **Fase 2:** Admin Power (Auth, CRUD Real de Skills/Categorías).
- [ ] **Fase 2.1:** Demo Mode (Datos de ejemplo en primera corrida + flujo de bienvenida).
- [ ] **Fase 3:** Time Travel (Historial de Snapshots).
- [ ] **Fase 4:** Packaging (Electron Desktop App).

---

## 📄 Licencia

MIT License. Copyright © 2025.
