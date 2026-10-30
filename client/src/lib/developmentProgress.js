// Progress of development goals and plans. A skipped action is not pending work, so it
// counts neither as done nor as remaining: it is left out of both sides of the ratio.

export const countableActions = (actions = []) => actions.filter((a) => a.status !== 'skipped');

const ratio = (completed, total) => ({
  completed,
  total,
  percent: total > 0 ? Math.round((completed / total) * 100) : 0,
});

export function goalProgress(actions = []) {
  const countable = countableActions(actions);
  return ratio(countable.filter((a) => a.status === 'completed').length, countable.length);
}

/** Aggregated over every goal's countable actions, so it agrees with the goals shown. */
export function planProgress(goals = []) {
  return goals.reduce((acc, goal) => {
    const { completed, total } = goalProgress(goal.actions);
    return ratio(acc.completed + completed, acc.total + total);
  }, ratio(0, 0));
}

/** All countable actions completed, and at least one of them. */
export function isGoalDone(actions = []) {
  const { completed, total } = goalProgress(actions);
  return total > 0 && completed === total;
}
