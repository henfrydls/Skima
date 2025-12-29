/**
 * Badge Component
 * 
 * Píldora para mostrar niveles de competencia (0-5):
 * - 0-1: Gris (Sin competencia / Básico)
 * - 2: Ocre (En desarrollo)
 * - 3-4: Verde oliva (Competente)
 * - 5: Teal (Experto)
 */

const levelStyles = {
  0: { bg: 'bg-gray-200', text: 'text-gray-600', label: 'N/A' },
  1: { bg: 'bg-gray-300', text: 'text-gray-700', label: 'Básico' },
  2: { bg: 'bg-warning/20', text: 'text-warning', label: 'En desarrollo' },
  3: { bg: 'bg-competent/20', text: 'text-competent', label: 'Competente' },
  4: { bg: 'bg-competent/30', text: 'text-competent', label: 'Avanzado' },
  5: { bg: 'bg-primary/20', text: 'text-primary', label: 'Experto' },
};

export default function Badge({ 
  level = 0, 
  showLabel = false,
  className = '',
  ...props 
}) {
  const safeLevel = Math.min(5, Math.max(0, Math.floor(level)));
  const style = levelStyles[safeLevel];

  return (
    <span
      className={`
        inline-flex items-center gap-1
        px-2 py-0.5 rounded-full
        text-xs font-medium
        ${style.bg} ${style.text}
        ${className}
      `}
      {...props}
    >
      <span className="font-bold">{safeLevel}</span>
      {showLabel && <span className="hidden sm:inline">· {style.label}</span>}
    </span>
  );
}
