import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import GoalFormModal from '../DevelopmentGoalFormModal';

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ authFetch: vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ skills: [], categories: [] }) }) }),
}));
vi.mock('../../../lib/apiBase', () => ({ API_BASE: '' }));
vi.mock('../SkillSelect', () => ({
  default: () => <div data-testid="skill-select" />,
}));
vi.mock('../../development/GapSuggestions', () => ({
  default: () => <div data-testid="gap-suggestions" />,
}));

beforeEach(() => {
  document.body.innerHTML = '';
});

const renderModal = (props = {}) => render(
  <GoalFormModal collaboratorId={1} onClose={vi.fn()} onSubmit={vi.fn()} {...props} />
);

describe('DevelopmentGoalFormModal — dropdown styling (bug #34)', () => {
  it('Target Level select shows native chevron (no appearance-none)', () => {
    renderModal();
    const targetSelect = document.querySelector('select[name="targetLevel"]');
    expect(targetSelect).toBeInTheDocument();
    // appearance-none would hide the native dropdown chevron, making the select
    // look like a plain text input — that was bug #34.
    expect(targetSelect.className).not.toMatch(/appearance-none/);
  });

  it('Priority select shows native chevron (no appearance-none)', () => {
    renderModal();
    const prioritySelect = document.querySelector('select[name="priority"]');
    expect(prioritySelect).toBeInTheDocument();
    expect(prioritySelect.className).not.toMatch(/appearance-none/);
  });

  it('Priority select uses the same styling tokens as the rest of the app', () => {
    renderModal();
    const prioritySelect = document.querySelector('select[name="priority"]');
    // Canonical tokens used across the app's selects/inputs
    expect(prioritySelect.className).toMatch(/border-gray-200/);
    expect(prioritySelect.className).toMatch(/rounded-lg/);
    expect(prioritySelect.className).toMatch(/focus:ring-primary/);
  });
});
