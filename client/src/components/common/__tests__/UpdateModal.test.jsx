import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UpdateModal from '../UpdateModal';

const mockContext = {
  state: 'available',
  updateInfo: { version: '1.5.0', notes: 'Bugfixes and improvements' },
  progress: { downloaded: 0, total: 0 },
  error: null,
  installNow: vi.fn(),
  remindLater: vi.fn(),
  skipVersion: vi.fn(),
  dismissError: vi.fn(),
};

vi.mock('../../../contexts/UpdateContext', () => ({
  useUpdate: () => mockContext,
}));

vi.mock('../../../hooks/useAppVersion', () => ({
  useAppVersion: () => '1.4.0',
}));

beforeEach(() => {
  document.body.innerHTML = '';
  Object.assign(mockContext, {
    state: 'available',
    updateInfo: { version: '1.5.0', notes: 'Bugfixes and improvements' },
    progress: { downloaded: 0, total: 0 },
    error: null,
  });
  Object.values(mockContext).forEach(v => v?.mockClear?.());
});

describe('UpdateModal', () => {
  describe('available state', () => {
    it('shows new version in title', () => {
      render(<UpdateModal />);
      expect(screen.getByText(/Update available/i)).toBeInTheDocument();
      expect(screen.getByText(/1\.5\.0/)).toBeInTheDocument();
    });

    it('shows release notes', () => {
      render(<UpdateModal />);
      expect(screen.getByText(/Bugfixes and improvements/)).toBeInTheDocument();
    });

    it('renders three action buttons', () => {
      render(<UpdateModal />);
      expect(screen.getByRole('button', { name: /Update now/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Remind me later/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Skip this version/i })).toBeInTheDocument();
    });

    it('clicking Update now calls installNow', () => {
      render(<UpdateModal />);
      fireEvent.click(screen.getByRole('button', { name: /Update now/i }));
      expect(mockContext.installNow).toHaveBeenCalled();
    });

    it('clicking Remind me later calls remindLater', () => {
      render(<UpdateModal />);
      fireEvent.click(screen.getByRole('button', { name: /Remind me later/i }));
      expect(mockContext.remindLater).toHaveBeenCalled();
    });

    it('clicking Skip this version calls skipVersion', () => {
      render(<UpdateModal />);
      fireEvent.click(screen.getByRole('button', { name: /Skip this version/i }));
      expect(mockContext.skipVersion).toHaveBeenCalled();
    });
  });

  describe('downloading state', () => {
    it('shows progress information', () => {
      mockContext.state = 'downloading';
      mockContext.progress = { downloaded: 5_000_000, total: 10_000_000 };
      render(<UpdateModal />);
      expect(screen.getByText(/Downloading/i)).toBeInTheDocument();
      // Shows the MB/MB summary
      expect(screen.getByText(/MB/)).toBeInTheDocument();
    });

    it('does not render the "Update now" button while downloading', () => {
      mockContext.state = 'downloading';
      render(<UpdateModal />);
      expect(screen.queryByRole('button', { name: /Update now/i })).not.toBeInTheDocument();
    });
  });

  describe('installing state', () => {
    it('shows installing message and restart hint', () => {
      mockContext.state = 'installing';
      render(<UpdateModal />);
      expect(screen.getByText(/Installing/i)).toBeInTheDocument();
      expect(screen.getByText(/restart/i)).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows the error message', () => {
      mockContext.state = 'error';
      mockContext.error = 'Network failure';
      render(<UpdateModal />);
      expect(screen.getByText(/Update failed/i)).toBeInTheDocument();
      expect(screen.getByText(/Network failure/)).toBeInTheDocument();
    });

    it('clicking Try again calls installNow', () => {
      mockContext.state = 'error';
      mockContext.error = 'Network failure';
      render(<UpdateModal />);
      fireEvent.click(screen.getByRole('button', { name: /Try again/i }));
      expect(mockContext.installNow).toHaveBeenCalled();
    });

    it('clicking Close calls dismissError', () => {
      mockContext.state = 'error';
      mockContext.error = 'Network failure';
      render(<UpdateModal />);
      fireEvent.click(screen.getByRole('button', { name: /Close/i }));
      expect(mockContext.dismissError).toHaveBeenCalled();
    });
  });
});
