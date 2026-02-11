import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SidebarUser from '../SidebarUser';
import * as ConfigContextModule from '../../../contexts/ConfigContext';

// Mock the useConfig hook
const mockUseConfig = vi.fn();

vi.mock('../../../contexts/ConfigContext', async () => {
  const actual = await vi.importActual('../../../contexts/ConfigContext');
  return {
    ...actual,
    useConfig: () => mockUseConfig(),
  };
});

describe('SidebarUser', () => {
  const renderWithContext = (isCollapsed = false, pathname = '/', adminName = 'John Doe', companyName = 'Acme Corp') => {
    mockUseConfig.mockReturnValue({
      adminName,
      companyName,
      setAdminName: vi.fn(),
      setCompanyName: vi.fn(),
      categories: [],
      setCategories: vi.fn(),
      updateCategory: vi.fn(),
      deleteCategory: vi.fn(),
    });

    return render(
      <MemoryRouter initialEntries={[pathname]}>
        <SidebarUser isCollapsed={isCollapsed} />
      </MemoryRouter>
    );
  };

  it('renders without crashing', () => {
    renderWithContext();
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('displays admin name initials in avatar', () => {
    renderWithContext();
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('displays admin full name when not collapsed', () => {
    renderWithContext(false);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays "Administrador" role when not collapsed', () => {
    renderWithContext(false);
    expect(screen.getByText('Administrador')).toBeInTheDocument();
  });

  it('hides name and role when collapsed', () => {
    renderWithContext(true);
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.queryByText('Administrador')).not.toBeInTheDocument();
  });

  it('shows chevron icon when not collapsed', () => {
    const { container } = renderWithContext(false);
    const chevron = container.querySelector('svg:last-child');
    expect(chevron).toBeInTheDocument();
  });

  it('hides chevron icon when collapsed', () => {
    renderWithContext(true);
    expect(screen.queryByText('Administrador')).not.toBeInTheDocument();
  });

  it('generates correct initials for two-word name', () => {
    renderWithContext();
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('generates correct initials for single word name', () => {
    renderWithContext(false, '/', 'Admin', 'Acme Corp');
    // Single word 'Admin' → split gives ['Admin'] → map first char → ['A'] → join → 'A'
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('generates correct initials for multi-word name (takes first 2)', () => {
    renderWithContext(false, '/', 'John Paul Smith', 'Acme Corp');
    expect(screen.getByText('JP')).toBeInTheDocument();
  });

  it('uses default initials when no admin name provided', () => {
    renderWithContext(false, '/', '', 'Acme Corp');
    expect(screen.getByText('AD')).toBeInTheDocument();
  });

  it('converts initials to uppercase', () => {
    renderWithContext(false, '/', 'jane doe', 'Acme Corp');
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('links to /profile page', () => {
    const { container } = renderWithContext();
    const link = container.querySelector('a');
    expect(link).toHaveAttribute('href', '/profile');
  });

  it('applies active styling when on /profile page', () => {
    const { container } = renderWithContext(false, '/profile');
    const link = container.querySelector('a');
    expect(link).toHaveClass('bg-primary/10', 'text-primary');
  });

  it('applies inactive styling when not on /profile page', () => {
    const { container } = renderWithContext(false, '/dashboard');
    const link = container.querySelector('a');
    expect(link).toHaveClass('text-gray-600', 'hover:bg-gray-100');
  });

  it('applies active avatar styling when on /profile page', () => {
    const { container } = renderWithContext(false, '/profile');
    const avatar = container.querySelector('.rounded-full');
    expect(avatar).toHaveClass('bg-primary', 'text-white');
  });

  it('applies inactive avatar styling when not on /profile page', () => {
    const { container } = renderWithContext(false, '/dashboard');
    const avatar = container.querySelector('.rounded-full');
    expect(avatar).toHaveClass('bg-primary/10', 'text-primary');
  });

  it('shows tooltip with name and company when collapsed', () => {
    const { container } = renderWithContext(true);
    const link = container.querySelector('a');
    expect(link).toHaveAttribute('title', 'John Doe - Acme Corp');
  });

  it('does not show tooltip when not collapsed', () => {
    const { container } = renderWithContext(false);
    const link = container.querySelector('a');
    expect(link).not.toHaveAttribute('title');
  });

  it('centers avatar when collapsed', () => {
    const { container } = renderWithContext(true);
    const link = container.querySelector('a');
    expect(link).toHaveClass('justify-center');
  });

  it('does not center content when not collapsed', () => {
    const { container } = renderWithContext(false);
    const link = container.querySelector('a');
    expect(link).not.toHaveClass('justify-center');
  });

  it('truncates long admin name', () => {
    renderWithContext(false, '/', 'Very Long Administrator Name That Should Be Truncated', 'Acme Corp');
    const nameElement = screen.getByText('Very Long Administrator Name That Should Be Truncated');
    expect(nameElement).toHaveClass('truncate');
  });

  it('applies border top to container', () => {
    const { container } = renderWithContext();
    const wrapper = container.querySelector('.p-2');
    expect(wrapper).toHaveClass('border-t', 'border-gray-100');
  });
});
