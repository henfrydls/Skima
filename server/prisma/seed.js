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
  { id: 4, nombre: 'Negocio & Estrategia', abrev: 'Negocio' },
  { id: 5, nombre: 'Entrega & Portafolio', abrev: 'Entrega' },
  { id: 6, nombre: 'Tecnologías Emergentes', abrev: 'Emergentes' },
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
];

// Demo Collaborators with full skill assessments
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
];

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  console.log('  Clearing existing data...');
  await prisma.assessment.deleteMany();
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
  
  for (const collab of COLLABORATORS) {
    const { skills, ...collaboratorData } = collab;
    
    const created = await prisma.collaborator.create({
      data: collaboratorData
    });

    // Create assessments for each skill
    for (const [skillId, data] of Object.entries(skills)) {
      await prisma.assessment.create({
        data: {
          collaboratorId: created.id,
          skillId: parseInt(skillId),
          nivel: data.nivel,
          criticidad: data.criticidad,
          frecuencia: data.frecuencia,
          snapshotId: null
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
