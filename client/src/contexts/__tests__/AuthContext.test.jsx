import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';

// Test component that consumes AuthContext
function TestConsumer() {
  const auth = useAuth();

  return (
    <div>
      <div data-testid="token">{auth.token || 'null'}</div>
      <div data-testid="isAuthenticated">{String(auth.isAuthenticated)}</div>
      <div data-testid="sessionExpired">{String(auth.sessionExpired)}</div>
      <button onClick={() => auth.login('test-token-123')}>Login</button>
      <button onClick={() => auth.logout()}>Logout</button>
      <button
        onClick={async () => {
          try {
            await auth.authFetch('/api/test');
          } catch (err) {
            // Error will be visible in sessionExpired state
          }
        }}
      >
        Fetch
      </button>
      <div data-testid="headers">{JSON.stringify(auth.getHeaders())}</div>
    </div>
  );
}

describe('AuthContext', () => {
  let localStorageMock;
  let fetchMock;

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    global.localStorage = localStorageMock;

    // Mock fetch
    fetchMock = vi.fn();
    global.fetch = fetchMock;

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should have isAuthenticated false when no token in localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      expect(screen.getByTestId('token')).toHaveTextContent('null');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('sessionExpired')).toHaveTextContent('false');
    });

    it('should have isAuthenticated true when token exists in localStorage', async () => {
      const mockToken = 'stored-token-456';
      localStorageMock.getItem.mockReturnValue(mockToken);

      // Mock successful verification
      fetchMock.mockResolvedValueOnce({
        json: async () => ({ authenticated: true }),
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      expect(screen.getByTestId('token')).toHaveTextContent(mockToken);
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');

      // Wait for verification call
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/auth/verify',
          {
            headers: { 'Authorization': `Bearer ${mockToken}` }
          }
        );
      });
    });
  });

  describe('Login', () => {
    it('should set token, update localStorage, and set isAuthenticated to true', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');

      await user.click(screen.getByText('Login'));

      expect(screen.getByTestId('token')).toHaveTextContent('test-token-123');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'test-token-123');
    });

    it('should reset sessionExpired flag on login', async () => {
      localStorageMock.getItem.mockReturnValue('existing-token');
      const user = userEvent.setup();

      // Mock verification on mount (first call)
      fetchMock.mockResolvedValueOnce({
        json: async () => ({ authenticated: true }),
      });

      // Mock 401 response to trigger sessionExpired (second call)
      fetchMock.mockResolvedValueOnce({ status: 401 });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Wait for mount verification
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/auth/verify',
          expect.any(Object)
        );
      });

      // Trigger a 401 by clicking Fetch
      await user.click(screen.getByText('Fetch'));

      await waitFor(() => {
        expect(screen.getByTestId('sessionExpired')).toHaveTextContent('true');
      });

      // Now login again
      await user.click(screen.getByText('Login'));

      expect(screen.getByTestId('sessionExpired')).toHaveTextContent('false');
    });
  });

  describe('Logout', () => {
    it('should clear token, remove from localStorage, and set isAuthenticated to false', async () => {
      const mockToken = 'token-to-logout';
      localStorageMock.getItem.mockReturnValue(mockToken);

      // Mock successful verification
      fetchMock.mockResolvedValueOnce({
        json: async () => ({ authenticated: true }),
      });

      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');

      await user.click(screen.getByText('Logout'));

      expect(screen.getByTestId('token')).toHaveTextContent('null');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
    });

    it('should reset sessionExpired flag on logout', async () => {
      localStorageMock.getItem.mockReturnValue('existing-token');
      const user = userEvent.setup();

      // Mock verification on mount (first call)
      fetchMock.mockResolvedValueOnce({
        json: async () => ({ authenticated: true }),
      });

      // Mock 401 response (second call)
      fetchMock.mockResolvedValueOnce({ status: 401 });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Wait for mount verification
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/auth/verify',
          expect.any(Object)
        );
      });

      // Trigger 401
      await user.click(screen.getByText('Fetch'));

      await waitFor(() => {
        expect(screen.getByTestId('sessionExpired')).toHaveTextContent('true');
      });

      // Logout
      await user.click(screen.getByText('Logout'));

      expect(screen.getByTestId('sessionExpired')).toHaveTextContent('false');
    });
  });

  describe('getHeaders', () => {
    it('should return Authorization header when authenticated', async () => {
      const mockToken = 'auth-token-789';
      localStorageMock.getItem.mockReturnValue(mockToken);

      // Mock verification on mount
      fetchMock.mockResolvedValueOnce({
        json: async () => ({ authenticated: true }),
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Wait for mount verification
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalled();
      });

      const headers = JSON.parse(screen.getByTestId('headers').textContent);
      expect(headers).toEqual({
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json'
      });
    });

    it('should not include Authorization header when not authenticated', () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      const headers = JSON.parse(screen.getByTestId('headers').textContent);
      expect(headers).toEqual({
        'Content-Type': 'application/json'
      });
      expect(headers.Authorization).toBeUndefined();
    });
  });

  describe('authFetch', () => {
    it('should make fetch with auth headers when authenticated', async () => {
      const mockToken = 'fetch-token-101';
      localStorageMock.getItem.mockReturnValue(mockToken);

      // Mock verification on mount (first call)
      fetchMock.mockResolvedValueOnce({
        json: async () => ({ authenticated: true }),
      });

      // Mock successful fetch response (second call)
      fetchMock.mockResolvedValueOnce({
        status: 200,
        json: async () => ({ data: 'success' }),
      });

      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Wait for mount verification
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/auth/verify',
          expect.any(Object)
        );
      });

      await user.click(screen.getByText('Fetch'));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/test',
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': `Bearer ${mockToken}`,
              'Content-Type': 'application/json'
            })
          })
        );
      });
    });

    it('should set sessionExpired to true on 401 response and throw error', async () => {
      const mockToken = 'expired-token';
      localStorageMock.getItem.mockReturnValue(mockToken);

      // Mock verification on mount (first call)
      fetchMock.mockResolvedValueOnce({
        json: async () => ({ authenticated: true }),
      });

      // Mock 401 response (second call)
      fetchMock.mockResolvedValueOnce({
        status: 401,
      });

      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Wait for mount verification
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/auth/verify',
          expect.any(Object)
        );
      });

      expect(screen.getByTestId('sessionExpired')).toHaveTextContent('false');

      await user.click(screen.getByText('Fetch'));

      await waitFor(() => {
        expect(screen.getByTestId('sessionExpired')).toHaveTextContent('true');
      });
    });

    it('should pass through non-401 responses normally', async () => {
      const mockToken = 'valid-token';
      localStorageMock.getItem.mockReturnValue(mockToken);

      // Mock verification on mount (first call)
      fetchMock.mockResolvedValueOnce({
        json: async () => ({ authenticated: true }),
      });

      const mockResponse = {
        status: 200,
        json: async () => ({ data: 'test-data' }),
      };
      // Mock authFetch call (second call)
      fetchMock.mockResolvedValueOnce(mockResponse);

      let capturedResponse;

      function TestFetchConsumer() {
        const auth = useAuth();

        return (
          <button
            onClick={async () => {
              capturedResponse = await auth.authFetch('/api/data');
            }}
          >
            Fetch Data
          </button>
        );
      }

      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestFetchConsumer />
        </AuthProvider>
      );

      // Wait for mount verification
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/auth/verify',
          expect.any(Object)
        );
      });

      await user.click(screen.getByText('Fetch Data'));

      await waitFor(() => {
        expect(capturedResponse).toBe(mockResponse);
      });
    });

    it('should merge custom headers with auth headers', async () => {
      const mockToken = 'custom-header-token';
      localStorageMock.getItem.mockReturnValue(mockToken);

      // Mock verification on mount (first call)
      fetchMock.mockResolvedValueOnce({
        json: async () => ({ authenticated: true }),
      });

      // Mock custom fetch (second call)
      fetchMock.mockResolvedValueOnce({
        status: 200,
        json: async () => ({ data: 'success' }),
      });

      function TestCustomHeadersConsumer() {
        const auth = useAuth();

        return (
          <button
            onClick={async () => {
              await auth.authFetch('/api/custom', {
                headers: { 'X-Custom-Header': 'custom-value' }
              });
            }}
          >
            Custom Fetch
          </button>
        );
      }

      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestCustomHeadersConsumer />
        </AuthProvider>
      );

      // Wait for mount verification
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/auth/verify',
          expect.any(Object)
        );
      });

      await user.click(screen.getByText('Custom Fetch'));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/custom',
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': `Bearer ${mockToken}`,
              'Content-Type': 'application/json',
              'X-Custom-Header': 'custom-value'
            })
          })
        );
      });
    });
  });

  describe('Mount Verification', () => {
    it('should trigger logout when token verification fails', async () => {
      const invalidToken = 'invalid-token';
      localStorageMock.getItem.mockReturnValue(invalidToken);

      // Mock failed verification
      fetchMock.mockResolvedValueOnce({
        json: async () => ({ authenticated: false }),
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Initially authenticated (token from localStorage)
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');

      // Wait for verification to complete and trigger logout
      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
    });

    it('should trigger logout when verification request throws', async () => {
      const invalidToken = 'network-error-token';
      localStorageMock.getItem.mockReturnValue(invalidToken);

      // Mock network error
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Initially authenticated
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');

      // Wait for verification error and logout
      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
    });

    it('should stay logged in when token verification succeeds', async () => {
      const validToken = 'valid-token-success';
      localStorageMock.getItem.mockReturnValue(validToken);

      // Mock successful verification
      fetchMock.mockResolvedValueOnce({
        json: async () => ({ authenticated: true }),
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');

      // Wait for verification to complete
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/auth/verify',
          {
            headers: { 'Authorization': `Bearer ${validToken}` }
          }
        );
      });

      // Should still be authenticated
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    });

    it('should not verify when no token exists on mount', () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('Cross-tab Sync', () => {
    it('should update token when storage event fires with new token', () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');

      // Simulate storage event from another tab
      act(() => {
        const storageEvent = new StorageEvent('storage', {
          key: 'auth_token',
          newValue: 'new-tab-token',
          oldValue: null,
        });
        window.dispatchEvent(storageEvent);
      });

      expect(screen.getByTestId('token')).toHaveTextContent('new-tab-token');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
    });

    it('should clear token when storage event fires with null value', async () => {
      const mockToken = 'token-to-clear';
      localStorageMock.getItem.mockReturnValue(mockToken);

      // Mock verification on mount
      fetchMock.mockResolvedValueOnce({
        json: async () => ({ authenticated: true }),
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Wait for mount verification
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalled();
      });

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');

      // Simulate storage event from another tab (logout)
      act(() => {
        const storageEvent = new StorageEvent('storage', {
          key: 'auth_token',
          newValue: null,
          oldValue: mockToken,
        });
        window.dispatchEvent(storageEvent);
      });

      expect(screen.getByTestId('token')).toHaveTextContent('null');
      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('sessionExpired')).toHaveTextContent('false');
    });

    it('should reset sessionExpired when another tab logs out', () => {
      const mockToken = 'session-expired-token';
      localStorageMock.getItem.mockReturnValue(mockToken);

      // Mock 401 to set sessionExpired
      fetchMock.mockResolvedValueOnce({ status: 401 });

      const user = userEvent.setup();

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Trigger 401 to set sessionExpired
      user.click(screen.getByText('Fetch')).then(() => {
        waitFor(() => {
          expect(screen.getByTestId('sessionExpired')).toHaveTextContent('true');
        }).then(() => {
          // Simulate another tab logging out
          act(() => {
            const storageEvent = new StorageEvent('storage', {
              key: 'auth_token',
              newValue: null,
              oldValue: mockToken,
            });
            window.dispatchEvent(storageEvent);
          });

          expect(screen.getByTestId('sessionExpired')).toHaveTextContent('false');
        });
      });
    });

    it('should ignore storage events for other keys', async () => {
      const mockToken = 'unchanged-token';
      localStorageMock.getItem.mockReturnValue(mockToken);

      // Mock verification on mount
      fetchMock.mockResolvedValueOnce({
        json: async () => ({ authenticated: true }),
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Wait for mount verification
      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalled();
      });

      const initialToken = screen.getByTestId('token').textContent;

      // Simulate storage event for different key
      act(() => {
        const storageEvent = new StorageEvent('storage', {
          key: 'other_key',
          newValue: 'other_value',
          oldValue: null,
        });
        window.dispatchEvent(storageEvent);
      });

      // Token should remain unchanged
      expect(screen.getByTestId('token')).toHaveTextContent(initialToken);
    });
  });

  describe('useAuth Hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      function InvalidConsumer() {
        useAuth(); // This should throw
        return <div>Should not render</div>;
      }

      expect(() => {
        render(<InvalidConsumer />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleError.mockRestore();
    });

    it('should work correctly when used inside AuthProvider', () => {
      localStorageMock.getItem.mockReturnValue(null);

      expect(() => {
        render(
          <AuthProvider>
            <TestConsumer />
          </AuthProvider>
        );
      }).not.toThrow();

      expect(screen.getByTestId('isAuthenticated')).toBeInTheDocument();
    });
  });
});
