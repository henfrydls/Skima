import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DownloadModal from '../DownloadModal';

const FAKE_ASSETS = [
  { name: 'Skima_1.4.1_x64-setup.exe', url: 'https://example/x64.exe', size: 105_000_000 },
  { name: 'Skima_1.4.1_universal.dmg', url: 'https://example/uni.dmg', size: 240_000_000 },
  { name: 'Skima_1.4.1_amd64.AppImage', url: 'https://example/app.AppImage', size: 195_000_000 },
  { name: 'Skima_1.4.1_amd64.deb', url: 'https://example/amd.deb', size: 122_000_000 },
];

const mockReleaseState = { version: '1.4.1', assets: FAKE_ASSETS, isLoading: false, isError: false, isFallback: false };
vi.mock('../../../hooks/useGitHubRelease', () => ({
  useGitHubRelease: () => mockReleaseState,
}));

const renderModal = (osOverride) => {
  if (osOverride) {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      get() { return osOverride; },
    });
  }
  return render(<DownloadModal isOpen={true} onClose={vi.fn()} />);
};

beforeEach(() => {
  document.body.innerHTML = '';
  Object.assign(mockReleaseState, { version: '1.4.1', assets: FAKE_ASSETS, isLoading: false, isError: false, isFallback: false });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DownloadModal', () => {
  describe('OS auto-detection', () => {
    it('shows Windows as primary when userAgent indicates Windows', () => {
      renderModal('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      expect(screen.getByText(/Download for Windows/i)).toBeInTheDocument();
    });

    it('shows macOS as primary when userAgent indicates Mac', () => {
      renderModal('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)');
      expect(screen.getByText(/Download for macOS/i)).toBeInTheDocument();
    });

    it('shows Linux as primary when userAgent indicates Linux', () => {
      renderModal('Mozilla/5.0 (X11; Linux x86_64)');
      expect(screen.getByText(/Download for Linux/i)).toBeInTheDocument();
    });

    it('shows mobile-only message when userAgent indicates Android', () => {
      renderModal('Mozilla/5.0 (Linux; Android 14; SM-S918U)');
      expect(screen.getByText(/Skima is a desktop app/i)).toBeInTheDocument();
      expect(screen.queryByText(/Download for/i)).not.toBeInTheDocument();
    });
  });

  describe('Mac install help section', () => {
    it('renders for macOS visitors', () => {
      renderModal('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)');
      expect(screen.getByTestId('mac-install-help')).toBeInTheDocument();
      expect(screen.getByText(/First time on macOS/i)).toBeInTheDocument();
    });

    it('does NOT render for Windows visitors', () => {
      renderModal('Mozilla/5.0 (Windows NT 10.0; Win64)');
      expect(screen.queryByTestId('mac-install-help')).not.toBeInTheDocument();
    });

    it('does NOT render for Linux visitors', () => {
      renderModal('Mozilla/5.0 (X11; Linux x86_64)');
      expect(screen.queryByTestId('mac-install-help')).not.toBeInTheDocument();
    });

    it('shows the Terminal command and a Copy button', () => {
      renderModal('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)');
      expect(screen.getByText(/xattr -cr/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Copy Terminal command/i })).toBeInTheDocument();
    });

    it('Copy button writes the command to the clipboard', async () => {
      const writeText = vi.fn().mockResolvedValue();
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText },
      });
      renderModal('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)');

      fireEvent.click(screen.getByRole('button', { name: /Copy Terminal command/i }));

      await waitFor(() => {
        expect(writeText).toHaveBeenCalledWith('xattr -cr /Applications/Skima.app');
      });
    });

    it('shows System Settings as alternative method', () => {
      renderModal('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)');
      expect(screen.getByText(/System Settings — manual alternative/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Open Anyway/i).length).toBeGreaterThan(0);
    });

    it('Why is this needed? toggle reveals the explanation', () => {
      renderModal('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)');
      const toggle = screen.getByRole('button', { name: /Why is this needed/i });
      expect(screen.queryByText(/Apple Developer certificate/i)).not.toBeInTheDocument();
      fireEvent.click(toggle);
      expect(screen.getByText(/Apple Developer certificate/i)).toBeInTheDocument();
    });
  });

  describe('Other platforms section', () => {
    it('lists non-primary platforms when on macOS', () => {
      renderModal('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)');
      expect(screen.getByText(/Windows installer/i)).toBeInTheDocument();
      expect(screen.getByText(/Linux \(AppImage\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Linux \(\.deb\)/i)).toBeInTheDocument();
    });

    it('does not duplicate the primary platform in the other-platforms list', () => {
      renderModal('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)');
      // "macOS (Universal)" is the primary CTA so should not appear in the secondary list
      const macosLabels = screen.queryAllByText(/macOS \(Universal\)/i);
      expect(macosLabels.length).toBe(0);
    });
  });

  describe('Source link', () => {
    it('shows View source on GitHub footer link', () => {
      renderModal('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)');
      const link = screen.getByText(/View source on GitHub/i).closest('a');
      expect(link).toHaveAttribute('href', expect.stringContaining('github.com'));
    });
  });

  describe('Loading and fallback states', () => {
    it('shows loading text while fetching version', () => {
      Object.assign(mockReleaseState, { isLoading: true, version: null, assets: [] });
      renderModal('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)');
      expect(screen.getByText(/Fetching latest version/i)).toBeInTheDocument();
    });

    it('marks the version as offline when using fallback', () => {
      Object.assign(mockReleaseState, { isFallback: true });
      renderModal('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)');
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
    });
  });

  describe('Closing', () => {
    it('Escape key triggers onClose', () => {
      const onClose = vi.fn();
      Object.defineProperty(navigator, 'userAgent', {
        configurable: true,
        get() { return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)'; },
      });
      render(<DownloadModal isOpen={true} onClose={onClose} />);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalled();
    });
  });
});
