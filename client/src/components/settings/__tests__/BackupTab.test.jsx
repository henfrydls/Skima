import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BackupTab from '../BackupTab';

const mockAuthFetch = vi.fn();
let mockIsDemo = false;

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ authFetch: mockAuthFetch }),
}));
vi.mock('../../../contexts/ConfigContext', () => ({
  useConfig: () => ({ isDemo: mockIsDemo }),
}));
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const makeFile = (obj, name = 'skima-backup-2026-06-01.json') =>
  new File([JSON.stringify(obj)], name, { type: 'application/json' });

const VALID = {
  exportDate: '2026-06-01T10:00:00.000Z',
  version: '2.0',
  data: { categories: [{ id: 1 }], skills: [{ id: 1 }, { id: 2 }], collaborators: [{ id: 1 }] },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockIsDemo = false;
  document.body.innerHTML = '';
  // Stub reload so the post-restore window.location.reload() is a no-op in jsdom.
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { reload: vi.fn(), href: 'http://localhost/' },
  });
});

describe('BackupTab', () => {
  it('renders export and restore sections', () => {
    render(<BackupTab />);
    expect(screen.getByRole('heading', { name: /Export Data/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Restore from Backup/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download Backup/i })).toBeInTheDocument();
  });

  it('disables restore in the online demo', () => {
    mockIsDemo = true;
    render(<BackupTab />);
    expect(screen.getByText(/not available in the online demo/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Choose File/i })).not.toBeInTheDocument();
    // export is still available (GET, allowed in demo)
    expect(screen.getByRole('button', { name: /Download Backup/i })).toBeInTheDocument();
  });

  it('shows a summary and enables restore for a valid backup file', async () => {
    render(<BackupTab />);
    fireEvent.change(screen.getByTestId('backup-file-input'), { target: { files: [makeFile(VALID)] } });
    await waitFor(() => expect(screen.getByText(/2 skills/)).toBeInTheDocument());
    expect(screen.getByText(/1 collaborators/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Restore from Backup/i })).not.toBeDisabled();
  });

  it('counts collections beyond the common ones (e.g. snapshots) in the summary', async () => {
    render(<BackupTab />);
    fireEvent.change(screen.getByTestId('backup-file-input'), {
      target: {
        files: [makeFile({ version: '2.0', data: { categories: [], skills: [], snapshots: [{ id: 1 }, { id: 2 }, { id: 3 }] } })],
      },
    });
    await waitFor(() => expect(screen.getByText(/3 snapshots/)).toBeInTheDocument());
  });

  it('rejects a wrong-shape file', async () => {
    render(<BackupTab />);
    fireEvent.change(screen.getByTestId('backup-file-input'), { target: { files: [makeFile({ nope: true })] } });
    await waitFor(() => expect(screen.getByText(/doesn't look like a Skima backup/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Restore from Backup/i })).toBeDisabled();
  });

  it('posts the parsed data to /api/import after confirming', async () => {
    mockAuthFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true }) });
    render(<BackupTab />);

    fireEvent.change(screen.getByTestId('backup-file-input'), { target: { files: [makeFile(VALID)] } });
    await waitFor(() => screen.getByText(/2 skills/));

    fireEvent.click(screen.getByRole('button', { name: /Restore from Backup/i }));
    await waitFor(() => screen.getByText(/Replace All Data\?/i));
    fireEvent.click(screen.getByRole('button', { name: /Wipe & Restore/i }));

    await waitFor(() => {
      const importCall = mockAuthFetch.mock.calls.find((c) => String(c[0]).includes('/api/import'));
      expect(importCall).toBeTruthy();
      expect(importCall[1].method).toBe('POST');
      expect(JSON.parse(importCall[1].body).data.skills).toHaveLength(2);
    });
  });
});
