import { createPortal } from 'react-dom';
import { AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';

/**
 * ConfirmModal - Generic confirmation dialog to replace window.confirm
 *
 * Props:
 * - isOpen: boolean
 * - onClose: function
 * - onConfirm: function (async supported)
 * - title: string
 * - message: string
 * - confirmText: string
 * - cancelText: string
 * - variant: 'danger' | 'warning' | 'info' (default: 'danger')
 * - isLoading: boolean
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Estás seguro?',
  message = 'Esta acción no se puede deshacer.',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false
}) {
  if (!isOpen) return null;

  const CONFIG = {
    danger: {
      icon: AlertCircle,
      color: 'text-critical',
      bgIcon: 'bg-critical/10',
      btn: 'bg-critical hover:bg-critical/90',
      border: 'border-critical/20'
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-warning',
      bgIcon: 'bg-warning/10',
      btn: 'bg-warning hover:bg-warning/90',
      border: 'border-warning/20'
    },
    info: {
      icon: AlertCircle,
      color: 'text-primary',
      bgIcon: 'bg-primary/10',
      btn: 'bg-primary hover:bg-primary/90',
      border: 'border-primary/20'
    }
  };

  const style = CONFIG[variant] || CONFIG.danger;
  const Icon = style.icon;

  return createPortal(
    <div
      className="modal-overlay z-[60] p-4"
      onClick={isLoading ? undefined : (e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full flex-shrink-0 ${style.bgIcon} ${style.color}`}>
              <Icon size={24} />
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${style.btn}`}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
