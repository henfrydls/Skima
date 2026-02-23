import express from 'express';
import { prisma } from '../db.js';

const router = express.Router();

// ============================================
// UTILITIES
// ============================================

/**
 * Calculate date range based on range parameter
 * @param {string} range - '6m', '12m', '24m', 'ytd', 'all'
 * @returns {{ startDate: Date, endDate: Date, label: string }}
 */
function getDateRange(range) {
  const now = new Date();
  let startDate;
  let label;
  
  switch (range) {
    case '6m':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 6);
      label = 'Últimos 6 meses';
      break;
    case '12m':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 12);
      label = 'Últimos 12 meses';
      break;
    case '24m':
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 24);
      label = 'Últimos 24 meses';
      break;
    case 'ytd':
      startDate = new Date(now.getFullYear(), 0, 1);
      label = 'Año actual (YTD)';
      break;
    case 'all':
    default:
      startDate = new Date('2000-01-01');
      label = 'Todo el historial';
      break;
  }
  
  return { startDate, endDate: now, label };
}

/**
 * Fill empty months with carry-over values
 * @param {Array} data - Monthly aggregated data
 * @param {Date} startDate
 * @param {Date} endDate
 */
function fillEmptyMonths(data, startDate, endDate) {
  const result = [];
  const dataMap = new Map();
  
  // Index existing data by month key
  data.forEach(d => {
    const key = d.date.toISOString().slice(0, 7); // YYYY-MM
    dataMap.set(key, d);
  });
  
  // Iterate through all months in range
  const current = new Date(startDate);
  current.setDate(1); // Start at first of month
  let lastValue = null;
  
  while (current <= endDate) {
    const key = current.toISOString().slice(0, 7);
    
    if (dataMap.has(key)) {
      const entry = dataMap.get(key);
      lastValue = entry.avgScore;
      result.push(entry);
    } else if (lastValue !== null) {
      // Carry-over previous value
      result.push({
        date: new Date(current),
        avgScore: lastValue,
        count: 0,
        newHires: [],
        isCarryOver: true
      });
    }
    
    // Next month
    current.setMonth(current.getMonth() + 1);
  }
  
  return result;
}

// ============================================
// THRESHOLDS (Sync with frontend skillsLogic.js)
// ============================================
const SKILL_THRESHOLDS = {
  COMPETENT: 2.5,
  STRENGTH: 3.5,
  GOAL: 4.0
};

function getStatus(score) {
  if (score >= SKILL_THRESHOLDS.STRENGTH) return 'strength';
  if (score >= SKILL_THRESHOLDS.COMPETENT) return 'competent';
  return 'attention';
}

// ============================================
// MAIN ENDPOINT
// ============================================

/**
 * GET /api/skills/evolution
 * 
 * Query params:
 *   - range: '6m' | '12m' | '24m' | 'ytd' | 'all' (default: '12m')
 *   - startDate: ISO date (overrides range)
 *   - endDate: ISO date (overrides range)
 */
