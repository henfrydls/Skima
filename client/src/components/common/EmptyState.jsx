import { Users } from 'lucide-react';

/**
 * EmptyState Component
 * 
 * Estado vacío para cuando no hay datos.
 * Mejora UX: Prevención de confusión del usuario.
 */
export function EmptyState({ 
  icon: Icon = Users,
  title = 'No hay datos disponibles',
  description = 'No se encontraron elementos para mostrar.',
  actionLabel = 'Agregar',
  onAction = null,
}) {
  return (
    <div className="bg-surface p-12 rounded-lg shadow-sm text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-800 mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        {description}
      </p>
      {onAction && (
        <button 
          onClick={onAction}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
