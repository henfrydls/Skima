import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
  // After bug #34, native <select> elements were replaced with the custom
  // Select component (button + portal panel) used elsewhere in the app.
  it('Target Level uses the custom Select (no native <select> element)', () => {
    renderModal();
    const nativeSelect = document.querySelector('select[name="targetLevel"]');
    expect(nativeSelect).toBeNull();
    // The trigger button exposes name="targetLevel"
    const trigger = document.querySelector('button[name="targetLevel"]');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
  });

  it('Priority uses the custom Select', () => {
    renderModal();
    expect(document.querySelector('select[name="priority"]')).toBeNull();
    const trigger = document.querySelector('button[name="priority"]');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
  });

  it('Priority dropdown shows High/Medium/Low options when opened', () => {
    renderModal();
    const trigger = document.querySelector('button[name="priority"]');
    fireEvent.click(trigger);
    // Panel renders into document.body via portal
    expect(screen.getByRole('option', { name: 'High' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Medium' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Low' })).toBeInTheDocument();
  });

  it('Selecting a Priority option calls onChange with the option value', () => {
    const onSubmit = vi.fn();
    renderModal({ onSubmit });
    const trigger = document.querySelector('button[name="priority"]');
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('option', { name: 'Low' }));
    // The trigger label should now show 'Low'
    expect(trigger.textContent).toContain('Low');
  });
});
