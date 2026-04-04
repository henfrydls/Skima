import express from 'express';
import { prisma } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ============================================================
// DEVELOPMENT PLANS - CRUD
// ============================================================

// GET /api/development-plans — list all plans (optional filters)
router.get('/development-plans', async (req, res) => {
  try {
    const { collaboratorId, status } = req.query;
    const where = {};

    if (collaboratorId) {
      where.collaboratorId = parseInt(collaboratorId, 10);
    }
    if (status) {
      where.status = status;
    }

    const plans = await prisma.developmentPlan.findMany({
      where,
      include: {
        collaborator: true,
        goals: {
          include: { actions: true },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(plans);
  } catch (error) {
    console.error('[API] GET /api/development-plans failed:', error);
    res.status(500).json({ message: 'Error fetching development plans', error: error.message });
  }
});

// GET /api/development-plans/:id — get plan detail with nested goals and actions
router.get('/development-plans/:id', async (req, res) => {
  try {
    const plan = await prisma.developmentPlan.findUnique({
      where: { id: parseInt(req.params.id, 10) },
      include: {
        collaborator: true,
        goals: {
          include: { actions: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    if (!plan) {
      return res.status(404).json({ message: 'Development plan not found' });
    }

    res.json(plan);
  } catch (error) {
    console.error('[API] GET /api/development-plans/:id failed:', error);
    res.status(500).json({ message: 'Error fetching development plan', error: error.message });
  }
});

// POST /api/development-plans — create plan
router.post('/development-plans', authMiddleware, async (req, res) => {
  try {
    const { collaboratorId, title, description, targetRole, startDate, endDate } = req.body;

    if (!collaboratorId || !title) {
      return res.status(400).json({ message: 'collaboratorId and title are required' });
    }

    const plan = await prisma.developmentPlan.create({
      data: {
        collaboratorId: parseInt(collaboratorId, 10),
        title,
        description: description || null,
        targetRole: targetRole || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      },
      include: {
        collaborator: true,
        goals: { include: { actions: true } }
      }
    });

    res.status(201).json(plan);
  } catch (error) {
    console.error('[API] POST /api/development-plans failed:', error);
    res.status(500).json({ message: 'Error creating development plan', error: error.message });
  }
});

// PUT /api/development-plans/:id — update plan
router.put('/development-plans/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, description, targetRole, status, startDate, endDate } = req.body;

    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (targetRole !== undefined) data.targetRole = targetRole;
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;

    if (status !== undefined) {
      data.status = status;
      if (status === 'completed') {
        data.completedAt = new Date();
      } else {
        data.completedAt = null;
      }
    }

    const plan = await prisma.developmentPlan.update({
      where: { id },
      data,
      include: {
        collaborator: true,
        goals: { include: { actions: true } }
      }
    });

    res.json(plan);
  } catch (error) {
    console.error('[API] PUT /api/development-plans/:id failed:', error);
    res.status(500).json({ message: 'Error updating development plan', error: error.message });
  }
});

// DELETE /api/development-plans/:id — delete plan (cascade)
router.delete('/development-plans/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    // Prisma cascade handles goals+actions deletion
    await prisma.developmentPlan.delete({ where: { id } });

    res.json({ message: 'Development plan deleted' });
  } catch (error) {
    console.error('[API] DELETE /api/development-plans/:id failed:', error);
    res.status(500).json({ message: 'Error deleting development plan', error: error.message });
  }
});

// ============================================================
// DEVELOPMENT GOALS - CRUD
// ============================================================

// POST /api/development-plans/:planId/goals — create goal
router.post('/development-plans/:planId/goals', authMiddleware, async (req, res) => {
  try {
    const planId = parseInt(req.params.planId, 10);
    const { title, description, skillId, currentLevel, targetLevel, priority, targetDate } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'title is required' });
    }

    // Verify plan exists
    const plan = await prisma.developmentPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      return res.status(404).json({ message: 'Development plan not found' });
    }

    const goal = await prisma.developmentGoal.create({
      data: {
        planId,
        title,
        description: description || null,
        skillId: skillId ? parseInt(skillId, 10) : null,
        currentLevel: currentLevel != null ? parseFloat(currentLevel) : null,
        targetLevel: targetLevel != null ? parseFloat(targetLevel) : null,
        priority: priority != null ? parseInt(priority, 10) : 2,
        targetDate: targetDate ? new Date(targetDate) : null
      },
      include: { actions: true }
    });

    res.status(201).json(goal);
  } catch (error) {
    console.error('[API] POST /api/development-plans/:planId/goals failed:', error);
    res.status(500).json({ message: 'Error creating development goal', error: error.message });
  }
});

// PUT /api/development-goals/:id — update goal
router.put('/development-goals/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, description, skillId, currentLevel, targetLevel, priority, status, targetDate, sortOrder } = req.body;

    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (skillId !== undefined) data.skillId = skillId ? parseInt(skillId, 10) : null;
    if (currentLevel !== undefined) data.currentLevel = currentLevel != null ? parseFloat(currentLevel) : null;
    if (targetLevel !== undefined) data.targetLevel = targetLevel != null ? parseFloat(targetLevel) : null;
    if (priority !== undefined) data.priority = parseInt(priority, 10);
    if (targetDate !== undefined) data.targetDate = targetDate ? new Date(targetDate) : null;
    if (sortOrder !== undefined) data.sortOrder = parseInt(sortOrder, 10);

    if (status !== undefined) {
      data.status = status;
      if (status === 'completed') {
        data.completedAt = new Date();
      } else {
        data.completedAt = null;
      }
    }

    const goal = await prisma.developmentGoal.update({
      where: { id },
      data,
      include: { actions: true }
    });

    res.json(goal);
  } catch (error) {
    console.error('[API] PUT /api/development-goals/:id failed:', error);
    res.status(500).json({ message: 'Error updating development goal', error: error.message });
  }
});

