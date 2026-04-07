import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import PlanFormModal from '../DevelopmentPlanFormModal';

// Mock react-dom createPortal to render inline
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return { ...actual, createPortal: (node) => node };
});

// Mock useFocusTrap
vi.mock('../../../hooks/useFocusTrap', () => ({
  default: vi.fn(),
}));

// Mock AuthContext
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    authFetch: vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }),
  }),
}));

// Mock API_BASE
vi.mock('../../../lib/apiBase', () => ({
  API_BASE: '',
}));

describe('DevelopmentPlanFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows warning when no collaborators are available', async () => {
    render(
      <PlanFormModal
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/No collaborators yet/)).toBeInTheDocument();
    });
  });

  it('renders modal title for new plan', () => {
    render(
      <PlanFormModal
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText('New Development Plan')).toBeInTheDocument();
  });
});
