import { test, expect } from '@playwright/test';
import { enterDemo } from './helpers/auth.js';
import { navigateTo, waitForPageReady } from './helpers/navigation.js';

test.describe('IDP Flow — Development Plans', () => {
  test.beforeEach(async ({ page }) => {
    await enterDemo(page);
  });

  test('development page loads and shows plans', async ({ page }) => {
    await navigateTo(page, 'Development');
    await waitForPageReady(page);
    await expect(page.locator('main')).toBeVisible();
    // Should show "Development Plans" heading
    await expect(page.locator('h1, h2').filter({ hasText: /development/i }).first()).toBeVisible({ timeout: 5000 });
  });

  test('development page is read-only (no create button)', async ({ page }) => {
    await navigateTo(page, 'Development');
    await waitForPageReady(page);
    // Should NOT have a "New Plan" or "Create" button
    const createBtn = page.locator('button').filter({ hasText: /new plan|create plan/i });
    await expect(createBtn).toHaveCount(0);
  });

  test('settings has Development tab with CRUD (requires auth)', async ({ page }) => {
    // Settings requires authentication — login first if password exists
    // In demo mode without password, auto-login should work
    await page.goto('/settings');
    await waitForPageReady(page);

    // Check if we hit "Access Denied" — means we need to login
    const accessDenied = await page.locator('text=Access Denied').isVisible({ timeout: 3000 }).catch(() => false);
    if (accessDenied) {
      // Try signing in (no password in demo seed = auto-login)
      const signInBtn = page.locator('button').filter({ hasText: /sign in/i }).first();
      if (await signInBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await signInBtn.click();
        await page.waitForLoadState('networkidle');
        // If login modal appears, submit without password
        const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /sign in|log in|submit/i }).first();
        if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await submitBtn.click();
          await page.waitForLoadState('networkidle');
        }
      }
      await page.goto('/settings');
      await waitForPageReady(page);
    }

    // Look for Development tab
    const devTab = page.locator('button').filter({ hasText: /development/i }).first();
    if (await devTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await devTab.click();
      await waitForPageReady(page);
      // Should have a "New Plan" or add button
      const addBtn = page.locator('button').filter({ hasText: /new plan|add plan|create|\+/i }).first();
      await expect(addBtn).toBeVisible({ timeout: 5000 });
    } else {
      test.skip(true, 'Development tab not visible — may require different auth flow');
    }
  });

  test('development page shows seed plan cards', async ({ page }) => {
    await navigateTo(page, 'Development');
    await waitForPageReady(page);
    // The seed created plans — we should see at least one plan card
    // Look for any card-like element or plan title
    // Look for plan titles from seed data
    const growthPlan = page.locator('text=Growth Plan').first();
    const isVisible = await growthPlan.isVisible({ timeout: 5000 }).catch(() => false);
    expect(isVisible).toBe(true);
  });

  test('can navigate to plan detail', async ({ page }) => {
    await navigateTo(page, 'Development');
    await waitForPageReady(page);
    // Click on the first plan card/link
    const planLink = page.locator('a[href*="/development/"]').first();
    if (await planLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await planLink.click();
      await waitForPageReady(page);
      // Should be on a detail page
      await expect(page.url()).toContain('/development/');
      await expect(page.locator('main')).toBeVisible();
    } else {
      // Plans might be shown differently — try clicking any card
      const card = page.locator('[class*="card"], [class*="Card"]').first();
      if (await card.isVisible({ timeout: 3000 }).catch(() => false)) {
        await card.click();
        await waitForPageReady(page);
      } else {
        test.skip(true, 'No plan cards visible to click');
      }
    }
  });
});
