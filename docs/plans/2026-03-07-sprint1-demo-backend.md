# Sprint 1: Demo Mode Backend — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a DEMO_MODE middleware that blocks destructive operations on the server, expose `isOnlineDemo` to the client, and update Docker config — without touching any existing route handlers.

**Architecture:** A single Express middleware reads `DEMO_MODE` env var and intercepts requests matching a blocklist of destructive endpoints (DELETE, setup, reset, import, credentials). All other requests pass through untouched. The `GET /api/config` response gains one new field: `isOnlineDemo`. ConfigContext on the client exposes it.

**Tech Stack:** Express 5 middleware, Vitest + Supertest tests, Docker Compose env vars

---

### Task 1: Create Demo Middleware

**Files:**
- Create: `server/src/middleware/demo.js`

**Step 1: Create the middleware file**

```javascript
// server/src/middleware/demo.js

const DEMO_BLOCKED = [
  ['POST',   /^\/api\/reset-database$/],
  ['POST',   /^\/api\/setup$/],
  ['POST',   /^\/api\/seed-demo$/],
  ['POST',   /^\/api\/reset-demo$/],
  ['POST',   /^\/api\/import$/],
  ['PUT',    /^\/api\/config$/],
  ['DELETE', /^\/api\/categories\/\d+$/],
  ['DELETE', /^\/api\/collaborators\/\d+$/],
  ['DELETE', /^\/api\/skills\/\d+$/],
  ['DELETE', /^\/api\/role-profiles\/[^/]+$/],
  ['DELETE', /^\/api\/evaluations\/[^/]+$/],
];

export function demoModeMiddleware(req, res, next) {
  if (process.env.DEMO_MODE !== 'true') return next();

  const blocked = DEMO_BLOCKED.some(
    ([method, pattern]) => req.method === method && pattern.test(req.path)
  );

  if (blocked) {
    return res.status(403).json({
      error: 'DEMO_MODE',
      message: 'This action is not available in demo mode.',
    });
  }

  next();
}
```

**Step 2: Verify file exists**

Run: `node -e "import('./server/src/middleware/demo.js').then(m => console.log(typeof m.demoModeMiddleware))"`
Expected: `function`

**Step 3: Commit**

```bash
git add server/src/middleware/demo.js
git commit -m "feat: add demo mode middleware with destructive endpoint blocklist"
```

---

### Task 2: Register Middleware in createApp()

**Files:**
- Modify: `server/src/index.js` (lines 1-22)

**Step 1: Add import**

At line 11 (after the `authMiddleware` import), add:

```javascript
import { demoModeMiddleware } from './middleware/demo.js';
```

**Step 2: Register middleware after cookieParser, before routes**

At line 22 (after `app.use(cookieParser())`), add:

```javascript
  // Demo mode: block destructive operations when DEMO_MODE=true
  app.use(demoModeMiddleware);
```

The resulting order in `createApp()` should be:
```
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(demoModeMiddleware);    // <-- NEW
app.use('/api/auth', authRoutes);
...
```

**Step 3: Verify server starts**

Run: `cd server && node -e "import('./src/index.js').then(m => { const app = m.createApp(); console.log('OK'); process.exit(0); })"`
Expected: `OK`

**Step 4: Commit**

```bash
git add server/src/index.js
git commit -m "feat: register demo middleware in Express pipeline"
```

---

### Task 3: Add isOnlineDemo to GET /api/config

**Files:**
- Modify: `server/src/index.js` (lines 42-60, the GET /api/config handler)

**Step 1: Add `isOnlineDemo` to the "no config" response**

In the `if (!config)` block (around line 42), add `isOnlineDemo`:

```javascript
      if (!config) {
        return res.json({
          isSetup: false,
          isDemo: false,
          isOnlineDemo: process.env.DEMO_MODE === 'true',
          companyName: null,
          adminName: null,
          hasPassword: false
        });
      }
```

**Step 2: Add `isOnlineDemo` to the normal response**

In the `res.json()` block (around line 54), add `isOnlineDemo`:

```javascript
      res.json({
        isSetup: config.isSetup,
        isDemo: demoCount > 0,
        isOnlineDemo: process.env.DEMO_MODE === 'true',
        companyName: config.companyName,
        adminName: config.adminName,
        hasPassword: !!config.adminPassword
      });
```

**Step 3: Commit**

```bash
git add server/src/index.js
git commit -m "feat: expose isOnlineDemo flag in GET /api/config"
```

---

### Task 4: Expose isOnlineDemo in ConfigContext

**Files:**
- Modify: `client/src/contexts/ConfigContext.jsx` (line 65)

**Step 1: Add `isOnlineDemo` to the value object**

In the `value` object (around line 60), add `isOnlineDemo` after `isDemo`:

