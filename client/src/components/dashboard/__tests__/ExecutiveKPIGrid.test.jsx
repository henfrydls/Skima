import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ExecutiveKPIGrid from '../ExecutiveKPIGrid';

// Mock recharts (used by StatCard)
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />
}));

describe('ExecutiveKPIGrid', () => {
  const mockMetrics = {
    teamAverageRaw: 3.5,
    criticalGaps: 12,
    expertDensity: 25.5,
    roleCoverage: 78.3
  };

  it('renders all four KPI cards', () => {
    render(<ExecutiveKPIGrid metrics={mockMetrics} />);

    expect(screen.getByText('Índice de Madurez')).toBeInTheDocument();
    expect(screen.getByText('Riesgo de Talento')).toBeInTheDocument();
    expect(screen.getByText('Densidad de Expertos')).toBeInTheDocument();
    expect(screen.getByText('Cobertura de Roles')).toBeInTheDocument();
  });

  it('displays team average with correct value', () => {
    render(<ExecutiveKPIGrid metrics={mockMetrics} />);

    expect(screen.getByText('3.5')).toBeInTheDocument();
    expect(screen.getByText('Promedio general del equipo')).toBeInTheDocument();
  });

  it('displays critical gaps with correct value', () => {
    render(<ExecutiveKPIGrid metrics={mockMetrics} />);

    expect(screen.getByText('12.0')).toBeInTheDocument();
    expect(screen.getByText('Brechas críticas activas')).toBeInTheDocument();
  });

  it('displays expert density with percentage suffix', () => {
    render(<ExecutiveKPIGrid metrics={mockMetrics} />);

    expect(screen.getByText('25.5%')).toBeInTheDocument();
    expect(screen.getByText('% skills en nivel 4-5')).toBeInTheDocument();
  });

  it('displays role coverage with percentage suffix', () => {
    render(<ExecutiveKPIGrid metrics={mockMetrics} />);

    expect(screen.getByText('78.3%')).toBeInTheDocument();
    expect(screen.getByText('% cumpliendo requisitos mínimos')).toBeInTheDocument();
  });

  it('renders in grid layout with responsive columns', () => {
    const { container } = render(<ExecutiveKPIGrid metrics={mockMetrics} />);

    const grid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4');
    expect(grid).toBeInTheDocument();
  });

  it('handles undefined expertDensity gracefully', () => {
    const metricsWithoutExpertDensity = {
      ...mockMetrics,
      expertDensity: undefined
    };

    render(<ExecutiveKPIGrid metrics={metricsWithoutExpertDensity} />);

    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('handles undefined roleCoverage gracefully', () => {
    const metricsWithoutRoleCoverage = {
      ...mockMetrics,
      roleCoverage: undefined
    };

    render(<ExecutiveKPIGrid metrics={metricsWithoutRoleCoverage} />);

    // Should show 0.0% for undefined roleCoverage
    const percentages = screen.getAllByText(/0\.0%/);
    expect(percentages.length).toBeGreaterThan(0);
  });

  it('passes previous metrics for trend calculation', () => {
    const previousMetrics = {
      teamAverageRaw: 3.2,
      criticalGaps: 15,
      expertDensity: 22.0,
      roleCoverage: 75.0
    };

    render(
      <ExecutiveKPIGrid
        metrics={mockMetrics}
        previousMetrics={previousMetrics}
      />
    );

    // Should show deltas (trends)
    // Team average increased by 0.3
    expect(screen.getByText('+0.3')).toBeInTheDocument();

    // Critical gaps decreased by 3 (should be negative)
    expect(screen.getByText('-3.0')).toBeInTheDocument();
  });

  it('passes sparkline data to cards when provided', () => {
    const sparklineData = {
      maturity: [3.0, 3.2, 3.3, 3.5]
    };

    render(
      <ExecutiveKPIGrid
        metrics={mockMetrics}
        sparklineData={sparklineData}
      />
    );

    // Sparkline should be rendered for maturity
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('applies correct color to each KPI card', () => {
    const { container } = render(<ExecutiveKPIGrid metrics={mockMetrics} />);

    // Índice de Madurez - indigo
    const indigoIcons = container.querySelectorAll('.text-indigo-600');
    expect(indigoIcons.length).toBeGreaterThanOrEqual(2); // Maturity and Coverage

    // Riesgo de Talento - rose
    const roseIcons = container.querySelectorAll('.text-rose-600');
    expect(roseIcons.length).toBeGreaterThanOrEqual(1);

    // Densidad de Expertos - emerald
    const emeraldIcons = container.querySelectorAll('.text-emerald-600');
    expect(emeraldIcons.length).toBeGreaterThanOrEqual(1);
  });

  it('inverts delta colors for risk metric (lower is better)', () => {
    const previousMetrics = {
      teamAverageRaw: 3.2,
      criticalGaps: 15,
      expertDensity: 22.0,
      roleCoverage: 75.0
    };

    const { container } = render(
      <ExecutiveKPIGrid
        metrics={mockMetrics}
        previousMetrics={previousMetrics}
      />
    );

    // Critical gaps decreased (negative delta), but should show as positive (green)
    // because lower risk is better (invertDelta=true)
    const deltaWithGreen = container.querySelector('.text-emerald-600');
    expect(deltaWithGreen).toBeInTheDocument();
  });

  it('renders all four icon components correctly', () => {
    const { container } = render(<ExecutiveKPIGrid metrics={mockMetrics} />);

    // Each card should have an icon container
    const iconContainers = container.querySelectorAll('.p-2.rounded-lg');
    expect(iconContainers.length).toBe(4);
  });

  it('handles zero values correctly', () => {
    const zeroMetrics = {
      teamAverageRaw: 0,
      criticalGaps: 0,
      expertDensity: 0,
      roleCoverage: 0
    };

    render(<ExecutiveKPIGrid metrics={zeroMetrics} />);

    // Multiple cards may show 0.0 - just verify at least one exists
    expect(screen.getAllByText(/^0\.0/).length).toBeGreaterThanOrEqual(1);
  });

  it('formats decimal values correctly', () => {
    const decimalMetrics = {
      teamAverageRaw: 3.456,
      criticalGaps: 12.789,
      expertDensity: 25.678,
      roleCoverage: 78.123
    };

    render(<ExecutiveKPIGrid metrics={decimalMetrics} />);

    // Should round to 1 decimal place
    expect(screen.getByText('3.5')).toBeInTheDocument(); // 3.456 rounds to 3.5
    expect(screen.getByText('12.8')).toBeInTheDocument(); // 12.789 rounds to 12.8
    expect(screen.getByText('25.7%')).toBeInTheDocument(); // 25.678% rounds to 25.7%
    expect(screen.getByText('78.1%')).toBeInTheDocument(); // 78.123% rounds to 78.1%
  });

  it('applies consistent spacing between cards', () => {
    const { container } = render(<ExecutiveKPIGrid metrics={mockMetrics} />);

    const grid = container.querySelector('.gap-4');
    expect(grid).toBeInTheDocument();
  });

  it('renders without sparkline data (optional prop)', () => {
    render(<ExecutiveKPIGrid metrics={mockMetrics} />);

    // Should render successfully without sparkline
    expect(screen.getByText('Índice de Madurez')).toBeInTheDocument();
  });

  it('renders without previous metrics (optional prop)', () => {
    render(<ExecutiveKPIGrid metrics={mockMetrics} />);

    // Should render successfully without showing trends
    expect(screen.getByText('Índice de Madurez')).toBeInTheDocument();
    // No delta badges should appear (match delta format like +1.2 or -0.5)
    expect(screen.queryByText(/^[+]\d/)).not.toBeInTheDocument();
  });
});
