import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Categories one by one (SQLite doesn't support createMany with explicit IDs well)
  const categoriesData = [
    { nombre: 'Innovación & Diseño', abrev: 'Innovación' },
    { nombre: 'Desarrollo & Plataforma Técnica', abrev: 'Desarrollo' },
    { nombre: 'Liderazgo del Cambio', abrev: 'Cambio' },
    { nombre: 'Negocio & Estrategia', abrev: 'Negocio' },
    { nombre: 'Entrega & Portafolio', abrev: 'Entrega' },
    { nombre: 'Tecnologías Emergentes', abrev: 'Emergentes' }
  ];

  for (const cat of categoriesData) {
    await prisma.category.create({ data: cat });
  }
  console.log(`✅ Created ${categoriesData.length} categories`);

  // Create Skills
  const skillsData = [
    { categoriaId: 1, nombre: 'Design Thinking' },
    { categoriaId: 1, nombre: 'Service Design' },
    { categoriaId: 1, nombre: 'Lean Startup / Experimentación ágil' },
    { categoriaId: 1, nombre: 'User Research & Human-Centered Design' },
    { categoriaId: 1, nombre: 'Customer Journey Mapping' },
    { categoriaId: 1, nombre: 'Stage-Gate Methodology' },
    { categoriaId: 2, nombre: 'Cloud Infrastructure & DevOps (AWS/Azure)' },
    { categoriaId: 2, nombre: 'Arquitectura de Sistemas y Software' },
    { categoriaId: 2, nombre: 'Desarrollo Backend (Django, APIs REST)' },
    { categoriaId: 2, nombre: 'Desarrollo Frontend (HTMX, JS, frameworks)' },
    { categoriaId: 2, nombre: 'Integración de Sistemas y APIs' },
    { categoriaId: 2, nombre: 'Low-code/No-code (Power Platform, n8n)' },
    { categoriaId: 2, nombre: 'Ciberseguridad & Secure Development' },
    { categoriaId: 2, nombre: 'Testing/QA & Validación de Usabilidad' },
    { categoriaId: 3, nombre: 'Change Management organizacional' },
    { categoriaId: 3, nombre: 'Workshop Facilitation' },
    { categoriaId: 3, nombre: 'Training Design & Delivery' },
    { categoriaId: 3, nombre: 'Storytelling & Strategic Communication' },
    { categoriaId: 4, nombre: 'Business Case Development' },
    { categoriaId: 4, nombre: 'Financial Modeling, ROI & Innovation Metrics' },
    { categoriaId: 4, nombre: 'Data Analytics & Visualization' },
    { categoriaId: 4, nombre: 'Risk Assessment & Mitigation' },
    { categoriaId: 4, nombre: 'Market Research & Competitive Analysis' },
    { categoriaId: 4, nombre: 'Strategic Planning & Roadmapping' },
    { categoriaId: 4, nombre: 'Reportería & Executive Communication' },
    { categoriaId: 4, nombre: 'Documentación de Procesos y Sistemas' },
    { categoriaId: 4, nombre: 'Propiedad Intelectual & Gestión de Patentes' },
    { categoriaId: 4, nombre: 'Gestión Financiera & Presupuestos (P&L)' },
    { categoriaId: 5, nombre: 'Agile/Scrum & Iterative Development' },
    { categoriaId: 5, nombre: 'Portfolio Management & Prioritization' },
    { categoriaId: 5, nombre: 'Stakeholder Management & Alignment' },
    { categoriaId: 5, nombre: 'Process Automation & Optimization' },
    { categoriaId: 5, nombre: 'Project Management (PMI/Híbrido)' },
    { categoriaId: 5, nombre: 'Product Management & Lifecycle' },
    { categoriaId: 6, nombre: 'AI Fundamentals & Prompt Engineering' },
    { categoriaId: 2, nombre: 'UX/UI Design & Prototyping' },
    { categoriaId: 2, nombre: 'Observabilidad & Confiabilidad (SRE-lite)' },
    { categoriaId: 6, nombre: 'AI Agents & Autonomous Workflows' },
    { categoriaId: 6, nombre: 'IoT & Edge Computing' },
    { categoriaId: 2, nombre: 'Control de versiones (Git, Github)' }
  ];

  const createdSkills = [];
  for (const skill of skillsData) {
    const created = await prisma.skill.create({ data: skill });
    createdSkills.push(created);
  }
  console.log(`✅ Created ${createdSkills.length} skills`);

  // Create Demo Collaborator
  const demoCollaborator = await prisma.collaborator.create({
    data: {
      nombre: 'Demo User',
      rol: 'Product Manager',
      esDemo: true
    }
  });
  console.log(`✅ Created demo collaborator: ${demoCollaborator.nombre}`);

  // Create sample assessments for demo user (first 10 skills)
  for (let i = 0; i < Math.min(10, createdSkills.length); i++) {
    await prisma.assessment.create({
      data: {
        collaboratorId: demoCollaborator.id,
        skillId: createdSkills[i].id,
        nivel: Math.floor(Math.random() * 4) + 1,
        criticidad: ['C', 'I', 'D', 'N'][Math.floor(Math.random() * 4)],
        frecuencia: ['D', 'S', 'M', 'T', 'N'][Math.floor(Math.random() * 5)],
        snapshotId: null
      }
    });
  }
  console.log('✅ Created 10 sample assessments');

  console.log('🎉 Seeding complete!');
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
