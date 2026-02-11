import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '../Badge';

describe('Badge', () => {
  it('renders without crashing', () => {
    render(<Badge level={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('displays the correct level number', () => {
    render(<Badge level={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('applies default level 0 when no level provided', () => {
    render(<Badge />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('clamps level to maximum of 5', () => {
    render(<Badge level={10} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('clamps negative level to 0', () => {
    render(<Badge level={-2} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('floors decimal levels', () => {
    render(<Badge level={3.7} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('applies gray styling for level 0', () => {
    const { container } = render(<Badge level={0} />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-500');
  });

  it('applies gray styling for level 1', () => {
    const { container } = render(<Badge level={1} />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-gray-200', 'text-gray-600');
  });

  it('applies amber styling for level 2', () => {
    const { container } = render(<Badge level={2} />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-amber-100', 'text-amber-800');
  });

  it('applies blue styling for level 3', () => {
    const { container } = render(<Badge level={3} />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('applies blue styling for level 4', () => {
    const { container } = render(<Badge level={4} />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('applies indigo styling for level 5', () => {
    const { container } = render(<Badge level={5} />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-indigo-100', 'text-indigo-800');
  });

  it('hides label by default', () => {
    render(<Badge level={3} />);
    expect(screen.queryByText('Competente')).not.toBeInTheDocument();
  });

  it('shows label when showLabel is true', () => {
    render(<Badge level={3} showLabel={true} />);
    expect(screen.getByText('· Competente')).toBeInTheDocument();
  });

  it('displays correct label for each level', () => {
    const { rerender } = render(<Badge level={0} showLabel={true} />);
    expect(screen.getByText('· N/A')).toBeInTheDocument();

    rerender(<Badge level={1} showLabel={true} />);
    expect(screen.getByText('· Básico')).toBeInTheDocument();

    rerender(<Badge level={2} showLabel={true} />);
    expect(screen.getByText('· En desarrollo')).toBeInTheDocument();

    rerender(<Badge level={4} showLabel={true} />);
    expect(screen.getByText('· Avanzado')).toBeInTheDocument();

    rerender(<Badge level={5} showLabel={true} />);
    expect(screen.getByText('· Experto')).toBeInTheDocument();
  });

  it('accepts and applies custom className', () => {
    const { container } = render(<Badge level={2} className="custom-class" />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('custom-class');
  });

  it('passes through additional props', () => {
    const { container } = render(<Badge level={2} data-testid="custom-badge" />);
    const badge = container.querySelector('span');
    expect(badge).toHaveAttribute('data-testid', 'custom-badge');
  });
});
