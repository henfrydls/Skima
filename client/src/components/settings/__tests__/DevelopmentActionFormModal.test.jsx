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
