import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { check as checkForUpdate } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { invoke } from '@tauri-apps/api/core';
import UpdateModal from '../components/common/UpdateModal';
import { useConfig } from './ConfigContext';

const UpdateContext = createContext(null);

const STORAGE_KEYS = {
  AUTO_CHECK: 'skima.update.autoCheck',
  SKIP_VERSION: 'skima.update.skipVersion',
  SNOOZE_UNTIL: 'skima.update.snoozeUntil',
  LAST_CHECKED: 'skima.update.lastCheckedAt',
};

const SNOOZE_MS = 24 * 60 * 60 * 1000; // 24h
const AUTO_CHECK_DELAY_MS = 4000;

// GitHub's storage CDN (objects.githubusercontent.com) hangs on requests
// without a User-Agent. reqwest (used by the Tauri updater) sends none by
// default, so the client waits ~60s before reqwest aborts and the user
// sees a generic "error sending request". Setting an explicit UA fixes
// it. The timeout is a safety net for genuine network unreachability.
const UPDATE_CHECK_OPTIONS = {
  timeout: 30_000,
  headers: {
    'User-Agent': 'Skima-Updater',
    Accept: 'application/octet-stream',
  },
};

// On Windows we still see intermittent pre-TCP `error sending request`
// failures even with the User-Agent fix and Schannel TLS. Retry with
// backoff so a single transient failure doesn't surface as an error
// modal when a retry would have succeeded. Three attempts, 1.5s + 3s
// backoff, total worst case ~5s extra latency for the rare bad path.
async function checkWithRetry(retries = 3) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      return await checkForUpdate(UPDATE_CHECK_OPTIONS);
    } catch (e) {
      lastErr = e;
      // Don't retry on "platform not in manifest" — it's not a transient
      // network failure, retrying just delays the silent up-to-date result.
      if (isPlatformNotInManifestError(e)) {
        throw e;
      }
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, 1500 * (i + 1)));
      }
    }
  }
  throw lastErr;
}

const isTauri = () => typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__;

const getAutoCheckPref = () => localStorage.getItem(STORAGE_KEYS.AUTO_CHECK) !== 'false';

/**
 * Detect the "unsupported Linux package format" error from the Tauri updater.
 * Tauri v2 supports auto-update on Linux ONLY when the app is running as an
 * AppImage. Users who installed via .deb / .rpm hit this on `downloadAndInstall`.
 * The error message comes from the plugin (e.g. "binary for the package format
 * deb is not supported") so we match defensively.
 */
function isLinuxPackageUnsupportedError(err) {
  const msg = (err?.message || String(err) || '').toLowerCase();
  return /(unsupported|not supported|no installer|cannot install).*\b(linux|package|deb|rpm|format)\b|\b(deb|rpm)\b.*\b(not supported|unsupported)\b/.test(msg);
}

/**
 * Detect the "platform key not in manifest" error from the Tauri updater.
 *
 * The plugin throws this when latest.json's `platforms` object doesn't contain
 * a key matching the running OS/arch. Most common cause is a CI race during
 * release publishing — one platform's matrix job updated latest.json before
 * another one's entry got merged in (see issue #51). Genuine "platform not
 * supported" is rare and indistinguishable from the race case.
 *
 * UX decision: treat as "up-to-date" silently rather than surfacing an error
 * modal. Worst case: user misses an update for a few minutes until next
 * auto-check (or restart) when CI has settled. Better than a scary modal that
 * looks like the app is broken.
 */
function isPlatformNotInManifestError(err) {
  const msg = (err?.message || String(err) || '').toLowerCase();
  return /none of the fallback platforms.*were found/i.test(msg);
}

/**
 * UpdateProvider - Wraps the app to enable Tauri auto-update.
 *
 * State machine:
 *   idle → checking → (up-to-date | available | error)
 *   available → downloading → installing → (relaunch) | error | manual-only
 *
 * `manual-only` fires when the user clicks "Update now" on a Linux .deb / .rpm
 * install — Tauri can't apply the update and we surface a friendly CTA to
 * download manually from GitHub Releases.
 *
 * The modal renders for: available | downloading | installing | error | manual-only.
 *
 * Preferences (localStorage):
 *   - skima.update.autoCheck   - 'true' (default) | 'false'
 *   - skima.update.skipVersion - exact version string the user opted to skip
 *   - skima.update.snoozeUntil - ms timestamp; modal hidden until then
 *   - skima.update.lastCheckedAt - ms timestamp of the most recent check
 */
