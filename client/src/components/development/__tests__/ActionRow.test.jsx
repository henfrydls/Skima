import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ActionRow from '../ActionRow';

// Mock useAuth
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    authFetch: vi.fn(),
  }),
}));

// Mock API_BASE
vi.mock('../../../lib/apiBase', () => ({
  API_BASE: '',
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

const mockAction = {
  id: 1,
  title: 'Complete testing course',
  actionType: 'formal',
  status: 'completed',
  dueDate: '2026-05-01',
  completedAt: '2026-04-15T00:00:00Z',
};

describe('ActionRow', () => {
  const defaultProps = {
    action: mockAction,
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
  };

  const renderAction = (overrides = {}) =>
    render(<ActionRow {...defaultProps} {...overrides} />);

  it('renders action title', () => {
    renderAction();
    expect(screen.getByText('Complete testing course')).toBeInTheDocument();
  });

  it('shows correct type badge for formal (green)', () => {
    renderAction();
    const badge = screen.getByText('Formal');
    expect(badge).toBeInTheDocument();
    expect(badge.closest('span')).toHaveClass('bg-green-50', 'text-green-700');
  });

  it('shows correct type badge for experience (blue)', () => {
    renderAction({ action: { ...mockAction, actionType: 'experience' } });
    const badge = screen.getByText('Experience');
    expect(badge.closest('span')).toHaveClass('bg-blue-50', 'text-blue-700');
  });

  it('shows correct type badge for social (purple)', () => {
    renderAction({ action: { ...mockAction, actionType: 'social' } });
    const badge = screen.getByText('Social');
    expect(badge.closest('span')).toHaveClass('bg-purple-50', 'text-purple-700');
  });

  it('shows correct type badge for self_directed (amber)', () => {
    renderAction({ action: { ...mockAction, actionType: 'self_directed' } });
    const badge = screen.getByText('Self-directed');
    expect(badge.closest('span')).toHaveClass('bg-amber-50', 'text-amber-700');
  });

  // Bug #33: API returns `actionType`, component must read that field (not `type`)
  it('reads actionType from real API shape (not legacy "type")', () => {
    const apiAction = {
      id: 99,
      title: 'Real API shape action',
      actionType: 'formal',
      status: 'not_started',
      dueDate: null,
      completedAt: null,
    };
    renderAction({ action: apiAction });
    const badge = screen.getByText('Formal');
    expect(badge.closest('span')).toHaveClass('bg-green-50', 'text-green-700');
  });

  it('shows due date when provided', () => {
    renderAction();
    // Date-only strings may shift timezone; just verify a date is rendered near the calendar icon
    const dateEl = screen.getByText(/\w{3} \d{1,2}/);
    expect(dateEl).toBeInTheDocument();
  });

  it('does not show due date when not provided', () => {
    renderAction({ action: { ...mockAction, dueDate: null } });
    expect(screen.queryByText(/May/)).not.toBeInTheDocument();
  });

  it('completed actions do not have reduced opacity on the row', () => {
    const { container } = renderAction();
    const row = container.querySelector('.opacity-60');
    expect(row).not.toBeInTheDocument();
  });

  it('completed actions have line-through text', () => {
    renderAction();
    const title = screen.getByText('Complete testing course');
    expect(title).toHaveClass('line-through');
  });

  it('non-completed actions do not have line-through', () => {
    renderAction({ action: { ...mockAction, status: 'not_started' } });
    const title = screen.getByText('Complete testing course');
    expect(title).not.toHaveClass('line-through');
  });

  it('non-completed actions do not have reduced opacity', () => {
    const { container } = renderAction({ action: { ...mockAction, status: 'not_started' } });
    const row = container.querySelector('.opacity-60');
    expect(row).not.toBeInTheDocument();
  });

  it('in readOnly mode: no toggle button', () => {
    renderAction({ readOnly: true });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('in readOnly mode: shows static check icon for completed', () => {
    const { container } = renderAction({ readOnly: true });
    // Should render a span (not button) with the check icon
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('in edit mode: shows toggle button', () => {
    renderAction({ readOnly: false });
    const buttons = screen.getAllByRole('button');
    // Toggle button + delete button
    expect(buttons.length).toBe(2);
  });

  it('in readOnly mode: no delete button', () => {
    renderAction({ readOnly: true });
    const deleteBtn = screen.queryByTitle('Delete action');
    expect(deleteBtn).not.toBeInTheDocument();
  });

  it('in edit mode: shows delete button', () => {
    renderAction({ readOnly: false });
    const deleteBtn = screen.getByTitle('Delete action');
    expect(deleteBtn).toBeInTheDocument();
  });
});
