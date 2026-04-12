import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DevelopmentTab from '../DevelopmentTab';

// Mock react-dom createPortal to render inline
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return { ...actual, createPortal: (node) => node };
});

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

// Mock AuthContext
const mockAuthFetch = vi.fn();
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    authFetch: mockAuthFetch,
  }),
}));

// Mock API_BASE
vi.mock('../../../lib/apiBase', () => ({
  API_BASE: '',
}));

// Mock child modals to avoid their own fetch/context dependencies
vi.mock('../DevelopmentPlanFormModal', () => ({
  default: ({ onClose }) => (
    <div data-testid="plan-form-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock('../DevelopmentGoalFormModal', () => ({
  default: ({ onClose }) => (
    <div data-testid="goal-form-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock('../DevelopmentActionFormModal', () => ({
  default: ({ onClose }) => (
    <div data-testid="action-form-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock('../../common/ConfirmModal', () => ({
  default: ({ isOpen, onConfirm, onCancel, message }) =>
    isOpen ? (
      <div data-testid="confirm-modal">
        <span>{message}</span>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null,
}));

vi.mock('../../auth/LoginModal', () => ({
  default: ({ onClose }) => (
    <div data-testid="login-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

// --- Mock data covering all 4 statuses ---
const mockActivePlan = {
  id: 1,
  title: 'Q2 Growth Plan',
  description: 'Active plan description',
  status: 'active',
  collaboratorId: 10,
  collaborator: { id: 10, nombre: 'Maria Garcia', rol: 'Developer' },
  startDate: '2026-04-01',
  endDate: '2026-06-30',
  goals: [],
};

const mockDraftPlan = {
  id: 2,
  title: 'Backend Upskilling',
  description: null,
  status: 'draft',
  collaboratorId: 11,
  collaborator: { id: 11, nombre: 'Carlos Lopez', rol: 'Engineer' },
  startDate: null,
  endDate: null,
  goals: [],
};

const mockCompletedPlan = {
  id: 3,
  title: 'Onboarding Plan',
  description: null,
  status: 'completed',
  collaboratorId: 12,
  collaborator: { id: 12, nombre: 'Ana Torres', rol: 'Designer' },
  startDate: '2026-01-01',
  completedAt: '2026-03-15',
  goals: [],
};

const mockCancelledPlan = {
  id: 4,
  title: 'Cancelled Initiative',
  description: null,
  status: 'cancelled',
  collaboratorId: 13,
  collaborator: { id: 13, nombre: 'Luis Reyes', rol: 'QA' },
  startDate: null,
  endDate: null,
  goals: [],
};

// The API returns them in already-sorted order (server-side sorting happens in the component)
const allPlans = [mockActivePlan, mockCompletedPlan, mockDraftPlan, mockCancelledPlan];

const mockCollaborators = [
  { id: 10, nombre: 'Maria Garcia' },
  { id: 11, nombre: 'Carlos Lopez' },
  { id: 12, nombre: 'Ana Torres' },
  { id: 13, nombre: 'Luis Reyes' },
];

// Helper to set up fetch for all required endpoints
function setupFetch(plans = allPlans) {
  global.fetch = vi.fn((url) => {
    if (url.includes('/api/development-plans') && !url.match(/\/\d+/)) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(plans),
      });
    }
    if (url.includes('/api/data')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ skills: [], categories: [] }),
      });
    }
    if (url.includes('/api/collaborators')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockCollaborators),
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  });
}

describe('DevelopmentTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupFetch();
  });

  const renderTab = () => render(<DevelopmentTab isActive={true} />);

  // --- Loading state ---
  it('shows loading skeleton while fetching', () => {
    global.fetch = vi.fn(() => new Promise(() => {})); // never resolves
    renderTab();
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  // --- Renders plans ---
  it('renders all plan titles after loading', async () => {
    renderTab();
    await waitFor(() => {
      expect(screen.getByText('Q2 Growth Plan')).toBeInTheDocument();
      expect(screen.getByText('Backend Upskilling')).toBeInTheDocument();
      expect(screen.getByText('Onboarding Plan')).toBeInTheDocument();
      expect(screen.getByText('Cancelled Initiative')).toBeInTheDocument();
    });
  });

  it('renders collaborator names alongside plan titles', async () => {
    renderTab();
    await waitFor(() => {
      expect(screen.getByText('Maria Garcia')).toBeInTheDocument();
      expect(screen.getByText('Carlos Lopez')).toBeInTheDocument();
    });
  });

  it('shows plan count in the header', async () => {
    renderTab();
    await waitFor(() => {
      expect(screen.getByText('4 plans')).toBeInTheDocument();
    });
  });

  it('shows empty state when no plans exist', async () => {
    setupFetch([]);
    renderTab();
    await waitFor(() => {
      expect(screen.getByText('No development plans')).toBeInTheDocument();
    });
  });

  it('renders "New Plan" button', async () => {
    renderTab();
    await waitFor(() => {
      expect(screen.getByText(/New Plan/i)).toBeInTheDocument();
    });
  });

  // --- Sort order: active first, then completed, draft, cancelled ---
  it('displays active plans before completed, draft, and cancelled', async () => {
    // The component sorts in fetchPlans: active=0, completed=1, draft=2, cancelled=3
    // Feed them in reverse order to verify sorting
    setupFetch([mockCancelledPlan, mockDraftPlan, mockCompletedPlan, mockActivePlan]);
    renderTab();
    await waitFor(() => {
      const planTitles = screen
        .getAllByRole('button', { name: /edit plan|delete plan|Read-only/i })
        // fallback: check text order via all visible plan titles
        .map((el) => el.closest('[data-testid]'));
      // Use a simpler approach: get all plan title spans in document order
      const titles = screen
        .getAllByText(/Q2 Growth Plan|Backend Upskilling|Onboarding Plan|Cancelled Initiative/)
        .map((el) => el.textContent);
      expect(titles[0]).toBe('Q2 Growth Plan');     // active first
    });
  });

  // --- Search filter ---
  describe('Search filter', () => {
    it('renders the search input', async () => {
      renderTab();
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search plan...')).toBeInTheDocument();
      });
    });

    it('filters plans by title', async () => {
      renderTab();
      await waitFor(() => screen.getByText('Q2 Growth Plan'));

      fireEvent.change(screen.getByPlaceholderText('Search plan...'), {
        target: { value: 'Q2' },
      });

      expect(screen.getByText('Q2 Growth Plan')).toBeInTheDocument();
      expect(screen.queryByText('Backend Upskilling')).not.toBeInTheDocument();
      expect(screen.queryByText('Onboarding Plan')).not.toBeInTheDocument();
    });

    it('filters plans by status text', async () => {
      renderTab();
      await waitFor(() => screen.getByText('Q2 Growth Plan'));

      fireEvent.change(screen.getByPlaceholderText('Search plan...'), {
        target: { value: 'cancelled' },
      });

      expect(screen.getByText('Cancelled Initiative')).toBeInTheDocument();
      expect(screen.queryByText('Q2 Growth Plan')).not.toBeInTheDocument();
    });

    it('filters plans by collaborator name', async () => {
      renderTab();
      await waitFor(() => screen.getByText('Q2 Growth Plan'));

      fireEvent.change(screen.getByPlaceholderText('Search plan...'), {
        target: { value: 'Ana Torres' },
      });

      expect(screen.getByText('Onboarding Plan')).toBeInTheDocument();
      expect(screen.queryByText('Q2 Growth Plan')).not.toBeInTheDocument();
    });

    it('shows "No matching plans" and hides list when no results match', async () => {
      renderTab();
      await waitFor(() => screen.getByText('Q2 Growth Plan'));

      fireEvent.change(screen.getByPlaceholderText('Search plan...'), {
        target: { value: 'xyznotfound' },
      });

      expect(screen.getByText('No matching plans')).toBeInTheDocument();
      expect(screen.queryByText('Q2 Growth Plan')).not.toBeInTheDocument();
    });

    it('shows "Try a different search term." description when no results', async () => {
      renderTab();
      await waitFor(() => screen.getByText('Q2 Growth Plan'));

      fireEvent.change(screen.getByPlaceholderText('Search plan...'), {
        target: { value: 'noresult' },
      });

      expect(screen.getByText('Try a different search term.')).toBeInTheDocument();
    });

    it('updates the plan count label as results are filtered', async () => {
      renderTab();
      await waitFor(() => screen.getByText('4 plans'));

      fireEvent.change(screen.getByPlaceholderText('Search plan...'), {
        target: { value: 'Q2' },
      });

      expect(screen.getByText('1 plan')).toBeInTheDocument();
    });

    it('restores full list when search is cleared', async () => {
      renderTab();
      await waitFor(() => screen.getByText('Q2 Growth Plan'));

      const input = screen.getByPlaceholderText('Search plan...');
      fireEvent.change(input, { target: { value: 'Q2' } });
      expect(screen.queryByText('Backend Upskilling')).not.toBeInTheDocument();

      fireEvent.change(input, { target: { value: '' } });
      expect(screen.getByText('Backend Upskilling')).toBeInTheDocument();
    });
  });

  // --- Edit/Delete permissions by status ---
  describe('Edit and delete button permissions', () => {
    it('shows Edit2 icon button for active plan', async () => {
      setupFetch([mockActivePlan]);
      renderTab();
      await waitFor(() => screen.getByText('Q2 Growth Plan'));
      expect(screen.getByTitle('Edit plan')).toBeInTheDocument();
    });

    it('shows Trash2 icon button for active plan', async () => {
      setupFetch([mockActivePlan]);
      renderTab();
      await waitFor(() => screen.getByText('Q2 Growth Plan'));
      expect(screen.getByTitle('Delete plan')).toBeInTheDocument();
    });

    it('shows Edit2 icon button for draft plan', async () => {
      setupFetch([mockDraftPlan]);
      renderTab();
      await waitFor(() => screen.getByText('Backend Upskilling'));
      expect(screen.getByTitle('Edit plan')).toBeInTheDocument();
    });

    it('shows Trash2 icon button for draft plan', async () => {
      setupFetch([mockDraftPlan]);
      renderTab();
      await waitFor(() => screen.getByText('Backend Upskilling'));
      expect(screen.getByTitle('Delete plan')).toBeInTheDocument();
    });

    it('shows Lock icon instead of Edit2 for completed plan', async () => {
      setupFetch([mockCompletedPlan]);
      renderTab();
      await waitFor(() => screen.getByText('Onboarding Plan'));
      // Both edit and delete should be locked for completed
      const readOnlyIcons = screen.getAllByTitle('Read-only');
      expect(readOnlyIcons.length).toBe(2); // edit locked + delete locked
      expect(screen.queryByTitle('Edit plan')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Delete plan')).not.toBeInTheDocument();
    });

    it('shows Lock icon for edit but Trash2 for delete on cancelled plan', async () => {
      setupFetch([mockCancelledPlan]);
      renderTab();
      await waitFor(() => screen.getByText('Cancelled Initiative'));
      // Edit is locked; delete is allowed
      expect(screen.getByTitle('Read-only')).toBeInTheDocument();  // edit lock
      expect(screen.getByTitle('Delete plan')).toBeInTheDocument(); // delete still available
      expect(screen.queryByTitle('Edit plan')).not.toBeInTheDocument();
    });

    it('opens plan form modal when edit button is clicked on active plan', async () => {
      setupFetch([mockActivePlan]);
      renderTab();
      await waitFor(() => screen.getByText('Q2 Growth Plan'));
      fireEvent.click(screen.getByTitle('Edit plan'));
      expect(screen.getByTestId('plan-form-modal')).toBeInTheDocument();
    });

    it('opens confirm modal when delete button is clicked on active plan', async () => {
      setupFetch([mockActivePlan]);
      renderTab();
      await waitFor(() => screen.getByText('Q2 Growth Plan'));
      fireEvent.click(screen.getByTitle('Delete plan'));
      expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
    });
  });

  // --- Add Goal / Add Action visibility ---
  describe('Add Goal and Add Action button visibility', () => {
    async function expandPlan(planTitle) {
      const planRow = screen.getByText(planTitle).closest('[role="button"]');
      fireEvent.click(planRow);
    }

    it('shows "Add Goal" button when active plan is expanded', async () => {
      setupFetch([mockActivePlan]);
      renderTab();
      await waitFor(() => screen.getByText('Q2 Growth Plan'));
      await expandPlan('Q2 Growth Plan');
      expect(screen.getByText(/Add Goal/i)).toBeInTheDocument();
    });

    it('shows "Add Goal" button when draft plan is expanded', async () => {
      setupFetch([mockDraftPlan]);
      renderTab();
      await waitFor(() => screen.getByText('Backend Upskilling'));
      await expandPlan('Backend Upskilling');
      expect(screen.getByText(/Add Goal/i)).toBeInTheDocument();
    });

    it('hides "Add Goal" button when completed plan is expanded', async () => {
      setupFetch([mockCompletedPlan]);
      renderTab();
      await waitFor(() => screen.getByText('Onboarding Plan'));
      await expandPlan('Onboarding Plan');
      expect(screen.queryByText(/Add Goal/i)).not.toBeInTheDocument();
    });

    it('hides "Add Goal" button when cancelled plan is expanded', async () => {
      setupFetch([mockCancelledPlan]);
      renderTab();
      await waitFor(() => screen.getByText('Cancelled Initiative'));
      await expandPlan('Cancelled Initiative');
      expect(screen.queryByText(/Add Goal/i)).not.toBeInTheDocument();
    });

    it('shows "Add Action" button when active plan with a goal is expanded', async () => {
      const planWithGoal = {
        ...mockActivePlan,
        goals: [
          {
            id: 101,
            title: 'Learn TypeScript',
            status: 'active',
            priority: 'high',
            actions: [],
          },
        ],
      };
      setupFetch([planWithGoal]);
      renderTab();
      await waitFor(() => screen.getByText('Q2 Growth Plan'));

      // Expand plan
      fireEvent.click(screen.getByText('Q2 Growth Plan').closest('[role="button"]'));
      // Expand goal
      await waitFor(() => screen.getByText('Learn TypeScript'));
      fireEvent.click(screen.getByText('Learn TypeScript').closest('[role="button"]'));

      await waitFor(() => {
        expect(screen.getByText(/Add Action/i)).toBeInTheDocument();
      });
    });

    it('hides "Add Action" button when completed plan goal is expanded', async () => {
      const completedPlanWithGoal = {
        ...mockCompletedPlan,
        goals: [
          {
            id: 102,
            title: 'Completed Goal',
            status: 'completed',
            priority: 'medium',
            actions: [],
          },
        ],
      };
      setupFetch([completedPlanWithGoal]);
      renderTab();
      await waitFor(() => screen.getByText('Onboarding Plan'));

      // Expand plan
      fireEvent.click(screen.getByText('Onboarding Plan').closest('[role="button"]'));
      // Expand goal
      await waitFor(() => screen.getByText('Completed Goal'));
      fireEvent.click(screen.getByText('Completed Goal').closest('[role="button"]'));

      await waitFor(() => {
        expect(screen.queryByText(/Add Action/i)).not.toBeInTheDocument();
      });
    });
  });

  // --- ActionStatusDropdown disabled state ---
  describe('ActionStatusDropdown disabled for completed/cancelled plans', () => {
    function makePlanWithAction(basePlan, actionStatus = 'not_started') {
      return {
        ...basePlan,
        goals: [
          {
            id: 200,
            title: 'Test Goal',
            status: 'active',
            priority: 'medium',
            actions: [
              {
                id: 300,
                title: 'Test Action',
                type: 'experience',
                status: actionStatus,
              },
            ],
          },
        ],
      };
    }

    async function expandToActions(planTitle, goalTitle) {
      await waitFor(() => screen.getByText(planTitle));
      fireEvent.click(screen.getByText(planTitle).closest('[role="button"]'));
      await waitFor(() => screen.getByText(goalTitle));
      fireEvent.click(screen.getByText(goalTitle).closest('[role="button"]'));
    }

    it('action status badge has "cursor-default" class (disabled) for completed plan', async () => {
      const plan = makePlanWithAction(mockCompletedPlan);
      setupFetch([plan]);
      renderTab();
      await expandToActions('Onboarding Plan', 'Test Goal');
      await waitFor(() => screen.getByText('Test Action'));

      // The badge button for disabled state shows current label without ChevronDown
      const statusBadge = screen.getByTitle(/not started/i);
      expect(statusBadge.className).toContain('cursor-default');
    });

    it('action status badge does NOT have ChevronDown for completed plan (disabled)', async () => {
      const plan = makePlanWithAction(mockCompletedPlan);
      setupFetch([plan]);
      renderTab();
      await expandToActions('Onboarding Plan', 'Test Goal');
      await waitFor(() => screen.getByText('Test Action'));

      // When disabled, the component does not render ChevronDown alongside the badge
      const statusBadge = screen.getByTitle(/not started/i);
      // The disabled button should not open a dropdown on click
      fireEvent.click(statusBadge);
      expect(screen.queryByText('In Progress')).not.toBeInTheDocument();
    });

    it('action status badge is interactive (no cursor-default) for active plan', async () => {
      const plan = makePlanWithAction(mockActivePlan);
      setupFetch([plan]);
      renderTab();
      await expandToActions('Q2 Growth Plan', 'Test Goal');
      await waitFor(() => screen.getByText('Test Action'));

      const statusBadge = screen.getByTitle('Change status');
      expect(statusBadge.className).not.toContain('cursor-default');
    });

    it('action status badge is disabled for cancelled plan', async () => {
      const plan = makePlanWithAction(mockCancelledPlan);
      setupFetch([plan]);
      renderTab();
      await expandToActions('Cancelled Initiative', 'Test Goal');
      await waitFor(() => screen.getByText('Test Action'));

      const statusBadge = screen.getByTitle(/not started/i);
      expect(statusBadge.className).toContain('cursor-default');
    });
  });

  // --- New Plan modal ---
  describe('New Plan modal', () => {
    it('opens the plan form modal when "New Plan" is clicked', async () => {
      renderTab();
      await waitFor(() => screen.getByText(/New Plan/i));
      fireEvent.click(screen.getByText(/New Plan/i));
      expect(screen.getByTestId('plan-form-modal')).toBeInTheDocument();
    });

    it('closes the plan form modal when its close button is clicked', async () => {
      renderTab();
      await waitFor(() => screen.getByText(/New Plan/i));
      fireEvent.click(screen.getByText(/New Plan/i));
      fireEvent.click(screen.getByText('Close'));
      expect(screen.queryByTestId('plan-form-modal')).not.toBeInTheDocument();
    });
  });

  // --- Plan row expand/collapse ---
  describe('Plan row expand/collapse', () => {
    it('expands a plan row when clicked', async () => {
      setupFetch([mockActivePlan]);
      renderTab();
      await waitFor(() => screen.getByText('Q2 Growth Plan'));
      const planRow = screen.getByText('Q2 Growth Plan').closest('[role="button"]');
      expect(planRow).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(planRow);
      expect(planRow).toHaveAttribute('aria-expanded', 'true');
    });

    it('collapses an expanded plan row when clicked again', async () => {
      setupFetch([mockActivePlan]);
      renderTab();
      await waitFor(() => screen.getByText('Q2 Growth Plan'));
      const planRow = screen.getByText('Q2 Growth Plan').closest('[role="button"]');
      fireEvent.click(planRow);
      expect(planRow).toHaveAttribute('aria-expanded', 'true');
      fireEvent.click(planRow);
      expect(planRow).toHaveAttribute('aria-expanded', 'false');
    });

    it('shows goals section header when plan is expanded', async () => {
      setupFetch([mockActivePlan]);
      renderTab();
      await waitFor(() => screen.getByText('Q2 Growth Plan'));
      fireEvent.click(screen.getByText('Q2 Growth Plan').closest('[role="button"]'));
      expect(screen.getByText('Goals')).toBeInTheDocument();
    });

    it('shows "No goals yet" when expanded plan has no goals', async () => {
      setupFetch([mockActivePlan]);
      renderTab();
      await waitFor(() => screen.getByText('Q2 Growth Plan'));
      fireEvent.click(screen.getByText('Q2 Growth Plan').closest('[role="button"]'));
      expect(screen.getByText(/No goals yet/i)).toBeInTheDocument();
    });
  });

  // --- Does not fetch when isActive is false ---
  it('does not fetch plans when isActive is false', () => {
    render(<DevelopmentTab isActive={false} />);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
