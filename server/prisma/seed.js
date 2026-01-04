/**
 * Seed Script - Load Full Demo Data
 * 
 * Run with: npm run db:seed
 * 
 * This loads the original mock data into the SQLite database
 * for testing and demonstration purposes.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Demo Categories
const CATEGORIES = [
  { id: 1, nombre: 'Innovación & Diseño', abrev: 'Innovación' },
  { id: 2, nombre: 'Desarrollo & Plataforma Técnica', abrev: 'Desarrollo' },
  { id: 3, nombre: 'Liderazgo del Cambio', abrev: 'Cambio' },
  { id: 4, nombre: 'Negocio & Estrategia', abrev: 'Negocio', isActive: true },
  { id: 5, nombre: 'Entrega & Portafolio', abrev: 'Entrega', isActive: true },
  { id: 6, nombre: 'Tecnologías Emergentes', abrev: 'Emergentes', isActive: true },
  // Case: Archived Category
  { id: 7, nombre: 'Legacy Systems (Archived)', abrev: 'Legacy', isActive: false },
];

// Demo Skills (37 skills)
const SKILLS = [
  { id: 1, categoriaId: 1, nombre: 'Design Thinking' },
  { id: 2, categoriaId: 1, nombre: 'Service Design' },
  { id: 3, categoriaId: 1, nombre: 'Lean Startup / Experimentación ágil' },
  { id: 4, categoriaId: 1, nombre: 'User Research & Human-Centered Design' },
  { id: 5, categoriaId: 1, nombre: 'Customer Journey Mapping' },
  { id: 6, categoriaId: 1, nombre: 'Stage-Gate Methodology' },
  { id: 7, categoriaId: 2, nombre: 'Cloud Infrastructure & DevOps' },
  { id: 8, categoriaId: 2, nombre: 'Arquitectura de Sistemas' },
  { id: 9, categoriaId: 2, nombre: 'Desarrollo Backend (Django, APIs)' },
  { id: 10, categoriaId: 2, nombre: 'Desarrollo Frontend (HTMX, JS)' },
  { id: 11, categoriaId: 2, nombre: 'Integración de Sistemas y APIs' },
  { id: 12, categoriaId: 2, nombre: 'Low-code/No-code' },
  { id: 13, categoriaId: 2, nombre: 'Ciberseguridad' },
  { id: 14, categoriaId: 2, nombre: 'Testing/QA' },
  { id: 15, categoriaId: 3, nombre: 'Change Management' },
  { id: 16, categoriaId: 3, nombre: 'Workshop Facilitation' },
  { id: 17, categoriaId: 3, nombre: 'Training Design & Delivery' },
  { id: 18, categoriaId: 3, nombre: 'Storytelling & Communication' },
  { id: 19, categoriaId: 4, nombre: 'Business Case Development' },
  { id: 20, categoriaId: 4, nombre: 'Financial Modeling & ROI' },
  { id: 21, categoriaId: 4, nombre: 'Data Analytics & Visualization' },
  { id: 22, categoriaId: 4, nombre: 'Risk Assessment' },
  { id: 23, categoriaId: 4, nombre: 'Market Research' },
  { id: 24, categoriaId: 4, nombre: 'Strategic Planning' },
  { id: 25, categoriaId: 4, nombre: 'Executive Communication' },
  { id: 26, categoriaId: 4, nombre: 'Documentación de Procesos' },
  { id: 29, categoriaId: 5, nombre: 'Agile/Scrum' },
  { id: 30, categoriaId: 5, nombre: 'Portfolio Management' },
  { id: 31, categoriaId: 5, nombre: 'Stakeholder Management' },
  { id: 32, categoriaId: 5, nombre: 'Process Automation' },
  { id: 33, categoriaId: 5, nombre: 'Project Management' },
  { id: 34, categoriaId: 5, nombre: 'Product Management' },
  { id: 35, categoriaId: 6, nombre: 'AI & Prompt Engineering' },
  { id: 36, categoriaId: 2, nombre: 'UX/UI Design & Prototyping' },
  { id: 37, categoriaId: 2, nombre: 'Observabilidad & SRE' },
  { id: 38, categoriaId: 6, nombre: 'AI Agents & Workflows' },
  { id: 39, categoriaId: 6, nombre: 'IoT & Edge Computing' },
  { id: 40, categoriaId: 2, nombre: 'Control de versiones (Git)' },
  // Case: Archived Skill
  { id: 41, categoriaId: 7, nombre: 'COBOL Programming', isActive: false },
  { id: 42, categoriaId: 7, nombre: 'Mainframe Maintenance', isActive: false },
];

/**
 * COLLABORATORS - RICH DATA SET
 * Includes original profiles + Specific scenarios for gaps/history
 */
