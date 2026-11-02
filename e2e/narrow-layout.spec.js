import { test, expect } from '@playwright/test';
import { enterDemo } from './helpers/auth.js';
import { waitForPageReady } from './helpers/navigation.js';

// On a narrow window no page may scroll sideways as a whole, and the content must
// start to the right of the fixed sidebar. Wide content (the Settings tab row,
// tables) scrolls inside its own container instead.

const WIDTHS = [1000, 1280];
const PAGES = [
  ['dashboard', '/'],
  ['team-matrix', '/team-matrix'],
  ['evolution', '/evolution'],
  ['development', '/development'],
  ...['categorias', 'skills', 'perfiles', 'colaboradores', 'development', 'evaluaciones', 'backup', 'about']
    .map((tab) => [`settings-${tab}`, `/settings?tab=${tab}`]),
];

for (const width of WIDTHS) {
  test.describe(`at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test.beforeEach(async ({ page }) => {
      await enterDemo(page);
    });

    for (const [name, path] of PAGES) {
      test(`${name} does not scroll the page sideways`, async ({ page }) => {
        await page.goto(path);
        // Not networkidle: the Collaborators tab keeps a request open.
        await page.locator('main h1').first().waitFor();
        await waitForPageReady(page);
        await page.waitForTimeout(500);

        const layout = await page.evaluate(() => {
          const aside = document.querySelector('aside').getBoundingClientRect();
          const main = document.querySelector('main').getBoundingClientRect();
          return {
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            sidebarRight: aside.right,
            mainLeft: main.left,
            mainRight: main.right,
          };
        });

        await page.screenshot({ path: `test-results/narrow-layout/${width}-${name}.png` });

        expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
        expect(layout.mainLeft).toBeGreaterThanOrEqual(layout.sidebarRight);
        expect(layout.mainRight).toBeLessThanOrEqual(layout.clientWidth);
      });
    }
  });
}
