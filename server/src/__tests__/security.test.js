import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../index.js';

describe('Security Headers', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  it('sets X-Content-Type-Options header', async () => {
    const res = await request(app).get('/api/config');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('sets X-Frame-Options header', async () => {
    const res = await request(app).get('/api/config');
    expect(res.headers['x-frame-options']).toBe('DENY');
  });

  it('removes X-Powered-By header', async () => {
    const res = await request(app).get('/api/config');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('limits JSON body size to 1MB', async () => {
    const largeBody = { data: 'x'.repeat(2 * 1024 * 1024) };
    const res = await request(app)
      .post('/api/setup')
      .send(largeBody);
    expect(res.status).toBe(413);
  });
});

describe('Input Validation', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  it('rejects setup with missing companyName', async () => {
    const res = await request(app)
      .post('/api/setup')
      .send({ adminName: 'Admin', adminPassword: 'pass123' });
    expect(res.status).toBe(400);
  });

  it('rejects setup with empty companyName', async () => {
    const res = await request(app)
      .post('/api/setup')
      .send({ companyName: '', adminName: 'Admin', adminPassword: 'pass123' });
    expect(res.status).toBe(400);
  });

  it('rejects setup with companyName exceeding 200 chars', async () => {
    const res = await request(app)
      .post('/api/setup')
      .send({ companyName: 'x'.repeat(201), adminName: 'Admin', adminPassword: 'pass123' });
    expect(res.status).toBe(400);
  });

  it('rejects collaborator creation with missing nombre', async () => {
    const res = await request(app)
      .post('/api/collaborators')
      .send({ rol: 'Developer', area: 'Engineering' });
    expect(res.status).toBe(400);
  });
});
