import { useId, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE } from '../../lib/apiBase';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import { useCheckinStatus } from '../../hooks/useCheckinStatus';

const PRIVACY_URL = 'https://github.com/henfrydls/Skima/blob/main/PRIVACY.md';

/** Shown where the real number would be until one exists. Belongs to no installation. */
export const EXAMPLE_ID = '4f9c2a7e-1b60-4d3a-8c5e-2f1b74a9d0c6';

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Settings > About: the switch for the anonymous check-in and, behind one row, exactly
 * what it sends. Rendered only by a build that really sends, and never in the online demo.
 */
export default function CheckinSettings() {
  const { isOnlineDemo } = useConfig();
  const { getHeaders } = useAuth();
  const { status, sends, refresh } = useCheckinStatus();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState(null);
  const panelId = useId();

  if (isOnlineDemo || !sends) return null;

  const on = !status.off;

  const loadFields = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/checkin-fields`, { headers: getHeaders() });
      const body = await res.json();
      setFields(body.available ? body.fields : null);
    } catch {
      setFields(null);
    }
  };

  const toggle = async () => {
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/${on ? 'checkin-off' : 'checkin-on'}`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await refresh();
      if (open) await loadFields();
    } catch {
      toast.error(on ? 'Could not turn off the check-in' : 'Could not turn on the check-in');
    } finally {
      setBusy(false);
    }
  };

  const toggleOpen = () => {
    if (!open) loadFields();
    setOpen((was) => !was);
  };

  // While off there is no number at all; while on, it is made at the next check-in.
  const id = on ? fields?.id ?? null : null;

  const rows = [
    ['Random number', id ?? EXAMPLE_ID],
    ['App version', fields?.version ?? status.version ?? ''],
    ['System', fields?.os ?? ''],
    ['Architecture', fields?.arch ?? ''],
    ['How it was installed', fields?.source ?? ''],
    ['Date', today()],
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4" data-testid="checkin-settings">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Privacy</h3>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm text-gray-700" id={`${panelId}-label`}>Anonymous check-in</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Says Skima is still in use. Turning it off deletes the random number.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-labelledby={`${panelId}-label`}
          disabled={busy}
          onClick={toggle}
          data-testid="checkin-switch"
          className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60 ${on ? 'bg-primary' : 'bg-gray-300'}`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`}
          />
        </button>
      </div>

      <div className="border-t border-gray-100 pt-2">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={toggleOpen}
          data-testid="checkin-what-gets-sent"
          className="flex w-full items-center justify-between py-2 text-left text-sm text-gray-700"
        >
          What gets sent
          <ChevronRight size={16} className={`text-gray-500 transition-transform ${open ? 'rotate-90' : ''}`} aria-hidden="true" />
        </button>

        {open && (
          <div id={panelId} className="mt-1 space-y-3 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
            <p>
              Once a day, it tells us Skima is still in use. Nothing about your organization,
              your people or their evaluations.
            </p>
            <dl className="space-y-1">
              {rows.map(([label, value]) => (
                <div key={label} className="flex flex-wrap gap-x-2">
                  <dt className="font-medium text-gray-900">{label}</dt>
                  <dd className="min-w-0 break-all">{value}</dd>
                </div>
              ))}
            </dl>
            {id === null && (
              <p data-testid="checkin-example-note">
                {on
                  ? 'That number is an example. The real one is made at the next check-in.'
                  : 'That number is an example. A real one is only made if you turn the check-in on.'}
              </p>
            )}
            <p>Like any website, our server sees your connection&apos;s address and does not keep it.</p>
            <p>Turning it off deletes the random number and sends one last message saying so.</p>
            <a
              href={PRIVACY_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="checkin-privacy-policy"
              className="inline-block text-primary hover:underline"
            >
              Privacy policy →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
