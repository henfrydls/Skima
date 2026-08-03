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
  // Default: the mount-time /api/backup-log fetch resolves to an empty log.
  // Tests that need export/import/history behavior override this.
  mockAuthFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ lastExport: null, entries: [] }) });
  document.body.innerHTML = '';
  // Stub reload so the post-restore window.location.reload() is a no-op in jsdom.
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { reload: vi.fn(), href: 'http://localhost/' },
  });
});

describe('BackupTab', () => {
  it('renders export and restore sections', async () => {
    render(<BackupTab />);
    expect(screen.getByRole('heading', { name: /Export Data/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Restore from Backup/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download Backup/i })).toBeInTheDocument();
    // let the mount-time log fetch settle so its state update is inside act()
    await waitFor(() => expect(screen.getByText(/No backups yet/i)).toBeInTheDocument());
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

  it('posts the parsed data (and its provenance) to /api/import after confirming', async () => {
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
      const body = JSON.parse(importCall[1].body);
      expect(body.data.skills).toHaveLength(2);
      // provenance travels with the payload so the server can log it
      expect(body.fileName).toBe('skima-backup-2026-06-01.json');
      expect(body.sourceExportDate).toBe('2026-06-01T10:00:00.000Z');
      expect(body.sourceVersion).toBe('2.0');
    });
  });

  // Route by URL so the mount-time /api/backup-log fetch and later export/import
  // calls can return different shapes. The log endpoint returns { lastExport, entries }.
  const routeFetch = (entries, lastExport = entries.find((e) => e.type === 'export' && e.status === 'success') || null) =>
    vi.fn(async (url) => {
      if (String(url).includes('/api/backup-log')) {
        return { ok: true, status: 200, json: async () => ({ lastExport, entries }) };
      }
      if (String(url).includes('/api/export')) {
        return { ok: true, status: 200, json: async () => ({ exportDate: '2026-06-01T10:00:00.000Z', version: '2.0', data: {} }) };
      }
      return { ok: true, status: 200, json: async () => ({ success: true }) };
    });

  const iso = (msAgo) => new Date(Date.now() - msAgo).toISOString();
  const DAY = 86400000;

  it('prompts to make a first backup when the log is empty', async () => {
    mockAuthFetch.mockImplementation(routeFetch([]));
    render(<BackupTab />);
    await waitFor(() => expect(screen.getByText(/No backups yet/i)).toBeInTheDocument());
  });

  it('shows the last backup time and a recent-activity history', async () => {
    mockAuthFetch.mockImplementation(routeFetch([
      { id: 2, type: 'restore', status: 'success', recordCount: 5, recordsDeleted: 4, fileName: 'prod.json', createdAt: iso(2 * DAY) },
      { id: 1, type: 'export', status: 'success', recordCount: 12, createdAt: iso(3 * DAY) },
    ]));
    render(<BackupTab />);
    await waitFor(() => expect(screen.getByText(/Last backup 3 days ago/i)).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: /Recent Activity/i })).toBeInTheDocument();
    expect(screen.getByText(/Exported 12 records/i)).toBeInTheDocument();
    expect(screen.getByText(/Restored prod\.json — 5 in, 4 replaced/i)).toBeInTheDocument();
  });

  it('flags a stale backup (>30 days) as needing a fresh download', async () => {
    mockAuthFetch.mockImplementation(routeFetch([
      { id: 1, type: 'export', status: 'success', recordCount: 3, createdAt: iso(40 * DAY) },
    ]));
    render(<BackupTab />);
    await waitFor(() => expect(screen.getByText(/consider downloading a fresh one/i)).toBeInTheDocument());
  });

  it('surfaces a failed restore in the activity list', async () => {
    mockAuthFetch.mockImplementation(routeFetch([
      { id: 1, type: 'restore', status: 'failed', fileName: 'broken.json', createdAt: iso(60000) },
    ]));
    render(<BackupTab />);
    await waitFor(() => expect(screen.getByText(/Restore of broken\.json failed/i)).toBeInTheDocument());
  });

  it('uses the separate lastExport for the status even when entries hold only restores', async () => {
    // entries (recent activity) are all restores; lastExport is tracked apart so
    // the "last backup" line stays accurate.
    const entries = [{ id: 2, type: 'restore', status: 'success', recordCount: 1, recordsDeleted: 1, fileName: 'r.json', createdAt: iso(DAY) }];
    const lastExport = { id: 1, type: 'export', status: 'success', recordCount: 9, createdAt: iso(5 * DAY) };
    mockAuthFetch.mockImplementation(routeFetch(entries, lastExport));
    render(<BackupTab />);
    await waitFor(() => expect(screen.getByText(/Last backup 5 days ago/i)).toBeInTheDocument());
    expect(screen.queryByText(/No backups yet/i)).not.toBeInTheDocument();
  });

  it('does not fetch or show history in the online demo', async () => {
    mockIsDemo = true;
    mockAuthFetch.mockImplementation(routeFetch([{ id: 1, type: 'export', status: 'success', recordCount: 1, createdAt: iso(DAY) }]));
    render(<BackupTab />);
    // give any effect a tick to (not) run
    await waitFor(() => expect(screen.getByText(/not available in the online demo/i)).toBeInTheDocument());
    expect(screen.queryByRole('heading', { name: /Recent Activity/i })).not.toBeInTheDocument();
    expect(mockAuthFetch).not.toHaveBeenCalledWith(expect.stringContaining('/api/backup-log'));
  });
});
