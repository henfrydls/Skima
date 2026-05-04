import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { UpdateProvider, useUpdate } from '../UpdateContext';

// Mocks for the Tauri plugins
const mockCheck = vi.fn();
const mockDownloadAndInstall = vi.fn();
const mockRelaunch = vi.fn();

vi.mock('@tauri-apps/plugin-updater', () => ({
  check: () => mockCheck(),
}));

vi.mock('@tauri-apps/plugin-process', () => ({
  relaunch: () => mockRelaunch(),
}));

vi.mock('../../hooks/useAppVersion', () => ({
  useAppVersion: () => '1.4.0',
}));

// Mock UpdateModal since we test UI in its own file
vi.mock('../../components/common/UpdateModal', () => ({
  default: () => <div data-testid="update-modal" />,
}));

// Test harness: a tiny consumer that exposes the context to the test
function Probe() {
  const ctx = useUpdate();
  return (
    <div>
      <span data-testid="state">{ctx.state}</span>
      <span data-testid="version">{ctx.updateInfo?.version || 'none'}</span>
      <button data-testid="check" onClick={() => ctx.checkNow({ silent: false })}>check</button>
      <button data-testid="install" onClick={() => ctx.installNow()}>install</button>
      <button data-testid="remind" onClick={() => ctx.remindLater()}>remind</button>
      <button data-testid="skip" onClick={() => ctx.skipVersion()}>skip</button>
    </div>
  );
}

const renderWithProvider = () => render(
  <UpdateProvider>
    <Probe />
  </UpdateProvider>
);

