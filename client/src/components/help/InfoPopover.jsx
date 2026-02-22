import { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

/**
 * InfoPopover - Reusable help tooltip component
 *
 * Small info icon that shows a floating popover with title + content on click.
 * - Click to toggle (not hover - avoids accidental triggers)
 * - Click outside to dismiss
 * - Positioned below trigger, aligned center by default
 * - Animated with Framer Motion
 * - Accessible with ARIA attributes
 *
 * @param {string} title - Popover heading
 * @param {string|JSX} children - Popover content (description)
 * @param {string} className - Additional classes for the trigger button
 * @param {'center'|'left'|'right'} align - Horizontal alignment of popover relative to trigger
 */

const ALIGN_CLASSES = {
  center: 'left-1/2 -translate-x-1/2',
  left: 'right-0',
  right: 'left-0',
};

const ARROW_CLASSES = {
  center: 'left-1/2 -translate-x-1/2',
  left: 'right-4',
  right: 'left-4',
};

export default function InfoPopover({ title, children, className = '', align = 'center' }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <div className="relative inline-block">
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-center text-gray-400 hover:text-primary transition-colors ${className}`}
        aria-label={`Ayuda: ${title}`}
        aria-expanded={isOpen}
      >
        <HelpCircle size={14} />
      </button>

      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute ${ALIGN_CLASSES[align]} top-full mt-2 z-50`}
            role="tooltip"
          >
            {/* Arrow pointer */}
            <div className={`absolute ${ARROW_CLASSES[align]} -top-[5px]`}>
              <div className="w-2.5 h-2.5 bg-white border-l border-t border-gray-200 rotate-45 transform origin-center" />
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-lg w-[320px] p-4">
              {/* Title */}
              <h4 className="text-sm font-semibold text-gray-800 mb-2">
                {title}
              </h4>

              {/* Content */}
              <div className="text-sm text-gray-600 leading-relaxed">
                {children}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
