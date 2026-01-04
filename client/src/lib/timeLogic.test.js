import { describe, it, expect } from 'vitest';
import { generateTimePeriods, getSnapshotData, findBestMatchingPeriod } from './timeLogic';
import { startOfYear, endOfYear, startOfQuarter, endOfQuarter, startOfMonth, endOfMonth } from 'date-fns';

describe('timeLogic', () => {
    describe('findBestMatchingPeriod', () => {
        // Mock Periods
        const PERIODS = [
            // Years
            { id: 'Y-2025', type: 'year', startDate: new Date(2025, 0, 1), endDate: new Date(2025, 11, 31) },
            { id: 'Y-2024', type: 'year', startDate: new Date(2024, 0, 1), endDate: new Date(2024, 11, 31) },
            // Quarters 2025
            { id: 'Q-2025-4', type: 'quarter', startDate: new Date(2025, 9, 1), endDate: new Date(2025, 11, 31) },
            { id: 'Q-2025-3', type: 'quarter', startDate: new Date(2025, 6, 1), endDate: new Date(2025, 8, 30) },
            // Months 2025
            { id: 'M-2025-12', type: 'month', startDate: new Date(2025, 11, 1), endDate: new Date(2025, 11, 31) },
            { id: 'M-2025-09', type: 'month', startDate: new Date(2025, 8, 1), endDate: new Date(2025, 8, 30) },
        ];

        it('should maintain Live view (null -> null)', () => {
            expect(findBestMatchingPeriod(null, 'month', PERIODS)).toBe(null);
        });

        it('should Drill Down: Year -> Quarter (Latest inside)', () => {
            // Context: Year 2025 (Ends Dec 31)
            // Target: Quarter
            // Expect: Q4 2025 (Ends Dec 31)
            expect(findBestMatchingPeriod('Y-2025', 'quarter', PERIODS)).toBe('Q-2025-4');
        });

        it('should Drill Down: Year -> Month (Latest inside)', () => {
            // Context: Year 2025 (Ends Dec 31)
            // Target: Month
            // Expect: Dec 2025 (Ends Dec 31)
            expect(findBestMatchingPeriod('Y-2025', 'month', PERIODS)).toBe('M-2025-12');
        });

        it('should Drill Up: Month -> Year (Containment)', () => {
            // Context: Sep 2025
            // Target: Year
            // Expect: Year 2025 (Contains Sep)
            expect(findBestMatchingPeriod('M-2025-09', 'year', PERIODS)).toBe('Y-2025');
        });

        it('should Drill Up: Quarter -> Year (Containment)', () => {
            // Context: Q3 2025 (Ends Sep)
            // Target: Year
            // Expect: Year 2025
            expect(findBestMatchingPeriod('Q-2025-3', 'year', PERIODS)).toBe('Y-2025');
        });

        it('should switch same granularity', () => {
            // Context: Q3 2025
            // Target: Quarter
            // Expect: Q3 2025 (Self or closest before... logic will find self via endDate <= endDate)
            // Wait, endDate <= endDate finds Q4 (Date > Q3).
            // Logic sort is DESC.
            // Q4 > Q3.
            // Q4 End (Dec) > Q3 End (Sep)? Yes.
            // Q3 End <= Q3 End? Yes.
            // So it actually jumps to latest available if self is not available?
            // Containment: Q3 <= Q3 && Q3 >= Q3. Yes.
            // So Containment logic handles same granularity/self.
             expect(findBestMatchingPeriod('Q-2025-3', 'quarter', PERIODS)).toBe('Q-2025-3');
        });
    });
});
