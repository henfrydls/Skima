import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../index.js';
import { prisma } from '../db.js';
import { JWT_SECRET, generateToken } from '../middleware/auth.js';
import { resetRateLimiter } from '../routes/auth.js';

describe('Auth Routes', () => {
  let app;

  beforeEach(async () => {
    app = createApp();
    resetRateLimiter();
    // Ensure SystemConfig has a known password for auth tests
    await prisma.systemConfig.upsert({
      where: { id: 1 },
      update: { adminPassword: 'admin123', isSetup: true, companyName: 'Test', adminName: 'Test' },
      create: { id: 1, adminPassword: 'admin123', isSetup: true, companyName: 'Test', adminName: 'Test' },
    });
  });

  // ============================================
  // POST /api/auth/login
  // ============================================
  describe('POST /api/auth/login', () => {
    it('should return token with correct password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'admin123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(typeof res.body.token).toBe('string');
      expect(res.body.message).toBe('Inicio de sesión exitoso');

      // Verify the token is a valid JWT with expected payload
      const decoded = jwt.verify(res.body.token, JWT_SECRET);
      expect(decoded.role).toBe('admin');
      expect(decoded.loginTime).toBeDefined();
    });

    it('should return 401 with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Contraseña incorrecta');
      expect(res.body.code).toBe('INVALID_PASSWORD');
      expect(res.body.token).toBeUndefined();
    });

    it('should return 400 when password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Contraseña requerida');
      expect(res.body.code).toBe('PASSWORD_REQUIRED');
    });

    it('should return 500 when request body is not JSON (no body at all)', async () => {
      // When no Content-Type: application/json body is sent, req.body is undefined,
      // causing the destructuring to throw. The server catches this as a 500.
      const res = await request(app)
        .post('/api/auth/login');

      expect(res.status).toBe(500);
      expect(res.body.message).toBe('Error en el servidor');
    });

    it('should return 400 when password field is null', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: null });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('PASSWORD_REQUIRED');
    });

    it('should auto-grant access when no password is configured', async () => {
      // Remove the password from SystemConfig
      await prisma.systemConfig.update({
        where: { id: 1 },
        data: { adminPassword: null },
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.message).toBe('Acceso concedido (sin contraseña configurada)');
    });
  });

  // ============================================
  // GET /api/auth/verify
  // ============================================
  describe('GET /api/auth/verify', () => {
    it('should return authenticated true with valid token', async () => {
      const token = generateToken({ role: 'admin', loginTime: new Date().toISOString() });

      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.authenticated).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.role).toBe('admin');
    });

    it('should return authenticated false with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.status).toBe(200);
      expect(res.body.authenticated).toBe(false);
    });

    it('should return authenticated false with no Authorization header', async () => {
      const res = await request(app)
        .get('/api/auth/verify');

      expect(res.status).toBe(200);
      expect(res.body.authenticated).toBe(false);
    });

    it('should return authenticated false with malformed Authorization header', async () => {
      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'NotBearer sometoken');

      expect(res.status).toBe(200);
      expect(res.body.authenticated).toBe(false);
    });

    it('should return authenticated false with expired token', async () => {
      // Generate a token that expires immediately
      const token = generateToken({ role: 'admin' }, '0s');

      // Wait a tick so the token expires
      await new Promise(resolve => setTimeout(resolve, 50));

      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.authenticated).toBe(false);
    });
  });

  // ============================================
  // Auth Middleware (tested via protected route)
  // ============================================
  describe('Auth Middleware on protected routes', () => {
    it('should return 401 when accessing protected route without token', async () => {
      const res = await request(app)
        .post('/api/categories')
        .send({ nombre: 'Test', abrev: 'T' });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('AUTH_REQUIRED');
    });

    it('should return 401 when accessing protected route with invalid token', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .send({ nombre: 'Test', abrev: 'T' });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_TOKEN');
    });

    it('should allow access to protected route with valid token', async () => {
      const token = generateToken({ role: 'admin' });

      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Protected Cat', abrev: 'PC' });

      expect(res.status).toBe(200);
      expect(res.body.nombre).toBe('Protected Cat');
    });

    it('should return 401 with TOKEN_EXPIRED code for expired token', async () => {
      const token = generateToken({ role: 'admin' }, '0s');

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 50));

      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Test', abrev: 'T' });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('TOKEN_EXPIRED');
    });
  });
});