export function UpdateProvider({ children }) {
  // Setup wizard runs on first launch — we suppress auto-check until it's done
  // so the "Update failed" / "Available" modal doesn't overlay the welcome screen.
  const { isSetup } = useConfig();

  const [state, setState] = useState('idle');
  const [updateInfo, setUpdateInfo] = useState(null);
  const [progress, setProgress] = useState({ downloaded: 0, total: 0 });
  const [error, setError] = useState(null);
  // The native Tauri update handle (has downloadAndInstall) is stored outside
  // React state because it carries non-serializable methods.
  const updateHandleRef = useRef(null);

  /**
   * Run an update check. `silent` = no toast feedback (used for auto-check).
   */
  const checkNow = useCallback(async ({ silent = true } = {}) => {
    if (!isTauri()) {
      if (!silent) toast.error('Auto-updates are only available in the desktop app');
      return;
    }
    setState('checking');
    setError(null);
    try {
      const result = await checkWithRetry();
      localStorage.setItem(STORAGE_KEYS.LAST_CHECKED, String(Date.now()));

      if (!result) {
        // No update available
        setState('up-to-date');
        if (!silent) toast.success("You're up to date");
        return;
      }

      const skipVersion = localStorage.getItem(STORAGE_KEYS.SKIP_VERSION);
      const snoozeUntil = parseInt(localStorage.getItem(STORAGE_KEYS.SNOOZE_UNTIL) || '0', 10);

      // If this exact version was skipped, stay idle
      if (skipVersion === result.version) {
        setState('idle');
        return;
      }
      // Clear stale skip pref (different/newer version came in)
      if (skipVersion && skipVersion !== result.version) {
        localStorage.removeItem(STORAGE_KEYS.SKIP_VERSION);
      }
      // If currently snoozed, stay idle
      if (snoozeUntil > Date.now()) {
        setState('idle');
        return;
      }

      updateHandleRef.current = result;
      setUpdateInfo({
        version: result.version,
        notes: result.body || '',
      });
      setState('available');
    } catch (e) {
      // Bug #58: silently treat "platform not in manifest" as up-to-date.
      // Most often this is the CI race in #51 (manifest mid-publishing for
      // the user's platform) — we don't want to scare users with an error
      // modal for a transient state.
      if (isPlatformNotInManifestError(e)) {
        setState('up-to-date');
        if (!silent) toast.success("You're up to date");
        return;
      }
      setError(e?.message || String(e));
      setState('error');
      if (!silent) toast.error('Could not check for updates');
    }
  }, []);

  /**
   * Download + install + relaunch. Only valid in 'available' or 'error' state.
   */
  const installNow = useCallback(async () => {
    const handle = updateHandleRef.current;
    if (!handle) return;
    setError(null);
    setProgress({ downloaded: 0, total: 0 });
    // Show 'preparing' while the sidecar shuts down. prepare_for_update takes
    // ~1.5s on Windows to release the file lock; without a distinct state the
    // user stares at a 'Downloading... 0%' bar that isn't moving yet (#52).
    setState('preparing');

    try {
      // Kill the sidecar BEFORE the installer runs. If we don't, Windows
      // holds an open handle on skima-server.exe and NSIS errors with
      // "Error opening file for writing". The Rust command also waits
      // ~1.5s so the OS has time to release the file lock.
      try {
        await invoke('prepare_for_update');
      } catch (e) {
        // Non-fatal — log and proceed; installer will retry on its own
        // eslint-disable-next-line no-console
        console.warn('[updater] prepare_for_update failed:', e);
      }

      setState('downloading');
      let total = 0;
      await handle.downloadAndInstall((event) => {
        // Tauri's progress event shape:
        //   { event: 'Started', data: { contentLength } }
        //   { event: 'Progress', data: { chunkLength } }
        //   { event: 'Finished' }
        if (event.event === 'Started') {
          total = event.data?.contentLength || 0;
          setProgress({ downloaded: 0, total });
        } else if (event.event === 'Progress') {
          setProgress((prev) => ({
            downloaded: prev.downloaded + (event.data?.chunkLength || 0),
            total: prev.total || total,
          }));
        } else if (event.event === 'Finished') {
          setState('installing');
        }
      });
      // After install completes, restart
      await relaunch();
    } catch (e) {
      if (isLinuxPackageUnsupportedError(e)) {
        // Friendly fallback for .deb / .rpm users — auto-update isn't possible,
        // they need to download from GitHub manually.
        setState('manual-only');
        return;
      }
      setError(e?.message || String(e));
      setState('error');
    }
  }, []);

  const remindLater = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.SNOOZE_UNTIL, String(Date.now() + SNOOZE_MS));
    setState('idle');
  }, []);

  const skipVersion = useCallback(() => {
    if (updateInfo?.version) {
      localStorage.setItem(STORAGE_KEYS.SKIP_VERSION, updateInfo.version);
    }
    setState('idle');
  }, [updateInfo]);

  const dismissError = useCallback(() => {
    setState('idle');
    setError(null);
  }, []);

  // Auto-check on mount, with delay so we don't block startup.
  // Bug #57: don't run auto-check until setup wizard is complete — otherwise
  // the modal appears over the welcome screen on a fresh first launch.
  useEffect(() => {
    if (!isTauri()) return;
    // In `tauri:dev` the updater hits the real GitHub release, so the modal
    // would pop over the dev session. Skip auto-check there; the manual
    // "Check for updates" button in Settings still works.
    if (import.meta.env.MODE === 'development') return;
    if (!getAutoCheckPref()) return;
    if (!isSetup) return;
    const t = setTimeout(() => {
      checkNow({ silent: true });
    }, AUTO_CHECK_DELAY_MS);
    return () => clearTimeout(t);
  }, [checkNow, isSetup]);

  const showModal = state === 'available' || state === 'preparing' || state === 'downloading' || state === 'installing' || state === 'error' || state === 'manual-only';

  const value = {
    state,
    updateInfo,
    progress,
    error,
    isTauri: isTauri(),
    checkNow,
    installNow,
    remindLater,
    skipVersion,
    dismissError,
  };

  return (
    <UpdateContext.Provider value={value}>
      {children}
      {showModal && <UpdateModal />}
    </UpdateContext.Provider>
  );
}

export function useUpdate() {
  const ctx = useContext(UpdateContext);
  if (!ctx) {
    throw new Error('useUpdate must be used within UpdateProvider');
  }
  return ctx;
}