// DELETE /api/development-goals/:id — delete goal
router.delete('/development-goals/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.developmentGoal.delete({ where: { id } });
    res.json({ message: 'Development goal deleted' });
  } catch (error) {
    console.error('[API] DELETE /api/development-goals/:id failed:', error);
    res.status(500).json({ message: 'Error deleting development goal', error: error.message });
  }
});

// ============================================================
// DEVELOPMENT ACTIONS - CRUD
// ============================================================

// POST /api/development-goals/:goalId/actions — create action
router.post('/development-goals/:goalId/actions', authMiddleware, async (req, res) => {
  try {
    const goalId = parseInt(req.params.goalId, 10);
    const { title, description, actionType, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'title is required' });
    }

    // Verify goal exists
    const goal = await prisma.developmentGoal.findUnique({ where: { id: goalId } });
    if (!goal) {
      return res.status(404).json({ message: 'Development goal not found' });
    }

    const action = await prisma.developmentAction.create({
      data: {
        goalId,
        title,
        description: description || null,
        actionType: actionType || 'experience',
        dueDate: dueDate ? new Date(dueDate) : null
      }
    });

    res.status(201).json(action);
  } catch (error) {
    console.error('[API] POST /api/development-goals/:goalId/actions failed:', error);
    res.status(500).json({ message: 'Error creating development action', error: error.message });
  }
});

// PUT /api/development-actions/:id — update action
router.put('/development-actions/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, description, actionType, status, dueDate, evidence, sortOrder } = req.body;

    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (actionType !== undefined) data.actionType = actionType;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (evidence !== undefined) data.evidence = evidence;
    if (sortOrder !== undefined) data.sortOrder = parseInt(sortOrder, 10);

    if (status !== undefined) {
      data.status = status;
      if (status === 'completed') {
        data.completedAt = new Date();
      } else {
        data.completedAt = null;
      }
    }

    const action = await prisma.developmentAction.update({
      where: { id },
      data
    });

    res.json(action);
  } catch (error) {
    console.error('[API] PUT /api/development-actions/:id failed:', error);
    res.status(500).json({ message: 'Error updating development action', error: error.message });
  }
});

// DELETE /api/development-actions/:id — delete action
router.delete('/development-actions/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.developmentAction.delete({ where: { id } });
    res.json({ message: 'Development action deleted' });
  } catch (error) {
    console.error('[API] DELETE /api/development-actions/:id failed:', error);
    res.status(500).json({ message: 'Error deleting development action', error: error.message });
  }
});

// ============================================================
// GAP SUGGESTION
// ============================================================

// Default target levels by criticality
const TARGET_LEVELS = {
  C: 4.0,  // Critical: target mastery
  I: 3.5,  // Important: target strength
  D: 2.5   // Desired: target competent
};

