import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PlanCard from '../PlanCard';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockGoal = {
  id: 1,
  title: 'Improve React Testing',
  actions: [
    { id: 1, status: 'completed' },
    { id: 2, status: 'not_started' },
  ],
};

const mockPlan = {
  id: 1,
  title: 'Q2 Growth Plan',
  description: 'Test plan',
  status: 'active',
  targetRole: 'Senior Developer',
  startDate: '2026-04-01',
  endDate: '2026-06-30',
  collaborator: { id: 1, nombre: 'Maria Garcia', rol: 'Developer' },
  goals: [mockGoal],
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
};

describe('PlanCard', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  const renderCard = (planOverrides = {}) =>
    render(
      <MemoryRouter>
        <PlanCard plan={{ ...mockPlan, ...planOverrides }} />
      </MemoryRouter>
    );

  it('renders plan title', () => {
    renderCard();
    expect(screen.getByText('Q2 Growth Plan')).toBeInTheDocument();
  });

  it('renders collaborator name', () => {
    renderCard();
    expect(screen.getByText('Maria Garcia')).toBeInTheDocument();
  });

  it('renders Active status badge with correct styling', () => {
    renderCard({ status: 'active' });
    const badge = screen.getByText('Active');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-primary/10', 'text-primary');
  });

  it('renders Completed status badge with correct styling', () => {
    renderCard({ status: 'completed' });
    const badge = screen.getByText('Completed');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-emerald-50', 'text-emerald-700');
  });

  it('renders Draft status badge with correct styling', () => {
    renderCard({ status: 'draft' });
    const badge = screen.getByText('Draft');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-600');
  });

  it('renders goal count', () => {
    renderCard();
    expect(screen.getByText('1 goal')).toBeInTheDocument();
  });

  it('renders plural goals text when multiple goals', () => {
    const twoGoals = [mockGoal, { ...mockGoal, id: 2 }];
    renderCard({ goals: twoGoals });
    expect(screen.getByText('2 goals')).toBeInTheDocument();
  });

  it('renders progress bar with correct percentage', () => {
    renderCard();
    // 1 of 2 actions completed = 50%
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('shows date range when dates provided', () => {
    renderCard();
    // Date-only strings parsed as UTC may shift; just check a date range is rendered
    const dateEl = screen.getByText(/\d{4}.*-.*\d{4}/);
    expect(dateEl).toBeInTheDocument();
  });

  it('handles missing optional fields (no description, no dates)', () => {
    renderCard({
      description: undefined,
      startDate: undefined,
      endDate: undefined,
      collaborator: undefined,
    });
    expect(screen.getByText('Q2 Growth Plan')).toBeInTheDocument();
    // No calendar/date element rendered
    expect(screen.queryByText(/\d{4}.*-.*\d{4}/)).not.toBeInTheDocument();
  });

  it('navigates to plan detail on click', () => {
    const { container } = renderCard();
    fireEvent.click(container.querySelector('.cursor-pointer'));
    expect(mockNavigate).toHaveBeenCalledWith('/development/1');
  });

  it('shows 0% progress when no actions exist', () => {
    renderCard({ goals: [{ id: 1, title: 'Empty', actions: [] }] });
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('shows 0 goals when no goals provided', () => {
    renderCard({ goals: [] });
    expect(screen.getByText('0 goals')).toBeInTheDocument();
  });
});
