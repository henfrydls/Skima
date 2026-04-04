import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp, prisma } from '../index.js';

describe('Development Plans API', () => {
  let app;
  let category, skill, collaborator, roleProfile;

  beforeEach(async () => {
    app = createApp();

    // Clean in FK order (new tables first, then base tables)
    await prisma.developmentAction.deleteMany();
    await prisma.developmentGoal.deleteMany();
    await prisma.developmentPlan.deleteMany();
    await prisma.assessment.deleteMany();
    await prisma.evaluationSession.deleteMany();
    await prisma.roleProfile.deleteMany();
    await prisma.collaborator.deleteMany();
    await prisma.skill.deleteMany();
    await prisma.category.deleteMany();

    // Create test fixtures
    category = await prisma.category.create({
      data: { nombre: 'Frontend', abrev: 'FE' }
    });

    skill = await prisma.skill.create({
      data: { nombre: 'React', categoriaId: category.id }
    });

    collaborator = await prisma.collaborator.create({
      data: { nombre: 'Test User', rol: 'Senior Frontend' }
    });

    // Assessment: collaborator scores 2.0 in React
    await prisma.assessment.create({
      data: {
        collaboratorId: collaborator.id,
        skillId: skill.id,
        nivel: 2.0,
        criticidad: 'C',
        frecuencia: 'D'
      }
    });

    // Role profile: React is Critical (target 4.0)
    roleProfile = await prisma.roleProfile.create({
      data: {
        rol: 'Senior Frontend',
        skills: JSON.stringify({ [skill.id]: 'C' })
      }
    });
  });

  // ============================================================
  // 1. CRUD DevelopmentPlan
  // ============================================================
  describe('CRUD DevelopmentPlan', () => {
    it('POST /api/development-plans — creates a plan', async () => {
      const res = await request(app)
        .post('/api/development-plans')
        .send({
          collaboratorId: collaborator.id,
          title: 'Q2 Growth Plan',
          description: 'Focus on React skills'
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Q2 Growth Plan');
      expect(res.body.description).toBe('Focus on React skills');
      expect(res.body.collaboratorId).toBe(collaborator.id);
      expect(res.body.status).toBe('draft');
      expect(res.body.collaborator).toBeDefined();
      expect(res.body.goals).toEqual([]);
    });

    it('GET /api/development-plans — lists all plans', async () => {
      await prisma.developmentPlan.create({
        data: { collaboratorId: collaborator.id, title: 'Plan A' }
      });
      await prisma.developmentPlan.create({
        data: { collaboratorId: collaborator.id, title: 'Plan B' }
      });

      const res = await request(app).get('/api/development-plans');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('GET /api/development-plans?collaboratorId=X — filters by collaborator', async () => {
      const other = await prisma.collaborator.create({
        data: { nombre: 'Other User', rol: 'Designer' }
      });
      await prisma.developmentPlan.create({
        data: { collaboratorId: collaborator.id, title: 'Plan A' }
      });
      await prisma.developmentPlan.create({
        data: { collaboratorId: other.id, title: 'Plan B' }
      });

      const res = await request(app)
        .get(`/api/development-plans?collaboratorId=${collaborator.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Plan A');
    });

    it('GET /api/development-plans?status=active — filters by status', async () => {
      await prisma.developmentPlan.create({
        data: { collaboratorId: collaborator.id, title: 'Draft Plan', status: 'draft' }
      });
      await prisma.developmentPlan.create({
        data: { collaboratorId: collaborator.id, title: 'Active Plan', status: 'active' }
      });

      const res = await request(app)
        .get('/api/development-plans?status=active');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Active Plan');
    });

    it('GET /api/development-plans/:id — returns plan with nested goals and actions', async () => {
      const plan = await prisma.developmentPlan.create({
        data: { collaboratorId: collaborator.id, title: 'Detailed Plan' }
      });
      const goal = await prisma.developmentGoal.create({
        data: { planId: plan.id, title: 'Goal 1' }
      });
      await prisma.developmentAction.create({
        data: { goalId: goal.id, title: 'Action 1' }
      });

      const res = await request(app)
        .get(`/api/development-plans/${plan.id}`);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Detailed Plan');
      expect(res.body.goals).toHaveLength(1);
      expect(res.body.goals[0].title).toBe('Goal 1');
      expect(res.body.goals[0].actions).toHaveLength(1);
      expect(res.body.goals[0].actions[0].title).toBe('Action 1');
    });

    it('GET /api/development-plans/:id — returns 404 for non-existent plan', async () => {
      const res = await request(app).get('/api/development-plans/99999');
      expect(res.status).toBe(404);
    });

    it('PUT /api/development-plans/:id — updates plan fields', async () => {
      const plan = await prisma.developmentPlan.create({
        data: { collaboratorId: collaborator.id, title: 'Original' }
      });

      const res = await request(app)
        .put(`/api/development-plans/${plan.id}`)
        .send({ title: 'Updated', status: 'active' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated');
      expect(res.body.status).toBe('active');
    });

    it('PUT /api/development-plans/:id — auto-sets completedAt when status=completed', async () => {
      const plan = await prisma.developmentPlan.create({
        data: { collaboratorId: collaborator.id, title: 'Plan' }
      });

      const res = await request(app)
        .put(`/api/development-plans/${plan.id}`)
        .send({ status: 'completed' });

      expect(res.status).toBe(200);
      expect(res.body.completedAt).not.toBeNull();
    });

    it('PUT /api/development-plans/:id — clears completedAt when status changes away from completed', async () => {
      const plan = await prisma.developmentPlan.create({
        data: {
          collaboratorId: collaborator.id,
          title: 'Plan',
          status: 'completed',
          completedAt: new Date()
        }
      });

      const res = await request(app)
        .put(`/api/development-plans/${plan.id}`)
        .send({ status: 'active' });

      expect(res.status).toBe(200);
      expect(res.body.completedAt).toBeNull();
    });

    it('DELETE /api/development-plans/:id — deletes plan with cascade', async () => {
      const plan = await prisma.developmentPlan.create({
        data: { collaboratorId: collaborator.id, title: 'To Delete' }
      });
      const goal = await prisma.developmentGoal.create({
        data: { planId: plan.id, title: 'Goal' }
      });
      await prisma.developmentAction.create({
        data: { goalId: goal.id, title: 'Action' }
      });

      const res = await request(app)
        .delete(`/api/development-plans/${plan.id}`);

      expect(res.status).toBe(200);

      // Verify cascade
      const goals = await prisma.developmentGoal.findMany({ where: { planId: plan.id } });
      expect(goals).toHaveLength(0);
      const actions = await prisma.developmentAction.findMany({ where: { goalId: goal.id } });
      expect(actions).toHaveLength(0);
    });
  });

  // ============================================================
  // 2. CRUD DevelopmentGoal
  // ============================================================
  describe('CRUD DevelopmentGoal', () => {
    let plan;

    beforeEach(async () => {
      plan = await prisma.developmentPlan.create({
        data: { collaboratorId: collaborator.id, title: 'Test Plan' }
      });
    });

    it('POST /api/development-plans/:planId/goals — creates goal', async () => {
      const res = await request(app)
        .post(`/api/development-plans/${plan.id}/goals`)
        .send({
          title: 'Improve React',
          skillId: skill.id,
          currentLevel: 2.0,
          targetLevel: 4.0,
          priority: 1
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Improve React');
      expect(res.body.skillId).toBe(skill.id);
      expect(res.body.currentLevel).toBe(2.0);
      expect(res.body.targetLevel).toBe(4.0);
      expect(res.body.priority).toBe(1);
      expect(res.body.status).toBe('not_started');
    });

    it('POST /api/development-plans/:planId/goals — returns 404 for non-existent plan', async () => {
      const res = await request(app)
        .post('/api/development-plans/99999/goals')
        .send({ title: 'Goal' });

      expect(res.status).toBe(404);
    });

    it('PUT /api/development-goals/:id — updates goal', async () => {
      const goal = await prisma.developmentGoal.create({
        data: { planId: plan.id, title: 'Original Goal' }
      });

      const res = await request(app)
        .put(`/api/development-goals/${goal.id}`)
        .send({ title: 'Updated Goal', status: 'in_progress' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Goal');
      expect(res.body.status).toBe('in_progress');
    });

    it('PUT /api/development-goals/:id — auto-sets completedAt on completion', async () => {
      const goal = await prisma.developmentGoal.create({
        data: { planId: plan.id, title: 'Goal' }
      });

      const res = await request(app)
        .put(`/api/development-goals/${goal.id}`)
        .send({ status: 'completed' });

      expect(res.status).toBe(200);
      expect(res.body.completedAt).not.toBeNull();
    });

    it('PUT /api/development-goals/:id — clears completedAt when un-completing', async () => {
      const goal = await prisma.developmentGoal.create({
        data: { planId: plan.id, title: 'Goal', status: 'completed', completedAt: new Date() }
      });

      const res = await request(app)
        .put(`/api/development-goals/${goal.id}`)
        .send({ status: 'in_progress' });

      expect(res.status).toBe(200);
      expect(res.body.completedAt).toBeNull();
    });

    it('DELETE /api/development-goals/:id — deletes goal', async () => {
      const goal = await prisma.developmentGoal.create({
        data: { planId: plan.id, title: 'To Delete' }
      });

      const res = await request(app)
        .delete(`/api/development-goals/${goal.id}`);

      expect(res.status).toBe(200);
      const found = await prisma.developmentGoal.findUnique({ where: { id: goal.id } });
      expect(found).toBeNull();
    });

    it('goal appears nested in plan GET', async () => {
      await prisma.developmentGoal.create({
        data: { planId: plan.id, title: 'Nested Goal' }
      });

      const res = await request(app)
        .get(`/api/development-plans/${plan.id}`);

      expect(res.body.goals).toHaveLength(1);
      expect(res.body.goals[0].title).toBe('Nested Goal');
    });
  });

  // ============================================================
  // 3. CRUD DevelopmentAction
  // ============================================================
  describe('CRUD DevelopmentAction', () => {
    let plan, goal;

    beforeEach(async () => {
      plan = await prisma.developmentPlan.create({
        data: { collaboratorId: collaborator.id, title: 'Test Plan' }
      });
      goal = await prisma.developmentGoal.create({
        data: { planId: plan.id, title: 'Test Goal' }
      });
    });

    it('POST /api/development-goals/:goalId/actions — creates action', async () => {
      const res = await request(app)
        .post(`/api/development-goals/${goal.id}/actions`)
        .send({
          title: 'Complete React course',
          actionType: 'formal',
          dueDate: '2026-06-01'
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Complete React course');
      expect(res.body.actionType).toBe('formal');
      expect(res.body.status).toBe('not_started');
      expect(res.body.dueDate).toBeTruthy();
    });

    it('POST /api/development-goals/:goalId/actions — returns 404 for non-existent goal', async () => {
      const res = await request(app)
        .post('/api/development-goals/99999/actions')
        .send({ title: 'Action' });

      expect(res.status).toBe(404);
    });

    it('PUT /api/development-actions/:id — updates action', async () => {
      const action = await prisma.developmentAction.create({
        data: { goalId: goal.id, title: 'Original Action' }
      });

      const res = await request(app)
        .put(`/api/development-actions/${action.id}`)
        .send({ title: 'Updated Action', evidence: 'https://cert.example.com' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Action');
      expect(res.body.evidence).toBe('https://cert.example.com');
    });

    it('PUT /api/development-actions/:id — auto-sets completedAt when status=completed', async () => {
      const action = await prisma.developmentAction.create({
        data: { goalId: goal.id, title: 'Action' }
      });

      const res = await request(app)
        .put(`/api/development-actions/${action.id}`)
        .send({ status: 'completed' });

      expect(res.status).toBe(200);
      expect(res.body.completedAt).not.toBeNull();
    });

    it('PUT /api/development-actions/:id — clears completedAt when status changes away from completed', async () => {
      const action = await prisma.developmentAction.create({
        data: { goalId: goal.id, title: 'Action', status: 'completed', completedAt: new Date() }
      });

      const res = await request(app)
        .put(`/api/development-actions/${action.id}`)
        .send({ status: 'in_progress' });

      expect(res.status).toBe(200);
      expect(res.body.completedAt).toBeNull();
    });

    it('DELETE /api/development-actions/:id — deletes action', async () => {
      const action = await prisma.developmentAction.create({
        data: { goalId: goal.id, title: 'To Delete' }
      });

      const res = await request(app)
        .delete(`/api/development-actions/${action.id}`);

      expect(res.status).toBe(200);
      const found = await prisma.developmentAction.findUnique({ where: { id: action.id } });
      expect(found).toBeNull();
    });
  });

  // ============================================================
  // 4. Gap Suggestion
  // ============================================================
  describe('Gap Suggestion', () => {
    it('GET /api/collaborators/:id/suggested-goals — returns skill gaps', async () => {
      const res = await request(app)
        .get(`/api/collaborators/${collaborator.id}/suggested-goals`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);

      const suggestion = res.body[0];
      expect(suggestion).toHaveProperty('skillId', skill.id);
      expect(suggestion).toHaveProperty('skillName', 'React');
      expect(suggestion).toHaveProperty('currentLevel', 2.0);
      expect(suggestion).toHaveProperty('targetLevel', 4.0); // Critical = 4.0
      expect(suggestion).toHaveProperty('gapSize', 2.0);
      expect(suggestion).toHaveProperty('suggestedTitle');
    });

    it('returns empty array when no role profile exists', async () => {
      // Create collaborator with no matching role profile
      const noProfileCollab = await prisma.collaborator.create({
        data: { nombre: 'No Profile', rol: 'Unknown Role' }
      });

      const res = await request(app)
        .get(`/api/collaborators/${noProfileCollab.id}/suggested-goals`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns 404 for non-existent collaborator', async () => {
      const res = await request(app)
        .get('/api/collaborators/99999/suggested-goals');

      expect(res.status).toBe(404);
    });

    it('sorts suggestions by gap size descending', async () => {
      // Create a second skill with smaller gap
      const skill2 = await prisma.skill.create({
        data: { nombre: 'TypeScript', categoriaId: category.id }
      });
      await prisma.assessment.create({
        data: {
          collaboratorId: collaborator.id,
          skillId: skill2.id,
          nivel: 3.0,
          criticidad: 'I',
          frecuencia: 'D'
        }
      });

      // Update role profile to include both skills
      await prisma.roleProfile.update({
        where: { rol: 'Senior Frontend' },
        data: {
          skills: JSON.stringify({
            [skill.id]: 'C',   // gap: 4.0 - 2.0 = 2.0
            [skill2.id]: 'I'   // gap: 3.5 - 3.0 = 0.5
          })
        }
      });

      const res = await request(app)
        .get(`/api/collaborators/${collaborator.id}/suggested-goals`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].gapSize).toBeGreaterThanOrEqual(res.body[1].gapSize);
      expect(res.body[0].skillName).toBe('React');
      expect(res.body[1].skillName).toBe('TypeScript');
    });

    it('limits suggestions to max 5', async () => {
      // Create 6 skills with gaps
      const skills = [];
      for (let i = 0; i < 6; i++) {
        const s = await prisma.skill.create({
          data: { nombre: `Skill ${i}`, categoriaId: category.id }
        });
        skills.push(s);
        await prisma.assessment.create({
          data: {
            collaboratorId: collaborator.id,
            skillId: s.id,
            nivel: 1.0,
            criticidad: 'C',
            frecuencia: 'D'
          }
        });
      }

      const skillsMap = {};
      skillsMap[skill.id] = 'C';
      skills.forEach(s => { skillsMap[s.id] = 'C'; });

      await prisma.roleProfile.update({
        where: { rol: 'Senior Frontend' },
        data: { skills: JSON.stringify(skillsMap) }
      });

      const res = await request(app)
        .get(`/api/collaborators/${collaborator.id}/suggested-goals`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeLessThanOrEqual(5);
    });
  });

  // ============================================================
  // 5. Progress Computation
  // ============================================================
  describe('Progress Computation', () => {
    it('GET /api/development-plans/:id/progress — correct progress math', async () => {
      const plan = await prisma.developmentPlan.create({
        data: { collaboratorId: collaborator.id, title: 'Progress Plan' }
      });
      const goal = await prisma.developmentGoal.create({
        data: { planId: plan.id, title: 'Goal 1' }
      });

      // Create 4 actions: 2 completed, 1 in_progress, 1 not_started
      await prisma.developmentAction.create({
        data: { goalId: goal.id, title: 'A1', status: 'completed', completedAt: new Date() }
      });
      await prisma.developmentAction.create({
        data: { goalId: goal.id, title: 'A2', status: 'completed', completedAt: new Date() }
      });
      await prisma.developmentAction.create({
        data: { goalId: goal.id, title: 'A3', status: 'in_progress' }
      });
      await prisma.developmentAction.create({
        data: { goalId: goal.id, title: 'A4', status: 'not_started' }
      });

      const res = await request(app)
        .get(`/api/development-plans/${plan.id}/progress`);

      expect(res.status).toBe(200);
      // 2 completed / 4 total = 50%
      expect(res.body.planProgress).toBe(50);
      expect(res.body.goals).toHaveLength(1);
      expect(res.body.goals[0].progress).toBe(50);
      expect(res.body.goals[0].actionsSummary.total).toBe(4);
      expect(res.body.goals[0].actionsSummary.completed).toBe(2);
    });

    it('excludes skipped actions from denominator', async () => {
      const plan = await prisma.developmentPlan.create({
        data: { collaboratorId: collaborator.id, title: 'Progress Plan' }
      });
      const goal = await prisma.developmentGoal.create({
        data: { planId: plan.id, title: 'Goal 1' }
      });

      // 1 completed, 1 skipped => 1/1 = 100%
      await prisma.developmentAction.create({
        data: { goalId: goal.id, title: 'A1', status: 'completed', completedAt: new Date() }
      });
      await prisma.developmentAction.create({
        data: { goalId: goal.id, title: 'A2', status: 'skipped' }
      });

      const res = await request(app)
        .get(`/api/development-plans/${plan.id}/progress`);

      expect(res.body.goals[0].progress).toBe(100);
      expect(res.body.planProgress).toBe(100);
    });

    it('excludes cancelled goals from plan progress', async () => {
      const plan = await prisma.developmentPlan.create({
        data: { collaboratorId: collaborator.id, title: 'Progress Plan' }
      });

      // Goal 1: 100% complete
      const goal1 = await prisma.developmentGoal.create({
        data: { planId: plan.id, title: 'Goal 1' }
      });
      await prisma.developmentAction.create({
        data: { goalId: goal1.id, title: 'A1', status: 'completed', completedAt: new Date() }
      });

      // Goal 2: cancelled - should be excluded
      await prisma.developmentGoal.create({
        data: { planId: plan.id, title: 'Goal 2', status: 'cancelled' }
      });

      const res = await request(app)
        .get(`/api/development-plans/${plan.id}/progress`);

      // Only goal1 counts: 100%
      expect(res.body.planProgress).toBe(100);
      expect(res.body.goals).toHaveLength(1);
    });

    it('returns 0 progress for plan with no goals', async () => {
      const plan = await prisma.developmentPlan.create({
        data: { collaboratorId: collaborator.id, title: 'Empty Plan' }
      });

      const res = await request(app)
        .get(`/api/development-plans/${plan.id}/progress`);

      expect(res.body.planProgress).toBe(0);
      expect(res.body.goals).toHaveLength(0);
    });

    it('returns 404 for non-existent plan', async () => {
      const res = await request(app)
        .get('/api/development-plans/99999/progress');

      expect(res.status).toBe(404);
    });

    it('averages progress across multiple non-cancelled goals', async () => {
      const plan = await prisma.developmentPlan.create({
        data: { collaboratorId: collaborator.id, title: 'Multi Goal Plan' }
      });

      // Goal 1: 1/2 = 50%
      const goal1 = await prisma.developmentGoal.create({
        data: { planId: plan.id, title: 'Goal 1' }
      });
      await prisma.developmentAction.create({
        data: { goalId: goal1.id, title: 'A1', status: 'completed', completedAt: new Date() }
      });
      await prisma.developmentAction.create({
        data: { goalId: goal1.id, title: 'A2', status: 'not_started' }
      });

      // Goal 2: 2/2 = 100%
      const goal2 = await prisma.developmentGoal.create({
        data: { planId: plan.id, title: 'Goal 2' }
      });
      await prisma.developmentAction.create({
        data: { goalId: goal2.id, title: 'A3', status: 'completed', completedAt: new Date() }
      });
      await prisma.developmentAction.create({
        data: { goalId: goal2.id, title: 'A4', status: 'completed', completedAt: new Date() }
      });

      const res = await request(app)
        .get(`/api/development-plans/${plan.id}/progress`);

      // Average: (50 + 100) / 2 = 75
      expect(res.body.planProgress).toBe(75);
      expect(res.body.goals).toHaveLength(2);
    });
  });

  // ============================================================
  // 6. Validation
  // ============================================================
  describe('Validation', () => {
    it('POST /api/development-plans — returns 400 without title', async () => {
      const res = await request(app)
        .post('/api/development-plans')
        .send({ collaboratorId: collaborator.id });

      expect(res.status).toBe(400);
    });

    it('POST /api/development-plans — returns 400 without collaboratorId', async () => {
      const res = await request(app)
        .post('/api/development-plans')
        .send({ title: 'Plan' });

      expect(res.status).toBe(400);
    });

    it('POST /api/development-plans/:planId/goals — returns 400 without title', async () => {
      const plan = await prisma.developmentPlan.create({
        data: { collaboratorId: collaborator.id, title: 'Plan' }
      });

      const res = await request(app)
        .post(`/api/development-plans/${plan.id}/goals`)
        .send({ skillId: skill.id });

      expect(res.status).toBe(400);
    });

    it('POST /api/development-goals/:goalId/actions — returns 400 without title', async () => {
      const plan = await prisma.developmentPlan.create({
        data: { collaboratorId: collaborator.id, title: 'Plan' }
      });
      const goal = await prisma.developmentGoal.create({
        data: { planId: plan.id, title: 'Goal' }
      });

      const res = await request(app)
        .post(`/api/development-goals/${goal.id}/actions`)
        .send({ actionType: 'formal' });

      expect(res.status).toBe(400);
    });
  });
});
