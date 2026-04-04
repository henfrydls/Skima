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
 * Login to Settings by reading the password hint from the login modal.
 * The demo seed shows "Default password: admin123" — we extract and use it.
 * This is what a real user would do.
 */
export async function loginToSettings(page) {
  await page.goto('/settings');
  await page.waitForLoadState('networkidle');

  // Check if we hit "Access Denied"
  const accessDenied = await page.locator('text=Access Denied').isVisible({ timeout: 3000 }).catch(() => false);
  if (!accessDenied) return; // Already authenticated

  // Click "Sign In" button on the access denied page
  const signInBtn = page.locator('button').filter({ hasText: /sign in/i }).first();
  await signInBtn.click();
  await page.waitForTimeout(500);

  // The login modal should appear — look for the password hint
  const hintEl = page.locator('text=/default password/i').first();
  const hasHint = await hintEl.isVisible({ timeout: 3000 }).catch(() => false);

  if (hasHint) {
    // Extract password from hint text like "Default password: admin123"
    const hintText = await hintEl.textContent();
    const password = hintText.match(/:\s*(\S+)/)?.[1] || 'admin123';
    await page.fill('input[type="password"]', password);
  } else {
    // No hint — try submitting without password (no-password mode)
    // do nothing, just submit
  }

  // Click the Sign In button inside the modal
  const modalSignIn = page.locator('.modal-overlay button, [class*="modal"] button').filter({ hasText: /sign in/i }).first();
  await modalSignIn.click();
  await page.waitForLoadState('networkidle', { timeout: 10000 });

  // Should now be on settings page
  await page.waitForSelector('main', { timeout: 10000 }).catch(() => {});
}
