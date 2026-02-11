import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Avatar from '../Avatar';

describe('Avatar', () => {
  it('renders without crashing', () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('displays correct initials for a single name', () => {
    render(<Avatar name="John" />);
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('displays correct initials for a two-word name', () => {
    render(<Avatar name="Jane Smith" />);
    expect(screen.getByText('JS')).toBeInTheDocument();
  });

  it('displays only first two initials for longer names', () => {
    render(<Avatar name="Maria Elena Garcia Rodriguez" />);
    expect(screen.getByText('ME')).toBeInTheDocument();
  });

  it('converts initials to uppercase', () => {
    render(<Avatar name="john doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('applies default medium size class', () => {
    const { container } = render(<Avatar name="John Doe" />);
    const avatar = container.querySelector('div');
    expect(avatar).toHaveClass('w-10', 'h-10', 'text-sm');
  });

  it('applies small size class when size="sm"', () => {
    const { container } = render(<Avatar name="John Doe" size="sm" />);
    const avatar = container.querySelector('div');
    expect(avatar).toHaveClass('w-8', 'h-8', 'text-xs');
  });

  it('applies large size class when size="lg"', () => {
    const { container } = render(<Avatar name="John Doe" size="lg" />);
    const avatar = container.querySelector('div');
    expect(avatar).toHaveClass('w-12', 'h-12', 'text-base');
  });

  it('sets title attribute with full name for tooltip', () => {
    const { container } = render(<Avatar name="John Doe" />);
    const avatar = container.querySelector('div');
    expect(avatar).toHaveAttribute('title', 'John Doe');
  });

  it('applies correct styling classes', () => {
    const { container } = render(<Avatar name="Test User" />);
    const avatar = container.querySelector('div');
    expect(avatar).toHaveClass('rounded-full', 'bg-primary/10', 'text-primary');
  });
});
