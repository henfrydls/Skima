/**
 * Avatar Component
 * 
 * Muestra iniciales del colaborador con tooltip del nombre completo.
 */
export default function Avatar({ name, size = 'md' }) {
  // Extraer iniciales (primera letra de cada palabra)
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  return (
    <div 
      className={`
        ${sizeClasses[size]}
        rounded-full bg-primary/10 text-primary
        flex items-center justify-center
        font-medium cursor-default
        hover:bg-primary/20 transition-colors
      `}
      title={name}
    >
      {initials}
    </div>
  );
}