router.get('/', async (req, res) => {
  try {
    const { range = '12m', startDate: startDateParam, endDate: endDateParam } = req.query;
    
    // Determine date range
    let startDate, endDate, label;
    
    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
      label = 'Rango personalizado';
    } else {
      const dateRange = getDateRange(range);
      startDate = dateRange.startDate;
      endDate = dateRange.endDate;
      label = dateRange.label;
    }
    
    // ============================================
    // STEP 1: Get all evaluation sessions in range
    // ============================================
    const sessions = await prisma.evaluationSession.findMany({
      where: {
        evaluatedAt: { gte: startDate, lte: endDate }
      },
      include: {
        collaborator: true,
        assessments: {
          include: {
            skill: {
              include: { categoria: true }
            }
          }
        }
      },
      orderBy: { evaluatedAt: 'asc' }
    });
    
    // ============================================
    // STEP 1.5: Get Role Profiles for Smart Averaging
    // ============================================
    const roleProfilesResult = await prisma.roleProfile.findMany();
    const profileMap = new Map();
    roleProfilesResult.forEach(p => {
      try {
        const skillsObj = typeof p.skills === 'string' ? JSON.parse(p.skills) : p.skills;
        profileMap.set(p.rol, skillsObj);
      } catch (e) {
        console.error('Error parsing role profile skills:', e);
      }
    });

    // ============================================
    // STEP 2: Calculate first/last scores per employee
    // ============================================
    const byCollaborator = {};
    const byMonth = {};
    
    sessions.forEach(session => {
      const cId = session.collaboratorId;
      const cName = session.collaborator.nombre;
      const cRole = session.collaboratorRol || session.collaborator.rol;
      const joinedAt = session.collaborator.joinedAt;
      const isActive = session.collaborator.isActive;
      
      // Get role profile for filtering
      const roleSkills = profileMap.get(cRole);

      // Calculate average score for this session (Smart Filter)
      const validAssessments = session.assessments.filter(a => {
        // Base valid check
        if (!a.nivel || a.nivel <= 0) return false;

        // Inactive Skill Check
        if (a.skill && !a.skill.isActive) return false;
        
        // Role Profile check (if exists)
        if (roleSkills) {
          const skillIdStr = a.skillId.toString();
          // If skill is in profile, check criticality
          // If not in profile, decided policy: Include or Exclude?
          // Usually if profile exists, we respect it strictly. 
          // Assuming profile contains ALL relevant skills. If not in profile -> 'N'.
          // Let's use flexible check: If defined as 'N', exclude.
          const criticality = roleSkills[skillIdStr] || 'N'; 
          return criticality !== 'N';
        }
        
        return true; 
      });

      if (validAssessments.length === 0) return;
      
      const avgScore = validAssessments.reduce((a, b) => a + b.nivel, 0) / validAssessments.length;
      const roundedScore = Math.round(avgScore * 10) / 10;
      
      // Track by collaborator
      if (!byCollaborator[cId]) {
        byCollaborator[cId] = {
          id: cId,
          name: cName,
          role: cRole,
          joinedAt,
          isActive,
          first: { score: roundedScore, date: session.evaluatedAt },
          last: { score: roundedScore, date: session.evaluatedAt },
          sparkline: [],
          evaluationCount: 0
        };
      }
      
      byCollaborator[cId].last = { score: roundedScore, date: session.evaluatedAt };
      byCollaborator[cId].sparkline.push(roundedScore);
      byCollaborator[cId].evaluationCount++;
      
      // Track by month for chart
      const monthKey = session.evaluatedAt.toISOString().slice(0, 7);
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = {
          date: new Date(session.evaluatedAt.getFullYear(), session.evaluatedAt.getMonth(), 15),
          scores: [],
          collaboratorIds: new Set(),
          newHires: []
        };
      }
      byMonth[monthKey].scores.push(roundedScore);
      byMonth[monthKey].collaboratorIds.add(cId);
    });
    
    // ============================================
    // STEP 3: Detect new hires - will be applied after filling months
    // ============================================
    const allCollaborators = await prisma.collaborator.findMany({
      where: { isActive: true }
    });
    
    // Store new hires for later application to chartData
    const newHiresByMonth = {};
    allCollaborators.forEach(collab => {
      if (collab.joinedAt >= startDate && collab.joinedAt <= endDate) {
        const monthKey = collab.joinedAt.toISOString().slice(0, 7);
        if (!newHiresByMonth[monthKey]) {
          newHiresByMonth[monthKey] = [];
        }
        newHiresByMonth[monthKey].push(collab.nombre);
      }
    });
    
    // ============================================
    // STEP 4: Build chartData with filled months
    // ============================================
    const chartDataRaw = Object.values(byMonth).map(m => ({
      date: m.date,
      avgScore: m.scores.length > 0 ? Math.round((m.scores.reduce((a, b) => a + b, 0) / m.scores.length) * 10) / 10 : 0,
      count: m.collaboratorIds.size,
      newHires: [] // Will be filled from newHiresByMonth
    })).sort((a, b) => a.date - b.date);
    
    const chartData = fillEmptyMonths(chartDataRaw, startDate, endDate);
    
    // Format dates as ISO for frontend and apply newHires from all collaborators
    const formattedChartData = chartData.map(d => {
      const monthKey = d.date.toISOString().slice(0, 7);
      const hires = newHiresByMonth[monthKey] || [];
      
      return {
        date: d.date.toISOString().slice(0, 10),
        avgScore: d.avgScore,
        count: d.count,
        newHires: hires,
        isCarryOver: d.isCarryOver || false
      };
    });
    
    // ============================================
    // STEP 5: Build employees array
    // ============================================
    const employees = Object.values(byCollaborator)
      .filter(c => c.isActive)
      .map(c => {
        const growth = Math.round((c.last.score - c.first.score) * 10) / 10;
        const isRealNewHire = c.joinedAt >= startDate;
        const insufficientData = c.evaluationCount < 2 && !isRealNewHire;
        
        return {
          id: c.id,
          name: c.name,
          role: c.role,
          currentScore: c.last.score,
          startScore: c.first.score,
          growth,
          growthTrend: growth > 0.1 ? 'up' : growth < -0.1 ? 'down' : 'stable',
          isNewHire: isRealNewHire,
          insufficientData,
          joinedAt: c.joinedAt?.toISOString().slice(0, 10) || null,
          lastEvaluatedAt: c.last.date.toISOString().slice(0, 10),
          sparkline: c.sparkline,
          status: getStatus(c.last.score)
        };
      })
      .sort((a, b) => b.growth - a.growth); // Sort by growth descending
    
    // ============================================
    // STEP 6: Calculate meta & insights
    // ============================================
    // Use chart's last data point so KPI matches the visible chart endpoint
    const lastChartPoint = formattedChartData.length > 0
      ? formattedChartData[formattedChartData.length - 1]
      : null;
    const currentMaturityIndex = lastChartPoint ? lastChartPoint.avgScore : null;
    
    // Period delta: compare first and last chart points
    const periodDelta = formattedChartData.length >= 2
      ? Math.round((formattedChartData[formattedChartData.length - 1].avgScore - formattedChartData[0].avgScore) * 10) / 10
      : 0;
    
    // Top improver
    const topImprover = employees.find(e => !e.isNewHire && !e.insufficientData && e.growth > 0) || null;
    
    // ============================================
    // STEP 7: Calculate support cases based on critical skill gaps
    // ============================================
    // ============================================
    // STEP 7: Calculate support cases based on critical skill gaps
    // ============================================
    // Using pre-fetched profileMap from Step 1.5
    
    // For each employee, check their latest assessments against role profile
    const supportCases = [];
    
    for (const emp of employees) {
      const roleSkills = profileMap.get(emp.role);
      if (!roleSkills) continue; // No profile = no gaps to calculate
      
      // Get latest session for this employee
      const latestSession = await prisma.evaluationSession.findFirst({
        where: { 
          collaboratorId: emp.id,
          evaluatedAt: { gte: startDate, lte: endDate }
        },
        orderBy: { evaluatedAt: 'desc' },
        include: { assessments: true }
      });
      
      if (!latestSession) continue;
      
      // Create skill level map from assessments
      const skillLevels = new Map();
      latestSession.assessments.forEach(a => {
        skillLevels.set(a.skillId.toString(), a.nivel);
      });
      
      // Count critical gaps: skill marked as Critical (C) with nivel < 2.5
      let criticalGaps = 0;
      const gapSkills = [];
      
      for (const [skillId, criticality] of Object.entries(roleSkills)) {
        if (criticality === 'C') {
          const nivel = skillLevels.get(skillId) ?? 0;
          if (nivel < SKILL_THRESHOLDS.COMPETENT) {
            criticalGaps++;
            gapSkills.push(skillId);
          }
        }
      }
      
      if (criticalGaps > 0) {
        supportCases.push({
          id: emp.id,
          name: emp.name,
          role: emp.role,
          criticalGaps,
          currentScore: emp.currentScore
        });
      }
    }
    
    // Sort by number of critical gaps descending
    supportCases.sort((a, b) => b.criticalGaps - a.criticalGaps);
    
    // ============================================
    // RESPONSE
    // ============================================
    res.json({
      meta: {
        currentMaturityIndex,
        periodDelta,
        timeRangeLabel: label,
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
        totalEmployees: employees.length
      },
      chartData: formattedChartData,
      employees,
      insights: {
        topImprover: topImprover ? {
          id: topImprover.id,
          name: topImprover.name,
          growth: topImprover.growth
        } : null,
        supportCases,
        supportCount: supportCases.length
      }
    });
    
  } catch (error) {
    console.error('[API] GET /api/skills/evolution failed:', error);
    res.status(500).json({ message: 'Error fetching evolution data', error: error.message });
  }
});

export default router;
