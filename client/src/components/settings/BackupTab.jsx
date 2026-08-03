import { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Upload, AlertTriangle, Clock, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../common/Button';
import ConfirmModal from '../common/ConfirmModal';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import { API_BASE } from '../../lib/apiBase';

// Every backup-able collection, with friendly labels. All 20 are covered so the
// summary never says "No records" when a backup only holds less-common data.
const SUMMARY_KEYS = [
  ['collaborators', 'collaborators'],
  ['skills', 'skills'],
  ['categories', 'categories'],
  ['roleProfiles', 'role profiles'],
  ['assessments', 'assessments'],
  ['snapshots', 'snapshots'],
  ['evaluationSessions', 'evaluation sessions'],
  ['developmentPlans', 'development plans'],
  ['developmentGoals', 'goals'],
  ['developmentActions', 'actions'],
  ['timePeriods', 'time periods'],
  ['objectives', 'objectives'],
  ['keyResults', 'key results'],
  ['checkIns', 'check-ins'],
  ['reviewCycles', 'review cycles'],
  ['reviews', 'reviews'],
  ['reviewSkillRatings', 'skill ratings'],
  ['kpis', 'KPIs'],
  ['kpiEntries', 'KPI entries'],
  ['checkInNotes', 'check-in notes'],
];

// Whole days between `iso` and now (floored). Returns null for missing/bad dates.
function daysSince(iso) {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / 86400000);
}

// Compact "3 days ago" / "just now" label; falls back to the date past a week.
function relativeTime(iso) {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toISOString().slice(0, 10);
}

// One-line human summary of a log entry for the activity list.
function describeEntry(e) {
  if (e.type === 'export') {
    return `Exported ${e.recordCount ?? 0} record${e.recordCount === 1 ? '' : 's'}`;
  }
  const target = e.fileName || 'a backup';
  if (e.status === 'failed') return `Restore of ${target} failed`;
  const inserted = e.recordCount ?? 0;
  const deleted = e.recordsDeleted ?? 0;
  return `Restored ${target} — ${inserted} in, ${deleted} replaced`;
}

/**
 * BackupTab — export a full JSON snapshot and restore from one.
 * Restore is destructive (replaces ALL data) and disabled in the online demo.
 */
