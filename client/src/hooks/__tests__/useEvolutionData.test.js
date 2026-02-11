import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { useEvolutionData } from '../useEvolutionData';

describe('useEvolutionData', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initial state: loading true, data null', () => {
    fetchMock.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useEvolutionData());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe(null);
    expect(result.current.timeRange).toBe('12m');
  });

  it('successful fetch: loading false, data populated', async () => {
    const mockData = {
      snapshots: [
        { date: '2025-01-01', avgLevel: 2.5, totalSkills: 10 },
        { date: '2025-02-01', avgLevel: 2.7, totalSkills: 12 }
      ]
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    const { result } = renderHook(() => useEvolutionData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBe(null);
    expect(fetchMock).toHaveBeenCalledWith('/api/skills/evolution?range=12m');
  });

  it('error handling: loading false, error message set', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network failure'));

    const { result } = renderHook(() => useEvolutionData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toBe('Network failure');
  });

  it('error handling: generic error message when no error message', async () => {
    fetchMock.mockRejectedValueOnce(new Error());

    const { result } = renderHook(() => useEvolutionData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Error al cargar datos de evolución');
  });

  it('timeRange change triggers new fetch', async () => {
    const mockData1 = { snapshots: [{ date: '2025-01-01', avgLevel: 2.5 }] };
    const mockData2 = { snapshots: [{ date: '2024-01-01', avgLevel: 2.2 }] };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData1
    });

    const { result } = renderHook(() => useEvolutionData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData1);
    expect(fetchMock).toHaveBeenCalledWith('/api/skills/evolution?range=12m');

    // Change time range
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData2
    });

    act(() => {
      result.current.setTimeRange('6m');
    });

    await waitFor(() => {
      expect(result.current.timeRange).toBe('6m');
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData2);
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/skills/evolution?range=6m');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('refetch re-fetches with current range', async () => {
    const mockData1 = { snapshots: [{ date: '2025-01-01', avgLevel: 2.5 }] };
    const mockData2 = { snapshots: [{ date: '2025-02-01', avgLevel: 2.8 }] };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData1
    });

    const { result } = renderHook(() => useEvolutionData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData1);

    // Refetch with same range
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData2
    });

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData2);
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/skills/evolution?range=12m');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('default range is 12m', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ snapshots: [] })
    });

    const { result } = renderHook(() => useEvolutionData());

    expect(result.current.timeRange).toBe('12m');

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/skills/evolution?range=12m');
    });
  });

  it('custom initial range works', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ snapshots: [] })
    });

    const { result } = renderHook(() => useEvolutionData('24m'));

    expect(result.current.timeRange).toBe('24m');

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/skills/evolution?range=24m');
    });
  });

  it('HTTP error (non-ok response) sets error', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({})
    });

    const { result } = renderHook(() => useEvolutionData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('HTTP 404: Not Found');
    expect(result.current.data).toBe(null);
  });

  it('HTTP 500 error sets appropriate error message', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({})
    });

    const { result } = renderHook(() => useEvolutionData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('HTTP 500: Internal Server Error');
  });

  it('loading state transitions correctly during refetch', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ snapshots: [] })
    });

    const { result } = renderHook(() => useEvolutionData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Start refetch
    fetchMock.mockImplementation(() => new Promise(() => {})); // Never resolves

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });
  });

  it('clears error on successful refetch', async () => {
    // Initial fetch fails
    fetchMock.mockRejectedValueOnce(new Error('Initial error'));

    const { result } = renderHook(() => useEvolutionData());

    await waitFor(() => {
      expect(result.current.error).toBe('Initial error');
    });

    // Refetch succeeds
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ snapshots: [{ date: '2025-01-01', avgLevel: 3.0 }] })
    });

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.error).toBe(null);
    });

    expect(result.current.data).toEqual({ snapshots: [{ date: '2025-01-01', avgLevel: 3.0 }] });
  });

  it('multiple rapid time range changes use latest range', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ snapshots: [] })
    });

    const { result } = renderHook(() => useEvolutionData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Rapidly change ranges
    act(() => {
      result.current.setTimeRange('6m');
      result.current.setTimeRange('24m');
      result.current.setTimeRange('ytd');
    });

    await waitFor(() => {
      expect(result.current.timeRange).toBe('ytd');
    });

    // The hook should eventually fetch with the latest range
    await waitFor(() => {
      const calls = fetchMock.mock.calls;
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall).toContain('range=ytd');
    });
  });

  it('preserves data while loading new data', async () => {
    const mockData1 = { snapshots: [{ date: '2025-01-01', avgLevel: 2.5 }] };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData1
    });

    const { result } = renderHook(() => useEvolutionData());

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData1);
    });

    // Start new fetch but don't resolve immediately
    let resolvePromise;
    fetchMock.mockImplementationOnce(() => new Promise((resolve) => {
      resolvePromise = resolve;
    }));

    act(() => {
      result.current.setTimeRange('6m');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    // Data should still be the old data while loading
    expect(result.current.data).toEqual(mockData1);

    // Resolve the promise
    const mockData2 = { snapshots: [{ date: '2024-01-01', avgLevel: 2.2 }] };
    await act(async () => {
      resolvePromise({
        ok: true,
        json: async () => mockData2
      });
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData2);
    });
  });

  it('handles fetch with all time range', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ snapshots: [] })
    });

    const { result } = renderHook(() => useEvolutionData('all'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/skills/evolution?range=all');
    });

    expect(result.current.timeRange).toBe('all');
  });
});