describe('UpdateContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Default: pretend we're in Tauri so auto-check would normally run
    window.__TAURI_INTERNALS__ = {};
  });

  afterEach(() => {
    delete window.__TAURI_INTERNALS__;
    vi.useRealTimers();
  });

  describe('checkNow (manual)', () => {
    it('transitions to "up-to-date" when no update is available', async () => {
      mockCheck.mockResolvedValue(null);
      renderWithProvider();

      const checkBtn = screen.getByTestId('check');
      await act(async () => { checkBtn.click(); });

      await waitFor(() => {
        expect(screen.getByTestId('state').textContent).toBe('up-to-date');
      });
    });

    it('transitions to "available" with update info when update found', async () => {
      mockCheck.mockResolvedValue({
        version: '1.5.0',
        body: 'Some release notes',
        downloadAndInstall: mockDownloadAndInstall,
      });
      renderWithProvider();

      await act(async () => { screen.getByTestId('check').click(); });

      await waitFor(() => {
        expect(screen.getByTestId('state').textContent).toBe('available');
        expect(screen.getByTestId('version').textContent).toBe('1.5.0');
      });
    });

    it('transitions to "error" on check failure', async () => {
      mockCheck.mockRejectedValue(new Error('Network error'));
      renderWithProvider();

      await act(async () => { screen.getByTestId('check').click(); });

      await waitFor(() => {
        expect(screen.getByTestId('state').textContent).toBe('error');
      });
    });
  });

  describe('preferences', () => {
    it('remindLater stores snooze timestamp 24h in the future', async () => {
      mockCheck.mockResolvedValue({
        version: '1.5.0',
        body: '',
        downloadAndInstall: mockDownloadAndInstall,
      });
      renderWithProvider();

      await act(async () => { screen.getByTestId('check').click(); });
      await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('available'));

      const before = Date.now();
      await act(async () => { screen.getByTestId('remind').click(); });

      const stored = parseInt(localStorage.getItem('skima.update.snoozeUntil'), 10);
      expect(stored).toBeGreaterThanOrEqual(before + 24 * 60 * 60 * 1000 - 100);
      expect(stored).toBeLessThanOrEqual(before + 24 * 60 * 60 * 1000 + 100);
      expect(screen.getByTestId('state').textContent).toBe('idle');
    });

    it('skipVersion stores the skipped version string', async () => {
      mockCheck.mockResolvedValue({
        version: '1.5.0',
        body: '',
        downloadAndInstall: mockDownloadAndInstall,
      });
      renderWithProvider();

      await act(async () => { screen.getByTestId('check').click(); });
      await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('available'));

      await act(async () => { screen.getByTestId('skip').click(); });

      expect(localStorage.getItem('skima.update.skipVersion')).toBe('1.5.0');
      expect(screen.getByTestId('state').textContent).toBe('idle');
    });
  });

  describe('auto-check on mount', () => {
    it('does not run when not in Tauri', async () => {
      delete window.__TAURI_INTERNALS__;
      vi.useFakeTimers();
      renderWithProvider();
      await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
      expect(mockCheck).not.toHaveBeenCalled();
    });

    it('does not run when autoCheck pref is "false"', async () => {
      localStorage.setItem('skima.update.autoCheck', 'false');
      vi.useFakeTimers();
      renderWithProvider();
      await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
      expect(mockCheck).not.toHaveBeenCalled();
    });

    it('runs after 4s when in Tauri and autoCheck enabled (default)', async () => {
      mockCheck.mockResolvedValue(null);
      vi.useFakeTimers();
      renderWithProvider();

      await act(async () => { await vi.advanceTimersByTimeAsync(3500); });
      expect(mockCheck).not.toHaveBeenCalled();

      await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
      expect(mockCheck).toHaveBeenCalledTimes(1);
    });

    it('skips the modal if the found version equals skipVersion pref', async () => {
      localStorage.setItem('skima.update.skipVersion', '1.5.0');
      mockCheck.mockResolvedValue({
        version: '1.5.0',
        body: '',
        downloadAndInstall: mockDownloadAndInstall,
      });
      vi.useFakeTimers();
      renderWithProvider();
      await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
      expect(screen.getByTestId('state').textContent).toBe('idle');
    });

    it('skips the modal while snoozeUntil is in the future', async () => {
      localStorage.setItem('skima.update.snoozeUntil', String(Date.now() + 60 * 60 * 1000));
      mockCheck.mockResolvedValue({
        version: '1.5.0',
        body: '',
        downloadAndInstall: mockDownloadAndInstall,
      });
      vi.useFakeTimers();
      renderWithProvider();
      await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
      expect(screen.getByTestId('state').textContent).toBe('idle');
    });

    it('shows the modal again when snoozeUntil has passed', async () => {
      localStorage.setItem('skima.update.snoozeUntil', String(Date.now() - 1000));
      mockCheck.mockResolvedValue({
        version: '1.5.0',
        body: '',
        downloadAndInstall: mockDownloadAndInstall,
      });
      vi.useFakeTimers();
      renderWithProvider();
      await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
      expect(screen.getByTestId('state').textContent).toBe('available');
    });

    it('clears stale skipVersion when a newer version is found', async () => {
      localStorage.setItem('skima.update.skipVersion', '1.4.5');
      mockCheck.mockResolvedValue({
        version: '1.5.0',
        body: '',
        downloadAndInstall: mockDownloadAndInstall,
      });
      vi.useFakeTimers();
      renderWithProvider();
      await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
      expect(screen.getByTestId('state').textContent).toBe('available');
      expect(localStorage.getItem('skima.update.skipVersion')).not.toBe('1.4.5');
    });
  });

  describe('installNow', () => {
    it('calls downloadAndInstall then relaunch', async () => {
      mockDownloadAndInstall.mockResolvedValue(undefined);
      mockRelaunch.mockResolvedValue(undefined);
      mockCheck.mockResolvedValue({
        version: '1.5.0',
        body: '',
        downloadAndInstall: mockDownloadAndInstall,
      });
      renderWithProvider();

      await act(async () => { screen.getByTestId('check').click(); });
      await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('available'));

      await act(async () => { screen.getByTestId('install').click(); });

      await waitFor(() => {
        expect(mockDownloadAndInstall).toHaveBeenCalled();
        expect(mockRelaunch).toHaveBeenCalled();
      });
    });

    it('transitions to "error" when download fails', async () => {
      mockDownloadAndInstall.mockRejectedValue(new Error('Disk full'));
      mockCheck.mockResolvedValue({
        version: '1.5.0',
        body: '',
        downloadAndInstall: mockDownloadAndInstall,
      });
      renderWithProvider();

      await act(async () => { screen.getByTestId('check').click(); });
      await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('available'));

      await act(async () => { screen.getByTestId('install').click(); });

      await waitFor(() => {
        expect(screen.getByTestId('state').textContent).toBe('error');
      });
    });
  });
});
