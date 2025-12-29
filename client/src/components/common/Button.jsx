/**
 * Button Component
 * 
 * Variantes:
 * - primary: Acción principal (teal)
 * - ghost: Acción secundaria (transparente)
 * - danger: Acción destructiva (rojo)
 */

const variants = {
  primary: 'bg-primary text-white hover:bg-primary/90',
  ghost: 'bg-transparent text-primary hover:bg-primary/10',
  danger: 'bg-critical text-white hover:bg-critical/90',
};

export default function Button({ 
  variant = 'primary', 
  children, 
  className = '',
  ...props 
}) {
  return (
    <button
      className={`
        px-4 py-2 rounded-lg font-medium
        transition-all duration-150 ease-in-out
        active:scale-95
        focus:outline-none focus:ring-2 focus:ring-primary/50
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
