import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CheckinSettings, { EXAMPLE_ID } from '../CheckinSettings';

const mockConfig = { isOnlineDemo: false };
vi.mock('../../../contexts/ConfigContext', () => ({ useConfig: () => mockConfig }));
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ getHeaders: () => ({ Authorization: 'Bearer t' }) }),
}));
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn() } }));

const REAL_ID = '11111111-2222-4333-8444-555555555555';
let server;

function mockServer({ configured = true, disabled = false, off = false, id = REAL_ID } = {}) {
  server = { off, id, calls: [] };
  globalThis.fetch = vi.fn(async (url, opts = {}) => {
    const path = url.replace(/^.*\/api\//, '');
    server.calls.push({ path, method: opts.method || 'GET', headers: opts.headers });
    if (path === 'checkin-status') {
      return { ok: true, json: async () => ({ configured, disabled, off: server.off, noticeSeen: true, version: '1.6.0' }) };
    }
    if (path === 'checkin-fields') {
      return {
        ok: true,
        json: async () => ({
          available: true,
          fields: { id: server.off ? null : server.id, version: '1.6.0', os: 'windows', arch: 'x64', source: 'store' },
        }),
      };
    }
    if (path === 'checkin-off') { server.off = true; server.id = null; return { ok: true, json: async () => ({ sent: true }) }; }
    if (path === 'checkin-on') { server.off = false; return { ok: true, json: async () => ({ off: false }) }; }
    return { ok: false, status: 404, json: async () => ({}) };
  });
}

beforeEach(() => {
  mockConfig.isOnlineDemo = false;
});

describe('CheckinSettings', () => {
  it('renders nothing for a build that does not send', async () => {
    mockServer({ configured: false });
    const { container } = render(<CheckinSettings />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when SKIMA_DISABLE_CHECKIN is set', async () => {
    mockServer({ disabled: true });
    const { container } = render(<CheckinSettings />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing in the online demo', async () => {
    mockConfig.isOnlineDemo = true;
    mockServer();
    const { container } = render(<CheckinSettings />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the switch on when not turned off', async () => {
    mockServer();
    render(<CheckinSettings />);
    const sw = await screen.findByRole('switch', { name: /Anonymous check-in/i });
    expect(sw).toHaveAttribute('aria-checked', 'true');
  });

  it('"What gets sent" lists every field sent, with the real number', async () => {
    mockServer();
    render(<CheckinSettings />);
    fireEvent.click(await screen.findByTestId('checkin-what-gets-sent'));
    expect(await screen.findByText(REAL_ID)).toBeInTheDocument();
    for (const value of ['1.6.0', 'windows', 'x64', 'store']) {
      expect(screen.getByText(value)).toBeInTheDocument();
    }
    expect(screen.getByText(new Date().toISOString().slice(0, 10))).toBeInTheDocument();
    expect(screen.queryByTestId('checkin-example-note')).toBeNull();
    expect(screen.getByText(/sends one last message/i)).toBeInTheDocument();
  });

  it('"What gets sent" ends with the privacy policy, opened outside the app', async () => {
    mockServer();
    render(<CheckinSettings />);
    fireEvent.click(await screen.findByTestId('checkin-what-gets-sent'));
    const link = await screen.findByRole('link', { name: /privacy policy/i });
    expect(link).toHaveAttribute('href', 'https://github.com/henfrydls/Skima/blob/main/PRIVACY.md');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('marks the number as an example while on but before the first check-in', async () => {
    mockServer({ id: null });
    render(<CheckinSettings />);
    fireEvent.click(await screen.findByTestId('checkin-what-gets-sent'));
    expect(await screen.findByText(EXAMPLE_ID)).toBeInTheDocument();
    expect(screen.getByTestId('checkin-example-note')).toHaveTextContent(/made at the next check-in/i);
  });

  it('turning it off calls checkin-off with auth, then shows the example number marked as such', async () => {
    mockServer();
    render(<CheckinSettings />);
    fireEvent.click(await screen.findByTestId('checkin-what-gets-sent'));
    await screen.findByText(REAL_ID);
    fireEvent.click(screen.getByRole('switch'));
    await waitFor(() => expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false'));
    const off = server.calls.find((c) => c.path === 'checkin-off');
    expect(off.method).toBe('POST');
    expect(off.headers.Authorization).toBe('Bearer t');
    expect(screen.queryByText(REAL_ID)).toBeNull();
    expect(screen.getByText(EXAMPLE_ID)).toBeInTheDocument();
    expect(screen.getByTestId('checkin-example-note')).toHaveTextContent(/only made if you turn the check-in on/i);
  });

  it('turning it on calls checkin-on with auth', async () => {
    mockServer({ off: true });
    render(<CheckinSettings />);
    const sw = await screen.findByRole('switch');
    expect(sw).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(sw);
    await waitFor(() => expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true'));
    const on = server.calls.find((c) => c.path === 'checkin-on');
    expect(on.method).toBe('POST');
    expect(on.headers.Authorization).toBe('Bearer t');
  });
});
