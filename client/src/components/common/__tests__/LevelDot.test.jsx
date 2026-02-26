import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LevelDot from '../LevelDot';

describe('LevelDot', () => {
  it('renders without crashing', () => {
    const { container } = render(<LevelDot level={3} />);
    expect(container.querySelector('.rounded-full')).toBeInTheDocument();
  });

  it('displays level number by default', () => {
    render(<LevelDot level={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('displays rounded level to one decimal place', () => {
    render(<LevelDot level={3.14159} />);
    expect(screen.getByText('3.1')).toBeInTheDocument();
  });

  it('hides label when showLabel is false', () => {
    const { container } = render(<LevelDot level={3} showLabel={false} />);
    expect(screen.queryByText('3')).not.toBeInTheDocument();
    expect(container.querySelector('.rounded-full')).toBeInTheDocument();
  });

  it('applies gray color for level below 2', () => {
    const { container } = render(<LevelDot level={1} />);
    const dot = container.querySelector('.rounded-full');
    expect(dot).toHaveClass('bg-gray-300', 'text-gray-600');
  });

  it('applies warning color for level 2-2.9', () => {
    const { container } = render(<LevelDot level={2.5} />);
    const dot = container.querySelector('.rounded-full');
    expect(dot).toHaveClass('bg-warning', 'text-white');
  });

  it('applies competent color for level 3-3.9', () => {
    const { container } = render(<LevelDot level={3.5} />);
    const dot = container.querySelector('.rounded-full');
    expect(dot).toHaveClass('bg-competent', 'text-white');
  });

  it('applies primary color for level 4 and above', () => {
    const { container } = render(<LevelDot level={4.5} />);
    const dot = container.querySelector('.rounded-full');
    expect(dot).toHaveClass('bg-primary', 'text-white');
  });

  it('does not show critical indicator by default', () => {
    const { container } = render(<LevelDot level={3} />);
    const criticalBadge = container.querySelector('.animate-pulse');
    expect(criticalBadge).not.toBeInTheDocument();
  });

  it('shows critical indicator when isCriticalGap is true', () => {
    const { container } = render(<LevelDot level={3} isCriticalGap={true} />);
    const criticalBadge = container.querySelector('.animate-pulse');
    expect(criticalBadge).toBeInTheDocument();
    expect(screen.getByText('!')).toBeInTheDocument();
  });

  it('applies critical ring when isCriticalGap is true', () => {
    const { container } = render(<LevelDot level={3} isCriticalGap={true} />);
    const dot = container.querySelector('.rounded-full');
    expect(dot).toHaveClass('ring-2', 'ring-critical', 'ring-offset-1');
  });

  it('includes level in title attribute', () => {
    const { container } = render(<LevelDot level={3.5} />);
    const dot = container.querySelector('.rounded-full');
    expect(dot).toHaveAttribute('title', 'Nivel: 3.5');
  });

  it('includes CRÍTICO in title when isCriticalGap is true', () => {
    const { container } = render(<LevelDot level={2} isCriticalGap={true} />);
    const dot = container.querySelector('.rounded-full');
    expect(dot).toHaveAttribute('title', 'Nivel: 2 - CRÍTICO');
  });

  it('applies correct size classes', () => {
    const { container } = render(<LevelDot level={3} />);
    const dot = container.querySelector('.rounded-full');
    expect(dot).toHaveClass('w-8', 'h-8', 'text-xs', 'font-medium');
  });

  it('applies hover and transition classes', () => {
    const { container } = render(<LevelDot level={3} />);
    const dot = container.querySelector('.rounded-full');
    expect(dot).toHaveClass('transition-all', 'duration-150', 'hover:scale-110', 'cursor-pointer');
  });

  it('handles level 0 correctly', () => {
    render(<LevelDot level={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('handles level 5 correctly', () => {
    render(<LevelDot level={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
