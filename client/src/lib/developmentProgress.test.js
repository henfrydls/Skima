import { describe, it, expect } from 'vitest';
import { countableActions, goalProgress, planProgress, isGoalDone } from './developmentProgress';

const a = (status) => ({ status });

describe('developmentProgress', () => {
  it('leaves skipped actions out of both sides of the ratio', () => {
    const actions = [a('completed'), a('completed'), a('skipped'), a('not_started'), a('in_progress')];
    expect(countableActions(actions)).toHaveLength(4);
    expect(goalProgress(actions)).toEqual({ completed: 2, total: 4, percent: 50 });
  });

  it('5 completed + 1 skipped is a done goal at 100%', () => {
    const actions = [...Array(5)].map(() => a('completed')).concat(a('skipped'));
    expect(goalProgress(actions).percent).toBe(100);
    expect(isGoalDone(actions)).toBe(true);
  });

  it('a goal with no countable actions is at 0% and not done', () => {
    expect(goalProgress([]).percent).toBe(0);
    expect(goalProgress([a('skipped')])).toEqual({ completed: 0, total: 0, percent: 0 });
    expect(isGoalDone([a('skipped')])).toBe(false);
    expect(isGoalDone(undefined)).toBe(false);
  });

  // The issue's case: Settings showed 45% (9/20) and the detail 43% (9/21).
  it('the plan aggregate excludes skipped actions, like each goal does', () => {
    const goals = [
      { actions: [...Array(9)].map(() => a('completed')).concat(...Array(10).fill(a('not_started'))) },
      { actions: [a('not_started'), a('skipped')] },
    ];
    expect(planProgress(goals)).toEqual({ completed: 9, total: 20, percent: 45 });
  });

  it('handles goals without an actions array', () => {
    expect(planProgress([{}, { actions: [a('completed')] }])).toEqual({ completed: 1, total: 1, percent: 100 });
    expect(planProgress()).toEqual({ completed: 0, total: 0, percent: 0 });
  });
});
