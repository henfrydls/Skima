import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ConfigProvider, useConfig } from '../ConfigContext';

describe('ConfigContext', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper component to test the context
  function TestComponent() {
    const {
      config,
      isLoading,
      error,
      isSetup,
      companyName,
      adminName,
      onSetupComplete,
      refetchConfig
    } = useConfig();

    return (
      <div>
        <div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
        <div data-testid="error">{error || 'no-error'}</div>
        <div data-testid="isSetup">{isSetup ? 'setup' : 'not-setup'}</div>
        <div data-testid="companyName">{companyName}</div>
        <div data-testid="adminName">{adminName}</div>
        <div data-testid="config">{JSON.stringify(config)}</div>
        <button onClick={() => onSetupComplete({ companyName: 'NewCo', adminName: 'NewAdmin' })}>
          Complete Setup
        </button>
        <button onClick={refetchConfig}>Refetch</button>
      </div>
    );
  }

  it('shows loading state initially', () => {
    fetchMock.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('loading');
  });

  it('fetches config and displays company name', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isSetup: true,
        companyName: 'TechCorp',
        adminName: 'Alice'
      })
    });

    render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    expect(screen.getByTestId('companyName')).toHaveTextContent('TechCorp');
    expect(screen.getByTestId('adminName')).toHaveTextContent('Alice');
    expect(fetchMock).toHaveBeenCalledWith('/api/config');
  });

  it('isSetup false when server says not setup', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isSetup: false,
        companyName: null,
        adminName: null
      })
    });

    render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    expect(screen.getByTestId('isSetup')).toHaveTextContent('not-setup');
  });

  it('isSetup true when server says setup', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isSetup: true,
        companyName: 'MyCo',
        adminName: 'Bob'
      })
    });

    render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    expect(screen.getByTestId('isSetup')).toHaveTextContent('setup');
  });

  it('error handling: network failure sets default config', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));

    render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    expect(screen.getByTestId('error')).toHaveTextContent('Network error');
    expect(screen.getByTestId('isSetup')).toHaveTextContent('not-setup');
    expect(screen.getByTestId('companyName')).toHaveTextContent('Skima');
    expect(screen.getByTestId('adminName')).toHaveTextContent('Admin');

    // Verify default config was set
    const config = JSON.parse(screen.getByTestId('config').textContent);
    expect(config).toEqual({
      isSetup: false,
      companyName: null,
      adminName: null
    });
  });

  it('error handling: non-ok response with error message', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Database connection failed' })
    });

    render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    expect(screen.getByTestId('error')).toHaveTextContent('Database connection failed');
  });

  it('error handling: non-ok response without error message', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({})
    });

    render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    expect(screen.getByTestId('error')).toHaveTextContent('Failed to fetch config');
  });

  it('onSetupComplete updates config', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isSetup: false,
        companyName: null,
        adminName: null
      })
    });

    render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    expect(screen.getByTestId('isSetup')).toHaveTextContent('not-setup');

    // Click setup complete button
    const button = screen.getByText('Complete Setup');
    button.click();

    await waitFor(() => {
      expect(screen.getByTestId('isSetup')).toHaveTextContent('setup');
    });

    expect(screen.getByTestId('companyName')).toHaveTextContent('NewCo');
    expect(screen.getByTestId('adminName')).toHaveTextContent('NewAdmin');
  });

  it('refetchConfig re-fetches from server', async () => {
    // Initial fetch
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isSetup: false,
        companyName: 'OldCo',
        adminName: 'OldAdmin'
      })
    });

    render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    expect(screen.getByTestId('companyName')).toHaveTextContent('OldCo');

    // Mock second fetch with updated data
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isSetup: true,
        companyName: 'UpdatedCo',
        adminName: 'UpdatedAdmin'
      })
    });

    // Click refetch button
    const button = screen.getByText('Refetch');
    button.click();

    await waitFor(() => {
      expect(screen.getByTestId('companyName')).toHaveTextContent('UpdatedCo');
    });

    expect(screen.getByTestId('adminName')).toHaveTextContent('UpdatedAdmin');
    expect(screen.getByTestId('isSetup')).toHaveTextContent('setup');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('default values when config fields are null', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isSetup: false,
        companyName: null,
        adminName: null
      })
    });

    render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    expect(screen.getByTestId('companyName')).toHaveTextContent('Skima');
    expect(screen.getByTestId('adminName')).toHaveTextContent('Admin');
    expect(screen.getByTestId('isSetup')).toHaveTextContent('not-setup');
  });

  it('useConfig outside provider throws error', () => {
    // Suppress console.error for this test
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useConfig must be used within a ConfigProvider');

    consoleErrorSpy.mockRestore();
  });

  it('clears error on successful refetch', async () => {
    // Initial fetch fails
    fetchMock.mockRejectedValueOnce(new Error('Initial error'));

    render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Initial error');
    });

    // Refetch succeeds
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        isSetup: true,
        companyName: 'SuccessCo',
        adminName: 'SuccessAdmin'
      })
    });

    const button = screen.getByText('Refetch');
    button.click();

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });

    expect(screen.getByTestId('companyName')).toHaveTextContent('SuccessCo');
  });
});
