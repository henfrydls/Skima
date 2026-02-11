import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SessionExpiredModal from '../SessionExpiredModal';
import * as AuthContextModule from '../../../contexts/AuthContext';

// Mock the useAuth hook
const mockUseAuth = vi.fn();

vi.mock('../../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
  };
});

// Mock window.location.href
const originalLocation = window.location;

describe('SessionExpiredModal', () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location
    delete window.location;
    window.location = { href: '' };
  });

  afterEach(() => {
    // Restore window.location
    window.location = originalLocation;
  });

  const renderWithAuthContext = (sessionExpired) => {
    mockUseAuth.mockReturnValue({
      sessionExpired,
      logout: mockLogout,
      user: null,
      login: vi.fn(),
      loading: false,
    });

    return render(<SessionExpiredModal />);
  };

  it('does not render when sessionExpired is false', () => {
    renderWithAuthContext(false);
    expect(screen.queryByText('Sesión Expirada')).not.toBeInTheDocument();
  });

  it('renders modal when sessionExpired is true', () => {
    renderWithAuthContext(true);
    expect(screen.getByText('Sesión Expirada')).toBeInTheDocument();
  });

  it('displays session expired title', () => {
    renderWithAuthContext(true);
    expect(screen.getByText('Sesión Expirada')).toBeInTheDocument();
  });

  it('displays explanation message', () => {
    renderWithAuthContext(true);
    expect(screen.getByText(/Tu sesión ha expirado por inactividad/i)).toBeInTheDocument();
    expect(screen.getByText(/Por favor, inicia sesión nuevamente/i)).toBeInTheDocument();
  });

  it('displays login button', () => {
    renderWithAuthContext(true);
    expect(screen.getByRole('button', { name: 'Iniciar Sesión' })).toBeInTheDocument();
  });

  it('displays warning icon', () => {
    renderWithAuthContext(true);
    const icon = document.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('calls logout when login button is clicked', () => {
    renderWithAuthContext(true);

    const loginButton = screen.getByRole('button', { name: 'Iniciar Sesión' });
    fireEvent.click(loginButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('redirects to /login when login button is clicked', () => {
    renderWithAuthContext(true);

    const loginButton = screen.getByRole('button', { name: 'Iniciar Sesión' });
    fireEvent.click(loginButton);

    expect(window.location.href).toBe('/login');
  });

  it('applies correct styling to modal backdrop', () => {
    renderWithAuthContext(true);
    const backdrop = document.querySelector('.fixed');
    expect(backdrop).toHaveClass('inset-0', 'backdrop-blur-sm');
  });

  it('applies correct styling to modal content', () => {
    renderWithAuthContext(true);
    const modal = document.querySelector('.bg-surface');
    expect(modal).toHaveClass('rounded-xl', 'shadow-2xl', 'max-w-sm');
  });

  it('applies warning color scheme to header', () => {
    renderWithAuthContext(true);
    const header = document.querySelector('.text-warning');
    expect(header).toBeInTheDocument();
  });

  it('centers modal on screen', () => {
    renderWithAuthContext(true);
    const backdrop = document.querySelector('.fixed');
    expect(backdrop).toHaveClass('flex', 'items-center', 'justify-center');
  });

  it('renders into document.body via portal', () => {
    renderWithAuthContext(true);

    // Modal should be rendered directly in body, not in the react root
    const modalInBody = document.body.querySelector('.fixed');
    expect(modalInBody).toBeInTheDocument();
  });
});
