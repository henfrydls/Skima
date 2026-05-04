import { useState } from 'react';
import { Info, Github, Bug, FileText, RefreshCw, CheckCircle2 } from 'lucide-react';
import Button from '../common/Button';
import { useAppVersion } from '../../hooks/useAppVersion';
import { useUpdate } from '../../contexts/UpdateContext';

const STORAGE_AUTO_CHECK = 'skima.update.autoCheck';
const REPO_URL = 'https://github.com/henfrydls/Skima';

/**
 * AboutTab — shows app version, manages auto-update preferences,
 * exposes a manual "Check for updates" trigger, and lists license + repo links.
 */
export default function AboutTab() {
  const version = useAppVersion();
  const { state, checkNow, isTauri } = useUpdate();

  // Default ON unless explicitly set to "false"
  const [autoCheck, setAutoCheck] = useState(
    () => localStorage.getItem(STORAGE_AUTO_CHECK) !== 'false'
  );

  const handleAutoCheckToggle = (e) => {
    const enabled = e.target.checked;
    setAutoCheck(enabled);
    localStorage.setItem(STORAGE_AUTO_CHECK, enabled ? 'true' : 'false');
  };

  const checking = state === 'checking';

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Info size={28} className="text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Skima</h2>
            <p className="text-sm text-gray-500">People Development Platform</p>
            <p className="text-sm text-gray-700 mt-1">
              Version <span className="font-medium">{version}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Updates */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Updates</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Stay on the latest release
          </p>
        </div>

        {!isTauri ? (
          <p className="text-sm text-gray-500 italic">
            Auto-updates are only available in the desktop app.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  Check for new versions on GitHub Releases.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => checkNow({ silent: false })}
                isLoading={checking}
                disabled={checking}
              >
                <RefreshCw size={14} className="mr-1.5" />
                Check for updates
              </Button>
            </div>

            <label className="flex items-center gap-3 pt-2 border-t border-gray-100 cursor-pointer">
              <input
                type="checkbox"
                checked={autoCheck}
                onChange={handleAutoCheckToggle}
                className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary/20"
              />
              <span className="text-sm text-gray-700">
                Check for updates automatically
              </span>
            </label>
            <p className="text-xs text-gray-500 -mt-2 ml-7">
              Skima will check on startup. You'll be asked before any update is installed.
            </p>

            {state === 'up-to-date' && (
              <div className="flex items-center gap-2 text-xs text-competent">
                <CheckCircle2 size={14} />
                You're on the latest version
              </div>
            )}
          </>
        )}
      </div>

      {/* About */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">About</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <FileText size={16} className="text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-gray-700">License</p>
              <a
                href="https://polyformproject.org/licenses/noncommercial/1.0.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                PolyForm Noncommercial 1.0.0
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Github size={16} className="text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-gray-700">Source code</p>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
                aria-label="Source code on GitHub"
              >
                Source code on GitHub →
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Bug size={16} className="text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-gray-700">Report a bug</p>
              <a
                href={`${REPO_URL}/issues/new`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Open a GitHub issue →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
