import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginModal from '../LoginModal';

// Mock ConfigContext (LoginModal uses useConfig for password hint)
vi.mock('../../../contexts/ConfigContext', () => ({
  useConfig: () => ({
    config: { hasPassword: true, isDemo: true },
    isLoading: false,
    isSetup: true,
    isDemo: true,
    companyName: 'Test',
    adminName: 'Admin',
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('LoginModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockClear();
  });

  it('does not render when isOpen is false', () => {
    render(
      <LoginModal
        isOpen={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.queryByText('Acceso Admin')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(
      <LoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('Acceso Admin')).toBeInTheDocument();
    expect(screen.getByText('Ingresa la contraseña para continuar')).toBeInTheDocument();
  });

  it('renders password input field', () => {
    render(
      <LoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const passwordInput = screen.getByLabelText(/contraseña/i);
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('renders submit button', () => {
    render(
      <LoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('renders close button', () => {
    render(
      <LoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const closeButton = screen.getByRole('button', { name: '' }); // X button has no text
    expect(closeButton).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <LoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(btn => btn.querySelector('svg')); // X icon button
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('allows typing in password field', async () => {
    const user = userEvent.setup();

    render(
      <LoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const passwordInput = screen.getByLabelText(/contraseña/i);
    await user.type(passwordInput, 'admin123');

    expect(passwordInput).toHaveValue('admin123');
  });

  it('submit button is disabled when password is empty', () => {
    render(
      <LoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    expect(submitButton).toBeDisabled();
  });

  it('submit button is enabled when password is entered', async () => {
    const user = userEvent.setup();

    render(
      <LoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const passwordInput = screen.getByLabelText(/contraseña/i);
    await user.type(passwordInput, 'admin123');

    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('submits login request with correct credentials', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'test-token-123' })
    });

    const user = userEvent.setup();

    render(
      <LoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const passwordInput = screen.getByLabelText(/contraseña/i);
    await user.type(passwordInput, 'admin123');

    const form = screen.getByRole('button', { name: /iniciar sesión/i }).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'admin123' })
      });
    });
  });

  it('calls onSuccess with token on successful login', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'test-token-123' })
    });

    const user = userEvent.setup();

    render(
      <LoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const passwordInput = screen.getByLabelText(/contraseña/i);
    await user.type(passwordInput, 'admin123');

    const form = screen.getByRole('button', { name: /iniciar sesión/i }).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith('test-token-123');
    });
  });

  it('displays error message on failed login', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Contraseña incorrecta' })
    });

    const user = userEvent.setup();

    render(
      <LoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const passwordInput = screen.getByLabelText(/contraseña/i);
    await user.type(passwordInput, 'wrongpassword');

    const form = screen.getByRole('button', { name: /iniciar sesión/i }).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Contraseña incorrecta')).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('displays default error message when API does not provide one', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({})
    });

    const user = userEvent.setup();

    render(
      <LoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const passwordInput = screen.getByLabelText(/contraseña/i);
    await user.type(passwordInput, 'wrongpassword');

    const form = screen.getByRole('button', { name: /iniciar sesión/i }).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Error de autenticación')).toBeInTheDocument();
    });
  });

  it('displays connection error on network failure', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    const user = userEvent.setup();

    render(
      <LoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const passwordInput = screen.getByLabelText(/contraseña/i);
    await user.type(passwordInput, 'admin123');

    const form = screen.getByRole('button', { name: /iniciar sesión/i }).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Error de conexión con el servidor')).toBeInTheDocument();
    });
  });

  it('shows loading state during login', async () => {
    global.fetch.mockImplementationOnce(() =>
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ token: 'test-token' })
      }), 100))
    );

    const user = userEvent.setup();

    render(
      <LoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const passwordInput = screen.getByLabelText(/contraseña/i);
    await user.type(passwordInput, 'admin123');

    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    fireEvent.click(submitButton);

    // Button should be disabled during loading
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('clears password field after successful login', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'test-token-123' })
    });

    const user = userEvent.setup();

    render(
      <LoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const passwordInput = screen.getByLabelText(/contraseña/i);
    await user.type(passwordInput, 'admin123');

    const form = screen.getByRole('button', { name: /iniciar sesión/i }).closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    expect(passwordInput).toHaveValue('');
  });

  it('displays development hint with default password', () => {
    render(
      <LoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText(/contraseña por defecto/i)).toBeInTheDocument();
    expect(screen.getByText('admin123')).toBeInTheDocument();
  });

  it('renders lock icon in header', () => {
    render(
      <LoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Portal renders to document.body
    const iconContainer = document.querySelector('.bg-primary\\/10');
    expect(iconContainer).toBeInTheDocument();
  });

  it('password field has autofocus when modal opens', () => {
    render(
      <LoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const passwordInput = screen.getByLabelText(/contraseña/i);
    // React autoFocus prop is applied - verify the input is the active element or has the attribute
    expect(document.activeElement === passwordInput || passwordInput.hasAttribute('autofocus')).toBe(true);
  });

  it('renders modal using portal to document.body', () => {
    render(
      <LoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Modal should be attached to body
    const modalBackdrop = document.querySelector('.modal-overlay');
    expect(modalBackdrop).toBeInTheDocument();
    expect(modalBackdrop.parentElement).toBe(document.body);
  });

  it('prevents form submission when password is empty', () => {
    render(
      <LoginModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // The submit button is disabled when password is empty
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    expect(submitButton).toBeDisabled();
    // Input has required attribute
    const passwordInput = screen.getByLabelText(/contraseña/i);
    expect(passwordInput).toBeRequired();
  });
});
