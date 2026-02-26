import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StatCard from '../StatCard';
import { TrendingUp, AlertTriangle } from 'lucide-react';

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />
}));

// Mock framer-motion for InfoPopover
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }) => <>{children}</>
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

  it('renders InfoPopover when helpContent is provided', () => {
    render(
      <StatCard
        title="Test Metric"
        value={75}
        icon={TrendingUp}
        helpContent="This is help content for the metric"
      />
    );

    // Help icon button should be present
    const helpButton = screen.getByRole('button', { name: /Ayuda: Test Metric/i });
    expect(helpButton).toBeInTheDocument();
  });

  it('shows help popover content when help icon is clicked', () => {
    render(
      <StatCard
        title="Test Metric"
        value={75}
        icon={TrendingUp}
        helpContent="This is help content for the metric"
      />
    );

    const helpButton = screen.getByRole('button', { name: /Ayuda: Test Metric/i });
    fireEvent.click(helpButton);

    // Popover content should be visible
    expect(screen.getByText('This is help content for the metric')).toBeInTheDocument();
  });

  it('does not render InfoPopover when helpContent is not provided', () => {
    render(
      <StatCard
        title="Test Metric"
        value={75}
        icon={TrendingUp}
      />
    );

    // Help button should not exist
    expect(screen.queryByRole('button', { name: /Ayuda:/i })).not.toBeInTheDocument();
  });

  it('renders helpText when provided', () => {
    render(
      <StatCard
        title="Test Metric"
        value={75}
        icon={TrendingUp}
        helpText="Additional inline help text"
      />
    );

    expect(screen.getByText('Additional inline help text')).toBeInTheDocument();
  });

  it('can render both helpContent and helpText together', () => {
    render(
      <StatCard
        title="Test Metric"
        value={75}
        icon={TrendingUp}
        helpContent="Popover help content"
        helpText="Inline help text"
      />
    );

    // Inline text visible immediately
    expect(screen.getByText('Inline help text')).toBeInTheDocument();

    // Popover content only visible after click
    expect(screen.queryByText('Popover help content')).not.toBeInTheDocument();

    const helpButton = screen.getByRole('button', { name: /Ayuda: Test Metric/i });
    fireEvent.click(helpButton);

    expect(screen.getByText('Popover help content')).toBeInTheDocument();
  });
});
