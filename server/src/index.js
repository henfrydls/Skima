import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import { authMiddleware } from './middleware/auth.js';

export const prisma = new PrismaClient();

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());

  // Auth routes (public)
  app.use('/api/auth', authRoutes);

  // ============================================================
  // API ROUTES
  // ============================================================

  // GET /api/data - Aggregated data for Dashboard (backwards compatible)
  app.get('/api/data', async (req, res) => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { id: 'asc' }
      });

      const skills = await prisma.skill.findMany({
        orderBy: { id: 'asc' }
      });

      const collaboratorsRaw = await prisma.collaborator.findMany({
        include: {
          assessments: {
            where: { snapshotId: null } // Current (not archived) assessments
          }
        }
      });

      // Transform to match frontend expected format
      const collaborators = collaboratorsRaw.map(col => {
        const skillsMap = {};
        col.assessments.forEach(a => {
          skillsMap[a.skillId] = {
            nivel: a.nivel,
            criticidad: a.criticidad,
            frecuencia: a.frecuencia
          };
        });
        return {
          id: col.id,
          nombre: col.nombre,
          rol: col.rol,
          esDemo: col.esDemo,
          skills: skillsMap
        };
      });

      // Check if there are any demo collaborators
      const hasDemo = collaborators.some(c => c.esDemo);

      res.json({
        categories: categories.map(c => ({
          id: c.id,
          nombre: c.nombre,
          abrev: c.abrev,
          skillCount: skills.filter(s => s.categoriaId === c.id).length
        })),
        skills: skills.map(s => ({
          id: s.id,
          categoria: s.categoriaId,
          nombre: s.nombre
        })),
        collaborators,
        allowResetFromDemo: hasDemo
      });
    } catch (error) {
      console.error('[API] GET /api/data failed:', error);
      res.status(500).json({ message: 'Error reading data' });
    }
  });

  // POST /api/collaborators - Add new collaborator
  app.post('/api/collaborators', async (req, res) => {
    try {
      const { nombre, rol, skills, esDemo = false } = req.body;

      if (!nombre || !rol) {
        return res.status(400).json({ message: 'Nombre y rol son requeridos' });
      }

      const collaborator = await prisma.collaborator.create({
        data: {
          nombre,
          rol,
          esDemo
        }
      });

      // Create assessments for each skill
      if (skills && typeof skills === 'object') {
        const assessmentData = Object.entries(skills).map(([skillId, data]) => ({
          collaboratorId: collaborator.id,
          skillId: parseInt(skillId),
          nivel: parseFloat(data.nivel) || 0,
          criticidad: data.criticidad || 'N',
          frecuencia: data.frecuencia || 'N',
          snapshotId: null
        }));

        await prisma.assessment.createMany({
          data: assessmentData
        });
      }

      // Return in expected format
      res.json({
        id: collaborator.id,
        nombre: collaborator.nombre,
        rol: collaborator.rol,
        esDemo: collaborator.esDemo,
        skills: skills || {}
      });
    } catch (error) {
      console.error('[API] POST /api/collaborators failed:', error);
      res.status(500).json({ message: 'Error saving collaborator' });
    }
  });

  // POST /api/reset-demo - Remove demo data
  app.post('/api/reset-demo', async (req, res) => {
    try {
      const demoCollaborators = await prisma.collaborator.findMany({
        where: { esDemo: true }
      });

      if (demoCollaborators.length === 0) {
        return res.status(409).json({ message: 'No hay datos demo para eliminar.' });
      }

      const demoIds = demoCollaborators.map(c => c.id);

      // Delete assessments first (foreign key constraint)
      await prisma.assessment.deleteMany({
        where: { collaboratorId: { in: demoIds } }
      });

      // Delete collaborators
      await prisma.collaborator.deleteMany({
        where: { id: { in: demoIds } }
      });

      res.json({
        collaborators: [],
        allowResetFromDemo: false
      });
    } catch (error) {
      console.error('[API] POST /api/reset-demo failed:', error);
      res.status(500).json({ message: 'Error resetting demo data' });
    }
  });

  // GET /api/categories - List all categories
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await prisma.category.findMany({
        include: { _count: { select: { skills: true } } }
      });
      res.json(categories.map(c => ({
        ...c,
        skillCount: c._count.skills
      })));
    } catch (error) {
      console.error('[API] GET /api/categories failed:', error);
      res.status(500).json({ message: 'Error fetching categories' });
    }
  });

  // GET /api/skills - List all skills
  app.get('/api/skills', async (req, res) => {
    try {
      const skills = await prisma.skill.findMany();
      res.json(skills);
    } catch (error) {
      console.error('[API] GET /api/skills failed:', error);
      res.status(500).json({ message: 'Error fetching skills' });
    }
  });

  // GET /api/collaborators - List all collaborators
  app.get('/api/collaborators', async (req, res) => {
    try {
      const collaborators = await prisma.collaborator.findMany();
      res.json(collaborators);
    } catch (error) {
      console.error('[API] GET /api/collaborators failed:', error);
      res.status(500).json({ message: 'Error fetching collaborators' });
    }
  });

  // ============================================================
  // PROTECTED CRUD ROUTES (Require Auth)
  // ============================================================

  // POST /api/categories - Create category
  app.post('/api/categories', authMiddleware, async (req, res) => {
    try {
      const { nombre, abrev } = req.body;
      if (!nombre || !abrev) {
        return res.status(400).json({ message: 'Nombre y abreviatura son requeridos' });
      }
      const category = await prisma.category.create({
        data: { nombre, abrev }
      });
      res.json(category);
    } catch (error) {
      console.error('[API] POST /api/categories failed:', error);
      res.status(500).json({ message: 'Error creating category' });
    }
  });

  // PUT /api/categories/:id - Update category
  app.put('/api/categories/:id', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, abrev } = req.body;
      const category = await prisma.category.update({
        where: { id: parseInt(id) },
        data: { nombre, abrev }
      });
      res.json(category);
    } catch (error) {
      console.error('[API] PUT /api/categories failed:', error);
      res.status(500).json({ message: 'Error updating category' });
    }
  });

  // DELETE /api/categories/:id - Delete category (cascades to skills)
  app.delete('/api/categories/:id', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      // Delete related skills first
      await prisma.skill.deleteMany({ where: { categoriaId: parseInt(id) } });
      await prisma.category.delete({ where: { id: parseInt(id) } });
      res.json({ success: true });
    } catch (error) {
      console.error('[API] DELETE /api/categories failed:', error);
      res.status(500).json({ message: 'Error deleting category' });
    }
  });

  // POST /api/skills - Create skill
  app.post('/api/skills', authMiddleware, async (req, res) => {
    try {
      const { nombre, categoriaId } = req.body;
      if (!nombre || !categoriaId) {
        return res.status(400).json({ message: 'Nombre y categoría son requeridos' });
      }
      const skill = await prisma.skill.create({
        data: { nombre, categoriaId: parseInt(categoriaId) }
      });
      res.json(skill);
    } catch (error) {
      console.error('[API] POST /api/skills failed:', error);
      res.status(500).json({ message: 'Error creating skill' });
    }
  });

  // PUT /api/skills/:id - Update skill
  app.put('/api/skills/:id', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre, categoriaId } = req.body;
      const skill = await prisma.skill.update({
        where: { id: parseInt(id) },
        data: { nombre, categoriaId: categoriaId ? parseInt(categoriaId) : undefined }
      });
      res.json(skill);
    } catch (error) {
      console.error('[API] PUT /api/skills failed:', error);
      res.status(500).json({ message: 'Error updating skill' });
    }
  });

  // DELETE /api/skills/:id - Delete skill
  app.delete('/api/skills/:id', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      // Delete related assessments first
      await prisma.assessment.deleteMany({ where: { skillId: parseInt(id) } });
      await prisma.skill.delete({ where: { id: parseInt(id) } });
      res.json({ success: true });
    } catch (error) {
      console.error('[API] DELETE /api/skills failed:', error);
      res.status(500).json({ message: 'Error deleting skill' });
    }
  });

  // ============================================================
  // DATA PORTABILITY ROUTES
  // ============================================================

  // GET /api/export - Full JSON dump
  app.get('/api/export', async (req, res) => {
    try {
      const categories = await prisma.category.findMany();
      const skills = await prisma.skill.findMany();
      const collaborators = await prisma.collaborator.findMany();
      const assessments = await prisma.assessment.findMany();
      const snapshots = await prisma.snapshot.findMany();

      res.json({
        exportDate: new Date().toISOString(),
        version: '1.0',
        data: {
          categories,
          skills,
          collaborators,
          assessments,
          snapshots
        }
      });
    } catch (error) {
      console.error('[API] GET /api/export failed:', error);
      res.status(500).json({ message: 'Error exporting data' });
    }
  });

  // POST /api/import - Wipe and replace (Protected)
  app.post('/api/import', authMiddleware, async (req, res) => {
    try {
      const { data } = req.body;

      if (!data || !data.categories || !data.skills) {
        return res.status(400).json({ message: 'Formato de datos inválido' });
      }

      // Wipe existing data (order matters due to foreign keys)
      await prisma.assessment.deleteMany();
      await prisma.snapshot.deleteMany();
      await prisma.collaborator.deleteMany();
      await prisma.skill.deleteMany();
      await prisma.category.deleteMany();

      // Import new data
      if (data.categories.length > 0) {
        await prisma.category.createMany({ data: data.categories });
      }
      if (data.skills.length > 0) {
        await prisma.skill.createMany({ data: data.skills });
      }
      if (data.collaborators?.length > 0) {
        await prisma.collaborator.createMany({ data: data.collaborators });
      }
      if (data.snapshots?.length > 0) {
        await prisma.snapshot.createMany({ data: data.snapshots });
      }
      if (data.assessments?.length > 0) {
        await prisma.assessment.createMany({ data: data.assessments });
      }

      res.json({ success: true, message: 'Datos importados correctamente' });
    } catch (error) {
      console.error('[API] POST /api/import failed:', error);
      res.status(500).json({ message: 'Error importing data' });
    }
  });

  return app;
}

// ============================================================
// SERVER START (only when run directly)
// ============================================================
const PORT = process.env.PORT || 3001;

// Only start server if this file is run directly (not imported for tests)
if (process.argv[1] && process.argv[1].includes('index.js')) {
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`[Server] Skills Matrix API running on http://localhost:${PORT}`);
  });
}
