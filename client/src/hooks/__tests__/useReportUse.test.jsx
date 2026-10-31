import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, fireEvent } from '@testing-library/react';
import { useReportUse, REPORT_EVERY_MS } from '../useReportUse';

const mockConfig = { isSetup: true, isOnlineDemo: false };
vi.mock('../../contexts/ConfigContext', () => ({ useConfig: () => mockConfig }));

const useReports = () => fetch.mock.calls.filter(([url, o]) => url.endsWith('/api/use') && o?.method === 'POST');

let visibility = 'visible';

beforeEach(() => {
  mockConfig.isSetup = true;
  mockConfig.isOnlineDemo = false;
  visibility = 'visible';
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility);
  globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204 });
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useReportUse', () => {
  it('reports once when the app opens', () => {
    renderHook(() => useReportUse());
    expect(useReports()).toHaveLength(1);
  });

  it('clicks and keys report again only after the interval', () => {
    renderHook(() => useReportUse());
    fireEvent.pointerDown(window);
    fireEvent.keyDown(window, { key: 'a' });
    expect(useReports()).toHaveLength(1);
    vi.advanceTimersByTime(REPORT_EVERY_MS);
    fireEvent.pointerDown(window);
    expect(useReports()).toHaveLength(2);
  });

  it('a window left open with nobody at it reports nothing more', () => {
    renderHook(() => useReportUse());
    vi.advanceTimersByTime(24 * 60 * 60 * 1000);
    expect(useReports()).toHaveLength(1);
  });

  it('coming back to the window reports; a hidden window does not', () => {
    visibility = 'hidden';
    renderHook(() => useReportUse());
    expect(useReports()).toHaveLength(0);
    visibility = 'visible';
    fireEvent(document, new Event('visibilitychange'));
    expect(useReports()).toHaveLength(1);
  });

  it.each([
    ['before setup', { isSetup: false }],
    ['in the online demo', { isOnlineDemo: true }],
  ])('reports nothing %s', (_, config) => {
    Object.assign(mockConfig, config);
    renderHook(() => useReportUse());
    fireEvent.pointerDown(window);
    expect(useReports()).toHaveLength(0);
  });

  it('stops listening when unmounted', () => {
    const { unmount } = renderHook(() => useReportUse());
    unmount();
    vi.advanceTimersByTime(REPORT_EVERY_MS);
    fireEvent.pointerDown(window);
    expect(useReports()).toHaveLength(1);
  });
});
