import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CheckinNotice from '../CheckinNotice';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));
const mockConfig = { isSetup: true, isOnlineDemo: false };
vi.mock('../../../contexts/ConfigContext', () => ({ useConfig: () => mockConfig }));
vi.mock('../../../contexts/AuthContext', () => ({ useAuth: () => ({ getHeaders: () => ({}) }) }));

function mockStatus(status) {
  globalThis.fetch = vi.fn(async (url) => {
    if (url.endsWith('/api/checkin-status')) {
      return { ok: true, json: async () => ({ configured: true, disabled: false, off: false, noticeSeen: false, version: '1.6.0', ...status }) };
    }
    return { ok: true, json: async () => ({ noticeSeen: true }) };
  });
}

const seenCalls = () => fetch.mock.calls.filter(([url, o]) => url.endsWith('/api/checkin-notice-seen') && o?.method === 'POST');

beforeEach(() => {
  mockConfig.isSetup = true;
  mockConfig.isOnlineDemo = false;
  mockNavigate.mockClear();
});

describe('CheckinNotice', () => {
  it('says it is on, offers "See or turn off", and is marked seen once shown', async () => {
    mockStatus({});
    render(<CheckinNotice />);
    expect(await screen.findByText('Anonymous check-in is on.')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('checkin-notice-open'));
    expect(screen.getByTestId('checkin-notice-open')).toHaveTextContent('See or turn off');
    expect(mockNavigate).toHaveBeenCalledWith('/settings?tab=about');
    await waitFor(() => expect(seenCalls()).toHaveLength(1));
  });

  it('says it is off, and offers "See and turn on", for a copy that starts off', async () => {
    mockStatus({ off: true });
    render(<CheckinNotice />);
    expect(await screen.findByText('Anonymous check-in is off.')).toBeInTheDocument();
    expect(screen.getByTestId('checkin-notice-open')).toHaveTextContent('See and turn on');
  });

  it('is not shown again once seen', async () => {
    mockStatus({ noticeSeen: true });
    const { container } = render(<CheckinNotice />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
    expect(seenCalls()).toHaveLength(0);
  });

  it.each([
    ['before setup is complete', { isSetup: false }, {}],
    ['in the online demo', { isOnlineDemo: true }, {}],
    ['in a build that does not send', {}, { configured: false }],
    ['with SKIMA_DISABLE_CHECKIN', {}, { disabled: true }],
  ])('is not shown %s, and not marked seen', async (_, config, status) => {
    Object.assign(mockConfig, config);
    mockStatus(status);
    const { container } = render(<CheckinNotice />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
    expect(seenCalls()).toHaveLength(0);
  });

  it('the X hides it without changing the check-in', async () => {
    mockStatus({});
    render(<CheckinNotice />);
    fireEvent.click(await screen.findByTestId('checkin-notice-dismiss'));
    expect(screen.queryByTestId('checkin-notice')).toBeNull();
    expect(fetch.mock.calls.some(([url]) => /checkin-(on|off)$/.test(url))).toBe(false);
  });
});
