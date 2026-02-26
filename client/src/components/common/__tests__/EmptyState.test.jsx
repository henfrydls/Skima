import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Users, FileText } from 'lucide-react';
import EmptyState from '../EmptyState';

describe('EmptyState', () => {
  it('renders without crashing', () => {
    render(<EmptyState />);
    expect(screen.getByText('No hay datos disponibles')).toBeInTheDocument();
  });

  it('displays default title and description', () => {
    render(<EmptyState />);
    expect(screen.getByText('No hay datos disponibles')).toBeInTheDocument();
    expect(screen.getByText('No se encontraron elementos para mostrar.')).toBeInTheDocument();
  });

  it('displays custom title and description', () => {
    render(
      <EmptyState
        title="No skills found"
        description="Add your first skill to get started"
      />
    );
    expect(screen.getByText('No skills found')).toBeInTheDocument();
    expect(screen.getByText('Add your first skill to get started')).toBeInTheDocument();
  });

  it('renders default Users icon', () => {
    const { container } = render(<EmptyState />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('renders custom icon when provided', () => {
    const { container } = render(<EmptyState icon={FileText} />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('does not show action button when onAction is null', () => {
    render(<EmptyState />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows action button when onAction is provided', () => {
    const handleAction = vi.fn();
    render(<EmptyState onAction={handleAction} />);
    expect(screen.getByRole('button', { name: 'Agregar' })).toBeInTheDocument();
  });

  it('displays custom action label', () => {
    const handleAction = vi.fn();
    render(<EmptyState onAction={handleAction} actionLabel="Create New" />);
    expect(screen.getByRole('button', { name: 'Create New' })).toBeInTheDocument();
  });

  it('calls onAction when action button is clicked', () => {
    const handleAction = vi.fn();
    render(<EmptyState onAction={handleAction} actionLabel="Add Item" />);

    fireEvent.click(screen.getByRole('button', { name: 'Add Item' }));
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('renders secondary action when provided', () => {
    const handleAction = vi.fn();
    const secondaryButton = <button>Secondary Action</button>;

    render(
      <EmptyState
        onAction={handleAction}
        secondaryAction={secondaryButton}
      />
    );

    expect(screen.getByText('Secondary Action')).toBeInTheDocument();
  });

  it('applies correct container styling', () => {
    const { container } = render(<EmptyState />);
    const wrapper = container.querySelector('.text-center');
    expect(wrapper).toHaveClass('py-16', 'bg-white', 'rounded-xl', 'border', 'border-dashed');
  });

  it('shows primary action without secondary action', () => {
    const handleAction = vi.fn();
    render(<EmptyState onAction={handleAction} actionLabel="Primary" />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveTextContent('Primary');
  });

  it('shows both primary and secondary actions', () => {
    const handleAction = vi.fn();
    const secondaryButton = <button>Cancel</button>;

    render(
      <EmptyState
        onAction={handleAction}
        actionLabel="Confirm"
        secondaryAction={secondaryButton}
      />
    );

    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });
});
