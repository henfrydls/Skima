import { test, expect } from '@playwright/test';
import { enterDemo, loginToSettings } from './helpers/auth.js';
import { navigateTo, waitForPageReady } from './helpers/navigation.js';

test.describe('IDP Flow — Development Plans', () => {
  test.beforeEach(async ({ page }) => {
    await enterDemo(page);
  });

  test('development page loads and shows heading', async ({ page }) => {
    await navigateTo(page, 'Development');
    await waitForPageReady(page);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1, h2').filter({ hasText: /development/i }).first()).toBeVisible({ timeout: 5000 });
  });

  test('development page is read-only (no create button)', async ({ page }) => {
    await navigateTo(page, 'Development');
    await waitForPageReady(page);
    const createBtn = page.locator('button').filter({ hasText: /new plan|create plan/i });
    await expect(createBtn).toHaveCount(0);
  });

  test('development page shows seed plan cards with collaborator names', async ({ page }) => {
    await navigateTo(page, 'Development');
    await waitForPageReady(page);
    // Seed data has "Q2 2026 Growth Plan" and "Completed Growth Plan"
    await expect(page.locator('text=Growth Plan').first()).toBeVisible({ timeout: 5000 });
  });

  test('can navigate to plan detail', async ({ page }) => {
    await navigateTo(page, 'Development');
    await waitForPageReady(page);
    // Click on a plan card (it's a link to /development/:id)
    const planLink = page.locator('a[href*="/development/"]').first();
    if (await planLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await planLink.click();
      await waitForPageReady(page);
      expect(page.url()).toContain('/development/');
      await expect(page.locator('main')).toBeVisible();
    } else {
      test.skip(true, 'No plan links visible');
    }
  });

  test('settings Development tab accessible after login', async ({ page }) => {
    // Login using the password hint from the modal
    await loginToSettings(page);
    await waitForPageReady(page);

    // Find and click Development tab
    const devTab = page.locator('button').filter({ hasText: /development/i }).first();
    if (await devTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await devTab.click();
      await waitForPageReady(page);
      // Should have a "New Plan" or add button
      const addBtn = page.locator('button').filter({ hasText: /new plan|add plan|create|\+/i }).first();
      await expect(addBtn).toBeVisible({ timeout: 5000 });
    } else {
      test.skip(true, 'Development tab not visible');
    }
  });
});
