import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, prisma } from '../index.js';

/**
 * Helper: Seed the database with a category, skill, collaborator,
 * and an evaluation session with assessments for evolution tests.
 */
async function seedEvolutionData(options = {}) {
  const {
    evaluatedAt = new Date(),
    nivel = 3.5,
    collaboratorName = 'Test User',
    collaboratorRole = 'Developer',
    joinedAt = new Date('2024-01-15'),
  } = options;

  const category = await prisma.category.create({
    data: { id: 1, nombre: 'Technical', abrev: 'TECH' }
  });

  const skill = await prisma.skill.create({
    data: { id: 1, nombre: 'JavaScript', categoriaId: category.id }
  });

  const collaborator = await prisma.collaborator.create({
    data: {
      nombre: collaboratorName,
      rol: collaboratorRole,
      esDemo: false,
      isActive: true,
      joinedAt
    }
  });

  const session = await prisma.evaluationSession.create({
    data: {
      collaboratorId: collaborator.id,
      collaboratorNombre: collaboratorName,
      collaboratorRol: collaboratorRole,
      evaluatedAt
    }
  });

  await prisma.assessment.create({
    data: {
      collaboratorId: collaborator.id,
      skillId: skill.id,
      nivel,
      criticidad: 'C',
      frecuencia: 'D',
      evaluationSessionId: session.id
    }
  });

  return { category, skill, collaborator, session };
}