export default function BackupTab() {
  const { authFetch } = useAuth();
  const { isDemo } = useConfig();
  const fileInputRef = useRef(null);

  const [exporting, setExporting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(null); // { fileName, exportDate, version, data, counts }
  const [parseError, setParseError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restored, setRestored] = useState(false);
  const [log, setLog] = useState(null); // null = not loaded yet; [] = loaded, empty
  const [lastExport, setLastExport] = useState(null); // most recent successful export

  const card = 'bg-white rounded-lg border border-gray-200 p-6 space-y-4';
  const heading = 'text-sm font-semibold text-gray-900 uppercase tracking-wide';

  // Install-local backup history. Skipped in the online demo (the log is a
  // per-install audit trail, not part of the seeded demo experience).
  const loadLog = useCallback(async () => {
    if (isDemo) return;
    try {
      const res = await authFetch(`${API_BASE}/api/backup-log`);
      if (!res.ok) return;
      const data = await res.json();
      setLog(Array.isArray(data?.entries) ? data.entries : []);
      setLastExport(data?.lastExport || null);
    } catch (err) {
      if (err.message !== 'SESSION_EXPIRED') { setLog([]); setLastExport(null); }
    }
  }, [authFetch, isDemo]);

  useEffect(() => { loadLog(); }, [loadLog]);

  const daysSinceBackup = daysSince(lastExport?.createdAt);
  const backupStale = daysSinceBackup === null || daysSinceBackup > 30;

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await authFetch(`${API_BASE}/api/export`);
      if (!res.ok) throw new Error('Export failed');
      const json = await res.json();
      const date = (json.exportDate || new Date().toISOString()).slice(0, 10);
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `skima-backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded');
      loadLog(); // reflect the new backup in the status line & history
    } catch (err) {
      if (err.message !== 'SESSION_EXPIRED') toast.error('Error exporting data');
    } finally {
      setExporting(false);
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsed(null);
    setParseError(null);
    setParsing(true);
    try {
      const text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error('Could not read file'));
        reader.readAsText(file);
      });
      let obj;
      try {
        obj = JSON.parse(text);
      } catch {
        setParseError("This file isn't valid JSON. Choose a Skima backup file (.json).");
        return;
      }
      if (!obj?.data || !Array.isArray(obj.data.categories) || !Array.isArray(obj.data.skills)) {
        setParseError("This doesn't look like a Skima backup file (missing expected data).");
        return;
      }
      const counts = SUMMARY_KEYS
        .map(([key, label]) => [Array.isArray(obj.data[key]) ? obj.data[key].length : 0, label])
        .filter(([n]) => n > 0)
        .map(([n, label]) => `${n} ${label}`);
      setParsed({ fileName: file.name, exportDate: obj.exportDate, version: obj.version, data: obj.data, counts });
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // allow re-selecting same file
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const res = await authFetch(`${API_BASE}/api/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: parsed.data,
          fileName: parsed.fileName,
          sourceExportDate: parsed.exportDate || null,
          sourceVersion: parsed.version || null,
        }),
      });
      if (res.status === 403) {
        toast.error('Restoring is not available in demo mode');
        setConfirmOpen(false);
        setRestoring(false);
        return;
      }
      if (res.status === 413) {
        toast.error('This backup is too large to restore.');
        setConfirmOpen(false);
        setRestoring(false);
        return;
      }
      if (!res.ok) throw new Error('Import failed');
      setRestored(true);
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      if (err.message !== 'SESSION_EXPIRED') toast.error('Error importing data');
      setRestoring(false); // keep modal open to retry
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Export */}
      <div className={card}>
        <div className="space-y-1">
          <h3 className={heading}>Export Data</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Download a complete snapshot of your Skima data — collaborators, skills, evaluations, IDPs, OKRs, and reviews.
          </p>
          {!isDemo && log && (
            <div className={`flex items-center gap-1.5 text-xs pt-1 ${backupStale ? 'text-amber-700' : 'text-gray-500'}`}>
              <Clock size={14} className={`flex-shrink-0 ${backupStale ? 'text-warning' : ''}`} />
              {lastExport ? (
                <span>
                  Last backup {relativeTime(lastExport.createdAt)}
                  {backupStale && ' — consider downloading a fresh one'}
                </span>
              ) : (
                <span>No backups yet — download one to keep your data safe</span>
              )}
            </div>
          )}
        </div>
        <Button variant="primary" size="sm" onClick={handleExport} isLoading={exporting} disabled={exporting}>
          <Download size={14} className="mr-1.5" />
          Download Backup
        </Button>
      </div>

      {/* Restore */}
      <div className={card}>
        <h3 className={heading}>Restore from Backup</h3>

        <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 text-xs text-warning flex items-start gap-2">
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
          <span>Restoring replaces ALL current data. This cannot be undone.</span>
        </div>

        {isDemo ? (
          <p className="text-sm text-gray-500 italic">Restoring is not available in the online demo.</p>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFile}
              className="hidden"
              data-testid="backup-file-input"
            />
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={parsing}>
                <Upload size={14} className="mr-1.5" />
                Choose File
              </Button>
              {parsing && <span className="text-xs text-gray-400">Parsing…</span>}
              {parsed && <span className="text-xs text-gray-500 truncate max-w-[16rem]">{parsed.fileName}</span>}
            </div>

            {parseError && (
              <div className="border border-critical bg-critical/5 text-critical text-sm rounded-lg p-3">
                {parseError}
              </div>
            )}

            {parsed && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm space-y-1">
                <div className="text-gray-700">
                  {parsed.counts.length ? parsed.counts.join(' · ') : 'No records in this backup.'}
                </div>
                <div className="text-xs text-gray-400">
                  {parsed.exportDate ? `Exported ${parsed.exportDate.slice(0, 10)}` : 'Unknown date'} · format v{parsed.version || '?'}
                </div>
                {parsed.version === '1.0' && (
                  <div className="text-xs text-gray-500">
                    Legacy format (v1.0) — newer collections (IDPs, OKRs, reviews) will be skipped.
                  </div>
                )}
              </div>
            )}

            <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)} disabled={!parsed || restoring}>
              Restore from Backup
            </Button>
          </>
        )}
      </div>

      {/* Activity history — install-local audit trail of exports & restores */}
      {!isDemo && log && log.length > 0 && (
        <div className={card}>
          <h3 className={heading}>Recent Activity</h3>
          {/* -my-1 trims the first/last row padding so it sits flush with the heading/border */}
          <ul className="divide-y divide-gray-100 -my-1 max-h-72 overflow-y-auto">
            {log.map((e) => {
              const failed = e.status === 'failed';
              const Icon = e.type === 'export' ? Download : failed ? XCircle : CheckCircle2;
              const iconColor = failed ? 'text-red-600' : e.type === 'export' ? 'text-primary' : 'text-emerald-600';
              const label = describeEntry(e);
              return (
                <li key={e.id} className="flex items-start gap-2.5 py-2.5">
                  <Icon size={15} className={`flex-shrink-0 mt-0.5 ${iconColor}`} />
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm truncate ${failed ? 'text-red-600' : 'text-gray-700'}`} title={label}>
                      {label}
                    </div>
                    <div className="text-xs text-gray-400">{relativeTime(e.createdAt)}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => { if (!restoring) setConfirmOpen(false); }}
        onConfirm={handleRestore}
        variant="danger"
        title={restored ? 'Restore complete' : 'Replace All Data?'}
        message={
          restored
            ? 'Reloading…'
            : `This will permanently delete everything currently in Skima and replace it with the contents of ${parsed?.fileName || 'the backup'}${parsed?.counts?.length ? ` (${parsed.counts.join(', ')})` : ''}. This cannot be undone.`
        }
        confirmText="Wipe & Restore"
        isLoading={restoring}
      />
    </div>
  );
}
