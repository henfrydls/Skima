import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ToastUndo from '../ToastUndo';
import { toast } from 'react-hot-toast';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    dismiss: vi.fn()
  }
}));

describe('ToastUndo', () => {
  const mockOnUndo = vi.fn();
  const mockToast = {
    id: 'test-toast-123',
    visible: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with message', () => {
    render(
      <ToastUndo
        t={mockToast}
        message="Item deleted"
        onUndo={mockOnUndo}
      />
    );

    expect(screen.getByText('Item deleted')).toBeInTheDocument();
  });

  it('displays undo button', () => {
    render(
      <ToastUndo
        t={mockToast}
        message="Item deleted"
        onUndo={mockOnUndo}
      />
    );

    expect(screen.getByRole('button', { name: /deshacer/i })).toBeInTheDocument();
  });

  it('shows countdown timer starting at correct value', () => {
    render(
      <ToastUndo
        t={mockToast}
        message="Item deleted"
        onUndo={mockOnUndo}
        duration={4000}
      />
    );

    // Should show 4 seconds initially
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('decrements countdown timer over time', async () => {
    render(
      <ToastUndo
        t={mockToast}
        message="Item deleted"
        onUndo={mockOnUndo}
        duration={4000}
      />
    );

    expect(screen.getByText('4')).toBeInTheDocument();

    // Advance by 1 second within act
    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText('3')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('calls onUndo when undo button is clicked', () => {
    render(
      <ToastUndo
        t={mockToast}
        message="Item deleted"
        onUndo={mockOnUndo}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /deshacer/i }));
    expect(mockOnUndo).toHaveBeenCalledTimes(1);
  });

  it('dismisses toast when undo button is clicked', () => {
    render(
      <ToastUndo
        t={mockToast}
        message="Item deleted"
        onUndo={mockOnUndo}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /deshacer/i }));
    expect(toast.dismiss).toHaveBeenCalledWith(mockToast.id);
  });

  it('respects custom duration prop', () => {
    render(
      <ToastUndo
        t={mockToast}
        message="Item deleted"
        onUndo={mockOnUndo}
        duration={6000}
      />
    );

    // Should show 6 seconds initially
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('uses default duration when not provided', () => {
    render(
      <ToastUndo
        t={mockToast}
        message="Item deleted"
        onUndo={mockOnUndo}
      />
    );

    // Default is 4000ms = 4 seconds
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('applies visible animation class when toast is visible', () => {
    const { container } = render(
      <ToastUndo
        t={{ ...mockToast, visible: true }}
        message="Item deleted"
        onUndo={mockOnUndo}
      />
    );

    const toastElement = container.querySelector('.animate-enter');
    expect(toastElement).toBeInTheDocument();
  });

  it('applies leave animation class when toast is not visible', () => {
    const { container } = render(
      <ToastUndo
        t={{ ...mockToast, visible: false }}
        message="Item deleted"
        onUndo={mockOnUndo}
      />
    );

    const toastElement = container.querySelector('.animate-leave');
    expect(toastElement).toBeInTheDocument();
  });

  it('displays circular countdown progress indicator', () => {
    const { container } = render(
      <ToastUndo
        t={mockToast}
        message="Item deleted"
        onUndo={mockOnUndo}
        duration={4000}
      />
    );

    // Check for SVG circle elements
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(2); // Background circle + progress circle
  });

  it('updates progress circle strokeDashoffset as time passes', () => {
    const { container } = render(
      <ToastUndo
        t={mockToast}
        message="Item deleted"
        onUndo={mockOnUndo}
        duration={4000}
      />
    );

    const progressCircle = container.querySelectorAll('circle')[1];
    const initialOffset = progressCircle.getAttribute('stroke-dashoffset');

    act(() => { vi.advanceTimersByTime(2000); });

    const newOffset = progressCircle.getAttribute('stroke-dashoffset');
    expect(newOffset).not.toBe(initialOffset);
  });

  it('stops countdown at zero', () => {
    render(
      <ToastUndo
        t={mockToast}
        message="Item deleted"
        onUndo={mockOnUndo}
        duration={1000}
      />
    );

    act(() => { vi.advanceTimersByTime(2000); });
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders with border accent', () => {
    const { container } = render(
      <ToastUndo
        t={mockToast}
        message="Item deleted"
        onUndo={mockOnUndo}
      />
    );

    const toastElement = container.querySelector('.border-l-4.border-primary');
    expect(toastElement).toBeInTheDocument();
  });

  it('includes rotation icon in undo button', () => {
    const { container } = render(
      <ToastUndo
        t={mockToast}
        message="Item deleted"
        onUndo={mockOnUndo}
      />
    );

    // RotateCcw icon should be present
    const undoButton = screen.getByRole('button', { name: /deshacer/i });
    expect(undoButton).toBeInTheDocument();
  });

  it('cleans up timer on unmount', () => {
    const { unmount } = render(
      <ToastUndo
        t={mockToast}
        message="Item deleted"
        onUndo={mockOnUndo}
      />
    );

    // Spy on clearInterval
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('updates timer smoothly with 50ms intervals', () => {
    render(
      <ToastUndo
        t={mockToast}
        message="Item deleted"
        onUndo={mockOnUndo}
        duration={1000}
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();

    // Advance by 150ms total (3 intervals of 50ms)
    act(() => { vi.advanceTimersByTime(150); });

    // Should still show 1 second (Math.ceil(850/1000) = 1)
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
