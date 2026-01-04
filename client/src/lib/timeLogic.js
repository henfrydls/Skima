import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, eachMonthOfInterval, format, isBefore, isAfter, isEqual, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * timeLogic.js
 * 
 * Core engine for "Time Travel" functionality.
 * Allows reconstructing the state of the team at any point in the past
 * without server-side snapshots.
 */

/**
 * Validates if a date is valid and not in the distant future (e.g. > current year + 1)
 */
const isValidDate = (date) => {
  if (!isValid(date)) return false;
  const nextYear = new Date().getFullYear() + 1;
  return date.getFullYear() <= nextYear; // Basic sanity check against 2050 dates
};

/**
 * Generates available time periods (Year, Quarter, Month) based on data history
 * with intelligent grouping.
 * 
 * @param {Array} collaborators - Full list of collaborators with evaluationSessions
 * @returns {Array} List of period objects { id, label, type, startDate, endDate }
 */
export const generateTimePeriods = (collaborators = []) => {
  // 1. Collect all valid assessment dates
  const dates = [];
  collaborators.forEach(c => {
    if (c.evaluationSessions && Array.isArray(c.evaluationSessions)) {
      c.evaluationSessions.forEach(s => {
        const d = new Date(s.evaluatedAt);
        if (isValidDate(d)) {
          dates.push(d);
        }
      });
    }
  });

  if (dates.length === 0) return [];

  // Sort dates to find range
  dates.sort((a, b) => a - b);
  const earliestDate = dates[0];
  const now = new Date();

  const periods = [];
  
  // Helper to add period if it has data or is recent
  const addPeriod = (period) => {
    // Optional: Check if period actually has data before adding? 
    // For now, we generate continuous ranges to avoid gaps.
    periods.push(period);
  };

  // 2. Generate Years (From earliest to current)
  const currentYear = now.getFullYear();
  const startYearNum = earliestDate.getFullYear();
  
  for (let y = currentYear; y >= startYearNum; y--) {
    addPeriod({
      id: `Y-${y}`,
      label: `Año ${y}`,
      type: 'year',
      startDate: startOfYear(new Date(y, 0, 1)),
      endDate: endOfYear(new Date(y, 0, 1))
    });
  }

  // 3. Generate Quarters (Look back 2 years max)
  const quartersBack = 8; 
  let qDate = startOfQuarter(now);
  
  for (let i = 0; i < quartersBack; i++) {
    if (qDate < earliestDate && i > 0) break;
    
    // Format: "Q1 2025"
    const qNum = Math.floor(qDate.getMonth() / 3) + 1;
    const year = qDate.getFullYear();
    const qLabel = `Q${qNum} ${year}`;
    
    addPeriod({
      id: `Q-${year}-${qNum}`,
      label: qLabel,
      type: 'quarter',
      startDate: startOfQuarter(qDate),
      endDate: endOfQuarter(qDate)
    });
    
    // Move back 3 months
    qDate = new Date(qDate.setMonth(qDate.getMonth() - 3)); 
  }

  // 4. Generate Months (Look back 18 months max)
  const monthsBack = 18;
  let mDate = startOfMonth(now);
  
  for (let i = 0; i < monthsBack; i++) {
    if (mDate < earliestDate && i > 0) break;
    
    // Format: "Enero 2025"
    const mLabel = format(mDate, 'MMMM yyyy', { locale: es });
    
    addPeriod({
      id: `M-${format(mDate, 'yyyy-MM')}`,
      label: mLabel.charAt(0).toUpperCase() + mLabel.slice(1), // Capitalize first letter
      type: 'month',
      startDate: startOfMonth(mDate),
      endDate: endOfMonth(mDate)
    });
    
    // Move back 1 month
    mDate = new Date(mDate.setMonth(mDate.getMonth() - 1));
  }

  return periods;
};

/**
 * Reconstructs the state of collaborators at a specific point in time (snapshotDate).
 * Uses "Last Known Value" logic: checking assessments <= snapshotDate.
 * 
 * @param {Array} collaborators - Full list of collaborators with evaluationSessions
 * @param {Date|string} snapshotDate - The cut-off date for the snapshot (end of a period)
 * @returns {Array} Array of collaborators with 'skills' and properties mapped to that point in time
 */
export const getSnapshotData = (collaborators, snapshotDate) => {
  if (!snapshotDate) return collaborators; // Live view
  
  const dateLimit = new Date(snapshotDate); 

  return collaborators.map(collab => {
    // 1. Filter sessions that happened BEFORE or ON the snapshot date
    // AND filter out future dating errors relative to NOW (Sanity check)
    const relevantSessions = (collab.evaluationSessions || [])
      .filter(session => {
        const d = new Date(session.evaluatedAt);
        return d <= dateLimit && isValidDate(d);
      })
      .sort((a, b) => new Date(b.evaluatedAt) - new Date(a.evaluatedAt)); // Newest first

    // If no sessions before this date, this collaborator "didn't exist" or hasn't been evaluated
    if (relevantSessions.length === 0) {
      return {
        ...collab,
        skills: {}, // No skills at this time
        promedio: 0,
        lastEvaluated: null,
        isSnapshot: true,
        isActive: false // Treat as inactive for calculations if no data
      };
    }

    // 2. Reconstruct Skills State (Last Known Value)
    // We assume the LATEST session captured the state of the employee at that time.
    // Ideally, if a session only evaluated Skill A, we should keep Skill B from previous session.
    // For robust "Last Known Value", we iterate backwards.
    
    const reconstructedSkills = {};
    const skillTimestamps = {}; // To track freshness if needed
    
    // Iterate from OLDEST to NEWEST to apply updates sequentially
    const ascendingSessions = [...relevantSessions].reverse();
    
    ascendingSessions.forEach(session => {
        if (session.assessments) {
            session.assessments.forEach(ass => {
                reconstructedSkills[ass.skillId] = {
                    ...ass,
                    evaluatedAt: session.evaluatedAt
                };
                skillTimestamps[ass.skillId] = session.evaluatedAt;
            });
        }
    });

    // 3. Calculate Average for this snapshot
    const skillValues = Object.values(reconstructedSkills).map(s => s.nivel);
    const avg = skillValues.length > 0 
      ? skillValues.reduce((a, b) => a + b, 0) / skillValues.length
      : 0;
      
    // Determine the "Effective Date" of this snapshot state (freshness)
    const latestUpdate = relevantSessions[0].evaluatedAt;

    return {
      ...collab,
      skills: reconstructedSkills,
      promedio: avg,
      lastEvaluated: latestUpdate, 
      isSnapshot: true,
      // If the latest data is OLDER than 1 year relative to snapshot date, maybe flag it?
      // isStale: (dateLimit - new Date(latestUpdate)) > ONE_YEAR_MS
    };
  });
};
