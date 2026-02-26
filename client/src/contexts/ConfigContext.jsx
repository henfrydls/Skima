import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../lib/apiBase';

/**
 * ConfigContext - Manages system configuration state
 * 
 * Checks if the system is set up on load and provides config data
 * to all components (company name, admin name).
 */

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch config with retry for sidecar startup delay
  const fetchConfig = useCallback(async (retries = 0) => {
    const maxRetries = API_BASE ? 10 : 0; // Only retry in Tauri mode (sidecar may be starting)
    try {
      const response = await fetch(`${API_BASE}/api/config`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch config');
      }

      setConfig(data);
      setError(null);
    } catch (err) {
      // If server not ready yet, retry with delay (Tauri sidecar startup)
      if (retries < maxRetries) {
        console.log(`[Config] Server not ready, retrying (${retries + 1}/${maxRetries})...`);
        await new Promise(r => setTimeout(r, 1000));
        return fetchConfig(retries + 1);
      }
      console.error('Error fetching config:', err);
      setError(err.message);
      // Set default empty config on error
      setConfig({ isSetup: false, companyName: null, adminName: null });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Called after setup is complete
  const onSetupComplete = useCallback((newConfig) => {
    setConfig({
      isSetup: true,
      companyName: newConfig.companyName,
      adminName: newConfig.adminName
    });
  }, []);

  const value = {
    config,
    isLoading,
    error,
    isSetup: config?.isSetup ?? false,
    isDemo: config?.isDemo ?? false,
    companyName: config?.companyName ?? 'Skima',
    adminName: config?.adminName ?? 'Admin',
    onSetupComplete,
    refetchConfig: fetchConfig
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
