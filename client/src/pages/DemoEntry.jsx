import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { API_BASE } from '../lib/apiBase';

/**
 * DemoEntry — /demo route
 *
 * 1. Calls POST /api/seed-demo to ensure demo data exists
 * 2. Sets demo_active cookie (24h)
 * 3. Redirects to /
 */
export default function DemoEntry() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const initDemo = async () => {
      try {
        // Seed demo data
        const res = await fetch(`${API_BASE}/api/seed-demo`, { method: 'POST' });
        if (!res.ok && res.status !== 409) {
          // 409 = already seeded, that's fine
          throw new Error('Failed to initialize demo');
        }

        // Set cookie (24h)
        document.cookie = 'demo_active=true; max-age=86400; path=/';

        // Redirect to dashboard
        navigate('/', { replace: true });
      } catch (err) {
        console.error('[DemoEntry] Error:', err);
        setError(err.message);
      }
    };

    initDemo();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md px-6">
          <p className="text-lg font-medium text-slate-800 mb-2">Something went wrong</p>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <a
            href="/"
            className="px-5 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            Back to home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <Loader2 className="animate-spin text-primary mx-auto mb-4" size={32} />
        <p className="text-sm text-slate-500">Setting up your demo...</p>
      </div>
    </div>
  );
}
