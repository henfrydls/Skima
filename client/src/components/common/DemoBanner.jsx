import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, X, Settings, Download } from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';

const GITHUB_RELEASES = 'https://github.com/henfrydls/Skima/releases';

/**
 * DemoBanner - Persistent banner shown when app is in demo mode.
 *
 * Shows at the top of the main content area. Can be dismissed
 * for the session via sessionStorage so it won't reappear on navigation.
 * When isOnlineDemo, shows "Download App" instead of "Set Up My Space".
 */
export default function DemoBanner() {
  const { isDemo, isOnlineDemo } = useConfig();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem('demoBannerDismissed') === 'true'; }
    catch { return false; }
  });

  if (!isDemo || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem('demoBannerDismissed', 'true'); }
    catch { /* ignore */ }
  };

  return (
    <div className="sticky top-0 z-20 flex items-center gap-3 px-6 py-2.5 bg-amber-50 border-b border-amber-200 text-sm">
      <FlaskConical size={16} className="text-amber-600 flex-shrink-0" />
      <span className="text-amber-800 flex-1">
        <span className="font-medium">Demo Mode</span> — You're exploring with sample data.
      </span>
      {isOnlineDemo ? (
        <a
          href={GITHUB_RELEASES}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-primary
                   bg-white border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
        >
          <Download size={12} />
          Download App
        </a>
      ) : (
        <button
          onClick={() => navigate('/setup')}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-primary
                   bg-white border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
        >
          <Settings size={12} />
          Set Up My Space
        </button>
      )}
      <button
        onClick={handleDismiss}
        className="p-1 text-amber-400 hover:text-amber-600 transition-colors"
        aria-label="Close banner"
      >
        <X size={14} />
      </button>
    </div>
  );
}
