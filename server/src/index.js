import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { prisma } from './db.js';
import authRoutes from './routes/auth.js';
import evolutionRoutes from './routes/evolution.js';
import demoRoutes from './routes/demo.js';
import { authMiddleware } from './middleware/auth.js';

// Re-export prisma for any routes that still import from index
export { prisma };

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());

  // Auth routes (public)
  app.use('/api/auth', authRoutes);

  // Evolution routes (public - for dashboard)
  app.use('/api/skills/evolution', evolutionRoutes);

  // Demo seed routes (public - needed before login)
  app.use('/api/seed-demo', demoRoutes);

  // ============================================================
  // SYSTEM CONFIG ROUTES (Public - needed before login)
  // ============================================================

  // GET /api/config - Check if system is set up
  app.get('/api/config', async (req, res) => {
    try {
      const config = await prisma.systemConfig.findFirst();

      if (!config) {
        return res.json({
          isSetup: false,
          isDemo: false,
          companyName: null,
          adminName: null,
          hasPassword: false
        });
      }

      // Check if there are demo collaborators
      const demoCount = await prisma.collaborator.count({ where: { esDemo: true } });

      res.json({
        isSetup: config.isSetup,
        isDemo: demoCount > 0,
        companyName: config.companyName,
        adminName: config.adminName,
        hasPassword: !!config.adminPassword
      });
    } catch (error) {
      console.error('Error fetching config:', error);
      res.status(500).json({ error: 'Failed to fetch config' });
    }
  });

  // POST /api/setup - Initial system setup (or re-setup from demo mode)
  app.post('/api/setup', async (req, res) => {
    try {
      const { companyName, adminName, adminPassword } = req.body;

      if (!companyName || !adminName) {
        return res.status(400).json({
          error: 'Company name and admin name are required'
        });
      }

      // Check if already set up
      const existingConfig = await prisma.systemConfig.findFirst();
      const demoCount = await prisma.collaborator.count({ where: { esDemo: true } });
      const isInDemoMode = demoCount > 0;

      // Block re-setup only if already configured AND not in demo mode
      if (existingConfig?.isSetup && !isInDemoMode) {
        return res.status(400).json({
          error: 'System is already configured'
        });
      }

      // If transitioning from demo, clean demo data
      if (isInDemoMode) {
        const demoIds = (await prisma.collaborator.findMany({
          where: { esDemo: true }, select: { id: true }
        })).map(c => c.id);

        await prisma.assessment.deleteMany({ where: { collaboratorId: { in: demoIds } } });
        await prisma.evaluationSession.deleteMany({ where: { collaboratorId: { in: demoIds } } });
        await prisma.collaborator.deleteMany({ where: { esDemo: true } });
      }

      // Create or update config (upsert)
      const config = await prisma.systemConfig.upsert({
        where: { id: 1 },
        update: {
          companyName: companyName.trim(),
          adminName: adminName.trim(),
          adminPassword: adminPassword || null,
          isSetup: true
        },
        create: {
          id: 1,
          companyName: companyName.trim(),
          adminName: adminName.trim(),
          adminPassword: adminPassword || null,
          isSetup: true
        }
      });

      res.json({
        success: true,
        isSetup: config.isSetup,
        isDemo: false,
        companyName: config.companyName,
        adminName: config.adminName,
        hasPassword: !!config.adminPassword
      });
    } catch (error) {
      console.error('Error setting up system:', error);
      res.status(500).json({ error: 'Failed to setup system' });
    }
  });

  // PUT /api/config - Update system configuration (for Settings)
  app.put('/api/config', async (req, res) => {
    try {
      const { companyName, adminName, adminPassword, currentPassword } = req.body;

      const config = await prisma.systemConfig.findFirst();
      if (!config) {
        return res.status(404).json({ error: 'Config not found' });
      }

      // If changing password and current password exists, verify it
      if (config.adminPassword && adminPassword) {
        if (currentPassword !== config.adminPassword) {
          return res.status(401).json({ error: 'Current password is incorrect' });
        }
      }

      const updateData = {};
      if (companyName) updateData.companyName = companyName.trim();
      if (adminName) updateData.adminName = adminName.trim();
      if (adminPassword !== undefined) updateData.adminPassword = adminPassword || null;

      const updated = await prisma.systemConfig.update({
        where: { id: 1 },
        data: updateData
      });

      res.json({
        success: true,
        companyName: updated.companyName,
        adminName: updated.adminName,
        hasPassword: !!updated.adminPassword
      });
    } catch (error) {
      console.error('Error updating config:', error);
      res.status(500).json({ error: 'Failed to update config' });
    }
  });

  // POST /api/config/verify - Verify admin password
  app.post('/api/config/verify', async (req, res) => {
    try {
      const { password } = req.body;

      const config = await prisma.systemConfig.findFirst();
      if (!config) {
        return res.status(404).json({ error: 'Config not found', valid: false });
      }

      // If no password set, consider it valid (open access)
      if (!config.adminPassword) {
        return res.json({ valid: true });
      }

      const valid = password === config.adminPassword;
      res.json({ valid });
    } catch (error) {
      console.error('Error verifying password:', error);
      res.status(500).json({ error: 'Failed to verify password', valid: false });
    }
  });

  // ============================================================
  // API ROUTES
  // ============================================================

  // GET /api/data - Aggregated data for Dashboard (backwards compatible)
  app.get('/api/data', async (req, res) => {
    try {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      
      // Only fetch active categories and skills
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { orden: 'asc' }
      });

      const skills = await prisma.skill.findMany({
        where: { isActive: true },
        orderBy: { id: 'asc' }
      });
      
      const activeSkillIds = new Set(skills.map(s => s.id));

      // Fetch role profiles FIRST to use in average calculation
      const roleProfilesRaw = await prisma.roleProfile.findMany();
      const roleProfiles = {};
      roleProfilesRaw.forEach(p => {
        roleProfiles[p.rol] = typeof p.skills === 'string' ? JSON.parse(p.skills) : p.skills;
      });

      const collaboratorsRaw = await prisma.collaborator.findMany({
        where: { isActive: true },
        include: {
          assessments: {
            where: { snapshotId: null } // Current (not archived) assessments
          },
          // Include evaluation history for sparklines and comparison
          evaluationSessions: {
            orderBy: { evaluatedAt: 'desc' },
            take: 5, // Last 5 sessions for sparkline (use last 3)
            include: {
              assessments: {
                include: {
                  skill: {
                    include: { categoria: true }
                  }
                }
              }
            }
          }
        }
      });
      
      // Transform to match frontend expected format
      const collaborators = collaboratorsRaw.map(col => {
        const skillsMap = {};
        let totalNivel = 0;
        let evalCount = 0;
        
        // Get role profile for this collaborator
        const profile = roleProfiles[col.rol] || {};
        
        // Determine active assessments source: Prefer latest session, fallback to current table
        const latestSession = col.evaluationSessions && col.evaluationSessions.length > 0 
          ? col.evaluationSessions[0] 
          : null;
        
        const sourceAssessments = latestSession ? latestSession.assessments : col.assessments;
        
        sourceAssessments.forEach(a => {
          // Only process ACTIVE skills
          if (!activeSkillIds.has(a.skillId)) return;

          skillsMap[a.skillId] = {
            nivel: a.nivel,
            criticidad: profile[String(a.skillId)] || 'N', // Use CURRENT role criticality
            frecuencia: a.frecuencia
          };
          
          // Calculate average based on nivel (1-5 scale)
          // STRICT RULE: Only count skills required for the role (C, I, D). Ignore N/A.
          const skillCriticidad = profile[String(a.skillId)] || 'N'; 
          
          if (skillCriticidad !== 'N' && a.nivel && a.nivel > 0) {
            totalNivel += a.nivel;
            evalCount++;
          }
        });
        
        const promedio = evalCount > 0 ? totalNivel / evalCount : 0;
        
        return {
          id: col.id,
          nombre: col.nombre,
          rol: col.rol,
          esDemo: col.esDemo,
          skills: skillsMap,
          promedio: Math.round(promedio * 10) / 10, // Round to 1 decimal
          lastEvaluated: latestSession ? latestSession.evaluatedAt : col.lastEvaluated,
          // Include evaluation history for sparklines and comparison
          evaluationSessions: col.evaluationSessions.map(session => ({
            id: session.id,
            evaluatedAt: session.evaluatedAt,
            collaboratorRol: session.collaboratorRol,
            assessments: session.assessments.map(a => ({
              skillId: a.skillId,
              skillNombre: a.skill.nombre,
              nivel: a.nivel,
              criticidad: a.criticidad,
              categoriaId: a.skill.categoriaId,
              categoriaNombre: a.skill.categoria.nombre
            }))
          }))
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
        roleProfiles,
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

  // GET /api/categories - List categories (optionally include archived)
  app.get('/api/categories', async (req, res) => {
    try {
      const includeArchived = req.query.includeArchived === 'true';
      
      const categories = await prisma.category.findMany({
        where: includeArchived ? {} : { isActive: true },
        include: { 
          _count: { 
            select: { 
              skills: { where: { isActive: true } }  // Count only active skills
            } 
          } 
        },
        orderBy: { orden: 'asc' }
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



  // GET /api/skills - List skills (optionally include archived)
  app.get('/api/skills', async (req, res) => {
    try {
      const includeArchived = req.query.includeArchived === 'true';
      
      const skills = await prisma.skill.findMany({
        where: includeArchived ? {} : { isActive: true }
      });
      res.json(skills);
    } catch (error) {
      console.error('[API] GET /api/skills failed:', error);
      res.status(500).json({ message: 'Error fetching skills' });
    }
  });

  // GET /api/collaborators - List all collaborators
  app.get('/api/collaborators', async (req, res) => {
    try {
      const includeArchived = req.query.includeArchived === 'true';
      const collaborators = await prisma.collaborator.findMany({
        where: includeArchived ? {} : { isActive: true }
      });
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
      
      // Get max order to append to end
      const maxOrder = await prisma.category.aggregate({
        _max: { orden: true }
      });
      const nextOrder = (maxOrder._max.orden || 0) + 1;

      const category = await prisma.category.create({
        data: { nombre, abrev, orden: nextOrder }
      });
      res.json(category);
    } catch (error) {
      console.error('[API] POST /api/categories failed:', error);
      res.status(500).json({ message: 'Error creating category' });
    }
  });

  // PUT /api/categories/reorder - Reorder categories
  // MUST be defined before /:id route
  app.put('/api/categories/reorder', authMiddleware, async (req, res) => {
    try {
      const { order } = req.body; // Array of IDs in new order
      
      if (!Array.isArray(order)) {
        return res.status(400).json({ message: 'Invalid order data' });
      }

      // Transactional update for safety
      await prisma.$transaction(
        order.map((id, index) => 
          prisma.category.update({
            where: { id: parseInt(id) },
            data: { orden: index }
          })
        )
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error('[API] PUT /api/categories/reorder failed:', error);
      res.status(500).json({ message: 'Error reordering categories' });
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

  // DELETE /api/categories/:id - Soft delete category (and its skills)
  app.delete('/api/categories/:id', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const categoryId = parseInt(id);
      
      // Soft delete: set isActive=false for category and related skills
      await prisma.$transaction([
        prisma.skill.updateMany({ 
          where: { categoriaId: categoryId },
          data: { isActive: false }
        }),
        prisma.category.update({ 
          where: { id: categoryId },
          data: { isActive: false }
        })
      ]);
      
      res.json({ success: true, message: 'Categoría archivada exitosamente' });
    } catch (error) {
      console.error('[API] DELETE /api/categories failed:', error);
      res.status(500).json({ message: 'Error archivando categoría' });
    }
  });

  // PUT /api/categories/:id/restore - Restore archived category (and its skills)
  app.put('/api/categories/:id/restore', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const categoryId = parseInt(id);
      
      // Restore: set isActive=true for category and related skills
      await prisma.$transaction([
        prisma.skill.updateMany({ 
          where: { categoriaId: categoryId },
          data: { isActive: true }
        }),
        prisma.category.update({ 
          where: { id: categoryId },
          data: { isActive: true }
        })
      ]);
      
      res.json({ success: true, message: 'Categoría restaurada exitosamente' });
    } catch (error) {
      console.error('[API] PUT /api/categories/:id/restore failed:', error);
      res.status(500).json({ message: 'Error restaurando categoría' });
    }
  });

  // PUT /api/categories/reorder - Reorder categories

  app.put('/api/categories/reorder', authMiddleware, async (req, res) => {
    try {
      const { order } = req.body; // Array of category IDs in new order: [3, 1, 2, 4, ...]
      
      if (!Array.isArray(order)) {
        return res.status(400).json({ message: 'order must be an array of category IDs' });
      }

      // Update each category's orden field
      for (let i = 0; i < order.length; i++) {
        await prisma.category.update({
          where: { id: order[i] },
          data: { orden: i }
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('[API] PUT /api/categories/reorder failed:', error);
      res.status(500).json({ message: 'Error reordering categories' });
    }
  });

  // POST /api/collaborators - Create collaborator
  app.post('/api/collaborators', authMiddleware, async (req, res) => {
    try {
      const { nombre, rol, email, esDemo } = req.body;
      if (!nombre || !rol) {
        return res.status(400).json({ message: 'Nombre y rol son requeridos' });
      }

      const collaborator = await prisma.collaborator.create({
        data: {
          nombre,
          rol,
          email,
          esDemo: esDemo || false
        }
      });
      res.json(collaborator);
    } catch (error) {
      console.error('[API] POST /api/collaborators failed:', error);
      res.status(500).json({ message: 'Error creating collaborator' });
    }
  });

  // DELETE /api/collaborators/:id - Soft Delete collaborator
  app.delete('/api/collaborators/:id', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Soft Delete: just set isActive = false
      await prisma.collaborator.update({
        where: { id: parseInt(id) },
        data: { isActive: false }
      });
      
      res.json({ message: 'Collaborator archived' });
    } catch (error) {
      console.error('[API] DELETE /api/collaborators/:id failed:', error);
      res.status(500).json({ message: 'Error archiving collaborator' });
    }
  });

  // PUT /api/collaborators/:id/restore - Restore collaborator
  app.put('/api/collaborators/:id/restore', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      
      await prisma.collaborator.update({
        where: { id: parseInt(id) },
        data: { isActive: true }
      });
      
      res.json({ message: 'Collaborator restored' });
    } catch (error) {
      console.error('[API] PUT /api/collaborators/:id/restore failed:', error);
      res.status(500).json({ message: 'Error restoring collaborator' });
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

  // ============================================================
  // ROLE PROFILES ENDPOINTS
  // ============================================================

  // GET /api/role-profiles - List all role profiles
  app.get('/api/role-profiles', async (req, res) => {
    try {
      const profiles = await prisma.roleProfile.findMany();
      // Transform to { "UX Designer": { "1": "C", ... }, ... }
      const result = {};
      profiles.forEach(p => {
        result[p.rol] = typeof p.skills === 'string' ? JSON.parse(p.skills) : p.skills;
      });
      res.json(result);
    } catch (error) {
      console.error('[API] GET /api/role-profiles failed:', error);
      res.status(500).json({ message: 'Error fetching role profiles' });
    }
  });

  // GET /api/role-profiles/:rol - Get single role profile
  app.get('/api/role-profiles/:rol', async (req, res) => {
    try {
      const { rol } = req.params;
      const profile = await prisma.roleProfile.findUnique({ where: { rol } });
      if (!profile) {
        return res.status(404).json({ message: 'Perfil no encontrado' });
      }
      res.json(typeof profile.skills === 'string' ? JSON.parse(profile.skills) : profile.skills);
    } catch (error) {
      console.error('[API] GET /api/role-profiles/:rol failed:', error);
      res.status(500).json({ message: 'Error fetching role profile' });
    }
  });

  // PUT /api/role-profiles/:rol - Create or update role profile
  app.put('/api/role-profiles/:rol', authMiddleware, async (req, res) => {
    try {
      const { rol } = req.params;
      const skills = req.body; // { "1": "C", "2": "I" }

      // Validate criticidad values
      const validCriticidades = ['C', 'I', 'D', 'N'];
      for (const [, value] of Object.entries(skills)) {
        if (!validCriticidades.includes(value)) {
          return res.status(400).json({ message: `Criticidad inválida: ${value}. Debe ser C, I, D, o N` });
        }
      }

      const profile = await prisma.roleProfile.upsert({
        where: { rol },
        update: { skills: JSON.stringify(skills) },
        create: { rol, skills: JSON.stringify(skills) }
      });

      res.json({
        id: profile.id,
        rol: profile.rol,
        skills: typeof profile.skills === 'string' ? JSON.parse(profile.skills) : profile.skills
      });
    } catch (error) {
      console.error('[API] PUT /api/role-profiles/:rol failed:', error);
      res.status(500).json({ message: 'Error saving role profile' });
    }
  });

  // PUT /api/role-profiles/:rol/rename - Rename role profile
  app.put('/api/role-profiles/:rol/rename', authMiddleware, async (req, res) => {
    try {
      const { rol } = req.params; // Old role name
      const { newName } = req.body; // New role name

      if (!newName || !newName.trim()) {
        return res.status(400).json({ message: 'El nuevo nombre es requerido' });
      }

      const trimmedNewName = newName.trim();

      // Check if old profile exists
      const existingProfile = await prisma.roleProfile.findUnique({ where: { rol } });
      if (!existingProfile) {
        return res.status(404).json({ message: 'Perfil no encontrado' });
      }

      // Check if new name already exists (unless it's the same)
      if (trimmedNewName !== rol) {
        const conflictProfile = await prisma.roleProfile.findUnique({ where: { rol: trimmedNewName } });
        if (conflictProfile) {
          return res.status(400).json({ message: 'Ya existe un perfil con ese nombre' });
        }
      }

      // Transaction: Update profile + all collaborators using this role + evaluation sessions
      await prisma.$transaction([
        // 1. Update the role profile name
        prisma.roleProfile.update({
          where: { rol },
          data: { rol: trimmedNewName }
        }),
        // 2. Update all collaborators that have this role
        prisma.collaborator.updateMany({
          where: { rol: rol },
          data: { rol: trimmedNewName }
        }),
        // 3. Update evaluation session snapshots that reference this role
        prisma.evaluationSession.updateMany({
          where: { collaboratorRol: rol },
          data: { collaboratorRol: trimmedNewName }
        })
      ]);

      res.json({ success: true, oldName: rol, newName: trimmedNewName });
    } catch (error) {
      console.error('[API] PUT /api/role-profiles/:rol/rename failed:', error);
      res.status(500).json({ message: 'Error renaming role profile' });
    }
  });

  // POST /api/role-profiles - Create new role profile
  app.post('/api/role-profiles', authMiddleware, async (req, res) => {
    try {
      const { rol, skills } = req.body;

      if (!rol) {
        return res.status(400).json({ message: 'Rol es requerido' });
      }

      // Check if profile already exists
      const existing = await prisma.roleProfile.findUnique({ where: { rol } });
      if (existing) {
        return res.status(400).json({ message: 'Ya existe un perfil para este rol' });
      }

      const profile = await prisma.roleProfile.create({
        data: { rol, skills: JSON.stringify(skills || {}) }
      });

      res.json({
        id: profile.id,
        rol: profile.rol,
        skills: typeof profile.skills === 'string' ? JSON.parse(profile.skills) : profile.skills
      });
    } catch (error) {
      console.error('[API] POST /api/role-profiles failed:', error);
      res.status(500).json({ message: 'Error creating role profile' });
    }
  });

  // DELETE /api/role-profiles/:rol - Delete role profile
  app.delete('/api/role-profiles/:rol', authMiddleware, async (req, res) => {
    try {
      const { rol } = req.params;
      await prisma.roleProfile.delete({ where: { rol } });
      res.json({ success: true });
    } catch (error) {
      console.error('[API] DELETE /api/role-profiles/:rol failed:', error);
      res.status(500).json({ message: 'Error deleting role profile' });
    }
  });

  // ============================================================
  // COLLABORATOR SKILLS (EVALUATIONS) ENDPOINTS
  // ============================================================

  // GET /api/collaborators/:id/skills - Get collaborator's current evaluations
  app.get('/api/collaborators/:id/skills', async (req, res) => {
    try {
      const collaboratorId = parseInt(req.params.id);
      
      const assessments = await prisma.assessment.findMany({
        where: { collaboratorId, snapshotId: null }
      });

      // Transform to { "1": { nivel: 3, frecuencia: "D" }, ... }
      const result = {};
      assessments.forEach(a => {
        result[a.skillId] = { nivel: a.nivel, frecuencia: a.frecuencia };
      });

      res.json(result);
    } catch (error) {
      console.error('[API] GET /api/collaborators/:id/skills failed:', error);
      res.status(500).json({ message: 'Error fetching collaborator skills' });
    }
  });

  // PUT /api/collaborators/:id/skills - Save collaborator evaluations
  app.put('/api/collaborators/:id/skills', authMiddleware, async (req, res) => {
    try {
      const collaboratorId = parseInt(req.params.id);
      const skills = req.body; // { "1": { nivel: 3, frecuencia: "D" }, ... }

      // Get collaborator and their role profile
      const collab = await prisma.collaborator.findUnique({ where: { id: collaboratorId } });
      if (!collab) {
        return res.status(404).json({ message: 'Colaborador no encontrado' });
      }

      const roleProfile = await prisma.roleProfile.findUnique({ where: { rol: collab.rol } });
      const profileSkills = roleProfile 
        ? (typeof roleProfile.skills === 'string' ? JSON.parse(roleProfile.skills) : roleProfile.skills)
        : {};

      // Validate and upsert each assessment
      const validFrecuencias = ['D', 'S', 'M', 'T', 'N'];
      for (const [skillId, data] of Object.entries(skills)) {
        // Validate nivel (0-5)
        if (data.nivel < 0 || data.nivel > 5) {
          return res.status(400).json({ message: `Nivel inválido para skill ${skillId}: ${data.nivel}. Debe ser 0-5` });
        }
        // Validate frecuencia
        if (!validFrecuencias.includes(data.frecuencia)) {
          return res.status(400).json({ message: `Frecuencia inválida: ${data.frecuencia}. Debe ser D, S, M, T, o N` });
        }

        const criticidad = profileSkills[skillId] || 'N';

        // Can't use upsert with null in composite key, so use findFirst + update/create
        const existingAssessment = await prisma.assessment.findFirst({
          where: {
            collaboratorId,
            skillId: parseInt(skillId),
            snapshotId: null
          }
        });

        if (existingAssessment) {
          await prisma.assessment.update({
            where: { id: existingAssessment.id },
            data: {
              nivel: data.nivel,
              frecuencia: data.frecuencia,
              criticidad
            }
          });
        } else {
          await prisma.assessment.create({
            data: {
              collaboratorId,
              skillId: parseInt(skillId),
              nivel: data.nivel,
              frecuencia: data.frecuencia,
              criticidad,
              snapshotId: null
            }
          });
        }
      }

      // Update lastEvaluated timestamp
      await prisma.collaborator.update({
        where: { id: collaboratorId },
        data: { lastEvaluated: new Date() }
      });

      res.json({ success: true, message: 'Evaluaciones guardadas' });
    } catch (error) {
      console.error('[API] PUT /api/collaborators/:id/skills failed:', error);
      res.status(500).json({ message: 'Error saving evaluations' });
    }
  });

  // PUT /api/collaborators/:id - Update collaborator
  app.put('/api/collaborators/:id', authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { nombre, rol, email } = req.body;

      const collaborator = await prisma.collaborator.update({
        where: { id },
        data: {
          ...(nombre && { nombre }),
          ...(rol && { rol }),
          ...(email !== undefined && { email })
        }
      });

      res.json(collaborator);
    } catch (error) {
      console.error('[API] PUT /api/collaborators/:id failed:', error);
      res.status(500).json({ message: 'Error updating collaborator' });
    }
  });

  // ============================================================
  // EVALUATION SESSIONS ENDPOINTS
  // ============================================================

  // GET /api/collaborators/:id/evaluations - List evaluation sessions for a collaborator
  app.get('/api/collaborators/:id/evaluations', async (req, res) => {
    try {
      const collaboratorId = parseInt(req.params.id);

      const sessions = await prisma.evaluationSession.findMany({
        where: { collaboratorId },
        orderBy: { evaluatedAt: 'desc' },
        include: {
          _count: {
            select: { assessments: true }
          }
        }
      });

      res.json(sessions.map(s => ({
        id: s.id,
        uuid: s.uuid,
        evaluatedAt: s.evaluatedAt,
        evaluatedBy: s.evaluatedBy,
        notes: s.notes,
        assessmentCount: s._count.assessments,
        collaboratorNombre: s.collaboratorNombre,  // Snapshot data
        collaboratorRol: s.collaboratorRol         // Snapshot data
      })));
    } catch (error) {
      console.error('[API] GET /api/collaborators/:id/evaluations failed:', error);
      res.status(500).json({ message: 'Error fetching evaluation sessions' });
    }
  });

  // GET /api/evaluations/:uuid - Get single evaluation session by UUID
  app.get('/api/evaluations/:uuid', async (req, res) => {
    try {
      const { uuid } = req.params;

      const session = await prisma.evaluationSession.findUnique({
        where: { uuid },
        include: {
          collaborator: true,
          assessments: {
            include: {
              skill: {
                include: {
                  categoria: true
                }
              }
            }
          }
        }
      });

      if (!session) {
        return res.status(404).json({ message: 'Evaluación no encontrada' });
      }

      // Transform assessments to a map by skill ID
      const skillsMap = {};
      session.assessments.forEach(a => {
        skillsMap[a.skillId] = {
          nivel: a.nivel,
          criticidad: a.criticidad,
          frecuencia: a.frecuencia,
          skillName: a.skill.nombre,
          categoryName: a.skill.categoria.nombre,
          categoryId: a.skill.categoriaId
        };
      });

      res.json({
        id: session.id,
        uuid: session.uuid,
        collaborator: {
          id: session.collaborator.id,
          nombre: session.collaborator.nombre,
          rol: session.collaborator.rol
        },
        // Snapshot data (from time of evaluation)
        collaboratorNombre: session.collaboratorNombre,
        collaboratorRol: session.collaboratorRol,
        evaluatedAt: session.evaluatedAt,
        evaluatedBy: session.evaluatedBy,
        notes: session.notes,
        skills: skillsMap,
        assessmentCount: session.assessments.length
      });
    } catch (error) {
      console.error('[API] GET /api/evaluations/:uuid failed:', error);
      res.status(500).json({ message: 'Error fetching evaluation' });
    }
  });

  // POST /api/evaluations - Create new evaluation session
  app.post('/api/evaluations', authMiddleware, async (req, res) => {
    try {
      const { collaboratorId, evaluatedBy, notes, skills } = req.body;

      if (!collaboratorId) {
        return res.status(400).json({ message: 'collaboratorId es requerido' });
      }

      // Check collaborator exists
      const collab = await prisma.collaborator.findUnique({ where: { id: collaboratorId } });
      if (!collab) {
        return res.status(404).json({ message: 'Colaborador no encontrado' });
      }

      // Get role profile for criticidad
      const roleProfile = await prisma.roleProfile.findUnique({ where: { rol: collab.rol } });
      const profileSkills = roleProfile 
        ? (typeof roleProfile.skills === 'string' ? JSON.parse(roleProfile.skills) : roleProfile.skills)
        : {};

      // Create evaluation session with collaborator snapshot
      const session = await prisma.evaluationSession.create({
        data: {
          collaboratorId,
          collaboratorNombre: collab.nombre,  // Snapshot at time of evaluation
          collaboratorRol: collab.rol,        // Snapshot at time of evaluation
          evaluatedBy: evaluatedBy || null,
          notes: notes || null
        }
      });

      // Create assessments if skills provided
      if (skills && Object.keys(skills).length > 0) {
        const validFrecuencias = ['D', 'S', 'M', 'T', 'N'];
        
        for (const [skillId, data] of Object.entries(skills)) {
          // Validate
          if (data.nivel < 0 || data.nivel > 5) {
            continue; // Skip invalid
          }
          if (!validFrecuencias.includes(data.frecuencia)) {
            continue;
          }

          const criticidad = profileSkills[skillId] || 'N';

          await prisma.assessment.create({
            data: {
              collaboratorId,
              skillId: parseInt(skillId),
              nivel: data.nivel,
              frecuencia: data.frecuencia,
              criticidad,
              evaluationSessionId: session.id
            }
          });

          // Also update/create the current assessment (snapshotId: null)
          // Can't use upsert with null in composite key, so use findFirst + update/create
          const existingAssessment = await prisma.assessment.findFirst({
            where: {
              collaboratorId,
              skillId: parseInt(skillId),
              snapshotId: null
            }
          });

          if (existingAssessment) {
            await prisma.assessment.update({
              where: { id: existingAssessment.id },
              data: {
                nivel: data.nivel,
                frecuencia: data.frecuencia,
                criticidad
              }
            });
          } else {
            await prisma.assessment.create({
              data: {
                collaboratorId,
                skillId: parseInt(skillId),
                nivel: data.nivel,
                frecuencia: data.frecuencia,
                criticidad,
                snapshotId: null
              }
            });
          }
        }
      }

      // Update lastEvaluated
      await prisma.collaborator.update({
        where: { id: collaboratorId },
        data: { lastEvaluated: new Date() }
      });

      res.json({
        success: true,
        uuid: session.uuid,
        message: 'Evaluación creada correctamente'
      });
    } catch (error) {
      console.error('[API] POST /api/evaluations failed:', error);
      res.status(500).json({ message: 'Error creating evaluation' });
    }
  });

  // DELETE /api/evaluations/:uuid - Delete evaluation session
  app.delete('/api/evaluations/:uuid', authMiddleware, async (req, res) => {
    try {
      const { uuid } = req.params;

      // Delete assessments linked to this session
      const session = await prisma.evaluationSession.findUnique({ where: { uuid } });
      if (!session) {
        return res.status(404).json({ message: 'Evaluación no encontrada' });
      }

      await prisma.assessment.deleteMany({
        where: { evaluationSessionId: session.id }
      });

      await prisma.evaluationSession.delete({ where: { uuid } });

      res.json({ success: true });
    } catch (error) {
      console.error('[API] DELETE /api/evaluations/:uuid failed:', error);
      res.status(500).json({ message: 'Error deleting evaluation' });
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
