import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// EvolutionChart restarts its draw animation whenever its `data` prop changes
// identity, so the page must hand it the same array until the data really changes.
const chartProps = [];
vi.mock('../../components/evolution/EvolutionChart', () => ({
  default: (props) => {
    chartProps.push(props);
    return <div data-testid="chart" />;
  },
}));
vi.mock('../../components/evolution/EvolutionList', () => ({ default: () => null }));

const apiData = {
  chartData: [
    { month: '2026-01', teamAverage: 2.5 },
    { month: '2026-02', teamAverage: 2.8 },
  ],
  employees: [],
  insights: {},
  meta: { currentMaturityIndex: 2.8, periodDelta: 0.3 },
};
let hookState;
vi.mock('../../hooks/useEvolutionData', () => ({
  useEvolutionData: () => hookState,
}));

const { default: EvolutionPage } = await import('../EvolutionPage');

function renderPage() {
  return render(
    <MemoryRouter>
      <EvolutionPage />
    </MemoryRouter>
  );
}

describe('EvolutionPage', () => {
  beforeEach(() => {
    chartProps.length = 0;
    hookState = { data: apiData, loading: false, error: null, timeRange: '12m', setTimeRange: vi.fn() };
  });

  it('keeps the chart data when the period menu is opened and closed', () => {
    renderPage();
    const first = chartProps.at(-1).data;
    expect(first.length).toBe(2);

    fireEvent.click(screen.getByRole('button', { name: /last 12 months/i }));
    expect(screen.getByRole('button', { name: /last 6 months/i })).toBeInTheDocument();
    // Close it with the trigger (the first match; the open menu lists the option too).
    fireEvent.click(screen.getAllByRole('button', { name: /last 12 months/i })[0]);
    expect(screen.queryByRole('button', { name: /last 6 months/i })).not.toBeInTheDocument();

    expect(chartProps.length).toBeGreaterThan(1);
    expect(chartProps.every((p) => p.data === first)).toBe(true);
  });

  it('passes new chart data when the data changes', () => {
    const { rerender } = renderPage();
    const first = chartProps.at(-1).data;

    hookState = { ...hookState, data: { ...apiData, chartData: [...apiData.chartData, { month: '2026-03', teamAverage: 3 }] } };
    rerender(
      <MemoryRouter>
        <EvolutionPage />
      </MemoryRouter>
    );

    expect(chartProps.at(-1).data).not.toBe(first);
    expect(chartProps.at(-1).data.length).toBe(3);
  });
});
