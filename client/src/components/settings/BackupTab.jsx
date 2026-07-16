import { useState, useRef } from 'react';
import { Download, Upload, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../common/Button';
import ConfirmModal from '../common/ConfirmModal';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import { API_BASE } from '../../lib/apiBase';

// Collections surfaced in the file summary (friendly order + labels).
const SUMMARY_KEYS = [
  ['collaborators', 'collaborators'],
  ['skills', 'skills'],
  ['categories', 'categories'],
  ['roleProfiles', 'role profiles'],
  ['assessments', 'assessments'],
  ['evaluationSessions', 'evaluation sessions'],
  ['developmentPlans', 'development plans'],
  ['objectives', 'objectives'],
  ['reviews', 'reviews'],
  ['kpis', 'KPIs'],
];

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

  const card = 'bg-white rounded-lg border border-gray-200 p-6 space-y-4';
  const heading = 'text-sm font-semibold text-gray-900 uppercase tracking-wide';

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
        body: JSON.stringify({ data: parsed.data }),
      });
      if (res.status === 403) {
        toast.error('Restoring is not available in demo mode');
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
        <div>
          <h3 className={heading}>Export Data</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Download a complete snapshot of your Skima data — collaborators, skills, evaluations, IDPs, OKRs, and reviews.
          </p>
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
