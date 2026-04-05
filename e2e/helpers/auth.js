/**
 * Enter the demo — calls seed-demo API then navigates to dashboard.
 * Handles both online demo (cookie flow) and local dev (direct seed).
 */
export async function enterDemo(page) {
  // First, seed demo data via API directly (more reliable than /demo route)
  const apiBase = 'http://localhost:3001';
  await page.request.post(`${apiBase}/api/seed-demo`);

  // Navigate to dashboard
  await page.goto('/');

  // Wait for either main content (dashboard) or setup page, then handle
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  // If we landed on setup, the seed worked but config isn't set — go to dashboard directly
  const url = page.url();
  if (url.includes('/setup')) {
    // Seed data exists, but no SystemConfig. Create one via API.
    await page.request.post(`${apiBase}/api/setup`, {
      data: { companyName: 'Test Co', adminName: 'Admin' }
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  }

  // Wait for main content
  await page.waitForSelector('main', { timeout: 10000 }).catch(() => {
    return page.waitForSelector('[class*="dashboard"], [class*="content"], h1', { timeout: 5000 });
  });
}

/**
 * Login to Settings via API (avoids rate limiter and UI flakiness).
 * Gets a JWT token from the API, injects into localStorage, then navigates.
 */
export async function loginToSettings(page) {
  const apiBase = 'http://localhost:3001';

  // Must be on a page in the app's origin before setting localStorage
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Get token via API
  let token = null;
  const passwords = ['admin123', ''];
  for (const pw of passwords) {
    try {
      const res = await page.request.post(`${apiBase}/api/auth/login`, {
        data: { password: pw }
      });
      if (res.ok()) {
        const data = await res.json();
        token = data.token;
        break;
      }
    } catch { /* try next */ }
  }

  if (token) {
    // Inject token into localStorage
    await page.evaluate((t) => {
      localStorage.setItem('auth_token', t);
    }, token);
  }

  // Navigate to settings — token is now in localStorage, app will read it on mount
  await page.goto('/settings');
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  await page.waitForSelector('main', { timeout: 10000 }).catch(() => {});
}
