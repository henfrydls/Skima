import { test, expect } from '@playwright/test';
import { enterDemo, loginToSettings } from './helpers/auth.js';
import { navigateTo, waitForPageReady } from './helpers/navigation.js';

/**
 * Visual audit — captures screenshots of every page/state for UX review.
 * Run with: npx playwright test e2e/visual-audit.spec.js --headed
 */
test.describe('Visual Audit — Full App Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    await enterDemo(page);
  });

  test('capture dashboard', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);
    await page.waitForTimeout(1000); // Let animations finish
    await page.screenshot({ path: 'test-results/visual-audit/01-dashboard.png', fullPage: true });
  });

  test('capture team matrix', async ({ page }) => {
    await navigateTo(page, 'Team Matrix');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/visual-audit/02-team-matrix.png', fullPage: true });
  });

  test('capture evolution', async ({ page }) => {
    await navigateTo(page, 'Evolution');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/visual-audit/03-evolution.png', fullPage: true });
  });

  test('capture development plans list', async ({ page }) => {
    await navigateTo(page, 'Development');
    await waitForPageReady(page);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/visual-audit/04-development-list.png', fullPage: true });
  });

  test('capture development plans with Active filter', async ({ page }) => {
    await navigateTo(page, 'Development');
    await waitForPageReady(page);
    const activeFilter = page.locator('button').filter({ hasText: /^Active$/i }).first();
    if (await activeFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await activeFilter.click();
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: 'test-results/visual-audit/05-development-active-filter.png', fullPage: true });
  });

  test('capture development plan detail', async ({ page }) => {
    await navigateTo(page, 'Development');
    await waitForPageReady(page);
    // Click first plan
    const planLink = page.locator('a[href*="/development/"]').first();
    if (await planLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await planLink.click();
      await waitForPageReady(page);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/visual-audit/06-development-detail.png', fullPage: true });
    }
  });

  test('capture settings - Development tab', async ({ page }) => {
    await loginToSettings(page);
    await waitForPageReady(page);
    // Click Development tab
    const devTab = page.locator('button').filter({ hasText: /development/i }).first();
    if (await devTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await devTab.click();
      await waitForPageReady(page);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/visual-audit/07-settings-development-tab.png', fullPage: true });
    }
  });

  test('capture settings - Development tab expanded plan', async ({ page }) => {
    await loginToSettings(page);
    await waitForPageReady(page);
    const devTab = page.locator('button').filter({ hasText: /development/i }).first();
    if (await devTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await devTab.click();
      await waitForPageReady(page);
      // Try to expand first plan
      const expandBtn = page.locator('button').filter({ hasText: /expand|▶|chevron/i }).first();
      const planRow = page.locator('[class*="cursor-pointer"]').first();
      if (await planRow.isVisible({ timeout: 2000 }).catch(() => false)) {
        await planRow.click();
        await page.waitForTimeout(500);
      }
      await page.screenshot({ path: 'test-results/visual-audit/08-settings-development-expanded.png', fullPage: true });
    }
  });
});
