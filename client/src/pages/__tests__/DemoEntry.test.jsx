import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import DemoEntry from '../DemoEntry';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../lib/apiBase', () => ({ API_BASE: '' }));

const mockUseConfig = vi.fn();
vi.mock('../../contexts/ConfigContext', () => ({
  useConfig: () => mockUseConfig(),
}));

// Seeding replaces every table, so /demo seeds only on the online demo.
describe('DemoEntry', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('seeds the demo on the online demo', async () => {
    mockUseConfig.mockReturnValue({ isLoading: false, isOnlineDemo: true });
    render(<DemoEntry />);

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true }));
    expect(fetch).toHaveBeenCalledWith('/api/seed-demo', { method: 'POST' });
  });

  it('only redirects anywhere else', async () => {
    mockUseConfig.mockReturnValue({ isLoading: false, isOnlineDemo: false });
    render(<DemoEntry />);

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true }));
    expect(fetch).not.toHaveBeenCalled();
  });

  it('waits for the configuration before deciding', () => {
    mockUseConfig.mockReturnValue({ isLoading: true, isOnlineDemo: false });
    render(<DemoEntry />);

    expect(fetch).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
