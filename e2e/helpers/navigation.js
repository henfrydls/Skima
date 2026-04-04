/**
 * Navigate to a page via the sidebar link.
 * @param {import('@playwright/test').Page} page
 * @param {string} label — the visible text in the sidebar link
 */
export async function navigateTo(page, label) {
  await page.getByRole('link', { name: label }).click();
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for page to be fully loaded (no spinners).
 */
export async function waitForPageReady(page) {
  await page.waitForFunction(() => {
    const spinners = document.querySelectorAll('.animate-spin');
    return spinners.length === 0;
  }, { timeout: 10000 }).catch(() => {
    // Timeout is ok — page might not have spinners
  });
}
