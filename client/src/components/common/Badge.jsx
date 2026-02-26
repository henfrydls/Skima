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
  0: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'N/A' },
  1: { bg: 'bg-gray-200', text: 'text-gray-600', label: 'Básico' },
  2: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'En desarrollo' },
  3: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Competente' },
  4: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Avanzado' },
  5: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Experto' },
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