```javascript
  const value = {
    config,
    isLoading,
    error,
    isSetup: config?.isSetup ?? false,
    isDemo: config?.isDemo ?? false,
    isOnlineDemo: config?.isOnlineDemo ?? false,
    companyName: config?.companyName ?? 'Skima',
    adminName: config?.adminName ?? 'Admin',
    onSetupComplete,
    refetchConfig: fetchConfig
  };
```

**Step 2: Commit**

```bash
git add client/src/contexts/ConfigContext.jsx
git commit -m "feat: expose isOnlineDemo from ConfigContext"
```

---

### Task 5: Write Tests for Demo Middleware — Blocked Endpoints

**Files:**
- Create: `server/src/__tests__/demo-middleware.test.js`

**Step 1: Write test file with blocked endpoint tests**

```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { createApp, prisma } from '../index.js';

describe('Demo Mode Middleware', () => {
  let app;

  beforeEach(async () => {
    // Enable demo mode for these tests
    process.env.DEMO_MODE = 'true';
    app = createApp();

    // Clean slate
    await prisma.assessment.deleteMany();
    await prisma.evaluationSession.deleteMany();
    await prisma.roleProfile.deleteMany();
    await prisma.collaborator.deleteMany();
    await prisma.skill.deleteMany();
    await prisma.category.deleteMany();
    await prisma.systemConfig.deleteMany();
  });

  afterEach(() => {
    delete process.env.DEMO_MODE;
  });

  describe('Blocked endpoints return 403', () => {
    it('blocks POST /api/setup', async () => {
      const res = await request(app)
        .post('/api/setup')
        .send({ companyName: 'Test', adminName: 'Admin', adminPassword: 'pass' });
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('DEMO_MODE');
    });

    it('blocks POST /api/reset-database', async () => {
      const res = await request(app).post('/api/reset-database');
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('DEMO_MODE');
    });

    it('blocks POST /api/seed-demo', async () => {
      const res = await request(app).post('/api/seed-demo');
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('DEMO_MODE');
    });

    it('blocks POST /api/reset-demo', async () => {
      const res = await request(app).post('/api/reset-demo');
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('DEMO_MODE');
    });

    it('blocks POST /api/import', async () => {
      const res = await request(app)
        .post('/api/import')
        .send({ data: {} });
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('DEMO_MODE');
    });

    it('blocks PUT /api/config (credential changes)', async () => {
      const res = await request(app)
        .put('/api/config')
        .send({ adminPassword: 'hacked' });
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('DEMO_MODE');
    });

    it('blocks DELETE /api/categories/:id', async () => {
      const res = await request(app).delete('/api/categories/1');
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('DEMO_MODE');
    });

    it('blocks DELETE /api/collaborators/:id', async () => {
      const res = await request(app).delete('/api/collaborators/1');
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('DEMO_MODE');
    });

    it('blocks DELETE /api/skills/:id', async () => {
      const res = await request(app).delete('/api/skills/1');
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('DEMO_MODE');
    });

    it('blocks DELETE /api/role-profiles/:rol', async () => {
      const res = await request(app).delete('/api/role-profiles/Frontend%20Developer');
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('DEMO_MODE');
    });

    it('blocks DELETE /api/evaluations/:uuid', async () => {
      const res = await request(app).delete('/api/evaluations/some-uuid-here');
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('DEMO_MODE');
    });
  });
});
```

**Step 2: Run tests to verify they pass**

Run: `cd server && npx vitest run src/__tests__/demo-middleware.test.js`
Expected: 11 tests PASS

**Step 3: Commit**

```bash
git add server/src/__tests__/demo-middleware.test.js
git commit -m "test: add tests for demo middleware blocked endpoints"
```

---

### Task 6: Write Tests — Allowed Endpoints and Disabled Mode

**Files:**
- Modify: `server/src/__tests__/demo-middleware.test.js`

**Step 1: Add tests for allowed endpoints**

Append inside the `describe('Demo Mode Middleware')` block:

