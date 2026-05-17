import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Download, ExternalLink, Github, Bug, FileText,
  Apple, Monitor, Terminal as TerminalIcon, Settings as SettingsIcon,
  ChevronDown, Copy, Check, Info,
} from 'lucide-react';
import useFocusTrap from '../../hooks/useFocusTrap';
import { useGitHubRelease } from '../../hooks/useGitHubRelease';

const REPO_URL = 'https://github.com/henfrydls/Skima';
const TERMINAL_CMD = 'xattr -cr /Applications/Skima.app';

/**
 * Detect the visitor's OS for the primary download CTA.
 * Returns 'windows' | 'macos' | 'linux' | 'mobile' | 'unknown'.
 *
 * Order of confidence: userAgentData (Chromium-based) > platform > userAgent regex.
 * iPad with "Request Desktop Site" is identified by maxTouchPoints≥5 even when
 * the userAgent claims to be a Mac.
 */
function detectOS() {
  if (typeof navigator === 'undefined') return 'unknown';

  const ua = navigator.userAgent || '';
  const isTouchDevice = (navigator.maxTouchPoints || 0) > 1;
  if (/Android|iPhone|iPod/i.test(ua) || (isTouchDevice && /iPad/i.test(ua)) || (isTouchDevice && /Mobile/i.test(ua))) {
    return 'mobile';
  }

  const platformInfo = navigator.userAgentData?.platform || navigator.platform || '';
  const p = (platformInfo + ua).toLowerCase();
  if (p.includes('win')) return 'windows';
  if (p.includes('mac')) return 'macos';
  if (p.includes('linux')) return 'linux';
  return 'unknown';
}

/**
 * Best-effort detection of Apple Silicon vs Intel Mac. Returns one of:
 *   'apple-silicon' | 'intel' | 'unknown'.
 *
 * Chromium (Chrome/Edge/Brave/Arc) exposes the arch via
 * userAgentData.getHighEntropyValues(['architecture']) — 'arm' or 'x86'.
 * Safari intentionally does not, so we fall back to a heuristic:
 *   - The user agent string from Safari on Apple Silicon since Big Sur
 *     still says "Intel Mac OS X" (Apple kept it for compat). It is
 *     therefore NOT a signal of Intel hardware.
 *   - As of 2026 the active install base of Macs skews Apple Silicon
 *     (every new Mac since late 2020), so when we cannot tell we
 *     default to 'unknown' and the UI lets the user pick.
 *
 * Async because getHighEntropyValues returns a Promise.
 */
async function detectMacArch() {
  if (typeof navigator === 'undefined') return 'unknown';
  const uaData = navigator.userAgentData;
  if (uaData && typeof uaData.getHighEntropyValues === 'function') {
    try {
      const hints = await uaData.getHighEntropyValues(['architecture']);
      if (hints.architecture === 'arm') return 'apple-silicon';
      if (hints.architecture === 'x86') return 'intel';
    } catch {
      // Permission denied or unsupported — fall through
    }
  }
  return 'unknown';
}

function formatBytes(bytes) {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}

/**
 * Find the macOS asset matching the given arch.
 *   'apple-silicon' → *_aarch64.dmg
 *   'intel'         → *_x64.dmg or *_x86_64.dmg
 *   'unknown'       → any .dmg (legacy universal or first available)
 */
function pickMacDmgForArch(assets, arch) {
  const find = (predicate) => assets.find(predicate);
  if (arch === 'apple-silicon') {
    return (
      find((a) => /_aarch64\.dmg$/i.test(a.name)) ||
      find((a) => /_arm64\.dmg$/i.test(a.name)) ||
      find((a) => a.name.endsWith('.dmg'))
    );
  }
  if (arch === 'intel') {
    return (
      find((a) => /_x86_64\.dmg$/i.test(a.name)) ||
      find((a) => /_x64\.dmg$/i.test(a.name)) ||
      find((a) => a.name.endsWith('.dmg'))
    );
  }
  return find((a) => a.name.endsWith('.dmg'));
}

/**
 * Pick the primary asset for a given OS from the assets list.
 * Returns null if no matching asset (renders the modal as multi-platform).
 * macArch is honored only when os === 'macos' and there is more than one
 * dmg in the release.
 */
function pickPrimaryAsset(os, assets, macArch = 'unknown') {
  const find = (predicate) => assets.find(predicate);
  if (os === 'windows') return find((a) => a.name.endsWith('.exe'));
  if (os === 'macos') return pickMacDmgForArch(assets, macArch);
  if (os === 'linux') return find((a) => a.name.endsWith('.AppImage'));
  return null;
}

