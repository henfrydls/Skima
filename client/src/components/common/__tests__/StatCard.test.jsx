import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard from '../StatCard';
import { TrendingUp, AlertTriangle } from 'lucide-react';

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />
}));

describe('StatCard', () => {
  it('renders basic card with title and value', () => {
    render(
      <StatCard
        title="Test Metric"
        value={75.5}
        icon={TrendingUp}
      />
    );

    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('75.5')).toBeInTheDocument();
  });

  it('renders with subtext when provided', () => {
    render(
      <StatCard
        title="Test Metric"
        value={75.5}
        subtext="Additional information"
        icon={TrendingUp}
      />
    );

    expect(screen.getByText('Additional information')).toBeInTheDocument();
  });

  it('renders with suffix when provided', () => {
    render(
      <StatCard
        title="Coverage"
        value={85}
        suffix="%"
        icon={TrendingUp}
      />
    );

    expect(screen.getByText('85.0%')).toBeInTheDocument();
  });

  it('displays positive delta with TrendingUp icon', () => {
    render(
      <StatCard
        title="Test Metric"
        value={80}
        trend={5.5}
        icon={TrendingUp}
      />
    );

    // Should show +5.5
    expect(screen.getByText('+5.5')).toBeInTheDocument();
  });

  it('displays negative delta with TrendingDown icon', () => {
    render(
      <StatCard
        title="Test Metric"
        value={70}
        trend={-3.2}
        icon={TrendingUp}
      />
    );

    expect(screen.getByText('-3.2')).toBeInTheDocument();
  });

  it('calculates delta from previousValue when trend not provided', () => {
    render(
      <StatCard
        title="Test Metric"
        value={80}
        previousValue={75}
        icon={TrendingUp}
      />
    );

    // Delta should be 80 - 75 = +5.0
    expect(screen.getByText('+5.0')).toBeInTheDocument();
  });

  it('shows neutral indicator for very small deltas', () => {
    render(
      <StatCard
        title="Test Metric"
        value={75.02}
        previousValue={75}
        icon={TrendingUp}
      />
    );

    // Delta < 0.05 should show as 0.0
    expect(screen.getByText('0.0')).toBeInTheDocument();
  });

  it('inverts delta colors when invertDelta is true', () => {
    const { container } = render(
      <StatCard
        title="Risk Metric"
        value={10}
        trend={-5}
        invertDelta={true}
        icon={AlertTriangle}
      />
    );

    // Negative delta should be green (good) when inverted
    const deltaElement = container.querySelector('.text-emerald-600');
    expect(deltaElement).toBeInTheDocument();
  });

  it('renders sparkline when sparklineData provided', () => {
    const sparklineData = [10, 15, 12, 18, 20];

    render(
      <StatCard
        title="Test Metric"
        value={20}
        sparklineData={sparklineData}
        icon={TrendingUp}
      />
    );

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('does not render sparkline when data is insufficient', () => {
    const sparklineData = [10]; // Only 1 data point

    render(
      <StatCard
        title="Test Metric"
        value={10}
        sparklineData={sparklineData}
        icon={TrendingUp}
      />
    );

    expect(screen.queryByTestId('responsive-container')).not.toBeInTheDocument();
  });

  it('applies correct color scheme for different color props', () => {
    const { container } = render(
      <StatCard
        title="Test Metric"
        value={75}
        color="emerald"
        icon={TrendingUp}
      />
    );

    const iconContainer = container.querySelector('.text-emerald-600');
    expect(iconContainer).toBeInTheDocument();
  });

  it('defaults to indigo color when no color specified', () => {
    const { container } = render(
      <StatCard
        title="Test Metric"
        value={75}
        icon={TrendingUp}
      />
    );

    const iconContainer = container.querySelector('.text-indigo-600');
    expect(iconContainer).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const { container } = render(
      <StatCard
        title="Test Metric"
        value={75}
        icon={TrendingUp}
      />
    );

    // Icon should be rendered inside the colored container
    const iconContainer = container.querySelector('.text-indigo-600');
    expect(iconContainer).toBeInTheDocument();
  });

  it('handles non-numeric values', () => {
    render(
      <StatCard
        title="Status"
        value="Active"
        icon={TrendingUp}
      />
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('does not render delta when no trend or previousValue provided', () => {
    render(
      <StatCard
        title="Test Metric"
        value={75}
        icon={TrendingUp}
      />
    );

    // No delta should be shown
    expect(screen.queryByText(/\+/)).not.toBeInTheDocument();
    expect(screen.queryByText(/-/)).not.toBeInTheDocument();
  });

  it('applies hover effects via class', () => {
    const { container } = render(
      <StatCard
        title="Test Metric"
        value={75}
        icon={TrendingUp}
      />
    );

    const card = container.querySelector('.hover\\:shadow-md');
    expect(card).toBeInTheDocument();
  });
});