const COLLABORATORS = [
  {
    nombre: 'María González',
    rol: 'Product Manager',
    esDemo: true,
    skills: {
      1: { nivel: 3.5, frecuencia: 'D', criticidad: 'C' },
      2: { nivel: 3.5, frecuencia: 'S', criticidad: 'C' },
      3: { nivel: 3.5, frecuencia: 'D', criticidad: 'C' },
      4: { nivel: 3.5, frecuencia: 'S', criticidad: 'I' },
      5: { nivel: 3.5, frecuencia: 'M', criticidad: 'I' },
      6: { nivel: 3.5, frecuencia: 'M', criticidad: 'D' },
      7: { nivel: 0.7, frecuencia: 'N', criticidad: 'I' },
      8: { nivel: 0.7, frecuencia: 'M', criticidad: 'I' },
      9: { nivel: 0.7, frecuencia: 'N', criticidad: 'D' },
      10: { nivel: 0.7, frecuencia: 'N', criticidad: 'D' },
      11: { nivel: 0.7, frecuencia: 'M', criticidad: 'I' },
      12: { nivel: 0.7, frecuencia: 'S', criticidad: 'C' },
      13: { nivel: 0.7, frecuencia: 'N', criticidad: 'I' },
      14: { nivel: 0.7, frecuencia: 'M', criticidad: 'I' },
      15: { nivel: 2.9, frecuencia: 'D', criticidad: 'C' },
      16: { nivel: 2.9, frecuencia: 'D', criticidad: 'C' },
      17: { nivel: 2.9, frecuencia: 'S', criticidad: 'C' },
      18: { nivel: 2.9, frecuencia: 'D', criticidad: 'C' },
      19: { nivel: 2.6, frecuencia: 'S', criticidad: 'C' },
      20: { nivel: 2.6, frecuencia: 'S', criticidad: 'C' },
      21: { nivel: 2.6, frecuencia: 'D', criticidad: 'C' },
      22: { nivel: 2.6, frecuencia: 'S', criticidad: 'C' },
      23: { nivel: 2.6, frecuencia: 'M', criticidad: 'I' },
      24: { nivel: 2.6, frecuencia: 'D', criticidad: 'C' },
      25: { nivel: 2.6, frecuencia: 'D', criticidad: 'C' },
      26: { nivel: 2.6, frecuencia: 'S', criticidad: 'I' },
      29: { nivel: 2.9, frecuencia: 'D', criticidad: 'C' },
      30: { nivel: 2.9, frecuencia: 'D', criticidad: 'C' },
      31: { nivel: 2.9, frecuencia: 'D', criticidad: 'C' },
      32: { nivel: 2.9, frecuencia: 'S', criticidad: 'I' },
      33: { nivel: 2.9, frecuencia: 'D', criticidad: 'C' },
      34: { nivel: 2.9, frecuencia: 'D', criticidad: 'C' },
      35: { nivel: 1.9, frecuencia: 'S', criticidad: 'I' },
      36: { nivel: 0.7, frecuencia: 'M', criticidad: 'D' },
      37: { nivel: 0.7, frecuencia: 'M', criticidad: 'I' },
      38: { nivel: 1.9, frecuencia: 'M', criticidad: 'I' },
      39: { nivel: 1.9, frecuencia: 'T', criticidad: 'D' },
      40: { nivel: 2.5, frecuencia: 'S', criticidad: 'I' },
    },
  },
  {
    nombre: 'Carlos Mendez',
    rol: 'Arquitecto Cloud',
    esDemo: true,
    skills: {
      1: { nivel: 3.5, frecuencia: 'M', criticidad: 'I' },
      2: { nivel: 3.5, frecuencia: 'T', criticidad: 'D' },
      3: { nivel: 3.5, frecuencia: 'M', criticidad: 'I' },
      7: { nivel: 4.2, frecuencia: 'D', criticidad: 'C' },
      8: { nivel: 4.0, frecuencia: 'D', criticidad: 'C' },
      9: { nivel: 3.8, frecuencia: 'D', criticidad: 'C' },
      10: { nivel: 2.5, frecuencia: 'S', criticidad: 'I' },
      11: { nivel: 4.0, frecuencia: 'D', criticidad: 'C' },
      13: { nivel: 3.5, frecuencia: 'D', criticidad: 'C' },
      14: { nivel: 3.0, frecuencia: 'D', criticidad: 'C' },
      37: { nivel: 4.0, frecuencia: 'D', criticidad: 'C' },
      38: { nivel: 2.5, frecuencia: 'S', criticidad: 'C' },
      40: { nivel: 4.5, frecuencia: 'D', criticidad: 'C' },
    },
  },
  {
    nombre: 'Ana Rodríguez',
    rol: 'Consultora de Innovación',
    esDemo: true,
    skills: {
      1: { nivel: 4.2, frecuencia: 'D', criticidad: 'C' },
      2: { nivel: 4.0, frecuencia: 'D', criticidad: 'C' },
      3: { nivel: 4.0, frecuencia: 'D', criticidad: 'C' },
      4: { nivel: 4.5, frecuencia: 'D', criticidad: 'C' },
      5: { nivel: 4.0, frecuencia: 'S', criticidad: 'C' },
      6: { nivel: 3.5, frecuencia: 'M', criticidad: 'I' },
      15: { nivel: 3.8, frecuencia: 'D', criticidad: 'C' },
      16: { nivel: 4.5, frecuencia: 'D', criticidad: 'C' },
      17: { nivel: 4.0, frecuencia: 'D', criticidad: 'C' },
      18: { nivel: 4.2, frecuencia: 'D', criticidad: 'C' },
      19: { nivel: 3.5, frecuencia: 'S', criticidad: 'C' },
      21: { nivel: 3.2, frecuencia: 'D', criticidad: 'C' },
      24: { nivel: 3.8, frecuencia: 'D', criticidad: 'C' },
      31: { nivel: 3.5, frecuencia: 'D', criticidad: 'C' },
    },
  },
  {
    nombre: 'Pedro Sánchez',
    rol: 'Líder de Plataforma',
    esDemo: true,
    skills: {
      7: { nivel: 3.8, frecuencia: 'D', criticidad: 'C' },
      8: { nivel: 4.0, frecuencia: 'D', criticidad: 'C' },
      9: { nivel: 3.5, frecuencia: 'S', criticidad: 'C' },
      11: { nivel: 3.8, frecuencia: 'D', criticidad: 'C' },
      13: { nivel: 3.5, frecuencia: 'S', criticidad: 'C' },
      29: { nivel: 3.5, frecuencia: 'D', criticidad: 'C' },
      33: { nivel: 3.0, frecuencia: 'D', criticidad: 'C' },
      34: { nivel: 3.5, frecuencia: 'D', criticidad: 'C' },
      37: { nivel: 3.5, frecuencia: 'D', criticidad: 'C' },
      40: { nivel: 4.0, frecuencia: 'D', criticidad: 'C' },
    },
  },
  {
    nombre: 'Laura Torres',
    rol: 'Junior Developer',
    esDemo: true,
    skills: {
      7: { nivel: 2.0, frecuencia: 'D', criticidad: 'C' },
      8: { nivel: 1.5, frecuencia: 'S', criticidad: 'C' },
      9: { nivel: 2.5, frecuencia: 'D', criticidad: 'C' },
      10: { nivel: 2.8, frecuencia: 'D', criticidad: 'C' },
      11: { nivel: 1.8, frecuencia: 'S', criticidad: 'C' },
      14: { nivel: 2.0, frecuencia: 'D', criticidad: 'C' },
      29: { nivel: 2.5, frecuencia: 'D', criticidad: 'C' },
      35: { nivel: 2.0, frecuencia: 'D', criticidad: 'C' },
      40: { nivel: 3.0, frecuencia: 'D', criticidad: 'C' },
    },
  },
  // Case: "Promoted" (High Performance / Expert)
  {
    nombre: 'Diana Prince',
    rol: 'Engineering Director',
    esDemo: true,
    skills: {
      15: { nivel: 4.8, frecuencia: 'D', criticidad: 'C' }, // High Leadership
      18: { nivel: 4.9, frecuencia: 'D', criticidad: 'C' },
      24: { nivel: 4.7, frecuencia: 'D', criticidad: 'C' }, // Strategy
      25: { nivel: 5.0, frecuencia: 'D', criticidad: 'C' },
      30: { nivel: 4.5, frecuencia: 'W', criticidad: 'I' },
    },
  },
  // Case: "New Hire" (Empty/Low Assessments)
  {
    nombre: 'Kevin Nuevo',
    rol: 'Intern',
    esDemo: true,
    skills: {
       40: { nivel: 1.5, frecuencia: 'D', criticidad: 'I' }, // Just Git
    },
    isActive: false,
  },
  // Case: Undefined Role (No Profile)
  {
    nombre: 'Contractor',
    rol: 'External Consultant',
    esDemo: true,
    skills: {
      1: { nivel: 4.0, frecuencia: 'P', criticidad: 'I' },
    },
  },
  // ================= ADDED SCENARIOS =================
  // 3. "The Struggling Manager" (Roberto - MANY GAPS)
  {
    nombre: 'Roberto Problemas',
    rol: 'Engineering Director',
    esDemo: true,
    skills: {
      15: { nivel: 1.5, frecuencia: 'D', criticidad: 'C' }, // Critical Gap
      18: { nivel: 1.8, frecuencia: 'D', criticidad: 'C' }, // Critical Gap
      24: { nivel: 2.0, frecuencia: 'D', criticidad: 'C' }, // Critical Gap
      25: { nivel: 1.5, frecuencia: 'D', criticidad: 'C' }, // Critical Gap
      7: { nivel: 4.0, frecuencia: 'W', criticidad: 'I' },  // Good technical, bad manager
    },
  },
  // 4. "The Rising Star" (Sofia - IMPROVING)
  {
    nombre: 'Sofía Estrella',
    rol: 'Junior Developer',
    esDemo: true,
    skills: {
      9: { nivel: 4.0, frecuencia: 'D', criticidad: 'C' }, // Exceeds expectations
      10: { nivel: 4.2, frecuencia: 'D', criticidad: 'C' },
      40: { nivel: 4.5, frecuencia: 'D', criticidad: 'C' },
    },
  },
];

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  console.log('  Clearing existing data...');
  await prisma.assessment.deleteMany();
  await prisma.evaluationSession.deleteMany();
  await prisma.snapshot.deleteMany();
  await prisma.collaborator.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.category.deleteMany();

  // Seed Categories
  console.log('  Seeding categories...');
  for (const cat of CATEGORIES) {
    await prisma.category.create({ data: cat });
  }

  // Seed Skills
  console.log('  Seeding skills...');
  for (const skill of SKILLS) {
    await prisma.skill.create({ data: skill });
  }

  // Seed Collaborators and Assessments
  console.log('  Seeding collaborators and assessments...');
  let totalAssessments = 0;
  let totalSessions = 0;
  
  // Generate varied evaluation dates for demo purposes
  const getRandomPastDate = (daysAgo) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  };
  
  for (const collab of COLLABORATORS) {
    const { skills, ...collaboratorData } = collab;
    
    // Random evaluation date: between 5 and 90 days ago
    const daysAgo = Math.floor(Math.random() * 85) + 5;
    const evaluationDate = getRandomPastDate(daysAgo);
    
    const created = await prisma.collaborator.create({
      data: {
        ...collaboratorData,
        lastEvaluated: evaluationDate
      }
    });

    // Create an EvaluationSession for this collaborator (if they have skills)
    if (Object.keys(skills).length > 0) {
      const session = await prisma.evaluationSession.create({
        data: {
          collaboratorId: created.id,
          collaboratorNombre: created.nombre,
          collaboratorRol: created.rol,
          evaluatedBy: 'Admin (Demo)',
          notes: 'Evaluación inicial generada por seed',
          evaluatedAt: evaluationDate
        }
      });
      totalSessions++;

      // Create assessments for each skill, linked to the session
      for (const [skillId, data] of Object.entries(skills)) {
        await prisma.assessment.create({
          data: {
            collaboratorId: created.id,
            skillId: parseInt(skillId),
            nivel: data.nivel,
            criticidad: data.criticidad,
            frecuencia: data.frecuencia,
            snapshotId: null,
            evaluationSessionId: session.id,
            createdAt: evaluationDate
          }
        });
        totalAssessments++;
      }
    }
  }

  // Create historical evaluations for Time Travel
  console.log('  Adding historical evaluations...');
  
  // 1. Laura Torres: Previous evaluation as "Intern" (6 months ago)
  const lauraTorres = await prisma.collaborator.findFirst({ where: { nombre: 'Laura Torres' } });
  if (lauraTorres) {
    const oldDate1 = getRandomPastDate(180); // ~6 months ago
    const oldSession1 = await prisma.evaluationSession.create({
      data: {
        collaboratorId: lauraTorres.id,
        collaboratorNombre: 'Laura Torres',
        collaboratorRol: 'Intern', // Previous role
        evaluatedBy: 'HR Manager',
        notes: 'Evaluación de período de prueba',
        evaluatedAt: oldDate1
      }
    });
    totalSessions++;
    
    // Create some historical assessments with lower scores
    const internSkills = { 9: 1.5, 10: 1.8, 40: 2.0 };
    for (const [skillId, nivel] of Object.entries(internSkills)) {
      await prisma.assessment.create({
        data: {
          collaboratorId: lauraTorres.id,
          skillId: parseInt(skillId),
          nivel: nivel,
          criticidad: 'I',
          frecuencia: 'D',
          evaluationSessionId: oldSession1.id,
          createdAt: oldDate1
        }
      });
      totalAssessments++;
    }
    
    // Another historical one 3 months ago (still Intern but improving)
    const oldDate2 = getRandomPastDate(90);
    const oldSession2 = await prisma.evaluationSession.create({
      data: {
        collaboratorId: lauraTorres.id,
        collaboratorNombre: 'Laura Torres',
        collaboratorRol: 'Intern',
        evaluatedBy: 'Tech Lead',
        notes: 'Evaluación de progreso Q3',
        evaluatedAt: oldDate2
      }
    });
    totalSessions++;
    
    const improvingSkills = { 9: 2.0, 10: 2.2, 40: 2.5 };
    for (const [skillId, nivel] of Object.entries(improvingSkills)) {
      await prisma.assessment.create({
        data: {
          collaboratorId: lauraTorres.id,
          skillId: parseInt(skillId),
          nivel: nivel,
          criticidad: 'I',
          frecuencia: 'D',
          evaluationSessionId: oldSession2.id,
          createdAt: oldDate2
        }
      });
      totalAssessments++;
    }
  }

  // 2. Diana Prince: Previous evaluation as "Engineering Manager" (4 months ago)
  const dianaPrince = await prisma.collaborator.findFirst({ where: { nombre: 'Diana Prince' } });
  if (dianaPrince) {
    const oldDate = getRandomPastDate(120); // ~4 months ago
    const oldSession = await prisma.evaluationSession.create({
      data: {
        collaboratorId: dianaPrince.id,
        collaboratorNombre: 'Diana Prince',
        collaboratorRol: 'Engineering Manager', // Previous role before promotion
        evaluatedBy: 'CTO',
        notes: 'Evaluación pre-promoción',
        evaluatedAt: oldDate
      }
    });
    totalSessions++;
    
    // Lower leadership scores before promotion
    const managerSkills = { 15: 4.0, 18: 4.2, 24: 4.0, 25: 4.3 };
    for (const [skillId, nivel] of Object.entries(managerSkills)) {
      await prisma.assessment.create({
        data: {
          collaboratorId: dianaPrince.id,
          skillId: parseInt(skillId),
          nivel: nivel,
          criticidad: 'C',
          frecuencia: 'D',
          evaluationSessionId: oldSession.id,
          createdAt: oldDate
        }
      });
      totalAssessments++;
    }
  }
  
  // 3.1. Roberto (Struggling): Was better before? Or always bad?
  const roberto = await prisma.collaborator.findFirst({ where: { nombre: 'Roberto Problemas' } });
  if (roberto) {
    // 1 Year Ago (Q1 Previous Year)
    const date1y = new Date();
    date1y.setFullYear(date1y.getFullYear() - 1);
    date1y.setMonth(2); // March
    
    const sess1 = await prisma.evaluationSession.create({
      data: {
        collaboratorId: roberto.id,
        collaboratorNombre: 'Roberto Problemas',
        collaboratorRol: 'Engineering Director',
        evaluatedBy: 'CTO',
        notes: 'Evaluación Anual 2024 - Desempeño Aceptable',
        evaluatedAt: date1y
      }
    });
    totalSessions++;
    
    // Skills were better
    const decentSkills = { 15: 3.0, 18: 3.0, 24: 3.5, 25: 3.2 };
    for (const [skillId, nivel] of Object.entries(decentSkills)) {
      await prisma.assessment.create({
        data: {
          collaboratorId: roberto.id,
          skillId: parseInt(skillId),
          nivel: nivel,
          criticidad: 'C',
          frecuencia: 'D',
          evaluationSessionId: sess1.id,
          createdAt: date1y
        }
      });
      totalAssessments++;
    }
  }

  // 3.2. Sofía Estrella (Rising): Was a rookie 6 months ago (Level 2), now Expert (Level 4+)
  const sofia = await prisma.collaborator.findFirst({ where: { nombre: 'Sofía Estrella' } });
  if (sofia) {
    // 6 Months Ago (Previous Quarter roughly)
    const date6m = new Date();
    date6m.setMonth(date6m.getMonth() - 6);
    
    const sess2 = await prisma.evaluationSession.create({
      data: {
        collaboratorId: sofia.id,
        collaboratorNombre: 'Sofía Estrella',
        collaboratorRol: 'Junior Developer', // Same role
        evaluatedBy: 'Tech Lead',
        notes: 'Evaluación de Medio Año - Learning Phase',
        evaluatedAt: date6m
      }
    });
    totalSessions++;
    
    // Skills were lower
    const rookieSkills = { 9: 2.0, 10: 2.2, 40: 2.5 };
    for (const [skillId, nivel] of Object.entries(rookieSkills)) {
      await prisma.assessment.create({
        data: {
          collaboratorId: sofia.id,
          skillId: parseInt(skillId),
          nivel: nivel,
          criticidad: 'C',
          frecuencia: 'D',
          evaluationSessionId: sess2.id,
          createdAt: date6m
        }
      });
      totalAssessments++;
    }
  }

  // Create sample role profiles
  console.log('  Seeding role profiles...');
  const ROLE_PROFILES = [
    {
      rol: 'Product Manager',
      skills: JSON.stringify({
        "1": "C", "2": "C", "3": "C", "4": "C", "5": "I",  // Innovación & Diseño
        "15": "C", "16": "I", "17": "I", "18": "C",       // Liderazgo del Cambio
        "19": "C", "20": "I", "21": "I", "24": "C", "25": "C", // Negocio & Estrategia
        "26": "I", "27": "I", "28": "I"                    // Entrega & Portafolio
      })
    },
    {
      rol: 'Tech Lead',
      skills: JSON.stringify({
        "7": "C", "8": "C", "9": "C", "10": "I", "11": "C", "13": "I", "14": "I", // Desarrollo
        "15": "I", "16": "I", "17": "D",                    // Liderazgo
        "32": "I", "33": "C", "34": "I", "35": "C", "36": "I", "37": "C", "38": "D" // Tecnologías
      })
    },
    {
      rol: 'Junior Developer',
      skills: JSON.stringify({
        "9": "C", "10": "C", "11": "I", "14": "C", // Desarrollo
        "7": "D", "8": "D"                          // Cloud/Arch aspiracional
      })
    },
    {
      rol: 'UX Designer',
      skills: JSON.stringify({
        "1": "C", "2": "C", "4": "C", "5": "C", // Design skills
        "3": "I", "6": "D",                      // Innovación
        "18": "C", "16": "I"                     // Comunicación
      })
    },
    {
      rol: 'QA Engineer',
      skills: JSON.stringify({
        "14": "C",                                // Testing/QA
        "9": "I", "10": "I", "11": "I",          // Desarrollo
        "7": "D", "13": "I"                       // Cloud/Security
      })
    },
    // Case: Unused Profile (No collaborators have this role)
    {
      rol: 'Data Scientist',
      skills: JSON.stringify({
        "21": "C", "35": "C", "38": "I", // Data & AI
        "9": "I", "30": "I"
      })
    },
    // Intern profile (entry-level - mostly desirable/learning skills)
    {
      rol: 'Intern',
      skills: JSON.stringify({
        "9": "D", "10": "D", "14": "D",   // Desarrollo básico
        "40": "I",                        // Git
        "11": "D"                         // Coding standards
      })
    },
    // Case: Profiles that match actual collaborators
    {
      rol: 'Arquitecto Cloud',
      skills: JSON.stringify({
        "7": "C", "8": "C", "11": "C", "13": "C", "37": "C", // Cloud Infra
        "9": "I", "10": "D", "40": "C",                      // Dev
        "38": "I", "35": "I"                                   // AI/Emerging
      })
    },
    {
      rol: 'Consultora de Innovación',
      skills: JSON.stringify({
        "1": "C", "2": "C", "3": "C", "4": "C", "5": "C", // Innovación
        "15": "C", "16": "C", "17": "I", "18": "C",       // Liderazgo
        "19": "I", "21": "I", "24": "C", "31": "I"         // Negocio/Entrega
      })
    },
    {
      rol: 'Líder de Plataforma',
      skills: JSON.stringify({
        "7": "C", "8": "C", "11": "C", "13": "I", "37": "I", // Plataforma
        "9": "I", "29": "C", "32": "I", "33": "C", "34": "I", // Entrega
        "40": "C"                                              // Git
      })
    },
    {
      rol: 'Engineering Director',
      skills: JSON.stringify({
        "15": "C", "16": "I", "17": "I", "18": "C",       // Liderazgo
        "24": "C", "25": "C", "30": "C", "31": "C",       // Estrategia
        "7": "D", "8": "I"                                  // Tech awareness
      })
    }
  ];

  for (const profile of ROLE_PROFILES) {
    await prisma.roleProfile.upsert({
      where: { rol: profile.rol },
      update: { skills: profile.skills },
      create: profile
    });
  }

  console.log('✅ Seed completed!');
  console.log(`   - ${CATEGORIES.length} categories`);
  console.log(`   - ${SKILLS.length} skills`);
  console.log(`   - ${COLLABORATORS.length} collaborators`);
  console.log(`   - ${totalAssessments} assessments`);
  console.log(`   - ${ROLE_PROFILES.length} role profiles`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
