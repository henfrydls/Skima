/**
 * Enter the demo — navigates to /demo which seeds data and sets cookie.
 * Waits for redirect to dashboard.
 */
export async function enterDemo(page) {
  await page.goto('/demo');
  // Wait for redirect back to / after demo seed + cookie set
  await page.waitForURL('/', { timeout: 15000 });
  // Wait for main content to appear
  await page.waitForSelector('main', { timeout: 10000 });
}
