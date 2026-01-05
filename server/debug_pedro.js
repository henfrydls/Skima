
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

function log(msg) {
  fs.appendFileSync('debug_output.txt', msg + '\n');
}

async function debugPedro() {
  fs.writeFileSync('debug_output.txt', ''); // Clear file
  
  const pedro = await prisma.collaborator.findFirst({
    where: { nombre: { contains: 'Pedro Rosario' } },
    include: {
      evaluationSessions: {
        orderBy: { evaluatedAt: 'desc' },
        include: {
          assessments: true
        }
      },
      assessments: {
        where: { snapshotId: null }
      }
    }
  });

  if (!pedro) {
    log('Pedro not found');
    return;
  }

  log(`Pedro Found: ${pedro.nombre} (${pedro.rol})`);
  
  // Role Profile
  const profileParams = await prisma.roleProfile.findFirst({
    where: { rol: pedro.rol }
  });
  
  let profile = {};
  if (profileParams) {
    profile = typeof profileParams.skills === 'string' ? JSON.parse(profileParams.skills) : profileParams.skills;
  }
  log('Role Profile Loaded.');

  // Latest Session
  const latestSession = pedro.evaluationSessions[0];
  log(`Latest Session Date: ${latestSession?.evaluatedAt}`);

  // Stale Assessments (col.assessments)
  log(`Stale Assessments Count: ${pedro.assessments.length}`);

  // Calculate Average using Latest Session
  if (latestSession) {
    log('--- Calculation using Latest Session ---');
    let total = 0;
    let count = 0;
    
    latestSession.assessments.forEach(a => {
      const crit = profile[String(a.skillId)] || 'N';
      if (crit !== 'N' && a.nivel > 0) {
        log(`Skill ${a.skillId}: Nivel ${a.nivel} (Crit: ${crit}) -> INCLUDED`);
        total += a.nivel;
        count++;
      } else {
         // log(`Skill ${a.skillId}: Excluded`);
      }
    });
    
    const avg = count > 0 ? total / count : 0;
    log(`Calculated Average (Smart): ${avg.toFixed(2)} based on ${count} skills.`);
  }

  // Calculate Average using Stale Assessments
  log('--- Calculation using Stale Assessments ---');
  let staleTotal = 0;
  let staleCount = 0;
  pedro.assessments.forEach(a => {
    const crit = profile[String(a.skillId)] || 'N';
    if (crit !== 'N' && a.nivel > 0) {
        staleTotal += a.nivel;
        staleCount++;
    }
  });
  const staleAvg = staleCount > 0 ? staleTotal / staleCount : 0;
  log(`Calculated Average (Stale): ${staleAvg.toFixed(2)} based on ${staleCount} skills.`);

}

debugPedro()
  .catch(e => log(String(e)))
  .finally(async () => await prisma.$disconnect());
