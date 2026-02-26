import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, prisma } from '../index.js';

describe('API Routes', () => {
  let app;

  beforeEach(async () => {
    app = createApp();
    
    // Clean up
    await prisma.assessment.deleteMany();
    await prisma.collaborator.deleteMany();
    await prisma.skill.deleteMany();
    await prisma.category.deleteMany();

    // Seed test data
    await prisma.category.create({
      data: { id: 1, nombre: 'Test Category', abrev: 'Test' }
    });
    
    await prisma.skill.create({
      data: { id: 1, nombre: 'Test Skill', categoriaId: 1 }
    });
  });

  describe('GET /api/data', () => {
    it('should return aggregated dashboard data', async () => {
      const res = await request(app).get('/api/data');
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('categories');
      expect(res.body).toHaveProperty('skills');
      expect(res.body).toHaveProperty('collaborators');
      expect(res.body).toHaveProperty('allowResetFromDemo');
      expect(Array.isArray(res.body.categories)).toBe(true);
      expect(Array.isArray(res.body.skills)).toBe(true);
    });

    it('should return categories with skillCount', async () => {
      const res = await request(app).get('/api/data');
      
      expect(res.body.categories[0]).toHaveProperty('skillCount');
      expect(res.body.categories[0].skillCount).toBe(1);
    });
  });

  describe('GET /api/categories', () => {
    it('should return all categories', async () => {
      const res = await request(app).get('/api/categories');
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].nombre).toBe('Test Category');
    });
  });

  describe('GET /api/skills', () => {
    it('should return all skills', async () => {
      const res = await request(app).get('/api/skills');
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].nombre).toBe('Test Skill');
    });
  });

  describe('GET /api/collaborators', () => {
    it('should return empty array when no collaborators', async () => {
      const res = await request(app).get('/api/collaborators');
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it('should return collaborators after creation', async () => {
      await prisma.collaborator.create({
        data: { nombre: 'Test User', rol: 'Developer', esDemo: false }
      });
      
      const res = await request(app).get('/api/collaborators');
      
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].nombre).toBe('Test User');
    });
  });

  describe('POST /api/collaborators', () => {
    it('should create a new collaborator', async () => {
      const res = await request(app)
        .post('/api/collaborators')
        .send({ nombre: 'New User', rol: 'Designer' });
      
      expect(res.status).toBe(200);
      expect(res.body.nombre).toBe('New User');
      expect(res.body.rol).toBe('Designer');
      expect(res.body.esDemo).toBe(false);
    });

    it('should return 400 if nombre is missing', async () => {
      const res = await request(app)
        .post('/api/collaborators')
        .send({ rol: 'Designer' });
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Nombre y rol son requeridos');
    });

    it('should return 400 if rol is missing', async () => {
      const res = await request(app)
        .post('/api/collaborators')
        .send({ nombre: 'Test' });
      
      expect(res.status).toBe(400);
    });

    it('should create collaborator with skills', async () => {
      const res = await request(app)
        .post('/api/collaborators')
        .send({
          nombre: 'Skilled User',
          rol: 'Developer',
          skills: {
            1: { nivel: 3.5, criticidad: 'C', frecuencia: 'D' }
          }
        });
      
      expect(res.status).toBe(200);
      expect(res.body.skills).toHaveProperty('1');
      
      // Verify assessment was created
      const assessments = await prisma.assessment.findMany({
        where: { collaboratorId: res.body.id }
      });
      expect(assessments.length).toBe(1);
      expect(assessments[0].nivel).toBe(3.5);
    });
  });

  describe('POST /api/reset-demo', () => {
    it('should return 409 if no demo data exists', async () => {
      const res = await request(app).post('/api/reset-demo');
      
      expect(res.status).toBe(409);
      expect(res.body.message).toBe('No hay datos demo para eliminar.');
    });

    it('should delete demo collaborators and their assessments', async () => {
      // Create demo collaborator with assessment
      const demoUser = await prisma.collaborator.create({
        data: { nombre: 'Demo User', rol: 'Tester', esDemo: true }
      });
      
      await prisma.assessment.create({
        data: {
          collaboratorId: demoUser.id,
          skillId: 1,
          nivel: 2.0,
          criticidad: 'I',
          frecuencia: 'S'
        }
      });
      
      const res = await request(app).post('/api/reset-demo');
      
      expect(res.status).toBe(200);
      expect(res.body.collaborators).toEqual([]);
      expect(res.body.allowResetFromDemo).toBe(false);
      
      // Verify deletion
      const remaining = await prisma.collaborator.findMany();
      expect(remaining.length).toBe(0);
    });
  });
});
