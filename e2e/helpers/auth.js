const API_BASE = 'http://localhost:3001';

// Cached auth token — shared across tests in the same worker
let cachedToken = null;

/**
 * Enter the demo — calls seed-demo API then navigates to dashboard.
 * Also pre-fetches an auth token for Settings access.
 */
export async function enterDemo(page) {
  // Seed demo data
  await page.request.post(`${API_BASE}/api/seed-demo`);

  // Pre-fetch auth token (one login, reuse for all tests)
  if (!cachedToken) {
    const passwords = ['admin123', ''];
    for (const pw of passwords) {
      try {
        const res = await page.request.post(`${API_BASE}/api/auth/login`, {
          data: { password: pw }
        });
        if (res.ok()) {
          const data = await res.json();
          cachedToken = data.token;
          break;
        }
      } catch { /* try next */ }
    }
  }

  // Navigate to dashboard
  await page.goto('/');
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  // Handle setup wizard if needed
  if (page.url().includes('/setup')) {
    await page.request.post(`${API_BASE}/api/setup`, {
      data: { companyName: 'Test Co', adminName: 'Admin' }
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  // Inject auth token into localStorage for Settings access
  if (cachedToken) {
    await page.evaluate((t) => {
      localStorage.setItem('auth_token', t);
    }, cachedToken);
  }

  // Wait for main content
  await page.waitForSelector('main', { timeout: 10000 }).catch(() => {
    return page.waitForSelector('h1', { timeout: 5000 });
  });
}

/**
 * Navigate to Settings with authentication.
 * Injects token into localStorage then does a fresh page load so React
 * AuthContext reads it on mount.
 */
export async function loginToSettings(page) {
  // First go to any app page to set localStorage on the correct origin
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Ensure we have a token
  if (!cachedToken) {
    try {
      const res = await page.request.post(`${API_BASE}/api/auth/login`, {
        data: { password: 'admin123' }
      });
      if (res.ok()) {
        const data = await res.json();
        cachedToken = data.token;
      }
    } catch { /* rate limited */ }
  }

  // Inject token into localStorage
  if (cachedToken) {
    await page.evaluate((t) => {
      localStorage.setItem('auth_token', t);
    }, cachedToken);
  }

  // Now navigate to settings — React mounts fresh, reads token from localStorage
  await page.goto('/settings');
  await page.waitForLoadState('networkidle', { timeout: 10000 });

  // If still Access Denied, the token was invalid or expired — reload once more
  const accessDenied = await page.locator('text=Access Denied').isVisible({ timeout: 2000 }).catch(() => false);
  if (accessDenied && cachedToken) {
    // Re-inject and hard reload
    await page.evaluate((t) => {
      localStorage.setItem('auth_token', t);
    }, cachedToken);
    await page.reload();
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  await page.waitForSelector('main', { timeout: 10000 }).catch(() => {});
}

/**
 * Reset cached token (use in tests that reset the database)
 */
export function resetAuthCache() {
  cachedToken = null;
}
