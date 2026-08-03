import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ActionFormModal from '../DevelopmentActionFormModal';

// jsdom: createPortal requires document.body
beforeEach(() => {
  document.body.innerHTML = '';
});

const renderModal = (props = {}) => {
  const defaultProps = {
    onClose: vi.fn(),
    onSubmit: vi.fn().mockResolvedValue(undefined),
    ...props,
  };
  return { ...render(<ActionFormModal {...defaultProps} />), props: defaultProps };
};

describe('DevelopmentActionFormModal', () => {
  it('submits payload with actionType field (not legacy "type")', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderModal({ onSubmit });

    fireEvent.change(screen.getByPlaceholderText(/Complete React Testing course/i), {
      target: { value: 'My new action' },
    });

    // Click the "Formal (10%)" type tile
    fireEvent.click(screen.getByText(/Formal/i).closest('button'));

    fireEvent.click(screen.getByRole('button', { name: /Add Action/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.actionType).toBe('formal');
    expect(payload.title).toBe('My new action');
    // The legacy "type" field must not be present (or must equal actionType)
    expect(payload.type).toBeUndefined();
  });

  it('defaults actionType to "experience" when no selection made', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderModal({ onSubmit });

    fireEvent.change(screen.getByPlaceholderText(/Complete React Testing course/i), {
      target: { value: 'Default type action' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Add Action/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].actionType).toBe('experience');
  });

  it('pre-fills actionType when editing an existing action', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const existing = {
      id: 7,
      title: 'Existing action',
      actionType: 'social',
      description: 'Mentoring session',
      dueDate: null,
    };
    renderModal({ action: existing, onSubmit });

    // Modal title should reflect edit mode
    expect(screen.getByText('Edit Action')).toBeInTheDocument();

    // Submit without changing — payload must keep actionType: 'social'
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].actionType).toBe('social');
  });

  // Bug #34: dropdowns must not hide the native chevron (no `appearance-none` class)
  // Otherwise the select looks like a text input. Action form uses tile buttons (no select),
  // but type tile buttons must remain visually distinct from inputs.
  it('renders type tiles with visible affordance (not as a hidden select)', () => {
    renderModal();
    // The "Formal" tile should be a clickable button with border styling
    const formalTile = screen.getByText(/Formal/i).closest('button');
    expect(formalTile).toBeInTheDocument();
    expect(formalTile.className).toMatch(/border/);
  });

  it('shows an editable Completed Date for a completed action and submits the backdated value', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const existing = {
      id: 9, title: 'Done action', actionType: 'formal', description: '',
      dueDate: null, status: 'completed', completedAt: '2026-06-10T00:00:00.000Z',
    };
    renderModal({ action: existing, onSubmit });

    expect(screen.getByText(/Completed Date/i)).toBeInTheDocument();
    const dateInput = document.querySelector('input[name="completedAt"]');
    expect(dateInput).not.toBeNull();
    expect(dateInput.value).toBe('2026-06-10');

    // Backdate it
    fireEvent.change(dateInput, { target: { value: '2020-01-15' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].completedAt).toBe('2020-01-15');
  });

  it('does not resend completedAt when editing a completed action without touching the date', async () => {
    // Regression: re-sending the date-only value on an unrelated edit truncated the
    // stored time-of-day and could shift the displayed date across a timezone boundary.
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const existing = {
      id: 11, title: 'Done', actionType: 'formal', description: '',
      dueDate: null, status: 'completed', completedAt: '2026-06-10T14:30:00.000Z',
    };
    renderModal({ action: existing, onSubmit });

    // Edit only the title — leave the completion date untouched
    fireEvent.change(screen.getByDisplayValue('Done'), { target: { value: 'Done (edited)' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty('completedAt');
    expect(onSubmit.mock.calls[0][0].title).toBe('Done (edited)');
  });

  it('hides Completed Date and omits it from the payload for a non-completed action', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const existing = {
      id: 10, title: 'In progress', actionType: 'experience', description: '',
      dueDate: null, status: 'in_progress',
    };
    renderModal({ action: existing, onSubmit });

    expect(document.querySelector('input[name="completedAt"]')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty('completedAt');
  });

  it('persists changed actionType when editing', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const existing = {
      id: 7,
      title: 'Existing action',
      actionType: 'experience',
      description: '',
      dueDate: null,
    };
    renderModal({ action: existing, onSubmit });

    // Change to Self-directed
    fireEvent.click(screen.getByText(/Self-directed/i).closest('button'));
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].actionType).toBe('self_directed');
  });
});
