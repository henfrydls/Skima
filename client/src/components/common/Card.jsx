/**
 * Card Component
 * 
 * Contenedor con borde izquierdo condicional según status:
 * - success: Verde (competent)
 * - warning: Ocre (warning)
 * - error: Rojo (critical)
 * - default: Sin borde de color
 */

const borderColors = {
  success: 'border-l-4 border-l-competent',
  warning: 'border-l-4 border-l-warning',
  error: 'border-l-4 border-l-critical',
  default: 'border-l-4 border-l-transparent',
};

export default function Card({ 
  status = 'default', 
  children, 
  className = '',
  ...props 
}) {
  return (
    <div
      className={`
        bg-surface rounded-lg shadow-sm
        p-4
        ${borderColors[status]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
