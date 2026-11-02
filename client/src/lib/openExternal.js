import { invoke } from '@tauri-apps/api/core';

// The desktop webview does not follow target="_blank" or window.open, so external
// links do nothing there. In the desktop app they go to the system browser through
// the opener plugin, whose capability only allows the URLs the app links to
// (src-tauri/capabilities/default.json). In a browser nothing changes.

const isTauri = () => typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__;

const isWebUrl = (url) => /^https?:\/\//i.test(url);

export function openExternal(url) {
  if (!isTauri()) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return Promise.resolve();
  }
  if (!isWebUrl(url)) return Promise.reject(new Error(`Not a web URL: ${url}`));
  return invoke('plugin:opener|open_url', { url }).catch((error) => {
    console.error('Could not open link:', url, error);
    throw error;
  });
}

// One listener for every external <a target="_blank"> in the app, so new links do
// not need their own handler. Installed only in the desktop app.
export function handleExternalLinkClick(event) {
  if (event.defaultPrevented || event.button !== 0) return;
  const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
  if (!link || link.target !== '_blank' || !isWebUrl(link.href)) return;
  event.preventDefault();
  openExternal(link.href).catch(() => {});
}

export function installExternalLinks() {
  if (!isTauri()) return;
  document.addEventListener('click', handleExternalLinkClick);
}
