import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GoalAccordion from '../GoalAccordion';

// Mock ActionRow to avoid its dependencies (useAuth, etc.)
vi.mock('../ActionRow', () => ({
  default: ({ action, readOnly }) => (
    <div data-testid={`action-${action.id}`}>{action.title}</div>
  ),
}));

const mockAction = {
  id: 1,
  title: 'Complete testing course',
  type: 'formal',
  status: 'completed',
  dueDate: '2026-05-01',
};

const mockGoal = {
  id: 1,
  title: 'Improve React Testing',
  description: 'Reach level 4 in testing',
  skill: { id: 1, name: 'React' },
  priority: 'high',
  status: 'in_progress',
  actions: [
    mockAction,
    { id: 2, title: 'Practice TDD', type: 'experience', status: 'not_started' },
  ],
};

describe('GoalAccordion', () => {
  const defaultProps = {
    goal: mockGoal,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onAddAction: vi.fn(),
    onUpdateAction: vi.fn(),
    onDeleteAction: vi.fn(),
  };

  const renderGoal = (overrides = {}) =>
    render(<GoalAccordion {...defaultProps} {...overrides} />);

  it('renders goal title', () => {
    renderGoal();
    expect(screen.getByText('Improve React Testing')).toBeInTheDocument();
  });

  it('shows skill badge when skill linked', () => {
    renderGoal();
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('does not show skill badge when no skill', () => {
    renderGoal({ goal: { ...mockGoal, skill: null } });
    expect(screen.queryByText('React')).not.toBeInTheDocument();
  });

  it('shows priority indicator', () => {
    const { container } = renderGoal();
    const dot = container.querySelector('.bg-critical');
    expect(dot).toBeInTheDocument();
  });

  it('shows medium priority by default', () => {
    const { container } = renderGoal({ goal: { ...mockGoal, priority: 'medium' } });
    const dot = container.querySelector('.bg-warning');
    expect(dot).toBeInTheDocument();
  });

  it('shows action count (completed/total)', () => {
    renderGoal();
    // 1 completed out of 2
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('shows progress bar', () => {
    const { container } = renderGoal();
    const progressBar = container.querySelector('.bg-primary.rounded-full');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar.style.width).toBe('50%');
  });

  it('expands on click to show actions', () => {
    renderGoal();
    expect(screen.queryByTestId('action-1')).not.toBeInTheDocument();

    // Click the header to expand
    fireEvent.click(screen.getByText('Improve React Testing'));
    expect(screen.getByTestId('action-1')).toBeInTheDocument();
    expect(screen.getByTestId('action-2')).toBeInTheDocument();
  });

  it('collapses on click when expanded', () => {
    renderGoal();
    const title = screen.getByText('Improve React Testing');

    // Expand
    fireEvent.click(title);
    expect(screen.getByTestId('action-1')).toBeInTheDocument();

    // Collapse
    fireEvent.click(title);
    expect(screen.queryByTestId('action-1')).not.toBeInTheDocument();
  });

  it('shows description when expanded', () => {
    renderGoal();
    fireEvent.click(screen.getByText('Improve React Testing'));
    expect(screen.getByText('Reach level 4 in testing')).toBeInTheDocument();
  });

  it('shows edit and delete buttons when expanded (not readOnly)', () => {
    renderGoal();
    fireEvent.click(screen.getByText('Improve React Testing'));
    expect(screen.getByText('Edit Goal')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('hides edit/delete buttons in readOnly mode', () => {
    renderGoal({ readOnly: true });
    fireEvent.click(screen.getByText('Improve React Testing'));
    expect(screen.queryByText('Edit Goal')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('hides "Add Action" button in readOnly mode', () => {
    renderGoal({ readOnly: true });
    fireEvent.click(screen.getByText('Improve React Testing'));
    expect(screen.queryByText('Add Action')).not.toBeInTheDocument();
  });

  it('shows "Add Action" button when expanded (not readOnly)', () => {
    renderGoal();
    fireEvent.click(screen.getByText('Improve React Testing'));
    expect(screen.getByText('Add Action')).toBeInTheDocument();
  });

  it('shows "No actions yet" when goal has no actions', () => {
    renderGoal({ goal: { ...mockGoal, actions: [] } });
    fireEvent.click(screen.getByText('Improve React Testing'));
    expect(screen.getByText('No actions yet')).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn();
    renderGoal({ onEdit });
    fireEvent.click(screen.getByText('Improve React Testing'));
    fireEvent.click(screen.getByText('Edit Goal'));
    expect(onEdit).toHaveBeenCalledWith(mockGoal);
  });

  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn();
    renderGoal({ onDelete });
    fireEvent.click(screen.getByText('Improve React Testing'));
    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith(mockGoal);
  });

  it('calls onAddAction when add action button clicked', () => {
    const onAddAction = vi.fn();
    renderGoal({ onAddAction });
    fireEvent.click(screen.getByText('Improve React Testing'));
    fireEvent.click(screen.getByText('Add Action'));
    expect(onAddAction).toHaveBeenCalledWith(mockGoal);
  });
});