/**
 * Group assets into platform cards, primary first.
 */
function groupAssets(assets, primary) {
  const cards = [];
  const seen = new Set();
  if (primary) {
    cards.push({ ...primary, label: labelForAsset(primary.name) });
    seen.add(primary.name);
  }
  for (const a of assets) {
    if (seen.has(a.name)) continue;
    if (a.name.endsWith('.sig') || a.name === 'latest.json') continue;
    cards.push({ ...a, label: labelForAsset(a.name) });
    seen.add(a.name);
  }
  return cards;
}

/**
 * Card label for the secondary "Other platforms" list. Convention validated
 * against Notion/Cursor/VS Code/LibreOffice: OS first, format in parentheses.
 */
function labelForAsset(name) {
  if (name.endsWith('.exe')) return 'Windows installer';
  if (name.endsWith('.dmg')) {
    if (/_aarch64\.dmg$/i.test(name) || /_arm64\.dmg$/i.test(name)) return 'macOS (Apple Silicon)';
    if (/_x86_64\.dmg$/i.test(name) || /_x64\.dmg$/i.test(name)) return 'macOS (Intel)';
    return 'macOS (Universal)';
  }
  if (name.endsWith('.AppImage')) return 'Linux (AppImage)';
  if (name.endsWith('.deb')) return 'Linux (.deb)';
  return name;
}

/**
 * Compact format-only label for the subtitle below the primary CTA.
 * The OS is already in the button, so we don't repeat it here.
 */
function formatForAsset(name) {
  if (name.endsWith('.exe')) return 'Installer';
  if (name.endsWith('.dmg')) {
    if (/_aarch64\.dmg$/i.test(name) || /_arm64\.dmg$/i.test(name)) return 'DMG · Apple Silicon';
    if (/_x86_64\.dmg$/i.test(name) || /_x64\.dmg$/i.test(name)) return 'DMG · Intel';
    return 'DMG';
  }
  if (name.endsWith('.AppImage')) return 'AppImage';
  if (name.endsWith('.deb')) return '.deb';
  return name;
}

