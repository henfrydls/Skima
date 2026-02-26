import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp, prisma } from '../index.js';
import { generateToken } from '../middleware/auth.js';

describe('Category Archive Logic', () => {
  let app;
  let categoryId;
  let skillId;
  let token;

  beforeEach(async () => {
    app = createApp();
    token = generateToken({ id: 999, email: 'test@test.com' });
    
    // Clean up
    await prisma.assessment.deleteMany();
    await prisma.skill.deleteMany();
    await prisma.category.deleteMany();

    // Create seed data
    const cat = await prisma.category.create({
      data: { nombre: 'Archive Test', abrev: 'Arc', orden: 1, isActive: true }
    });
    categoryId = cat.id;

    const skill = await prisma.skill.create({
      data: { nombre: 'Skill to Archive', categoriaId: cat.id, isActive: true }
    });
    skillId = skill.id;
  });

  afterEach(async () => {
    // Clean up
    await prisma.assessment.deleteMany();
    await prisma.skill.deleteMany();
    await prisma.category.deleteMany();
  });

  it('DELETE /api/categories/:id should soft delete category and skills', async () => {
    const res = await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);

    // Check DB directly
    const cat = await prisma.category.findUnique({ where: { id: categoryId } });
    expect(cat.isActive).toBe(false);

    const skill = await prisma.skill.findUnique({ where: { id: skillId } });
    expect(skill.isActive).toBe(false);
  });

  it('GET /api/categories should NOT return archived categories by default', async () => {
    // Archive it first
    await prisma.category.update({ where: { id: categoryId }, data: { isActive: false } });

    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body.find(c => c.id === categoryId)).toBeUndefined();
  });

  it('GET /api/categories?includeArchived=true should return archived categories', async () => {
    // Archive it first
    await prisma.category.update({ where: { id: categoryId }, data: { isActive: false } });

    const res = await request(app).get('/api/categories?includeArchived=true');
    expect(res.status).toBe(200);
    const cat = res.body.find(c => c.id === categoryId);
    expect(cat).toBeDefined();
    expect(cat.isActive).toBe(false);
  });

  it('PUT /api/categories/:id/restore should reactivate category and skills', async () => {
    // Archive first
    await prisma.category.update({ where: { id: categoryId }, data: { isActive: false } });
    await prisma.skill.update({ where: { id: skillId }, data: { isActive: false } });

    const res = await request(app)
      .put(`/api/categories/${categoryId}/restore`)
      .set('Authorization', `Bearer ${token}`);
      
    expect(res.status).toBe(200);

    const cat = await prisma.category.findUnique({ where: { id: categoryId } });
    expect(cat.isActive).toBe(true);

    const skill = await prisma.skill.findUnique({ where: { id: skillId } });
    expect(skill.isActive).toBe(true);
  });
});
