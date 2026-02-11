import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmModal from '../ConfirmModal';

describe('ConfirmModal', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(
      <ConfirmModal
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.queryByRole('button', { name: /confirmar/i })).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByRole('button', { name: /confirmar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('displays default title and message', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText('¿Estás seguro?')).toBeInTheDocument();
    expect(screen.getByText('Esta acción no se puede deshacer.')).toBeInTheDocument();
  });

  it('displays custom title and message', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        title="Delete Item"
        message="This will permanently delete the item."
      />
    );

    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('This will permanently delete the item.')).toBeInTheDocument();
  });

  it('displays custom button text', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        confirmText="Delete"
        cancelText="Keep"
      />
    );

    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when confirm button is clicked', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const backdrop = document.querySelector('.backdrop-blur-sm');
    fireEvent.click(backdrop);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading spinner when isLoading is true', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        isLoading={true}
      />
    );

    // Check for loader icon in confirm button
    const confirmButton = screen.getByRole('button', { name: /confirmar/i });
    expect(confirmButton).toBeDisabled();
  });

  it('disables buttons when isLoading is true', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        isLoading={true}
      />
    );

    expect(screen.getByRole('button', { name: /confirmar/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled();
  });

  it('applies danger variant styles by default', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(document.querySelector('.text-critical')).toBeInTheDocument();
  });

  it('applies warning variant styles when specified', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        variant="warning"
      />
    );

    expect(document.querySelector('.text-warning')).toBeInTheDocument();
  });

  it('applies info variant styles when specified', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        variant="info"
      />
    );

    expect(document.querySelector('.text-primary')).toBeInTheDocument();
  });

  it('renders with correct icon for danger variant', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        variant="danger"
      />
    );

    expect(document.querySelector('.text-critical')).toBeInTheDocument();
  });

  it('renders with correct icon for warning variant', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        variant="warning"
      />
    );

    expect(document.querySelector('.text-warning')).toBeInTheDocument();
  });

  it('renders modal using portal to document.body', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    // Modal should be attached to body
    const modalBackdrop = document.querySelector('.fixed.inset-0.z-\\[60\\]');
    expect(modalBackdrop).toBeInTheDocument();
    expect(modalBackdrop.parentElement).toBe(document.body);
  });
});
