import { useEffect } from 'react';

/**
 * useFocusTrap - Traps focus within a modal overlay on mount.
 * Focuses the first focusable element and wraps Tab/Shift+Tab.
 */
export default function useFocusTrap() {
  useEffect(() => {
    const modal = document.querySelector('.modal-overlay');
    if (!modal) return;

    const getFocusable = () =>
      modal.querySelectorAll(
        'input, select, textarea, button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

    // Focus first input on mount
    const focusable = getFocusable();
    if (focusable.length > 0) focusable[0].focus();

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;
      const elements = getFocusable();
      if (elements.length === 0) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, []);
}
