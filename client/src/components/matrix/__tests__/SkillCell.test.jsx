import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SkillCell from '../SkillCell';

describe('SkillCell', () => {
  it('renders without crashing', () => {
    const { container } = render(<SkillCell level={0} />);
    expect(container.querySelector('.flex')).toBeInTheDocument();
  });

  it('displays Badge with correct level', () => {
    render(<SkillCell level={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('displays Badge with level 0', () => {
    render(<SkillCell level={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('displays Badge with level 5', () => {
    render(<SkillCell level={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('does not apply critical ring by default', () => {
    const { container } = render(<SkillCell level={3} />);
    const badge = container.querySelector('.ring-critical');
    expect(badge).not.toBeInTheDocument();
  });

  it('applies critical ring when isCriticalGap is true', () => {
    const { container } = render(<SkillCell level={2} isCriticalGap={true} />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('ring-2', 'ring-critical');
  });

  it('applies correct container classes', () => {
    const { container } = render(<SkillCell level={3} />);
    const cellContainer = container.querySelector('.flex');
    expect(cellContainer).toHaveClass('flex', 'items-center', 'justify-center', 'h-full', 'min-h-[48px]', 'p-2');
  });

  it('centers content both horizontally and vertically', () => {
    const { container } = render(<SkillCell level={4} />);
    const cellContainer = container.querySelector('.flex');
    expect(cellContainer).toHaveClass('items-center', 'justify-center');
  });

  it('handles isCriticalGap false explicitly', () => {
    const { container } = render(<SkillCell level={3} isCriticalGap={false} />);
    const badge = container.querySelector('.ring-critical');
    expect(badge).not.toBeInTheDocument();
  });

  it('displays different level values correctly', () => {
    const { rerender } = render(<SkillCell level={1} />);
    expect(screen.getByText('1')).toBeInTheDocument();

    rerender(<SkillCell level={2} />);
    expect(screen.getByText('2')).toBeInTheDocument();

    rerender(<SkillCell level={4} />);
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('combines level prop with isCriticalGap prop', () => {
    const { container } = render(<SkillCell level={1} isCriticalGap={true} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('ring-2', 'ring-critical');
  });
});
