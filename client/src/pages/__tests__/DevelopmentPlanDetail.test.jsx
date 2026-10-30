import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DevelopmentPlanDetail from '../DevelopmentPlanDetail';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'p1' }),
  useNavigate: () => vi.fn(),
}));
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn() } }));

const action = (id, status) => ({ id, title: `Action ${id}`, status, type: 'other' });

// Settings showed 45% (9 of 20 countable) and this page showed 43% (9 of 21, counting the skipped one).
const plan = {
  id: 'p1',
  title: 'Plan',
  status: 'active',
  collaborator: { nombre: 'Ana' },
  goals: [
    {
      id: 'g1', title: 'Goal one', priority: 'medium',
      actions: [...Array(9)].map((_, i) => action(`c${i}`, 'completed')).concat([...Array(10)].map((_, i) => action(`n${i}`, 'not_started'))),
    },
    { id: 'g2', title: 'Goal two', priority: 'medium', actions: [action('s', 'skipped'), action('x', 'not_started')] },
    {
      id: 'g3', title: 'Goal three', priority: 'medium',
      actions: [...Array(5)].map((_, i) => action(`d${i}`, 'completed')).concat(action('s2', 'skipped')),
    },
  ],
};

describe('DevelopmentPlanDetail progress', () => {
  it('leaves skipped actions out of the plan figures, like each goal does', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => plan });
    render(<DevelopmentPlanDetail />);
    // 14 completed of 25 countable (27 actions, 2 skipped) = 56%; counting skipped gave 14/27 = 52%.
    expect(await screen.findByText('56%')).toBeInTheDocument();
    expect(screen.getByText('14/25')).toBeInTheDocument();
    // Goal three is done: 5 completed + 1 skipped.
    expect(screen.getByText('1/3')).toBeInTheDocument();
  });
});
