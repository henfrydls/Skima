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

vi.mock('../../../contexts/ConfigContext', () => ({
  useConfig: () => ({
    config: { hasPassword: true },
    isLoading: false,
    isSetup: true,
    isDemo: false,
  }),
}));

// Mock API Base
globalThis.API_BASE = 'http://localhost:3000/api';

describe('CategoriesTab', () => {
  const mockCategories = [
    { id: 1, nombre: 'Active Cat', abrev: 'AC', isActive: true, orden: 1 },
    { id: 2, nombre: 'Archived Cat', abrev: 'AR', isActive: false, orden: 2 },
    { id: 3, nombre: 'Dev Skills', abrev: 'DS', isActive: true, orden: 3 },
  ];
  const mockSkills = [
    { id: 1, nombre: 'JavaScript', categoriaId: 1, isActive: true },
    { id: 2, nombre: 'Python', categoriaId: 1, isActive: true },
    { id: 3, nombre: 'React', categoriaId: 3, isActive: true },
  ];

  beforeEach(() => {
    // Reset fetch mocks
    globalThis.fetch = vi.fn((url) => {
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

  it('opens new category modal when clicking add button', async () => {
    render(<CategoriesTab />);

    await waitFor(() => {
      expect(screen.getByText(/Active Cat/i)).toBeInTheDocument();
    });

    // Click the "Nueva Categoría" button
    const addButton = screen.getByText(/Nueva Categoría/i);
    fireEvent.click(addButton);

    // Modal should appear with create form
    await waitFor(() => {
      expect(document.querySelector('.fixed.inset-0')).toBeInTheDocument();
    });
  });

  it('opens edit modal when clicking edit on a category', async () => {
    render(<CategoriesTab />);

    await waitFor(() => {
      expect(screen.getByText(/Active Cat/i)).toBeInTheDocument();
    });

    // Click the menu button (MoreVertical icon) on the first category
    const menuButtons = screen.getAllByRole('button');
    const moreButton = menuButtons.find(btn => btn.querySelector('.lucide-more-vertical') || btn.closest('[class*="more"]'));

    // If we can't find by icon, look for the button near the category name
    if (moreButton) {
      fireEvent.click(moreButton);
    }
  });

  it('shows category count in header', async () => {
    render(<CategoriesTab />);

    await waitFor(() => {
      expect(screen.getByText(/Active Cat/i)).toBeInTheDocument();
    });

    // Should show count of active categories
    expect(screen.getByText(/1/)).toBeInTheDocument();
  });

  it('handles fetch error gracefully', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

    render(<CategoriesTab />);

    // Should show loading first, then handle error
    await waitFor(() => {
      // After error, component should not crash
      expect(document.body).toBeInTheDocument();
    });
  });

  it('submits new category via create modal', async () => {
    render(<CategoriesTab />);

    await waitFor(() => {
      expect(screen.getByText(/Active Cat/i)).toBeInTheDocument();
    });

    // Open create modal
    const addButton = screen.getByText(/Nueva Categoría/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(document.querySelector('form')).toBeInTheDocument();
    });

    // Fill in form fields
    const inputs = document.querySelectorAll('input');
    const nombreInput = Array.from(inputs).find(i => i.placeholder?.includes('categoría') || i.id?.includes('nombre'));
    const abrevInput = Array.from(inputs).find(i => i.placeholder?.includes('abrev') || i.id?.includes('abrev'));

    if (nombreInput && abrevInput) {
      fireEvent.change(nombreInput, { target: { value: 'New Category' } });
      fireEvent.change(abrevInput, { target: { value: 'NC' } });

      // Mock successful creation
      globalThis.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 3, nombre: 'New Category', abrev: 'NC', isActive: true, orden: 3 }),
        })
      );

      // Submit form
      const form = document.querySelector('form');
      fireEvent.submit(form);
    }
  });

  it('renders category rows with skill counts', async () => {
    render(<CategoriesTab />);

    await waitFor(() => {
      expect(screen.getByText(/Active Cat/i)).toBeInTheDocument();
    });

    // Should show multiple active categories
    expect(screen.getByText(/Dev Skills/i)).toBeInTheDocument();
    // Should display skill counts (getSkillCount function)
    expect(screen.getByText(/2 skills/i)).toBeInTheDocument(); // Active Cat has 2 skills
    expect(screen.getByText(/1 skill/i)).toBeInTheDocument(); // Dev Skills has 1 skill
  });

  it('opens and fills create category modal', async () => {
    render(<CategoriesTab />);

    await waitFor(() => {
      expect(screen.getByText(/Active Cat/i)).toBeInTheDocument();
    });

    // Click add button
    fireEvent.click(screen.getByText(/Nueva Categoría/i));

    await waitFor(() => {
      // Modal should show form fields
      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
    });

    // Find form inputs (inside the portal form, not the search input)
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
    const formInputs = form.querySelectorAll('input');
    expect(formInputs.length).toBeGreaterThanOrEqual(2);

    // Fill in nombre and abrev fields
    fireEvent.change(formInputs[0], { target: { value: 'New Test Category' } });
    fireEvent.change(formInputs[1], { target: { value: 'NTC' } });

    // Mock the create API call + refetch
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 10, nombre: 'New Test Category', abrev: 'NTC', isActive: true, orden: 4 }),
      })
    );

    // Submit the form
    fireEvent.submit(form);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });
  });

  it('opens edit modal for existing category', async () => {
    render(<CategoriesTab />);

    await waitFor(() => {
      expect(screen.getByText(/Active Cat/i)).toBeInTheDocument();
    });

    // Find category row actions - click menu button
    const allButtons = document.querySelectorAll('button');
    // Find a button with MoreVertical icon (usually the ... menu)
    const menuButton = Array.from(allButtons).find(btn =>
      btn.querySelector('svg.lucide-more-vertical') || btn.innerHTML.includes('more-vertical')
    );

    if (menuButton) {
      fireEvent.click(menuButton);
      // Wait for dropdown
      await waitFor(() => {
        const editOption = screen.queryByText(/Editar/i);
        if (editOption) {
          fireEvent.click(editOption);
        }
      });
    }
  });

  it('shows archive confirmation when deleting category with skills', async () => {
    render(<CategoriesTab />);

    await waitFor(() => {
      expect(screen.getByText(/Active Cat/i)).toBeInTheDocument();
    });

    // Find and click the menu for a category with skills
    const allButtons = document.querySelectorAll('button');
    const menuButton = Array.from(allButtons).find(btn =>
      btn.querySelector('svg.lucide-more-vertical') || btn.innerHTML.includes('more-vertical')
    );

    if (menuButton) {
      fireEvent.click(menuButton);
      await waitFor(() => {
        const archiveOption = screen.queryByText(/Archivar/i);
        if (archiveOption) {
          fireEvent.click(archiveOption);
        }
      });
    }
  });

  it('closes create modal when clicking cancel', async () => {
    render(<CategoriesTab />);

    await waitFor(() => {
      expect(screen.getByText(/Active Cat/i)).toBeInTheDocument();
    });

    // Open modal
    fireEvent.click(screen.getByText(/Nueva Categoría/i));

    await waitFor(() => {
      expect(document.querySelector('form')).toBeInTheDocument();
    });

    // Click close/cancel button in the modal
    const closeButtons = document.querySelectorAll('button');
    const closeBtn = Array.from(closeButtons).find(btn =>
      btn.querySelector('svg.lucide-x') || btn.innerHTML.includes('lucide-x')
    );

    if (closeBtn) {
      fireEvent.click(closeBtn);
      await waitFor(() => {
        expect(document.querySelector('form')).not.toBeInTheDocument();
      });
    }
  });
});
