import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EvaluationsTab from '../EvaluationsTab';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn(), useBlocker: () => ({ state: 'unblocked' }) };
});

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ getHeaders: () => ({}) }),
}));

vi.mock('../../../lib/apiBase', () => ({ API_BASE: '' }));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

// Ana was evaluated on two skills. GET /api/collaborators does not carry levels;
// /api/data does.
const data = {
  categories: [{ id: 1, nombre: 'Backend', abrev: 'BE', isActive: true }],
  skills: [
    { id: 10, nombre: 'Node.js', categoriaId: 1, isActive: true },
    { id: 11, nombre: 'SQL', categoriaId: 1, isActive: true },
  ],
  roleProfiles: { Developer: { 10: 'C', 11: 'I' } },
  collaborators: [{
    id: 1,
    nombre: 'Ana',
    rol: 'Developer',
    skills: { 10: { nivel: 4, frecuencia: 'D' }, 11: { nivel: 3, frecuencia: 'S' } },
  }],
};

describe('EvaluationsTab', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn((url) => {
      const json = url.startsWith('/api/data')
        ? data
        : url.startsWith('/api/collaborators?includeArchived')
          ? [{ id: 1, nombre: 'Ana', rol: 'Developer', isActive: true }]
          : [];
      return Promise.resolve({ ok: true, json: () => Promise.resolve(json) });
    });
  });

  it("starts the form from the collaborator's current levels", async () => {
    render(<EvaluationsTab initialContext={{ collaboratorId: 1 }} isActive />);

    const total = await screen.findByText('Total Skills');
    await waitFor(() => expect(total.previousElementSibling.textContent).toBe('2'));
  });
});