function MacInstallHelp({ pulsing }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const copiedTimerRef = useRef(null);

  // Cancel pending copy-feedback timer if the component unmounts mid-flight,
  // so React doesn't try to setState on an unmounted node.
  useEffect(() => () => {
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
  }, []);

  const flashCopied = () => {
    setCopied(true);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(TERMINAL_CMD);
      flashCopied();
    } catch {
      // Fallback for older browsers / non-HTTPS contexts
      const ta = document.createElement('textarea');
      ta.value = TERMINAL_CMD;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        flashCopied();
      } catch {
        // Silent fail — copy buttons are nice-to-have
      } finally {
        document.body.removeChild(ta);
      }
    }
  };

  return (
    <div
      className={`mx-6 mb-4 rounded-lg border border-amber-200 bg-amber-50 overflow-hidden transition-all duration-300 ease-in-out ${pulsing ? 'animate-mac-pulse' : ''}`}
      data-testid="mac-install-help"
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="mac-help-content"
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-amber-100/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Info size={16} className="text-amber-600 flex-shrink-0" />
          <span className="text-sm font-medium text-amber-900">
            First time on macOS? One extra step needed.
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`text-amber-600 flex-shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        id="mac-help-content"
        className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[600px]' : 'max-h-0'} overflow-hidden`}
      >
        <div className="px-4 pb-4 pt-1 space-y-3">
          {/* Method 1: Terminal */}
          <div className="bg-white rounded border border-amber-100 p-3">
            <div className="flex items-center gap-2 mb-2">
              <TerminalIcon size={14} className="text-amber-700" />
              <span className="text-sm font-medium text-amber-900">
                Terminal — recommended (1 step)
              </span>
            </div>
            <p className="text-xs text-amber-800 mb-2">
              Move Skima.app to your Applications folder, then run:
            </p>
            <div className="bg-gray-900 rounded flex items-center gap-2 px-2 py-2 font-mono text-xs">
              <code className="flex-1 min-w-0 text-white overflow-x-auto whitespace-nowrap">{TERMINAL_CMD}</code>
              <button
                type="button"
                onClick={handleCopy}
                aria-label={copied ? 'Copied to clipboard' : 'Copy Terminal command'}
                className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors justify-center ${
                  copied ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-amber-700 mt-2">
              This clears the quarantine flag Apple sets on unsigned apps.
            </p>
          </div>

          {/* Method 2: System Settings */}
          <div className="bg-white rounded border border-amber-100 p-3">
            <div className="flex items-center gap-2 mb-2">
              <SettingsIcon size={14} className="text-amber-700" />
              <span className="text-sm font-medium text-amber-900">
                System Settings — manual alternative (4 steps)
              </span>
            </div>
            <ol className="text-xs text-amber-800 space-y-1 list-decimal list-inside">
              <li>Try to open Skima — Apple will block it. Click <strong>Done</strong>.</li>
              <li>Open <strong>System Settings → Privacy &amp; Security</strong>.</li>
              <li>Scroll down and click <strong>Open Anyway</strong> next to Skima.</li>
              <li>Enter your admin password and click Open.</li>
            </ol>
            <p className="text-xs text-amber-700 mt-2 italic">
              macOS 15+ only: the "Open Anyway" button appears in Settings, not in the alert dialog.
            </p>
          </div>

          {/* Why this is needed */}
          <div>
            <button
              type="button"
              onClick={() => setShowWhy(!showWhy)}
              aria-expanded={showWhy}
              aria-controls="mac-why-content"
              className="text-xs text-amber-700 hover:text-amber-900 underline underline-offset-2 inline-flex items-center gap-1"
            >
              Why is this needed?
              <ChevronDown size={12} className={`transition-transform duration-200 ${showWhy ? 'rotate-180' : ''}`} />
            </button>
            {showWhy && (
              <p id="mac-why-content" className="text-xs text-amber-700 mt-1 leading-relaxed animate-fade-in">
                Skima is open-source and not signed with an Apple Developer certificate ($99/year).
                Gatekeeper blocks unsigned apps by default. The workaround above is safe — you can
                verify Skima's source code at{' '}
                <a href={REPO_URL} className="underline hover:text-amber-900" target="_blank" rel="noopener noreferrer">
                  github.com/henfrydls/Skima
                </a>.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * DownloadModal — primary download UX for the landing page.
 *
 * Auto-detects the visitor's OS and surfaces the right binary as the primary
 * CTA. For macOS, includes an inline help section explaining how to bypass
 * Gatekeeper since the app isn't notarized yet (issue #54).
 *
 * Props:
 * - isOpen: boolean — controlled by parent
 * - onClose: () => void
 */
export default function DownloadModal({ isOpen, onClose }) {
  const { version, assets, isLoading, isFallback } = useGitHubRelease();
  const [detectedOS] = useState(detectOS);
  const [detectedMacArch, setDetectedMacArch] = useState('unknown');
  const [archOverride, setArchOverride] = useState(null); // null = follow detected, otherwise 'apple-silicon' | 'intel'
  const [pulsing, setPulsing] = useState(false);
  const previousFocus = useRef(null);
  const pulsingTimerRef = useRef(null);

  // Detect Mac arch asynchronously (userAgentData.getHighEntropyValues returns
  // a Promise). Only runs once on mount. Safari and older browsers fall through
  // to 'unknown' and the UI offers both dmgs at equal prominence.
  useEffect(() => {
    if (detectedOS !== 'macos') return;
    let cancelled = false;
    detectMacArch().then((arch) => { if (!cancelled) setDetectedMacArch(arch); });
    return () => { cancelled = true; };
  }, [detectedOS]);

  // Cancel pulse timer on unmount to avoid setState on unmounted component
  useEffect(() => () => {
    if (pulsingTimerRef.current) clearTimeout(pulsingTimerRef.current);
  }, []);

  useFocusTrap();

  // Save and restore focus
  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement;
    } else if (previousFocus.current?.focus) {
      previousFocus.current.focus();
    }
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Active Mac arch = manual override if set, otherwise detected.
  // 'unknown' means we never confirmed — UI defaults to Apple Silicon
  // (active install base skews heavily that way as of 2026) but shows
  // a discreet swap link.
  const activeMacArch = archOverride || (detectedMacArch === 'unknown' ? 'apple-silicon' : detectedMacArch);
  // Whether to show the "I have an Intel/Apple Silicon Mac" toggle. Only
  // visible when there is more than one dmg in the release to swap between.
  const macDmgCount = useMemo(() => assets.filter((a) => a.name.endsWith('.dmg')).length, [assets]);
  const showMacArchToggle = detectedOS === 'macos' && macDmgCount > 1;

  const primaryAsset = useMemo(
    () => pickPrimaryAsset(detectedOS, assets, activeMacArch),
    [detectedOS, assets, activeMacArch]
  );
  const allCards = useMemo(() => groupAssets(assets, primaryAsset), [assets, primaryAsset]);
  const otherCards = useMemo(
    () => (primaryAsset ? allCards.filter((c) => c.name !== primaryAsset.name) : allCards),
    [allCards, primaryAsset]
  );

  const swapMacArch = () => {
    setArchOverride((current) => {
      const effective = current || (detectedMacArch === 'unknown' ? 'apple-silicon' : detectedMacArch);
      return effective === 'apple-silicon' ? 'intel' : 'apple-silicon';
    });
  };

  const handlePrimaryClick = () => {
    if (detectedOS === 'macos') {
      // Pulse the help block to draw attention to install instructions
      setPulsing(true);
      if (pulsingTimerRef.current) clearTimeout(pulsingTimerRef.current);
      pulsingTimerRef.current = setTimeout(() => setPulsing(false), 1500);
    }
  };

  if (!isOpen) return null;

  // Mobile: dedicated alternative view
  if (detectedOS === 'mobile') {
    return createPortal(
      <div
        className="modal-overlay z-50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-modal-title"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 id="download-modal-title" className="text-lg font-semibold text-gray-900">Download Skima</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
              <X size={20} />
            </button>
          </div>
          <div className="px-6 py-8 flex flex-col items-center text-center gap-3">
            <Monitor size={40} className="text-primary" />
            <p className="text-sm text-gray-700 font-medium">Skima is a desktop app.</p>
            <p className="text-sm text-gray-500">Open this page on your computer to download.</p>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary underline mt-2"
            >
              View source on GitHub →
            </a>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  const osLabel = { windows: 'Windows', macos: 'macOS', linux: 'Linux' }[detectedOS] || 'your platform';

  return createPortal(
    <div
      className="modal-overlay z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="download-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Download size={20} className="text-primary" />
            </div>
            <div>
              <h2 id="download-modal-title" className="text-lg font-semibold text-gray-900">
                Download Skima
              </h2>
              <p className="text-xs text-gray-500">
                {isLoading ? 'Fetching latest version...' : `v${version || '1.4.0'}`}
                {isFallback && <span className="ml-1 text-gray-400">· offline</span>}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Primary CTA */}
        {primaryAsset && (
          <div className="px-6 py-4">
            <a
              href={primaryAsset.url}
              onClick={handlePrimaryClick}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg shadow-sm transition-colors"
              data-testid="download-primary"
            >
              {detectedOS === 'macos' ? <Apple size={18} /> : detectedOS === 'windows' ? <Monitor size={18} /> : <Download size={18} />}
              Download for {osLabel}
              {detectedOS === 'macos' && showMacArchToggle && (
                <span className="text-amber-100 text-sm font-normal">
                  ({activeMacArch === 'apple-silicon' ? 'Apple Silicon' : 'Intel'})
                </span>
              )}
            </a>
            <p className="text-xs text-gray-400 mt-2 text-center">
              {formatForAsset(primaryAsset.name)}
              {primaryAsset.size > 0 && <span> · {formatBytes(primaryAsset.size)}</span>}
            </p>
            {showMacArchToggle && (
              <p className="text-xs text-gray-500 mt-1 text-center">
                {activeMacArch === 'apple-silicon' ? 'Tienes un Mac Intel?' : 'Tienes Apple Silicon (M1/M2/M3/M4)?'}{' '}
                <button
                  type="button"
                  onClick={swapMacArch}
                  className="text-primary underline hover:text-primary-dark"
                >
                  Cambiar a {activeMacArch === 'apple-silicon' ? 'Intel' : 'Apple Silicon'}
                </button>
              </p>
            )}
          </div>
        )}

        {/* Mac install help — only when macOS detected */}
        {detectedOS === 'macos' && <MacInstallHelp pulsing={pulsing} />}

        {/* Other platforms */}
        {otherCards.length > 0 && (
          <div className="px-6 pb-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
              {primaryAsset ? 'Other platforms' : 'Pick your platform'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {otherCards.map((card) => (
                <a
                  key={card.name}
                  href={card.url}
                  className="flex flex-col gap-0.5 px-3 py-2 rounded-lg border border-gray-200 hover:border-primary text-sm transition-colors"
                >
                  <span className="font-medium text-gray-700">{card.label}</span>
                  <span className="text-xs text-gray-400">
                    {card.size > 0 ? formatBytes(card.size) : ''}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Footer — source on GitHub + license */}
        <div className="border-t border-gray-100 px-6 py-3 bg-gray-50 flex items-center justify-between">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-primary inline-flex items-center gap-1.5"
          >
            <Github size={14} />
            View source on GitHub
            <ExternalLink size={10} />
          </a>
          <span className="text-xs text-gray-400">Free for noncommercial use</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
