import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    findBestMatchingPeriod,
    generateTimePeriods,
    getSnapshotData,
    getPreviousPeriodDate
} from './timeLogic';

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

        it('should return null if current period not found', () => {
            expect(findBestMatchingPeriod('INVALID-ID', 'month', PERIODS)).toBe(null);
        });

        it('should return latest available if no exact match', () => {
            // Context: Year 2024 (Ends Dec 31)
            // Target: Quarter
            // Expect: Q4 2025 (Latest available) since no quarters exist in 2024
            expect(findBestMatchingPeriod('Y-2024', 'quarter', PERIODS)).toBe('Q-2025-4');
        });
    });

    describe('generateTimePeriods', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            // Set current date to Jan 15, 2025
            vi.setSystemTime(new Date(2025, 0, 15));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should return empty array for empty collaborators', () => {
            expect(generateTimePeriods([])).toEqual([]);
        });

        it('should return empty array for collaborators with no evaluation sessions', () => {
            const collaborators = [
                { id: 1, name: 'Alice' },
                { id: 2, name: 'Bob', evaluationSessions: [] }
            ];
            expect(generateTimePeriods(collaborators)).toEqual([]);
        });

        it('should generate periods from evaluation dates', () => {
            const collaborators = [
                {
                    id: 1,
                    name: 'Alice',
                    evaluationSessions: [
                        { evaluatedAt: '2024-06-15', assessments: [] }
                    ]
                }
            ];

            const periods = generateTimePeriods(collaborators);

            // Should have years, quarters, and months
            expect(periods.length).toBeGreaterThan(0);

            // Check for year periods
            const years = periods.filter(p => p.type === 'year');
            expect(years.length).toBeGreaterThan(0);
            expect(years.some(p => p.id === 'Y-2025')).toBe(true);
            expect(years.some(p => p.id === 'Y-2024')).toBe(true);

            // Check for quarter periods
            const quarters = periods.filter(p => p.type === 'quarter');
            expect(quarters.length).toBeGreaterThan(0);

            // Check for month periods
            const months = periods.filter(p => p.type === 'month');
            expect(months.length).toBeGreaterThan(0);
        });

        it('should filter out invalid dates', () => {
            const collaborators = [
                {
                    id: 1,
                    name: 'Alice',
                    evaluationSessions: [
                        { evaluatedAt: 'invalid-date', assessments: [] },
                        { evaluatedAt: '2024-06-15', assessments: [] }
                    ]
                }
            ];

            const periods = generateTimePeriods(collaborators);
            expect(periods.length).toBeGreaterThan(0);
        });

        it('should filter out future dates beyond next year', () => {
            const collaborators = [
                {
                    id: 1,
                    name: 'Alice',
                    evaluationSessions: [
                        { evaluatedAt: '2050-06-15', assessments: [] },
                        { evaluatedAt: '2024-06-15', assessments: [] }
                    ]
                }
            ];

            const periods = generateTimePeriods(collaborators);
            // Should still generate periods based on 2024 date
            expect(periods.length).toBeGreaterThan(0);
        });

        it('should include current year in generated periods', () => {
            const collaborators = [
                {
                    id: 1,
                    name: 'Alice',
                    evaluationSessions: [
                        { evaluatedAt: '2025-01-10', assessments: [] }
                    ]
                }
            ];

            const periods = generateTimePeriods(collaborators);
            const years = periods.filter(p => p.type === 'year');
            expect(years.some(p => p.id === 'Y-2025')).toBe(true);
        });

        it('should generate period labels correctly', () => {
            const collaborators = [
                {
                    id: 1,
                    name: 'Alice',
                    evaluationSessions: [
                        { evaluatedAt: '2024-06-15', assessments: [] }
                    ]
                }
            ];

            const periods = generateTimePeriods(collaborators);

            // Check year label format
            const year2025 = periods.find(p => p.id === 'Y-2025');
            expect(year2025).toBeDefined();
            expect(year2025.label).toBe('Año 2025');

            // Check quarter label format (Q pattern)
            const quarters = periods.filter(p => p.type === 'quarter');
            expect(quarters.some(q => q.label.startsWith('Q'))).toBe(true);

            // Check month label format (capitalized Spanish month)
            const months = periods.filter(p => p.type === 'month');
            expect(months.length).toBeGreaterThan(0);
            expect(months[0].label[0]).toBe(months[0].label[0].toUpperCase());
        });

        it('should handle multiple collaborators with different evaluation dates', () => {
            const collaborators = [
                {
                    id: 1,
                    name: 'Alice',
                    evaluationSessions: [
                        { evaluatedAt: '2024-03-10', assessments: [] }
                    ]
                },
                {
                    id: 2,
                    name: 'Bob',
                    evaluationSessions: [
                        { evaluatedAt: '2024-09-20', assessments: [] }
                    ]
                }
            ];

            const periods = generateTimePeriods(collaborators);
            expect(periods.length).toBeGreaterThan(0);

            // Should generate periods covering both dates
            const years = periods.filter(p => p.type === 'year');
            expect(years.some(p => p.id === 'Y-2024')).toBe(true);
        });
    });

    describe('getSnapshotData', () => {
        const mockCollaborators = [
            {
                id: 1,
                name: 'Alice',
                evaluationSessions: [
                    {
                        evaluatedAt: '2024-06-15',
                        assessments: [
                            { skillId: 'js', nivel: 3 },
                            { skillId: 'react', nivel: 4 }
                        ]
                    },
                    {
                        evaluatedAt: '2024-09-20',
                        assessments: [
                            { skillId: 'js', nivel: 4 },
                            { skillId: 'node', nivel: 3 }
                        ]
                    }
                ]
            },
            {
                id: 2,
                name: 'Bob',
                evaluationSessions: [
                    {
                        evaluatedAt: '2024-05-10',
                        assessments: [
                            { skillId: 'python', nivel: 5 }
                        ]
                    }
                ]
            }
        ];

        it('should return collaborators as-is if no snapshot date (live view)', () => {
            const result = getSnapshotData(mockCollaborators, null);
            expect(result).toEqual(mockCollaborators);
        });

        it('should reconstruct skills at a specific point in time', () => {
            // Snapshot at Aug 1, 2024 (after first Alice eval, before second)
            const snapshot = getSnapshotData(mockCollaborators, new Date(2024, 7, 1));

            const alice = snapshot[0];
            expect(alice.isSnapshot).toBe(true);
            expect(alice.skills.js).toBeDefined();
            expect(alice.skills.js.nivel).toBe(3); // From June eval
            expect(alice.skills.react).toBeDefined();
            expect(alice.skills.react.nivel).toBe(4);
            expect(alice.skills.node).toBeUndefined(); // Not evaluated yet
        });

        it('should use last known value logic', () => {
            // Snapshot at Oct 1, 2024 (after both Alice evals)
            const snapshot = getSnapshotData(mockCollaborators, new Date(2024, 9, 1));

            const alice = snapshot[0];
            expect(alice.skills.js.nivel).toBe(4); // Updated in Sep
            expect(alice.skills.react.nivel).toBe(4); // From June (last known)
            expect(alice.skills.node.nivel).toBe(3); // Added in Sep
        });

        it('should calculate average correctly', () => {
            const snapshot = getSnapshotData(mockCollaborators, new Date(2024, 9, 1));

            const alice = snapshot[0];
            // Skills: js=4, react=4, node=3 -> avg = 11/3 = 3.666...
            expect(alice.promedio).toBeCloseTo(3.67, 1);
        });

        it('should mark collaborator as inactive with no skills if no evaluations before snapshot', () => {
            // Snapshot at Jan 1, 2024 (before any evaluations)
            const snapshot = getSnapshotData(mockCollaborators, new Date(2024, 0, 1));

            const alice = snapshot[0];
            expect(alice.skills).toEqual({});
            expect(alice.promedio).toBe(0);
            expect(alice.lastEvaluated).toBe(null);
            expect(alice.isActive).toBe(false);
        });

        it('should filter out invalid dates', () => {
            const collaborators = [
                {
                    id: 1,
                    name: 'Alice',
                    evaluationSessions: [
                        {
                            evaluatedAt: 'invalid-date',
                            assessments: [{ skillId: 'js', nivel: 3 }]
                        },
                        {
                            evaluatedAt: '2024-06-15',
                            assessments: [{ skillId: 'react', nivel: 4 }]
                        }
                    ]
                }
            ];

            const snapshot = getSnapshotData(collaborators, new Date(2024, 7, 1));
            const alice = snapshot[0];

            // Should only include valid evaluation
            expect(alice.skills.react).toBeDefined();
            expect(alice.skills.js).toBeUndefined();
        });

        it('should handle collaborators with no evaluation sessions', () => {
            const collaborators = [
                { id: 1, name: 'Alice' },
                { id: 2, name: 'Bob', evaluationSessions: [] }
            ];

            const snapshot = getSnapshotData(collaborators, new Date(2024, 7, 1));

            expect(snapshot[0].skills).toEqual({});
            expect(snapshot[0].promedio).toBe(0);
            expect(snapshot[1].skills).toEqual({});
        });

        it('should set lastEvaluated to the most recent evaluation date', () => {
            const snapshot = getSnapshotData(mockCollaborators, new Date(2024, 9, 1));

            const alice = snapshot[0];
            expect(alice.lastEvaluated).toBe('2024-09-20');

            const bob = snapshot[1];
            expect(bob.lastEvaluated).toBe('2024-05-10');
        });

        it('should handle empty assessments in sessions', () => {
            const collaborators = [
                {
                    id: 1,
                    name: 'Alice',
                    evaluationSessions: [
                        {
                            evaluatedAt: '2024-06-15',
                            assessments: []
                        }
                    ]
                }
            ];

            const snapshot = getSnapshotData(collaborators, new Date(2024, 7, 1));
            const alice = snapshot[0];

            expect(alice.skills).toEqual({});
            expect(alice.promedio).toBe(0);
        });

        it('should filter out future dates beyond current year + 1', () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date(2025, 0, 15));

            const collaborators = [
                {
                    id: 1,
                    name: 'Alice',
                    evaluationSessions: [
                        {
                            evaluatedAt: '2050-06-15',
                            assessments: [{ skillId: 'js', nivel: 3 }]
                        },
                        {
                            evaluatedAt: '2024-06-15',
                            assessments: [{ skillId: 'react', nivel: 4 }]
                        }
                    ]
                }
            ];

            const snapshot = getSnapshotData(collaborators, new Date(2024, 7, 1));
            const alice = snapshot[0];

            // Should ignore 2050 date
            expect(alice.skills.react).toBeDefined();
            expect(alice.skills.js).toBeUndefined();

            vi.useRealTimers();
        });
    });

    describe('getPreviousPeriodDate', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should get previous month date', () => {
            // Reference: Feb 15, 2025
            const referenceDate = new Date(2025, 1, 15);
            const prevDate = getPreviousPeriodDate(referenceDate, 'month');

            // Should return Jan 31, 2025
            expect(prevDate.getFullYear()).toBe(2025);
            expect(prevDate.getMonth()).toBe(0); // January (0-indexed)
            expect(prevDate.getDate()).toBe(31);
        });

        it('should get previous quarter date', () => {
            // Reference: May 15, 2025 (Q2)
            const referenceDate = new Date(2025, 4, 15);
            const prevDate = getPreviousPeriodDate(referenceDate, 'quarter');

            // Should return Mar 31, 2025 (end of Q1)
            expect(prevDate.getFullYear()).toBe(2025);
            expect(prevDate.getMonth()).toBe(2); // March
            expect(prevDate.getDate()).toBe(31);
        });

        it('should get previous year date', () => {
            // Reference: Jun 15, 2025
            const referenceDate = new Date(2025, 5, 15);
            const prevDate = getPreviousPeriodDate(referenceDate, 'year');

            // Should return Dec 31, 2024
            expect(prevDate.getFullYear()).toBe(2024);
            expect(prevDate.getMonth()).toBe(11); // December
            expect(prevDate.getDate()).toBe(31);
        });

        it('should use current date if no reference provided', () => {
            vi.setSystemTime(new Date(2025, 5, 15));

            const prevDate = getPreviousPeriodDate(undefined, 'month');

            // Should return May 31, 2025
            expect(prevDate.getFullYear()).toBe(2025);
            expect(prevDate.getMonth()).toBe(4); // May
        });

        it('should default to month granularity', () => {
            const referenceDate = new Date(2025, 1, 15);
            const prevDate = getPreviousPeriodDate(referenceDate);

            // Should return Jan 31, 2025 (previous month)
            expect(prevDate.getMonth()).toBe(0); // January
        });

        it('should handle January to previous December', () => {
            // Reference: Jan 15, 2025
            const referenceDate = new Date(2025, 0, 15);
            const prevDate = getPreviousPeriodDate(referenceDate, 'month');

            // Should return Dec 31, 2024
            expect(prevDate.getFullYear()).toBe(2024);
            expect(prevDate.getMonth()).toBe(11); // December
            expect(prevDate.getDate()).toBe(31);
        });

        it('should handle Q1 to previous Q4', () => {
            // Reference: Feb 15, 2025 (Q1)
            const referenceDate = new Date(2025, 1, 15);
            const prevDate = getPreviousPeriodDate(referenceDate, 'quarter');

            // Should return Dec 31, 2024 (end of Q4)
            expect(prevDate.getFullYear()).toBe(2024);
            expect(prevDate.getMonth()).toBe(11); // December
            expect(prevDate.getDate()).toBe(31);
        });

        it('should handle February edge case', () => {
            // Reference: Mar 31, 2025
            const referenceDate = new Date(2025, 2, 31);
            const prevDate = getPreviousPeriodDate(referenceDate, 'month');

            // Should return Feb 28, 2025 (end of Feb)
            expect(prevDate.getFullYear()).toBe(2025);
            expect(prevDate.getMonth()).toBe(1); // February
            expect(prevDate.getDate()).toBe(28);
        });

        it('should handle leap year February', () => {
            // Reference: Mar 15, 2024 (leap year)
            const referenceDate = new Date(2024, 2, 15);
            const prevDate = getPreviousPeriodDate(referenceDate, 'month');

            // Should return Feb 29, 2024
            expect(prevDate.getFullYear()).toBe(2024);
            expect(prevDate.getMonth()).toBe(1); // February
            expect(prevDate.getDate()).toBe(29);
        });

        it('should handle different quarters correctly', () => {
            // Q2 (Apr-Jun)
            const q2Date = new Date(2025, 4, 15);
            const prevQ2 = getPreviousPeriodDate(q2Date, 'quarter');
            expect(prevQ2.getMonth()).toBe(2); // Mar 31

            // Q3 (Jul-Sep)
            const q3Date = new Date(2025, 7, 15);
            const prevQ3 = getPreviousPeriodDate(q3Date, 'quarter');
            expect(prevQ3.getMonth()).toBe(5); // Jun 30

            // Q4 (Oct-Dec)
            const q4Date = new Date(2025, 10, 15);
            const prevQ4 = getPreviousPeriodDate(q4Date, 'quarter');
            expect(prevQ4.getMonth()).toBe(8); // Sep 30
        });
    });
});
