import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SmartTooltip from '../SmartTooltip';

describe('SmartTooltip', () => {
  const mockData = {
    collaboratorName: 'John Doe',
    skillName: 'React Development',
    nivel: 3.5,
    frecuencia: 'D',
    criticidad: 'C',
    estado: 'BRECHA CRÍTICA'
  };

  const mockInfo = {
    x: 100,
    y: 100,
    data: mockData
  };

  // Store original window dimensions
  let originalInnerWidth;
  let originalInnerHeight;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
    // Set standard viewport size for tests
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1920 });
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 1080 });
  });

  afterEach(() => {
    // Restore original dimensions
    Object.defineProperty(window, 'innerWidth', { writable: true, value: originalInnerWidth });
    Object.defineProperty(window, 'innerHeight', { writable: true, value: originalInnerHeight });
  });

  it('does not render when info is null', () => {
    const { container } = render(<SmartTooltip info={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders tooltip with collaborator name and skill name', () => {
    render(<SmartTooltip info={mockInfo} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('React Development')).toBeInTheDocument();
  });

  it('displays nivel (skill level) correctly', () => {
    render(<SmartTooltip info={mockInfo} />);

    expect(screen.getByText('3.5')).toBeInTheDocument();
  });

  it('displays frequency in Spanish', () => {
    render(<SmartTooltip info={mockInfo} />);

    // 'D' should map to 'Diario'
    expect(screen.getByText('Diario')).toBeInTheDocument();
  });

  it('displays criticality in Spanish', () => {
    render(<SmartTooltip info={mockInfo} />);

    // 'C' should map to 'Crítico'
    expect(screen.getByText('Crítico')).toBeInTheDocument();
  });

  it('shows critical gap badge when estado is "BRECHA CRÍTICA"', () => {
    render(<SmartTooltip info={mockInfo} />);

    expect(screen.getByText('Acción Requerida')).toBeInTheDocument();
  });

  it('shows improvement area badge when estado is "ÁREA DE MEJORA"', () => {
    const infoWithMejora = {
      ...mockInfo,
      data: { ...mockData, estado: 'ÁREA DE MEJORA' }
    };

    render(<SmartTooltip info={infoWithMejora} />);

    expect(screen.getByText('Plan de Desarrollo')).toBeInTheDocument();
  });

  it('does not show status badge for normal estado', () => {
    const infoWithNormalState = {
      ...mockInfo,
      data: { ...mockData, estado: 'OK' }
    };

    render(<SmartTooltip info={infoWithNormalState} />);

    expect(screen.queryByText('Acción Requerida')).not.toBeInTheDocument();
    expect(screen.queryByText('Plan de Desarrollo')).not.toBeInTheDocument();
  });

  it('handles missing frequency with fallback', () => {
    const infoWithoutFreq = {
      ...mockInfo,
      data: { ...mockData, frecuencia: undefined }
    };

    render(<SmartTooltip info={infoWithoutFreq} />);

    expect(screen.getByText('Sin definir')).toBeInTheDocument();
  });

  it('handles missing criticality with fallback', () => {
    const infoWithoutCrit = {
      ...mockInfo,
      data: { ...mockData, criticidad: undefined }
    };

    render(<SmartTooltip info={infoWithoutCrit} />);

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('handles missing nivel with em dash', () => {
    const infoWithoutNivel = {
      ...mockInfo,
      data: { ...mockData, nivel: undefined }
    };

    render(<SmartTooltip info={infoWithoutNivel} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('positions tooltip based on x and y coordinates', () => {
    const { container } = render(<SmartTooltip info={mockInfo} />);

    const tooltip = container.querySelector('.fixed');
    expect(tooltip).toBeInTheDocument();
    // Position is set via inline style (left/top), class provides position: fixed
    expect(tooltip.style.left).toBeDefined();
    expect(tooltip.style.top).toBeDefined();
  });

  it('adjusts position when near right edge of viewport', () => {
    // Position near right edge
    const infoNearRight = {
      ...mockInfo,
      x: 1800, // Close to 1920 width
      y: 100
    };

    const { container } = render(<SmartTooltip info={infoNearRight} />);
    const tooltip = container.querySelector('.fixed');

    // Tooltip should be positioned to the left of cursor
    const style = tooltip.style;
    const left = parseInt(style.left);
    expect(left).toBeLessThan(1800);
  });

  it('adjusts position when near bottom edge of viewport', () => {
    // Position near bottom edge
    const infoNearBottom = {
      ...mockInfo,
      x: 100,
      y: 1000 // Close to 1080 height
    };

    const { container } = render(<SmartTooltip info={infoNearBottom} />);
    const tooltip = container.querySelector('.fixed');

    // Tooltip should be positioned above cursor
    const style = tooltip.style;
    const top = parseInt(style.top);
    expect(top).toBeLessThan(1000);
  });

  it('applies minimum boundary constraints', () => {
    // Position at negative coordinates
    const infoAtNegative = {
      ...mockInfo,
      x: -100,
      y: -100
    };

    const { container } = render(<SmartTooltip info={infoAtNegative} />);
    const tooltip = container.querySelector('.fixed');

    // Should not be positioned at negative coordinates
    const style = tooltip.style;
    const left = parseInt(style.left);
    const top = parseInt(style.top);
    expect(left).toBeGreaterThanOrEqual(8);
    expect(top).toBeGreaterThanOrEqual(8);
  });

  it('maps all frequency codes correctly', () => {
    const frequencies = [
      { code: 'D', expected: 'Diario' },
      { code: 'S', expected: 'Semanal' },
      { code: 'M', expected: 'Mensual' },
      { code: 'Q', expected: 'Trimestral' },
      { code: 'T', expected: 'Trimestral' },
      { code: 'A', expected: 'Anual' },
      { code: 'N', expected: 'Nunca' },
      { code: 'P', expected: 'A Demanda' }
    ];

    frequencies.forEach(({ code, expected }) => {
      const { unmount } = render(
        <SmartTooltip
          info={{
            ...mockInfo,
            data: { ...mockData, frecuencia: code }
          }}
        />
      );
      expect(screen.getByText(expected)).toBeInTheDocument();
      unmount();
    });
  });

  it('maps all criticality codes correctly', () => {
    const criticalities = [
      { code: 'C', expected: 'Crítico' },
      { code: 'I', expected: 'Importante' },
      { code: 'D', expected: 'Deseable' },
      { code: 'N', expected: 'N/A' }
    ];

    criticalities.forEach(({ code, expected }) => {
      const { unmount } = render(
        <SmartTooltip
          info={{
            ...mockInfo,
            data: { ...mockData, criticidad: code }
          }}
        />
      );
      expect(screen.getByText(expected)).toBeInTheDocument();
      unmount();
    });
  });

  it('has high z-index for proper layering', () => {
    const { container } = render(<SmartTooltip info={mockInfo} />);
    const tooltip = container.querySelector('.z-\\[9999\\]');
    expect(tooltip).toBeInTheDocument();
  });

  it('applies pointer-events-none to prevent interaction', () => {
    const { container } = render(<SmartTooltip info={mockInfo} />);
    const tooltip = container.querySelector('.pointer-events-none');
    expect(tooltip).toBeInTheDocument();
  });
});
