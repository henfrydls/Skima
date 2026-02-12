import { useState, useEffect } from 'react';

/**
 * useAppVersion - Gets app version with Tauri API fallback to Vite define.
 * In desktop (Tauri): reads actual packaged version via @tauri-apps/api
 * In browser (dev): uses __APP_VERSION__ injected by Vite from package.json
 */
export function useAppVersion() {
  const [version, setVersion] = useState(__APP_VERSION__);

  useEffect(() => {
    const getTauriVersion = async () => {
      try {
        const { getVersion } = await import('@tauri-apps/api/app');
        const tauriVersion = await getVersion();
        setVersion(tauriVersion);
      } catch {
        // Not in Tauri - keep __APP_VERSION__ fallback
      }
    };
    getTauriVersion();
  }, []);

  return version;
}
