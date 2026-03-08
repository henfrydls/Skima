import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SkillStateLegend from '../SkillStateLegend';

vi.mock('framer-motion', () => ({
  motion: {
    span: ({ children, ...props }) => <span {...props}>{children}</span>
  },
  AnimatePresence: ({ children }) => <>{children}</>
}));

describe('SkillStateLegend', () => {
  it('renders all 4 evaluation states', () => {
    render(<SkillStateLegend />);
    expect(screen.getByText('Critical Gap')).toBeInTheDocument();
    expect(screen.getByText('Area for Improvement')).toBeInTheDocument();
    expect(screen.getByText('Competent')).toBeInTheDocument();
    expect(screen.getByText('Strength')).toBeInTheDocument();
  });

  it('renders title', () => {
    render(<SkillStateLegend />);
    expect(screen.getByText('Evaluation States')).toBeInTheDocument();
  });

  it('toggles expanded state to show criteria', () => {
    render(<SkillStateLegend />);
    const toggleBtn = screen.getByText('View rules');
    fireEvent.click(toggleBtn);
    expect(screen.getByText('Hide rules')).toBeInTheDocument();
    expect(screen.getByText(/Critical skill \(C\)/)).toBeInTheDocument();
  });

  it('hides toggle button in compact mode', () => {
    render(<SkillStateLegend compact />);
    expect(screen.queryByText('View rules')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<SkillStateLegend className="mt-4" />);
    expect(container.firstChild).toHaveClass('mt-4');
  });
});
