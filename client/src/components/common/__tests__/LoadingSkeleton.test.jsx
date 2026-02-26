import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  TableSkeleton,
  MatrixSkeleton,
  KPISkeleton,
  CardSkeleton,
  DashboardSkeleton,
  CollaboratorListSkeleton,
  EvolutionSkeleton
} from '../LoadingSkeleton';

describe('LoadingSkeleton Components', () => {
  describe('TableSkeleton', () => {
    it('renders default number of skeleton rows', () => {
      const { container } = render(<TableSkeleton />);
      const rows = container.querySelectorAll('.space-y-3 > div');
      expect(rows.length).toBe(5); // Default is 5 rows
    });

    it('renders custom number of skeleton rows', () => {
      const { container } = render(<TableSkeleton rows={8} />);
      const rows = container.querySelectorAll('.space-y-3 > div');
      expect(rows.length).toBe(8);
    });

    it('applies animate-pulse class', () => {
      const { container } = render(<TableSkeleton />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('renders header skeleton', () => {
      const { container } = render(<TableSkeleton />);
      const header = container.querySelector('.h-6.bg-gray-200');
      expect(header).toBeInTheDocument();
    });
  });

  describe('MatrixSkeleton', () => {
    it('renders default number of column skeletons', () => {
      const { container } = render(<MatrixSkeleton />);
      // Should have 5 avatar circles in header (default columns)
      const avatars = container.querySelectorAll('.w-8.h-8.bg-gray-200.rounded-full');
      expect(avatars.length).toBeGreaterThanOrEqual(5);
    });

    it('renders custom number of column skeletons', () => {
      const { container } = render(<MatrixSkeleton columns={7} />);
      // Check for presence of columns (simplified check)
      const avatars = container.querySelectorAll('.w-8.h-8.bg-gray-200.rounded-full');
      expect(avatars.length).toBeGreaterThanOrEqual(7);
    });

    it('renders category headers', () => {
      const { container } = render(<MatrixSkeleton />);
      // Should have 2 category headers with chevron icons
      const categoryHeaders = container.querySelectorAll('.bg-gray-50.p-3');
      expect(categoryHeaders.length).toBe(2);
    });

    it('renders skill rows within categories', () => {
      const { container } = render(<MatrixSkeleton />);
      // Should have skill name skeletons
      const skillNames = container.querySelectorAll('.w-\\[280px\\].h-4.bg-gray-200');
      expect(skillNames.length).toBeGreaterThan(0);
    });

    it('applies animate-pulse class', () => {
      const { container } = render(<MatrixSkeleton />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('KPISkeleton', () => {
    it('renders centered skeleton structure', () => {
      const { container } = render(<KPISkeleton />);
      const centered = container.querySelector('.text-center.animate-pulse');
      expect(centered).toBeInTheDocument();
    });

    it('renders main metric skeleton (large)', () => {
      const { container } = render(<KPISkeleton />);
      const largeMetric = container.querySelector('.h-20.bg-gray-200');
      expect(largeMetric).toBeInTheDocument();
    });

    it('renders secondary metrics skeleton', () => {
      const { container } = render(<KPISkeleton />);
      const secondaryMetrics = container.querySelectorAll('.h-4.bg-gray-200');
      expect(secondaryMetrics.length).toBeGreaterThan(0);
    });

    it('applies animate-pulse class', () => {
      const { container } = render(<KPISkeleton />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('CardSkeleton', () => {
    it('renders card with title skeleton', () => {
      const { container } = render(<CardSkeleton />);
      const title = container.querySelector('.h-5.bg-gray-200');
      expect(title).toBeInTheDocument();
    });

    it('renders content lines skeleton', () => {
      const { container } = render(<CardSkeleton />);
      const lines = container.querySelectorAll('.space-y-2 > div');
      expect(lines.length).toBe(2);
    });

    it('applies animate-pulse class', () => {
      const { container } = render(<CardSkeleton />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('DashboardSkeleton', () => {
    it('renders header skeleton', () => {
      const { container } = render(<DashboardSkeleton />);
      const header = container.querySelector('.h-10.bg-gray-200');
      expect(header).toBeInTheDocument();
    });

    it('renders snapshot selector skeleton', () => {
      const { container } = render(<DashboardSkeleton />);
      // Look for snapshot selector section
      const snapshotSection = container.querySelector('.bg-surface.p-4.rounded-lg.shadow-sm');
      expect(snapshotSection).toBeInTheDocument();
    });

    it('renders health score section skeleton', () => {
      const { container } = render(<DashboardSkeleton />);
      // Look for large metric skeleton
      const healthScore = container.querySelector('.h-20.bg-gray-200');
      expect(healthScore).toBeInTheDocument();
    });

    it('renders distribution and gaps grid', () => {
      const { container } = render(<DashboardSkeleton />);
      // Look for grid layout
      const grid = container.querySelector('.grid.lg\\:grid-cols-2');
      expect(grid).toBeInTheDocument();
    });

    it('renders quick actions skeleton', () => {
      const { container } = render(<DashboardSkeleton />);
      // Look for action buttons grid
      const actionsGrid = container.querySelectorAll('.grid.grid-cols-2.md\\:grid-cols-4');
      expect(actionsGrid.length).toBeGreaterThan(0);
    });

    it('renders progress bar skeleton', () => {
      const { container } = render(<DashboardSkeleton />);
      const progressBar = container.querySelector('.h-2.bg-gray-200.rounded-full');
      expect(progressBar).toBeInTheDocument();
    });

    it('applies animate-pulse class', () => {
      const { container } = render(<DashboardSkeleton />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('CollaboratorListSkeleton', () => {
    it('renders default number of collaborator cards', () => {
      const { container } = render(<CollaboratorListSkeleton />);
      const cards = container.querySelectorAll('.border.border-gray-200.rounded-lg');
      expect(cards.length).toBe(5); // Default count
    });

    it('renders custom number of collaborator cards', () => {
      const { container } = render(<CollaboratorListSkeleton count={3} />);
      const cards = container.querySelectorAll('.border.border-gray-200.rounded-lg');
      expect(cards.length).toBe(3);
    });

    it('renders collaborator name and role skeleton', () => {
      const { container } = render(<CollaboratorListSkeleton />);
      // Each card should have name and role
      const names = container.querySelectorAll('.h-5.bg-gray-200');
      expect(names.length).toBeGreaterThan(0);
    });

    it('renders score skeleton', () => {
      const { container } = render(<CollaboratorListSkeleton />);
      // Each card should have score display
      const scores = container.querySelectorAll('.h-8.bg-gray-200');
      expect(scores.length).toBeGreaterThan(0);
    });

    it('renders skill metrics skeleton', () => {
      const { container } = render(<CollaboratorListSkeleton />);
      // Each card should have multiple skill metrics (6 in the implementation)
      const firstCard = container.querySelector('.border.border-gray-200.rounded-lg');
      const metrics = firstCard.querySelectorAll('.text-center');
      expect(metrics.length).toBe(6);
    });

    it('applies animate-pulse class', () => {
      const { container } = render(<CollaboratorListSkeleton />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('EvolutionSkeleton', () => {
    it('renders header skeleton', () => {
      const { container } = render(<EvolutionSkeleton />);
      const header = container.querySelector('.h-8.bg-gray-200');
      expect(header).toBeInTheDocument();
    });

    it('renders 3 stat cards', () => {
      const { container } = render(<EvolutionSkeleton />);
      const statCards = container.querySelectorAll('.grid-cols-1.md\\:grid-cols-3 > div');
      expect(statCards.length).toBe(3);
    });

    it('renders chart area with bars', () => {
      const { container } = render(<EvolutionSkeleton />);
      const chartBars = container.querySelectorAll('.bg-gray-200.rounded-t');
      expect(chartBars.length).toBe(12);
    });

    it('renders list area with 4 items', () => {
      const { container } = render(<EvolutionSkeleton />);
      const listItems = container.querySelectorAll('.border.border-gray-100.rounded-lg');
      expect(listItems.length).toBe(4);
    });

    it('applies animate-pulse class', () => {
      const { container } = render(<EvolutionSkeleton />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('General skeleton behavior', () => {
    it('all skeletons have gray-200 background for skeleton bars', () => {
      const components = [
        <TableSkeleton key="table" />,
        <MatrixSkeleton key="matrix" />,
        <KPISkeleton key="kpi" />,
        <CardSkeleton key="card" />,
        <DashboardSkeleton key="dashboard" />,
        <CollaboratorListSkeleton key="collab" />
      ];

      components.forEach(component => {
        const { container, unmount } = render(component);
        const grayElements = container.querySelectorAll('.bg-gray-200');
        expect(grayElements.length).toBeGreaterThan(0);
        unmount();
      });
    });

    it('all skeletons apply rounded corners', () => {
      const components = [
        <TableSkeleton key="table" />,
        <MatrixSkeleton key="matrix" />,
        <KPISkeleton key="kpi" />,
        <CardSkeleton key="card" />,
        <DashboardSkeleton key="dashboard" />,
        <CollaboratorListSkeleton key="collab" />
      ];

      components.forEach(component => {
        const { container, unmount } = render(component);
        const roundedElements = container.querySelectorAll('[class*="rounded"]');
        expect(roundedElements.length).toBeGreaterThan(0);
        unmount();
      });
    });
  });
});
