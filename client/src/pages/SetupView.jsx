import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, Lock, ArrowRight, Loader2, Sparkles, Play, AlertTriangle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfig } from '../contexts/ConfigContext';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from '../lib/apiBase';
import { invalidatePreload } from '../lib/dataPreload';
import ConfirmModal from '../components/common/ConfirmModal';

/**
 * SetupView - Initial onboarding screen
 *
 * Full screen, no sidebar. Collects company name and admin name
 * to initialize the system. Also offers a "Demo Mode" to explore
 * the app with sample data before configuring.
 *
 * When accessed from demo mode, shows a confirmation before
 * replacing demo data with real configuration.
 */

export default function SetupView({ onSetupComplete }) {
  const navigate = useNavigate();
  const { isDemo, refetchConfig } = useConfig();
  const { logout } = useAuth();
  const [formData, setFormData] = useState({
    companyName: '',
    adminName: '',
    adminPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [demoError, setDemoError] = useState(null);
  const [error, setError] = useState(null);
  const [showDemoWarning, setShowDemoWarning] = useState(false);

  const handleExploreDemo = async () => {
    setError(null);
    setDemoError(null);
    setIsLoadingDemo(true);

    try {
      const response = await fetch(`${API_BASE}/api/seed-demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error creating demo data');
      }

      // Clear any dismissed banner so it shows in demo mode
      try { sessionStorage.removeItem('demoBannerDismissed'); } catch { /* ignore */ }

      toast.success('Demo data loaded! Explore the app freely.');
      invalidatePreload();
      await refetchConfig();
      navigate('/');
    } catch (err) {
      console.error('Demo setup error:', err);
      setDemoError(err.message || 'Error loading demo data.');
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const doSetup = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formData.companyName.trim(),
          adminName: formData.adminName.trim(),
          adminPassword: formData.adminPassword || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to setup');
      }

      // Clear previous auth state and demo banner
      logout();
      try { sessionStorage.removeItem('demoBannerDismissed'); } catch { /* ignore */ }

      toast.success('Configuration saved!');
      invalidatePreload();
      await refetchConfig();
      navigate('/');
    } catch (err) {
      console.error('Setup error:', err);
      setError(err.message || 'Error saving configuration.');
      toast.error('Error saving configuration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.companyName.trim() || !formData.adminName.trim()) {
      setError('Please complete all required fields.');
      return;
    }

    // If transitioning from demo, show modal before replacing data
    if (isDemo) {
      setShowDemoWarning(true);
      return;
    }

    await doSetup();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary/5 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          {isDemo ? (
            <>
              <h1 className="text-3xl font-light text-gray-900 mb-2">
                Set up your <span className="font-medium text-primary">Skima</span>
              </h1>
              <p className="text-gray-500">
                Demo data will be replaced by your configuration
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-light text-gray-900 mb-2">
                Welcome to <span className="font-medium text-primary">Skima</span>
              </h1>
              <p className="text-gray-500">
                Let's set up your local workspace
              </p>
            </>
          )}
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Company Name Input */}
          <div className="mb-6">
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
              Organization Name
            </label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="e.g. Acme Corp"
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                         text-gray-900 placeholder:text-gray-400 transition-all"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Admin Name Input */}
          <div className="mb-6">
            <label htmlFor="adminName" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name (Administrator)
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                id="adminName"
                value={formData.adminName}
                onChange={(e) => setFormData(prev => ({ ...prev, adminName: e.target.value }))}
                placeholder="e.g. Jane Doe"
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                         text-gray-900 placeholder:text-gray-400 transition-all"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Password Input (Optional) */}
          <div className="mb-6">
            <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Password <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                id="adminPassword"
                value={formData.adminPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, adminPassword: e.target.value }))}
                placeholder="Leave empty for open access"
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                         text-gray-900 placeholder:text-gray-400 transition-all"
                disabled={isSubmitting}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">For local use, you can leave it empty.</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-critical/5 border border-critical/20 rounded-xl text-critical text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !formData.companyName.trim() || !formData.adminName.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 
                     bg-primary text-white font-medium rounded-xl
                     hover:bg-primary/90 transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Setting up...
              </>
            ) : (
              <>
                Get Started
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Demo Mode section - only shown on fresh install (not when coming from demo) */}
        {!isDemo && (
          <>
            <div className="flex items-center gap-3 mt-6">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-xs text-gray-400 uppercase tracking-wider">or</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            <button
              type="button"
              onClick={handleExploreDemo}
              disabled={isSubmitting || isLoadingDemo}
              className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-6
                       bg-white text-gray-700 font-medium rounded-xl
                       border-2 border-gray-200 hover:border-primary/40 hover:text-primary
                       transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2"
            >
              {isLoadingDemo ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Loading demo...
                </>
              ) : (
                <>
                  <Play size={18} />
                  Explore with demo data
                </>
              )}
            </button>

            {/* Demo error with retry */}
            {demoError && (
              <div className="mt-3 p-3 bg-critical/5 border border-critical/20 rounded-xl flex items-center gap-3">
                <AlertTriangle size={16} className="text-critical flex-shrink-0" />
                <span className="text-sm text-critical flex-1">{demoError}</span>
                <button
                  type="button"
                  onClick={handleExploreDemo}
                  disabled={isLoadingDemo}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-critical
                           hover:bg-critical/10 rounded-lg transition-colors"
                >
                  <RefreshCw size={12} />
                  Retry
                </button>
              </div>
            )}

            <p className="text-center text-xs text-gray-400 mt-2">
              Browse the app with sample data. You can set up your workspace later.
            </p>
          </>
        )}

        {/* Back to demo link (only when coming from demo) */}
        {isDemo && (
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-6 w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Back to demo mode
          </button>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          All information is stored locally and can be modified later.
        </p>
      </div>

      {/* Demo → Real confirmation modal */}
      <ConfirmModal
        isOpen={showDemoWarning}
        onClose={() => setShowDemoWarning(false)}
        onConfirm={async () => {
          await doSetup();
        }}
        title="Replace demo data"
        message="Demo data will be replaced by your real configuration. This action cannot be undone."
        confirmText="Continue"
        cancelText="Cancel"
        variant="warning"
        isLoading={isSubmitting}
      />
    </div>
  );
}
