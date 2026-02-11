import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, X, Settings } from 'lucide-react';
import { useConfig } from '../../contexts/ConfigContext';

/**
 * DemoBanner - Persistent banner shown when app is in demo mode.
 *
 * Shows at the top of the main content area. Can be dismissed
 * for the session via sessionStorage so it won't reappear on navigation.
 */
export default function DemoBanner() {
  const { isDemo } = useConfig();
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
    <div className="mb-4 flex items-center gap-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm">
      <FlaskConical size={16} className="text-amber-600 flex-shrink-0" />
      <span className="text-amber-800 flex-1">
        <span className="font-medium">Modo Demo</span> — Estás explorando con datos de ejemplo.
      </span>
      <button
        onClick={() => navigate('/setup')}
        className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-primary
                 bg-white border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
      >
        <Settings size={12} />
        Configurar mi espacio
      </button>
      <button
        onClick={handleDismiss}
        className="p-1 text-amber-400 hover:text-amber-600 transition-colors"
        aria-label="Cerrar banner"
      >
        <X size={14} />
      </button>
    </div>
  );
}