describe('Evolution Routes', () => {
  let app;

  beforeEach(async () => {
    app = createApp();
  });

  // ============================================
  // GET /api/skills/evolution - Basic responses
  // ============================================
  describe('GET /api/skills/evolution', () => {
    it('should return 200 with correct response structure (empty data)', async () => {
      const res = await request(app).get('/api/skills/evolution');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('meta');
      expect(res.body).toHaveProperty('chartData');
      expect(res.body).toHaveProperty('employees');
      expect(res.body).toHaveProperty('insights');

      // Meta structure
      expect(res.body.meta).toHaveProperty('currentMaturityIndex');
      expect(res.body.meta).toHaveProperty('periodDelta');
      expect(res.body.meta).toHaveProperty('timeRangeLabel');
      expect(res.body.meta).toHaveProperty('startDate');
      expect(res.body.meta).toHaveProperty('endDate');
      expect(res.body.meta).toHaveProperty('totalEmployees');

      // Arrays
      expect(Array.isArray(res.body.chartData)).toBe(true);
      expect(Array.isArray(res.body.employees)).toBe(true);

      // Insights structure
      expect(res.body.insights).toHaveProperty('topImprover');
      expect(res.body.insights).toHaveProperty('supportCases');
      expect(res.body.insights).toHaveProperty('supportCount');
    });

    it('should return empty arrays when no data exists', async () => {
      const res = await request(app).get('/api/skills/evolution');

      expect(res.status).toBe(200);
      expect(res.body.employees).toEqual([]);
      expect(res.body.meta.totalEmployees).toBe(0);
      expect(res.body.meta.currentMaturityIndex).toBeNull();
      expect(res.body.insights.topImprover).toBeNull();
      expect(res.body.insights.supportCount).toBe(0);
    });
  });

  // ============================================
  // Default range (12m)
  // ============================================
  describe('GET /api/skills/evolution (default range = 12m)', () => {
    it('should use 12m range by default and return matching label', async () => {
      const res = await request(app).get('/api/skills/evolution');

      expect(res.status).toBe(200);
      expect(res.body.meta.timeRangeLabel).toBe('Últimos 12 meses');
    });

    it('should include evaluation data within last 12 months', async () => {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      await seedEvolutionData({ evaluatedAt: threeMonthsAgo, nivel: 4.0 });

      const res = await request(app).get('/api/skills/evolution');

      expect(res.status).toBe(200);
      expect(res.body.employees.length).toBe(1);
      expect(res.body.employees[0].name).toBe('Test User');
      expect(res.body.employees[0].currentScore).toBe(4.0);
      expect(res.body.meta.totalEmployees).toBe(1);
    });
  });

  // ============================================
  // Range parameter: 6m
  // ============================================
  describe('GET /api/skills/evolution?range=6m', () => {
    it('should return 6-month label', async () => {
      const res = await request(app).get('/api/skills/evolution?range=6m');

      expect(res.status).toBe(200);
      expect(res.body.meta.timeRangeLabel).toBe('Últimos 6 meses');
    });

    it('should exclude evaluations older than 6 months', async () => {
      const eightMonthsAgo = new Date();
      eightMonthsAgo.setMonth(eightMonthsAgo.getMonth() - 8);

      await seedEvolutionData({ evaluatedAt: eightMonthsAgo });

      const res = await request(app).get('/api/skills/evolution?range=6m');

      expect(res.status).toBe(200);
      expect(res.body.employees.length).toBe(0);
    });

    it('should include evaluations within 6 months', async () => {
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

      await seedEvolutionData({ evaluatedAt: twoMonthsAgo, nivel: 3.0 });

      const res = await request(app).get('/api/skills/evolution?range=6m');

      expect(res.status).toBe(200);
      expect(res.body.employees.length).toBe(1);
      expect(res.body.employees[0].currentScore).toBe(3.0);
    });
  });

  // ============================================
  // Range parameter: 12m
  // ============================================
  describe('GET /api/skills/evolution?range=12m', () => {
    it('should return 12-month label', async () => {
      const res = await request(app).get('/api/skills/evolution?range=12m');

      expect(res.status).toBe(200);
      expect(res.body.meta.timeRangeLabel).toBe('Últimos 12 meses');
    });

    it('should include evaluations within 12 months', async () => {
      const tenMonthsAgo = new Date();
      tenMonthsAgo.setMonth(tenMonthsAgo.getMonth() - 10);

      await seedEvolutionData({ evaluatedAt: tenMonthsAgo, nivel: 2.5 });

      const res = await request(app).get('/api/skills/evolution?range=12m');

      expect(res.status).toBe(200);
      expect(res.body.employees.length).toBe(1);
      expect(res.body.employees[0].currentScore).toBe(2.5);
    });
  });

  // ============================================
  // Range parameter: all
  // ============================================
  describe('GET /api/skills/evolution?range=all', () => {
    it('should return "all" history label', async () => {
      const res = await request(app).get('/api/skills/evolution?range=all');

      expect(res.status).toBe(200);
      expect(res.body.meta.timeRangeLabel).toBe('Todo el historial');
    });

    it('should include very old evaluations', async () => {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      await seedEvolutionData({
        evaluatedAt: twoYearsAgo,
        nivel: 1.5,
        joinedAt: new Date('2020-01-01')
      });

      const res = await request(app).get('/api/skills/evolution?range=all');

      expect(res.status).toBe(200);
      expect(res.body.employees.length).toBe(1);
      expect(res.body.employees[0].currentScore).toBe(1.5);
    });
  });

  // ============================================
  // Response structure validation
  // ============================================
  describe('Response structure validation', () => {
    it('should return correctly structured employee objects', async () => {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      await seedEvolutionData({ evaluatedAt: threeMonthsAgo, nivel: 3.5 });

      const res = await request(app).get('/api/skills/evolution');
      const employee = res.body.employees[0];

      expect(employee).toHaveProperty('id');
      expect(employee).toHaveProperty('name');
      expect(employee).toHaveProperty('role');
      expect(employee).toHaveProperty('currentScore');
      expect(employee).toHaveProperty('startScore');
      expect(employee).toHaveProperty('growth');
      expect(employee).toHaveProperty('growthTrend');
      expect(employee).toHaveProperty('isNewHire');
      expect(employee).toHaveProperty('insufficientData');
      expect(employee).toHaveProperty('lastEvaluatedAt');
      expect(employee).toHaveProperty('sparkline');
      expect(employee).toHaveProperty('status');

      expect(typeof employee.id).toBe('number');
      expect(typeof employee.name).toBe('string');
      expect(typeof employee.currentScore).toBe('number');
      expect(Array.isArray(employee.sparkline)).toBe(true);
      expect(['up', 'down', 'stable']).toContain(employee.growthTrend);
      expect(['strength', 'competent', 'attention']).toContain(employee.status);
    });

    it('should return correctly structured chartData entries', async () => {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      await seedEvolutionData({ evaluatedAt: oneMonthAgo, nivel: 3.0 });

      const res = await request(app).get('/api/skills/evolution');

      expect(res.body.chartData.length).toBeGreaterThan(0);

      const chartEntry = res.body.chartData.find(d => d.count > 0);
      expect(chartEntry).toBeDefined();
      expect(chartEntry).toHaveProperty('date');
      expect(chartEntry).toHaveProperty('avgScore');
      expect(chartEntry).toHaveProperty('count');
      expect(chartEntry).toHaveProperty('newHires');
      expect(chartEntry).toHaveProperty('isCarryOver');

      // Date should be in YYYY-MM-DD format
      expect(chartEntry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof chartEntry.avgScore).toBe('number');
      expect(typeof chartEntry.count).toBe('number');
      expect(Array.isArray(chartEntry.newHires)).toBe(true);
      expect(typeof chartEntry.isCarryOver).toBe('boolean');
    });

    it('should calculate meta.currentMaturityIndex as average of employee scores', async () => {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      // Create base category and skill
      const category = await prisma.category.create({
        data: { id: 1, nombre: 'Tech', abrev: 'T' }
      });
      const skill = await prisma.skill.create({
        data: { id: 1, nombre: 'JS', categoriaId: category.id }
      });

      // Create two collaborators with different scores
      const collab1 = await prisma.collaborator.create({
        data: { nombre: 'Alice', rol: 'Dev', isActive: true, joinedAt: new Date('2023-01-01') }
      });
      const collab2 = await prisma.collaborator.create({
        data: { nombre: 'Bob', rol: 'Dev', isActive: true, joinedAt: new Date('2023-01-01') }
      });

      // Create sessions
      const session1 = await prisma.evaluationSession.create({
        data: { collaboratorId: collab1.id, collaboratorNombre: 'Alice', collaboratorRol: 'Dev', evaluatedAt: oneMonthAgo }
      });
      const session2 = await prisma.evaluationSession.create({
        data: { collaboratorId: collab2.id, collaboratorNombre: 'Bob', collaboratorRol: 'Dev', evaluatedAt: oneMonthAgo }
      });

      // Create assessments: Alice=4.0, Bob=2.0 -> avg=3.0
      await prisma.assessment.create({
        data: { collaboratorId: collab1.id, skillId: skill.id, nivel: 4.0, criticidad: 'C', frecuencia: 'D', evaluationSessionId: session1.id }
      });
      await prisma.assessment.create({
        data: { collaboratorId: collab2.id, skillId: skill.id, nivel: 2.0, criticidad: 'C', frecuencia: 'D', evaluationSessionId: session2.id }
      });

      const res = await request(app).get('/api/skills/evolution');

      expect(res.status).toBe(200);
      expect(res.body.meta.totalEmployees).toBe(2);
      expect(res.body.meta.currentMaturityIndex).toBe(3.0);
    });

    it('should correctly classify employee status based on score thresholds', async () => {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const category = await prisma.category.create({
        data: { id: 1, nombre: 'Tech', abrev: 'T' }
      });
      const skill = await prisma.skill.create({
        data: { id: 1, nombre: 'JS', categoriaId: category.id }
      });

      // Create three collaborators for each status bracket
      const collabAttention = await prisma.collaborator.create({
        data: { nombre: 'Low', rol: 'Dev', isActive: true, joinedAt: new Date('2023-01-01') }
      });
      const collabCompetent = await prisma.collaborator.create({
        data: { nombre: 'Mid', rol: 'Dev', isActive: true, joinedAt: new Date('2023-01-01') }
      });
      const collabStrength = await prisma.collaborator.create({
        data: { nombre: 'High', rol: 'Dev', isActive: true, joinedAt: new Date('2023-01-01') }
      });

      // Sessions
      const s1 = await prisma.evaluationSession.create({
        data: { collaboratorId: collabAttention.id, collaboratorNombre: 'Low', collaboratorRol: 'Dev', evaluatedAt: oneMonthAgo }
      });
      const s2 = await prisma.evaluationSession.create({
        data: { collaboratorId: collabCompetent.id, collaboratorNombre: 'Mid', collaboratorRol: 'Dev', evaluatedAt: oneMonthAgo }
      });
      const s3 = await prisma.evaluationSession.create({
        data: { collaboratorId: collabStrength.id, collaboratorNombre: 'High', collaboratorRol: 'Dev', evaluatedAt: oneMonthAgo }
      });

      // Scores: 1.5 (attention), 3.0 (competent), 4.0 (strength)
      await prisma.assessment.create({
        data: { collaboratorId: collabAttention.id, skillId: skill.id, nivel: 1.5, criticidad: 'C', frecuencia: 'D', evaluationSessionId: s1.id }
      });
      await prisma.assessment.create({
        data: { collaboratorId: collabCompetent.id, skillId: skill.id, nivel: 3.0, criticidad: 'C', frecuencia: 'D', evaluationSessionId: s2.id }
      });
      await prisma.assessment.create({
        data: { collaboratorId: collabStrength.id, skillId: skill.id, nivel: 4.0, criticidad: 'C', frecuencia: 'D', evaluationSessionId: s3.id }
      });

      const res = await request(app).get('/api/skills/evolution');

      const employees = res.body.employees;
      const low = employees.find(e => e.name === 'Low');
      const mid = employees.find(e => e.name === 'Mid');
      const high = employees.find(e => e.name === 'High');

      expect(low.status).toBe('attention');
      expect(mid.status).toBe('competent');
      expect(high.status).toBe('strength');
    });
  });

  // ============================================
  // Edge cases
  // ============================================
  describe('Edge cases', () => {
    it('should treat an invalid range as "all" (default switch case)', async () => {
      const res = await request(app).get('/api/skills/evolution?range=invalid');

      expect(res.status).toBe(200);
      // Invalid range falls through to default case which is 'all'
      expect(res.body.meta.timeRangeLabel).toBe('Todo el historial');
    });

    it('should exclude inactive collaborators from employees list', async () => {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const category = await prisma.category.create({
        data: { id: 1, nombre: 'Tech', abrev: 'T' }
      });
      const skill = await prisma.skill.create({
        data: { id: 1, nombre: 'JS', categoriaId: category.id }
      });

      // Create an inactive collaborator
      const inactiveCollab = await prisma.collaborator.create({
        data: { nombre: 'Inactive User', rol: 'Dev', isActive: false, joinedAt: new Date('2023-01-01') }
      });

      const session = await prisma.evaluationSession.create({
        data: { collaboratorId: inactiveCollab.id, collaboratorNombre: 'Inactive User', collaboratorRol: 'Dev', evaluatedAt: oneMonthAgo }
      });

      await prisma.assessment.create({
        data: { collaboratorId: inactiveCollab.id, skillId: skill.id, nivel: 4.0, criticidad: 'C', frecuencia: 'D', evaluationSessionId: session.id }
      });

      const res = await request(app).get('/api/skills/evolution');

      expect(res.status).toBe(200);
      expect(res.body.employees.length).toBe(0);
      expect(res.body.meta.totalEmployees).toBe(0);
    });

    it('should skip sessions with no valid assessments (nivel <= 0)', async () => {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const category = await prisma.category.create({
        data: { id: 1, nombre: 'Tech', abrev: 'T' }
      });
      const skill = await prisma.skill.create({
        data: { id: 1, nombre: 'JS', categoriaId: category.id }
      });

      const collab = await prisma.collaborator.create({
        data: { nombre: 'Zero Score', rol: 'Dev', isActive: true, joinedAt: new Date('2023-01-01') }
      });

      const session = await prisma.evaluationSession.create({
        data: { collaboratorId: collab.id, collaboratorNombre: 'Zero Score', collaboratorRol: 'Dev', evaluatedAt: oneMonthAgo }
      });

      // Assessment with nivel = 0 should be filtered out
      await prisma.assessment.create({
        data: { collaboratorId: collab.id, skillId: skill.id, nivel: 0, criticidad: 'C', frecuencia: 'D', evaluationSessionId: session.id }
      });

      const res = await request(app).get('/api/skills/evolution');

      expect(res.status).toBe(200);
      expect(res.body.employees.length).toBe(0);
    });

    it('should accept custom startDate and endDate parameters', async () => {
      const specificDate = new Date('2024-06-15');

      await seedEvolutionData({
        evaluatedAt: specificDate,
        nivel: 3.0,
        joinedAt: new Date('2023-01-01')
      });

      const res = await request(app)
        .get('/api/skills/evolution?startDate=2024-01-01&endDate=2024-12-31');

      expect(res.status).toBe(200);
      expect(res.body.meta.timeRangeLabel).toBe('Rango personalizado');
      expect(res.body.meta.startDate).toBe('2024-01-01');
      expect(res.body.meta.endDate).toBe('2024-12-31');
      expect(res.body.employees.length).toBe(1);
    });

    it('should handle growth trend calculation correctly', async () => {
      const category = await prisma.category.create({
        data: { id: 1, nombre: 'Tech', abrev: 'T' }
      });
      const skill = await prisma.skill.create({
        data: { id: 1, nombre: 'JS', categoriaId: category.id }
      });

      const collab = await prisma.collaborator.create({
        data: { nombre: 'Grower', rol: 'Dev', isActive: true, joinedAt: new Date('2023-01-01') }
      });

      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      // Two sessions: first at 2.0, second at 4.0 (growth = 2.0)
      const session1 = await prisma.evaluationSession.create({
        data: { collaboratorId: collab.id, collaboratorNombre: 'Grower', collaboratorRol: 'Dev', evaluatedAt: threeMonthsAgo }
      });
      const session2 = await prisma.evaluationSession.create({
        data: { collaboratorId: collab.id, collaboratorNombre: 'Grower', collaboratorRol: 'Dev', evaluatedAt: oneMonthAgo }
      });

      await prisma.assessment.create({
        data: { collaboratorId: collab.id, skillId: skill.id, nivel: 2.0, criticidad: 'C', frecuencia: 'D', evaluationSessionId: session1.id }
      });
      await prisma.assessment.create({
        data: { collaboratorId: collab.id, skillId: skill.id, nivel: 4.0, criticidad: 'C', frecuencia: 'D', evaluationSessionId: session2.id }
      });

      const res = await request(app).get('/api/skills/evolution');

      const employee = res.body.employees[0];
      expect(employee.startScore).toBe(2.0);
      expect(employee.currentScore).toBe(4.0);
      expect(employee.growth).toBe(2.0);
      expect(employee.growthTrend).toBe('up');
      expect(employee.sparkline).toEqual([2.0, 4.0]);
    });
  });
});
