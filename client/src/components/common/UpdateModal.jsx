import { Download, RotateCcw, AlertCircle, Loader2 } from 'lucide-react';
import Button from './Button';
import useFocusTrap from '../../hooks/useFocusTrap';
import { useAppVersion } from '../../hooks/useAppVersion';
import { useUpdate } from '../../contexts/UpdateContext';

function formatBytes(bytes) {
  if (!bytes) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

/**
 * UpdateModal — surfaces auto-update flow to the user.
 *
 * Renders different content based on UpdateContext state:
 *   - available    → release notes + 3 actions (install / remind / skip)
 *   - downloading  → progress bar + bytes counter
 *   - installing   → indeterminate spinner with restart hint
 *   - error        → error message + retry / close
 *
 * Mounted by UpdateProvider — never rendered directly.
 */
export default function UpdateModal() {
  const { state, updateInfo, progress, error, installNow, remindLater, skipVersion, dismissError } = useUpdate();
  const currentVersion = useAppVersion();
  useFocusTrap();

  const percent = progress.total > 0 ? Math.min(100, Math.round((progress.downloaded / progress.total) * 100)) : 0;

  return (
    <div className="modal-overlay z-[70] p-4" role="dialog" aria-modal="true" aria-labelledby="update-modal-title">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        {state === 'available' && (
          <>
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Download size={20} className="text-primary" />
              </div>
              <div>
                <h2 id="update-modal-title" className="text-lg font-semibold text-gray-900">
                  Update available: Skima {updateInfo?.version}
                </h2>
                <p className="text-xs text-gray-500">
                  Current version: {currentVersion}
                </p>
              </div>
            </div>

            <div className="px-6 py-4">
              {updateInfo?.notes && (
                <div className="text-sm text-gray-600 max-h-40 overflow-y-auto whitespace-pre-line">
                  {updateInfo.notes}
                </div>
              )}
              {!updateInfo?.notes && (
                <p className="text-sm text-gray-500 italic">No release notes provided.</p>
              )}
            </div>

            <div className="flex justify-end gap-2 px-6 py-3 border-t border-gray-100 bg-gray-50">
              <Button variant="ghost" size="sm" onClick={skipVersion}>Skip this version</Button>
              <Button variant="secondary" size="sm" onClick={remindLater}>Remind me later</Button>
              <Button variant="primary" size="sm" onClick={installNow}>Update now</Button>
            </div>
          </>
        )}

        {state === 'downloading' && (
          <>
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 id="update-modal-title" className="text-lg font-semibold text-gray-900">
                Downloading update...
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Skima {updateInfo?.version}</p>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-200"
                  style={{ width: `${percent}%` }}
                  role="progressbar"
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  {formatBytes(progress.downloaded)}
                  {progress.total > 0 && ` / ${formatBytes(progress.total)}`}
                </span>
                <span>{percent}%</span>
              </div>
            </div>
          </>
        )}

        {state === 'installing' && (
          <>
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 id="update-modal-title" className="text-lg font-semibold text-gray-900">
                Installing...
              </h2>
            </div>
            <div className="px-6 py-6 flex flex-col items-center text-center gap-3">
              <Loader2 size={32} className="text-primary animate-spin" />
              <p className="text-sm text-gray-600">
                Skima will restart automatically when finished.
              </p>
            </div>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-critical/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={20} className="text-critical" />
              </div>
              <h2 id="update-modal-title" className="text-lg font-semibold text-gray-900">
                Update failed
              </h2>
            </div>

            <div className="px-6 py-4">
              <p className="text-sm text-gray-600">
                {error || 'Something went wrong while applying the update.'}
              </p>
            </div>

            <div className="flex justify-end gap-2 px-6 py-3 border-t border-gray-100 bg-gray-50">
              <Button variant="secondary" size="sm" onClick={dismissError}>Close</Button>
              <Button variant="primary" size="sm" onClick={installNow}>
                <RotateCcw size={14} className="mr-1.5" />
                Try again
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
