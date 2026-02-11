import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProtectedRoute from '../ProtectedRoute';

// Mock AuthContext
const mockLogin = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock ConfigContext (ProtectedRoute uses useConfig for auto-auth)
vi.mock('../../../contexts/ConfigContext', () => ({
  useConfig: () => ({
    config: { hasPassword: true },
    isLoading: false,
    isSetup: true,
    isDemo: false,
  }),
}));

// Mock LoginModal
vi.mock('../../auth/LoginModal', () => ({
  default: ({ isOpen, onClose, onSuccess }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="login-modal">
        <button onClick={onClose}>Close Modal</button>
        <button onClick={() => onSuccess('test-token')}>Login Success</button>
      </div>
    );
  }
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      login: mockLogin
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('does not render children when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      login: mockLogin
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('shows access restricted message when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      login: mockLogin
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Acceso Restringido')).toBeInTheDocument();
    expect(screen.getByText(/esta sección requiere autenticación/i)).toBeInTheDocument();
  });

  it('shows login button when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      login: mockLogin
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('opens login modal when login button is clicked', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      login: mockLogin
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    const loginButton = screen.getByRole('button', { name: /iniciar sesión/i });
    fireEvent.click(loginButton);

    expect(screen.getByTestId('login-modal')).toBeInTheDocument();
  });

  it('closes login modal when close is triggered', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      login: mockLogin
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Open modal
    const loginButton = screen.getByRole('button', { name: /iniciar sesión/i });
    fireEvent.click(loginButton);

    expect(screen.getByTestId('login-modal')).toBeInTheDocument();

    // Close modal
    const closeButton = screen.getByRole('button', { name: 'Close Modal' });
    fireEvent.click(closeButton);

    expect(screen.queryByTestId('login-modal')).not.toBeInTheDocument();
  });

  it('calls login function on successful authentication', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      login: mockLogin
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Open modal
    const loginButton = screen.getByRole('button', { name: /iniciar sesión/i });
    fireEvent.click(loginButton);

    // Trigger successful login
    const successButton = screen.getByRole('button', { name: 'Login Success' });
    fireEvent.click(successButton);

    expect(mockLogin).toHaveBeenCalledWith('test-token');
  });

  it('closes modal after successful login', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      login: mockLogin
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Open modal
    const loginButton = screen.getByRole('button', { name: /iniciar sesión/i });
    fireEvent.click(loginButton);

    expect(screen.getByTestId('login-modal')).toBeInTheDocument();

    // Trigger successful login
    const successButton = screen.getByRole('button', { name: 'Login Success' });
    fireEvent.click(successButton);

    expect(screen.queryByTestId('login-modal')).not.toBeInTheDocument();
  });

  it('renders access restricted view with proper styling', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      login: mockLogin
    });

    const { container } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    const accessView = container.querySelector('.min-h-screen.bg-background');
    expect(accessView).toBeInTheDocument();

    const centeredContent = container.querySelector('.flex.items-center.justify-center');
    expect(centeredContent).toBeInTheDocument();
  });

  it('passes correct props to LoginModal', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      login: mockLogin
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Initially modal should not be visible
    expect(screen.queryByTestId('login-modal')).not.toBeInTheDocument();

    // Open modal
    const loginButton = screen.getByRole('button', { name: /iniciar sesión/i });
    fireEvent.click(loginButton);

    // Modal should be visible
    expect(screen.getByTestId('login-modal')).toBeInTheDocument();
  });

  it('handles multiple login attempts', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      login: mockLogin
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // First login attempt
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Close Modal' }));

    // Second login attempt
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    expect(screen.getByTestId('login-modal')).toBeInTheDocument();
  });

  it('updates view when authentication state changes', () => {
    // Start unauthenticated
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      login: mockLogin
    });

    const { rerender } = render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText('Acceso Restringido')).toBeInTheDocument();

    // Change to authenticated
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      login: mockLogin
    });

    rerender(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Acceso Restringido')).not.toBeInTheDocument();
  });

  it('renders complex children when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      login: mockLogin
    });

    render(
      <ProtectedRoute>
        <div>
          <h1>Dashboard</h1>
          <p>Welcome to the protected area</p>
          <button>Action Button</button>
        </div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Welcome to the protected area')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument();
  });

  it('does not call login on mount when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      login: mockLogin
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(mockLogin).not.toHaveBeenCalled();
  });
});
