import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import bcrypt from 'bcryptjs';
import request from './helpers/request.js';
import { createApp, prisma } from '../index.js';
import { generateToken } from '../middleware/auth.js';
import { resetRateLimiter } from '../routes/auth.js';
import { resetSeedRateLimiter } from '../routes/demo.js';

// Writes that replace or add data need the admin once an install has a password.
// Open access (no password) keeps working without a token, as before.

const PASSWORD = 'owner-password';

async function setUpWithPassword(password = PASSWORD) {
  await prisma.systemConfig.create({
    data: {
      id: 1,
      companyName: 'Acme',
      adminName: 'Owner',
      adminPassword: await bcrypt.hash(password, 10),
      isSetup: true,
    },
  });
}

async function storedPasswordIs(password) {
  const config = await prisma.systemConfig.findFirst();
  return bcrypt.compare(password, config.adminPassword);
}

const bearer = () => `Bearer ${generateToken({ role: 'admin' })}`;

describe('auth guards', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    resetRateLimiter();
    resetSeedRateLimiter();
  });

  afterEach(() => {
    delete process.env.DEMO_MODE;
  });

  describe('POST /api/seed-demo', () => {
    it('refuses a set-up install with a password and no token, and changes nothing', async () => {
      await setUpWithPassword();
      await prisma.collaborator.create({ data: { nombre: 'Real', rol: 'Dev' } });

      const res = await request(app).post('/api/seed-demo');

      expect(res.status).toBe(401);
      expect(await prisma.collaborator.count()).toBe(1);
      expect((await prisma.systemConfig.findFirst()).companyName).toBe('Acme');
      expect(await storedPasswordIs(PASSWORD)).toBe(true);
    });

    it('lets the admin seed, and keeps the existing password', async () => {
      await setUpWithPassword();

      const res = await request(app).post('/api/seed-demo').set('Authorization', bearer());

      expect(res.status).toBe(200);
      expect(await storedPasswordIs(PASSWORD)).toBe(true);
      expect(await storedPasswordIs('admin123')).toBe(false);
    }, 30000);

    it('stays open on the public demo, even once set up', async () => {
      process.env.DEMO_MODE = 'true';
      await setUpWithPassword('admin123');

      const res = await request(createApp()).post('/api/seed-demo');

      expect(res.status).toBe(200);
    }, 30000);
  });

  describe('POST /api/collaborators', () => {
    it('needs a token when a password is set', async () => {
      await setUpWithPassword();

      const res = await request(app).post('/api/collaborators').send({ nombre: 'X', rol: 'Y' });

      expect(res.status).toBe(401);
      expect(await prisma.collaborator.count()).toBe(0);
    });

    it('never takes esDemo from the client', async () => {
      const res = await request(app)
        .post('/api/collaborators')
        .send({ nombre: 'X', rol: 'Y', esDemo: true });

      expect(res.status).toBe(200);
      expect(res.body.esDemo).toBe(false);
      expect(await prisma.collaborator.count({ where: { esDemo: true } })).toBe(0);
    });
  });

  describe('POST /api/reset-demo', () => {
    it('needs a token when a password is set', async () => {
      await setUpWithPassword();
      await prisma.collaborator.create({ data: { nombre: 'Demo', rol: 'Dev', esDemo: true } });

      const res = await request(app).post('/api/reset-demo');

      expect(res.status).toBe(401);
      expect(await prisma.collaborator.count()).toBe(1);
    });
  });

  describe('POST /api/setup over demo data', () => {
    const body = { companyName: 'Mine', adminName: 'Me', adminPassword: 'new-password' };

    it('needs a token when the password is not the demo one, and wipes nothing', async () => {
      await setUpWithPassword();
      await prisma.collaborator.create({ data: { nombre: 'Demo', rol: 'Dev', esDemo: true } });

      const res = await request(app).post('/api/setup').send(body);

      expect(res.status).toBe(401);
      expect(await prisma.collaborator.count()).toBe(1);
      expect(await storedPasswordIs(PASSWORD)).toBe(true);
    });

    it('lets the admin replace it', async () => {
      await setUpWithPassword();
      await prisma.collaborator.create({ data: { nombre: 'Demo', rol: 'Dev', esDemo: true } });

      const res = await request(app).post('/api/setup').set('Authorization', bearer()).send(body);

      expect(res.status).toBe(200);
      expect(await prisma.collaborator.count()).toBe(0);
    });

    it('still lets anyone leave the seeded demo ("Set up my space")', async () => {
      await request(app).post('/api/seed-demo');

      const res = await request(app).post('/api/setup').send(body);

      expect(res.status).toBe(200);
      expect(await prisma.collaborator.count()).toBe(0);
      expect(await storedPasswordIs('new-password')).toBe(true);
    }, 30000);

    it('treats demo rows next to real people as a configured install', async () => {
      await setUpWithPassword();
      await prisma.collaborator.create({ data: { nombre: 'Demo', rol: 'Dev', esDemo: true } });
      await prisma.collaborator.create({ data: { nombre: 'Real', rol: 'Dev' } });

      const res = await request(app).post('/api/setup').set('Authorization', bearer()).send(body);

      expect(res.status).toBe(400);
      expect(await prisma.collaborator.count()).toBe(2);
    });
  });

  describe('admin password checks', () => {
    it('has no unauthenticated password-check endpoint', async () => {
      await setUpWithPassword();

      const res = await request(app).post('/api/config/verify').send({ password: PASSWORD });

      expect(res.status).toBe(404);
    });

    it('PUT /api/config needs a token when a password is set', async () => {
      await setUpWithPassword();

      const res = await request(app)
        .put('/api/config')
        .send({ adminPassword: '', currentPassword: PASSWORD });

      expect(res.status).toBe(401);
      expect(await storedPasswordIs(PASSWORD)).toBe(true);
    });

    it('PUT /api/config answers a wrong current password with 403, not 401', async () => {
      await setUpWithPassword();

      const res = await request(app)
        .put('/api/config')
        .set('Authorization', bearer())
        .send({ adminPassword: 'other', currentPassword: 'wrong' });

      expect(res.status).toBe(403);
    });

    it('PUT /api/config shares the login limit for current-password checks', async () => {
      await setUpWithPassword();
      const attempt = () => request(app)
        .put('/api/config')
        .set('Authorization', bearer())
        .send({ adminPassword: 'other', currentPassword: 'wrong' });

      for (let i = 0; i < 10; i++) expect((await attempt()).status).toBe(403);
      expect((await attempt()).status).toBe(429);
      expect((await request(app).post('/api/auth/login').send({ password: PASSWORD })).status).toBe(429);
    }, 30000);

    it('PUT /api/config still changes the name with open access', async () => {
      await prisma.systemConfig.create({ data: { id: 1, companyName: 'Acme', adminName: 'Owner', isSetup: true } });

      const res = await request(app).put('/api/config').send({ companyName: 'Acme 2' });

      expect(res.status).toBe(200);
      expect(res.body.companyName).toBe('Acme 2');
    });
  });
});