// GET /api/collaborators/:id/suggested-goals — suggest goals based on skill gaps
router.get('/collaborators/:id/suggested-goals', async (req, res) => {
  try {
    const collaboratorId = parseInt(req.params.id, 10);

    // Get the collaborator with their role
    const collaborator = await prisma.collaborator.findUnique({
      where: { id: collaboratorId }
    });

    if (!collaborator) {
      return res.status(404).json({ message: 'Collaborator not found' });
    }

    // Get role profile for their role
    const roleProfile = await prisma.roleProfile.findUnique({
      where: { rol: collaborator.rol }
    });

    if (!roleProfile) {
      return res.json([]); // No profile = no suggestions
    }

    const roleSkills = typeof roleProfile.skills === 'string'
      ? JSON.parse(roleProfile.skills)
      : roleProfile.skills;

    // Get collaborator's latest assessments (most recent per skill)
    const assessments = await prisma.assessment.findMany({
      where: { collaboratorId },
      include: { skill: true },
      orderBy: { createdAt: 'desc' }
    });

    // Build map of latest assessment per skill
    const skillLevels = new Map();
    for (const a of assessments) {
      if (!skillLevels.has(a.skillId)) {
        skillLevels.set(a.skillId, a.nivel);
      }
    }

    // Calculate gaps
    const gaps = [];
    for (const [skillIdStr, criticality] of Object.entries(roleSkills)) {
      if (criticality === 'N') continue; // Not applicable

      const skillId = parseInt(skillIdStr, 10);
      const currentLevel = skillLevels.get(skillId) ?? 0;
      const targetLevel = TARGET_LEVELS[criticality] || 3.0;
      const gapSize = targetLevel - currentLevel;

      if (gapSize > 0) {
        // Get skill name
        const skill = await prisma.skill.findUnique({ where: { id: skillId } });
        if (!skill) continue;

        gaps.push({
          skillId,
          skillName: skill.nombre,
          currentLevel,
          targetLevel,
          gapSize: Math.round(gapSize * 10) / 10,
          suggestedTitle: `Improve ${skill.nombre} from ${currentLevel} to ${targetLevel}`
        });
      }
    }

    // Sort by gap size descending, limit to 5
    gaps.sort((a, b) => b.gapSize - a.gapSize);
    const topGaps = gaps.slice(0, 5);

    res.json(topGaps);
  } catch (error) {
    console.error('[API] GET /api/collaborators/:id/suggested-goals failed:', error);
    res.status(500).json({ message: 'Error fetching suggested goals', error: error.message });
  }
});

// ============================================================
// PROGRESS COMPUTATION
// ============================================================

// GET /api/development-plans/:id/progress — computed progress
router.get('/development-plans/:id/progress', async (req, res) => {
  try {
    const plan = await prisma.developmentPlan.findUnique({
      where: { id: parseInt(req.params.id, 10) },
      include: {
        goals: {
          include: { actions: true }
        }
      }
    });

    if (!plan) {
      return res.status(404).json({ message: 'Development plan not found' });
    }

    // Calculate progress for each goal
    const goalsProgress = plan.goals
      .filter(g => g.status !== 'cancelled')
      .map(goal => {
        const totalActions = goal.actions.filter(a => a.status !== 'skipped').length;
        const completedActions = goal.actions.filter(a => a.status === 'completed').length;
        const progress = totalActions > 0
          ? Math.round((completedActions / totalActions) * 100)
          : 0;

        return {
          id: goal.id,
          title: goal.title,
          progress,
          actionsSummary: {
            total: goal.actions.length,
            completed: completedActions,
            inProgress: goal.actions.filter(a => a.status === 'in_progress').length,
            notStarted: goal.actions.filter(a => a.status === 'not_started').length,
            skipped: goal.actions.filter(a => a.status === 'skipped').length
          }
        };
      });

    // Plan progress = average of non-cancelled goal progress
    const planProgress = goalsProgress.length > 0
      ? Math.round(goalsProgress.reduce((sum, g) => sum + g.progress, 0) / goalsProgress.length)
      : 0;

    res.json({
      planProgress,
      goals: goalsProgress
    });
  } catch (error) {
    console.error('[API] GET /api/development-plans/:id/progress failed:', error);
    res.status(500).json({ message: 'Error computing plan progress', error: error.message });
  }
});

export default router;
