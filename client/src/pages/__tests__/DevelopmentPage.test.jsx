import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DevelopmentPage from '../DevelopmentPage';

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

// Mock API_BASE
vi.mock('../../lib/apiBase', () => ({
  API_BASE: '',
}));

const mockPlan = {
  id: 1,
  title: 'Q2 Growth Plan',
  description: 'Test plan',
  status: 'active',
  startDate: '2026-04-01',
  endDate: '2026-06-30',
  collaborator: { id: 1, nombre: 'Maria Garcia', rol: 'Developer' },
  goals: [
    {
      id: 1,
      title: 'Improve Testing',
      actions: [
        { id: 1, status: 'completed' },
        { id: 2, status: 'not_started' },
      ],
    },
  ],
};

const mockDraftPlan = {
  id: 2,
  title: 'Draft Plan',
  status: 'draft',
  collaborator: { id: 2, nombre: 'Juan Perez' },
  goals: [],
};

describe('DevelopmentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  const renderPage = () =>
    render(
      <MemoryRouter>
        <DevelopmentPage />
      </MemoryRouter>
    );

  it('renders "Development Plans" heading', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });
    renderPage();
    expect(screen.getByText('Development Plans')).toBeInTheDocument();
  });

  it('shows loading skeleton while fetching', () => {
    // Never resolve the fetch
    global.fetch.mockReturnValue(new Promise(() => {}));
    renderPage();
    // CardSkeleton renders animated divs; check loading state is shown
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no plans', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('No development plans yet')).toBeInTheDocument();
    });
  });

  it('renders plan cards when data is fetched', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockPlan, mockDraftPlan]),
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Q2 Growth Plan')).toBeInTheDocument();
      expect(screen.getByText('Draft Plan')).toBeInTheDocument();
    });
  });

  it('renders all filter chips', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });
    renderPage();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('filter chips trigger re-fetch with status parameter', async () => {
    // Initial fetch (all)
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockPlan]),
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Q2 Growth Plan')).toBeInTheDocument();
    });

    // Click "Draft" filter
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockDraftPlan]),
    });
    fireEvent.click(screen.getByText('Draft'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=draft')
      );
    });
  });

  it('does NOT show "New Plan" button (read-only page)', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([mockPlan]),
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Q2 Growth Plan')).toBeInTheDocument();
    });
    expect(screen.queryByText('New Plan')).not.toBeInTheDocument();
    expect(screen.queryByText(/new plan/i)).not.toBeInTheDocument();
  });

  it('shows filtered empty state message', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('No development plans yet')).toBeInTheDocument();
    });

    // Switch to Active filter
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });
    fireEvent.click(screen.getByText('Active'));

    await waitFor(() => {
      expect(screen.getByText('No active plans found. Create plans in Settings \u2192 Development.')).toBeInTheDocument();
    });
  });
});
