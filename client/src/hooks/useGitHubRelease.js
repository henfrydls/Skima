import { useState, useEffect } from 'react';

/**
 * useGitHubRelease - fetch the latest GitHub release with sessionStorage cache.
 *
 * Used by DownloadModal to populate version, asset names, file sizes for the
 * platform-specific download links. Caches in sessionStorage for 10 minutes
 * so a user opening/closing the modal multiple times doesn't burn through
 * the unauthenticated rate limit (60 req/h per IP).
 *
 * Falls back to a hardcoded last-known release if the API fails. The fallback
 * download URLs use `releases/latest/download/<filename>` which is a permanent
 * GitHub redirect — they keep working even if our hardcoded version drifts.
 *
 * @returns {{
 *   version: string,        // e.g. "1.4.1"
 *   assets: Array<{name, url, size}>,
 *   isLoading: boolean,
 *   isError: boolean,
 *   isFallback: boolean,    // true when data is from FALLBACK_RELEASE
 * }}
 */

const REPO = 'henfrydls/Skima';
const CACHE_KEY = 'skima_release_cache';
const CACHE_TTL_MS = 10 * 60 * 1000;

// Last-known release used when the GitHub API is unreachable or rate-limited.
// Sizes are approximate — exact bytes don't matter for fallback display since
// the redirect URL works regardless of filename version.
const FALLBACK_RELEASE = {
  version: '1.4.1',
  assets: [
    { name: 'Skima_1.4.1_x64-setup.exe', url: `https://github.com/${REPO}/releases/latest/download/Skima_1.4.1_x64-setup.exe`, size: 105_000_000 },
    { name: 'Skima_1.4.1_universal.dmg', url: `https://github.com/${REPO}/releases/latest/download/Skima_1.4.1_universal.dmg`, size: 240_000_000 },
    { name: 'Skima_1.4.1_amd64.AppImage', url: `https://github.com/${REPO}/releases/latest/download/Skima_1.4.1_amd64.AppImage`, size: 195_000_000 },
    { name: 'Skima_1.4.1_amd64.deb', url: `https://github.com/${REPO}/releases/latest/download/Skima_1.4.1_amd64.deb`, size: 122_000_000 },
  ],
};

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.fetchedAt !== 'number') return null;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(version, assets) {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ version, assets, fetchedAt: Date.now() })
    );
  } catch {
    // Best-effort — sessionStorage may be unavailable (private mode, etc)
  }
}

export function useGitHubRelease() {
  const [state, setState] = useState(() => {
    const cached = readCache();
    if (cached) {
      return { version: cached.version, assets: cached.assets, isLoading: false, isError: false, isFallback: false };
    }
    return { version: null, assets: [], isLoading: true, isError: false, isFallback: false };
  });

  useEffect(() => {
    if (!state.isLoading) return;
    let cancelled = false;

    const run = async () => {
      try {
        const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
          headers: { Accept: 'application/vnd.github+json' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const version = (data.tag_name || '').replace(/^v/, '');
        const assets = (data.assets || []).map((a) => ({
          name: a.name,
          url: a.browser_download_url,
          size: a.size,
        }));
        if (cancelled) return;
        writeCache(version, assets);
        setState({ version, assets, isLoading: false, isError: false, isFallback: false });
      } catch {
        if (cancelled) return;
        setState({
          version: FALLBACK_RELEASE.version,
          assets: FALLBACK_RELEASE.assets,
          isLoading: false,
          isError: true,
          isFallback: true,
        });
      }
    };
    run();

    return () => { cancelled = true; };
  }, [state.isLoading]);

  return state;
}
