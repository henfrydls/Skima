import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RadioTower, X } from 'lucide-react';
import { API_BASE } from '../../lib/apiBase';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import { useCheckinStatus } from '../../hooks/useCheckinStatus';

/**
 * One line, once per installation, saying whether the anonymous check-in is on.
 * A new install has it on; nobody should find that out later. A line, not a dialog:
 * nothing has to be answered first. Marked seen when shown, not when answered.
 */
export default function CheckinNotice() {
  const { isSetup, isOnlineDemo } = useConfig();
  const { getHeaders } = useAuth();
  const { status, sends } = useCheckinStatus();
  const navigate = useNavigate();
  const [closed, setClosed] = useState(false);

  const show = isSetup && !isOnlineDemo && sends && !status.noticeSeen;

  useEffect(() => {
    if (!show) return;
    // A viewer without a session gets 401 and sees it again; the admin will see it once.
    fetch(`${API_BASE}/api/checkin-notice-seen`, { method: 'POST', headers: getHeaders() }).catch(() => {});
  }, [show, getHeaders]);

  if (!show || closed) return null;

  const on = !status.off;

  return (
    <section
      aria-labelledby="checkin-notice-title"
      data-testid="checkin-notice"
      className="mb-4 rounded-lg border border-gray-200 bg-white px-4 py-3"
    >
      <div className="flex items-start gap-3">
        <RadioTower size={16} className="mt-0.5 shrink-0 text-gray-500" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-sm text-gray-600">
          <span id="checkin-notice-title" className="font-medium text-gray-900">
            {on ? 'Anonymous check-in is on.' : 'Anonymous check-in is off.'}
          </span>{' '}
          <span className="hidden sm:inline">
            {on
              ? 'It tells us Skima is still in use, nothing about your organization or your people. '
              : 'It would tell us Skima is still in use, nothing about your organization or your people. '}
          </span>
          <button
            type="button"
            onClick={() => navigate('/settings?tab=about')}
            data-testid="checkin-notice-open"
            className="rounded font-medium text-primary underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {on ? 'See or turn off' : 'See and turn on'}
          </button>
        </p>
        <button
          type="button"
          onClick={() => setClosed(true)}
          aria-label="Dismiss"
          data-testid="checkin-notice-dismiss"
          className="-m-2 flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <X size={18} />
        </button>
      </div>
    </section>
  );
}