```javascript
  describe('Allowed endpoints pass through', () => {
    it('allows GET /api/config', async () => {
      const res = await request(app).get('/api/config');
      expect(res.status).toBe(200);
    });

    it('allows POST /api/auth/login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'wrong' });
      // 401 means it reached the handler (not 403)
      expect(res.status).not.toBe(403);
    });

    it('allows GET /api/data', async () => {
      const res = await request(app).get('/api/data');
      // May return 200 or 500 depending on DB state, but NOT 403
      expect(res.status).not.toBe(403);
    });

    it('allows POST /api/collaborators (create)', async () => {
      // First create a category so the collaborator has valid context
      const res = await request(app)
        .post('/api/collaborators')
        .send({ nombre: 'Test User', rol: 'Developer', area: 'Engineering' });
      // May fail validation, but should NOT be 403
      expect(res.status).not.toBe(403);
    });

    it('allows POST /api/config/verify', async () => {
      const res = await request(app)
        .post('/api/config/verify')
        .send({ password: 'test' });
      expect(res.status).not.toBe(403);
    });

    it('allows GET /api/export', async () => {
      const res = await request(app).get('/api/export');
      expect(res.status).not.toBe(403);
    });
  });

  describe('Middleware disabled when DEMO_MODE is not set', () => {
    it('allows all operations when DEMO_MODE is unset', async () => {
      delete process.env.DEMO_MODE;
      const freshApp = createApp();

      // Setup should work (not blocked)
      const res = await request(freshApp)
        .post('/api/setup')
        .send({ companyName: 'Real Co', adminName: 'Admin', adminPassword: 'secure123' });
      expect(res.status).not.toBe(403);
    });

    it('allows all operations when DEMO_MODE is false', async () => {
      process.env.DEMO_MODE = 'false';
      const freshApp = createApp();

      const res = await request(freshApp)
        .post('/api/setup')
        .send({ companyName: 'Real Co', adminName: 'Admin', adminPassword: 'secure123' });
      expect(res.status).not.toBe(403);
    });
  });
```

**Step 2: Run full test file**

Run: `cd server && npx vitest run src/__tests__/demo-middleware.test.js`
Expected: 19 tests PASS

**Step 3: Commit**

```bash
git add server/src/__tests__/demo-middleware.test.js
git commit -m "test: add tests for allowed endpoints and disabled demo mode"
```

---

### Task 7: Test isOnlineDemo in Config Response

**Files:**
- Modify: `server/src/__tests__/demo-middleware.test.js`

**Step 1: Add config response tests**

Append inside the `describe('Demo Mode Middleware')` block:

```javascript
  describe('GET /api/config includes isOnlineDemo', () => {
    it('returns isOnlineDemo true when DEMO_MODE=true', async () => {
      const res = await request(app).get('/api/config');
      expect(res.status).toBe(200);
      expect(res.body.isOnlineDemo).toBe(true);
    });

    it('returns isOnlineDemo false when DEMO_MODE is unset', async () => {
      delete process.env.DEMO_MODE;
      const freshApp = createApp();

      const res = await request(freshApp).get('/api/config');
      expect(res.status).toBe(200);
      expect(res.body.isOnlineDemo).toBe(false);
    });
  });
```

**Step 2: Run full test file**

Run: `cd server && npx vitest run src/__tests__/demo-middleware.test.js`
Expected: 21 tests PASS

**Step 3: Commit**

```bash
git add server/src/__tests__/demo-middleware.test.js
git commit -m "test: verify isOnlineDemo in config response"
```

---

### Task 8: Run Full Server Test Suite

**Step 1: Run all server tests to ensure no regressions**

Run: `cd server && npx vitest run --coverage`
Expected: All 82+ tests pass (61 existing + 21 new), no regressions

**Step 2: If any test fails, fix and re-run before proceeding**

---

### Task 9: Update Docker Compose for Demo Mode

**Files:**
- Modify: `docker-compose.yml`

**Step 1: Add DEMO_MODE env var and container name**

Update `docker-compose.yml` to:

```yaml
services:
  skima:
    build: .
    container_name: skima-demo
    ports:
      - "3000:3001"
    environment:
      - DEMO_MODE=true
    volumes:
      - skima-data:/app/data
    restart: unless-stopped

volumes:
  skima-data:
```

**Step 2: Verify Docker build works**

Run: `docker compose build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: add DEMO_MODE=true and container name to docker-compose"
```

---

### Task 10: Run Full CI Checks

**Step 1: Run client tests**

Run: `cd client && npx vitest run`
Expected: 696+ tests pass

**Step 2: Run lint**

Run: `cd client && npx eslint src/`
Expected: No errors

**Step 3: Run server tests**

Run: `cd server && npx vitest run`
Expected: 82+ tests pass

**Step 4: Run build**

Run: `npm run build`
Expected: Build succeeds

---

### Summary

After completing all 10 tasks, Sprint 1 delivers:

1. **`server/src/middleware/demo.js`** — Blocklist middleware (11 blocked endpoints)
2. **`server/src/index.js`** — Middleware registered + `isOnlineDemo` in config response
3. **`client/src/contexts/ConfigContext.jsx`** — Exposes `isOnlineDemo`
4. **`server/src/__tests__/demo-middleware.test.js`** — 21 tests (blocked, allowed, disabled, config)
5. **`docker-compose.yml`** — `DEMO_MODE=true` + container name

**Files created:** 2 (middleware + tests)
**Files modified:** 3 (index.js, ConfigContext.jsx, docker-compose.yml)
**Existing behavior changed:** None (middleware is no-op when DEMO_MODE is unset)
