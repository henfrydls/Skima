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
    expect(screen.getByText('Brecha Crítica')).toBeInTheDocument();
    expect(screen.getByText('Área de Mejora')).toBeInTheDocument();
    expect(screen.getByText('Competente')).toBeInTheDocument();
    expect(screen.getByText('Fortaleza')).toBeInTheDocument();
  });

  it('renders title', () => {
    render(<SkillStateLegend />);
    expect(screen.getByText('Estados de Evaluación')).toBeInTheDocument();
  });

  it('toggles expanded state to show criteria', () => {
    render(<SkillStateLegend />);
    const toggleBtn = screen.getByText('Ver reglas');
    fireEvent.click(toggleBtn);
    expect(screen.getByText('Ocultar reglas')).toBeInTheDocument();
    expect(screen.getByText(/Skill crítica \(C\)/)).toBeInTheDocument();
  });

  it('hides toggle button in compact mode', () => {
    render(<SkillStateLegend compact />);
    expect(screen.queryByText('Ver reglas')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<SkillStateLegend className="mt-4" />);
    expect(container.firstChild).toHaveClass('mt-4');
  });
});
