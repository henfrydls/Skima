import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CategoriesTab from '../CategoriesTab';

// Mock dependencies
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    getHeaders: () => ({ Authorization: 'Bearer fake-token' }),
    login: vi.fn(),
  }),
}));

// Mock API Base
global.API_BASE = 'http://localhost:3000/api';

describe('CategoriesTab', () => {
  const mockCategories = [
    { id: 1, nombre: 'Active Cat', isActive: true, orden: 1 },
    { id: 2, nombre: 'Archived Cat', isActive: false, orden: 2 },
  ];
  const mockSkills = [];

  beforeEach(() => {
    // Reset fetch mocks
    global.fetch = vi.fn((url) => {
      if (url.includes('/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCategories),
        });
      }
      if (url.includes('/skills')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSkills),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  it('renders active categories by default', async () => {
    render(<CategoriesTab />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText(/Active Cat/i)).toBeInTheDocument();
    });

    // Validates that 'Archived Cat' is NOT shown initially
    expect(screen.queryByText(/Archived Cat/i)).not.toBeInTheDocument();
  });

  it('toggles archived categories visibility', async () => {
    render(<CategoriesTab />);

    await waitFor(() => {
      expect(screen.queryByText(/Active Cat/i)).toBeInTheDocument();
    });

    // Find and click the toggle button
    const toggleBtn = screen.getByText(/Ver archivados/i);
    fireEvent.click(toggleBtn);

    // Now 'Archived Cat' should be visible
    expect(screen.getByText(/Archived Cat/i)).toBeInTheDocument();
    
    // Button text should change
    expect(screen.getByText(/Ocultar archivados/i)).toBeInTheDocument();
  });

  it('filters by search query', async () => {
    render(<CategoriesTab />);

    await waitFor(() => {
      expect(screen.getByText(/Active Cat/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar categoría/i);
    fireEvent.change(searchInput, { target: { value: 'Active' } });

    expect(screen.getByText(/Active Cat/i)).toBeInTheDocument();
    
    // If we search for something non-existent
    fireEvent.change(searchInput, { target: { value: 'NonExistent' } });
    expect(screen.queryByText(/Active Cat/i)).not.toBeInTheDocument();
  });
});
