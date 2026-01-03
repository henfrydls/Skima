import { Loader2 } from 'lucide-react';

/**
 * Button Component (Smart)
 * 
 * Variantes:
 * - primary: Acción principal (teal)
 * - secondary: Acción secundaria (borde gris)
 * - ghost: Acción sutil (transparente)
 * - danger: Acción destructiva (rojo)
 * 
 * Props:
 * - isLoading: Muestra spinner y deshabilita
 * - size: sm | md | lg
 */

const variants = {
  primary: 'bg-primary text-white hover:bg-primary/90 shadow-sm',
  secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm',
  ghost: 'bg-transparent text-primary hover:bg-primary/10',
  danger: 'bg-critical text-white hover:bg-critical/90 shadow-sm',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg'
};

export default function Button({ 
  variant = 'primary', 
  size = 'md',
  isLoading = false,
  children, 
  className = '',
  disabled,
  ...props 
}) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center justify-center rounded-lg font-medium
        transition-all duration-150 ease-in-out
        active:scale-[0.98] disabled:active:scale-100
        focus:outline-none focus:ring-2 focus:ring-primary/20
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {isLoading && (
        <Loader2 
          className="mr-2 animate-spin" 
          size={size === 'sm' ? 14 : 18} 
        />
      )}
      {children}
    </button>
  );
}
