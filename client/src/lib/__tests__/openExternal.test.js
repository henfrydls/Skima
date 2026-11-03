import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const invoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({ invoke: (...args) => invoke(...args) }));

const { openExternal, handleExternalLinkClick, installExternalLinks } = await import('../openExternal');

function clickOn(element, init = {}) {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init });
  element.dispatchEvent(event);
  return event;
}

function link(href, target = '_blank') {
  const a = document.createElement('a');
  a.href = href;
  if (target) a.target = target;
  a.innerHTML = '<span>text</span>';
  document.body.appendChild(a);
  return a;
}

describe('openExternal', () => {
  beforeEach(() => {
    invoke.mockReset().mockResolvedValue(undefined);
    vi.spyOn(window, 'open').mockImplementation(() => null);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    delete window.__TAURI_INTERNALS__;
    document.body.removeEventListener('click', handleExternalLinkClick);
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('in a browser', () => {
    it('opens a new tab, as before', async () => {
      await openExternal('https://github.com/henfrydls/Skima');

      expect(window.open).toHaveBeenCalledWith('https://github.com/henfrydls/Skima', '_blank', 'noopener,noreferrer');
      expect(invoke).not.toHaveBeenCalled();
    });

    it('leaves links to the browser: no listener is installed', () => {
      installExternalLinks();
      const event = clickOn(link('https://github.com/henfrydls/Skima'));

      expect(event.defaultPrevented).toBe(false);
      expect(invoke).not.toHaveBeenCalled();
    });
  });

  describe('in the desktop app', () => {
    beforeEach(() => {
      window.__TAURI_INTERNALS__ = {};
    });

    it('hands the URL to the opener plugin instead of the webview', async () => {
      await openExternal('https://github.com/henfrydls/Skima/releases/latest');

      expect(invoke).toHaveBeenCalledWith('plugin:opener|open_url', { url: 'https://github.com/henfrydls/Skima/releases/latest' });
      expect(window.open).not.toHaveBeenCalled();
    });

    it('refuses anything that is not an http(s) URL', async () => {
      await expect(openExternal('file:///etc/passwd')).rejects.toThrow('Not a web URL');
      await expect(openExternal('javascript:alert(1)')).rejects.toThrow('Not a web URL');
      expect(invoke).not.toHaveBeenCalled();
    });

    it('passes on a refusal from the plugin and logs it', async () => {
      invoke.mockRejectedValue(new Error('forbidden url'));

      await expect(openExternal('https://github.com/henfrydls/Skima')).rejects.toThrow('forbidden url');
      expect(console.error).toHaveBeenCalled();
    });

    it('opens a target="_blank" link through the plugin, also when the click lands on a child', () => {
      installExternalLinks();
      const a = link('https://github.com/henfrydls/Skima/blob/main/PRIVACY.md');

      const event = clickOn(a.querySelector('span'));

      expect(event.defaultPrevented).toBe(true);
      expect(invoke).toHaveBeenCalledWith('plugin:opener|open_url', { url: 'https://github.com/henfrydls/Skima/blob/main/PRIVACY.md' });
    });

    // Same behaviour as the listener tauri-plugin-shell injects on <body> (added at
    // DOMContentLoaded, so after this app's): any _blank link -> plugin:shell|open,
    // which the app does not allow, plus preventDefault.
    function addShellPluginListener() {
      const shell = vi.fn((event) => {
        const a = event.target.closest('a');
        if (a && a.target === '_blank' && /^https?:/.test(a.href)) {
          invoke('plugin:shell|open', { path: a.href });
          event.preventDefault();
        }
      });
      document.body.addEventListener('click', shell);
      return shell;
    }

    it('opens the link even with the shell plugin listening on <body>', () => {
      installExternalLinks();
      const shell = addShellPluginListener();
      const root = document.createElement('div');
      document.body.appendChild(root);
      const reactHandler = vi.fn();
      root.addEventListener('click', reactHandler);
      const a = document.createElement('a');
      a.href = 'https://github.com/henfrydls/Skima';
      a.target = '_blank';
      root.appendChild(a);

      clickOn(a);

      expect(invoke).toHaveBeenCalledTimes(1);
      expect(invoke).toHaveBeenCalledWith('plugin:opener|open_url', { url: 'https://github.com/henfrydls/Skima' });
      expect(shell).not.toHaveBeenCalled();
      expect(reactHandler).toHaveBeenCalled();
      document.body.removeEventListener('click', shell);
    });

    it('leaves in-app links, non-left clicks and handled clicks alone', () => {
      installExternalLinks();

      expect(clickOn(link('/settings', null)).defaultPrevented).toBe(false);
      expect(clickOn(link('https://github.com/henfrydls/Skima', null)).defaultPrevented).toBe(false);
      expect(clickOn(link('https://github.com/henfrydls/Skima'), { button: 1 }).defaultPrevented).toBe(false);

      const handled = link('https://github.com/henfrydls/Skima');
      handled.addEventListener('click', (e) => e.preventDefault());
      clickOn(handled);

      expect(invoke).not.toHaveBeenCalled();
    });
  });
});

// The opener capability allows only the URLs the app links to. A new external link
// outside it would do nothing in the desktop app, so every literal URL the client
// links to must match one of the capability's patterns.
describe('opener capability', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
  const capability = JSON.parse(readFileSync(join(root, 'src-tauri/capabilities/default.json'), 'utf8'));
  const opener = capability.permissions.find((p) => p.identifier === 'opener:allow-open-url');
  // The plugin matches with glob::Pattern, where * also matches "/".
  const patterns = opener.allow.map(({ url }) =>
    new RegExp(`^${url.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`));
  const allowed = (url) => patterns.some((re) => re.test(url));

  function sources(dir) {
    return readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return name === '__tests__' ? [] : sources(path);
      return /\.(jsx?|tsx?)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
    });
  }

  it('only allows https URLs', () => {
    expect(opener.allow.every(({ url }) => url.startsWith('https://'))).toBe(true);
  });

  it('allows every external URL the desktop app links to', () => {
    // The landing page only exists on the website, never in the desktop app.
    const files = sources(join(root, 'client/src')).filter((f) => !f.endsWith('LandingPage.jsx'));
    const urls = files.flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/['"`](https:\/\/[^'"`$\s]+)['"`]/g)].map((m) => m[1]));
    const linked = urls.filter((u) => /github\.com|gnu\.org/.test(u));

    expect(linked.length).toBeGreaterThan(0);
    expect(linked.filter((u) => !allowed(u))).toEqual([]);
  });

  it('does not allow other repositories or sites', () => {
    expect(allowed('https://github.com/henfrydls/Skima/blob/main/PRIVACY.md')).toBe(true);
    expect(allowed('https://github.com/henfrydls/SkimaOther')).toBe(false);
    expect(allowed('https://github.com/someone/else')).toBe(false);
    expect(allowed('http://github.com/henfrydls/Skima')).toBe(false);
  });
});
