import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { check as checkForUpdate } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import UpdateModal from '../components/common/UpdateModal';

const UpdateContext = createContext(null);

const STORAGE_KEYS = {
  AUTO_CHECK: 'skima.update.autoCheck',
  SKIP_VERSION: 'skima.update.skipVersion',
  SNOOZE_UNTIL: 'skima.update.snoozeUntil',
  LAST_CHECKED: 'skima.update.lastCheckedAt',
};

const SNOOZE_MS = 24 * 60 * 60 * 1000; // 24h
const AUTO_CHECK_DELAY_MS = 4000;

const isTauri = () => typeof window !== 'undefined' && !!window.__TAURI_INTERNALS__;

const getAutoCheckPref = () => localStorage.getItem(STORAGE_KEYS.AUTO_CHECK) !== 'false';

/**
 * UpdateProvider - Wraps the app to enable Tauri auto-update.
 *
 * State machine:
 *   idle → checking → (up-to-date | available | error)
 *   available → downloading → installing → (relaunch) | error
 *
 * The modal renders for: available | downloading | installing | error.
 *
 * Preferences (localStorage):
 *   - skima.update.autoCheck   - 'true' (default) | 'false'
 *   - skima.update.skipVersion - exact version string the user opted to skip
 *   - skima.update.snoozeUntil - ms timestamp; modal hidden until then
 *   - skima.update.lastCheckedAt - ms timestamp of the most recent check
 */
export function UpdateProvider({ children }) {
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
      const result = await checkForUpdate();
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
    setState('downloading');
    setError(null);
    setProgress({ downloaded: 0, total: 0 });

    try {
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
  useEffect(() => {
    if (!isTauri()) return;
    if (!getAutoCheckPref()) return;
    const t = setTimeout(() => {
      checkNow({ silent: true });
    }, AUTO_CHECK_DELAY_MS);
    return () => clearTimeout(t);
  }, [checkNow]);

  const showModal = state === 'available' || state === 'downloading' || state === 'installing' || state === 'error';

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
