import { Users } from 'lucide-react';
import Button from './Button';

/**
 * EmptyState Component
 * 
 * Estado vacío estandarizado con diseño "Premium".
 * Mejora UX: Feedback visual claro y acción directa.
 */
export function EmptyState({ 
  icon: Icon = Users,
  title = 'No hay datos disponibles',
  description = 'No se encontraron elementos para mostrar.',
  actionLabel = 'Agregar',
  onAction = null,
  secondaryAction = null
}) {
  return (
    <div className="text-center py-16 animate-fade-in bg-white rounded-xl border border-dashed border-gray-200">
      <div className="w-20 h-20 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-gray-50/50">
        <Icon className="w-10 h-10 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
        {description}
      </p>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {onAction && (
          <Button 
            onClick={onAction}
            className="shadow-lg shadow-primary/20 hover:shadow-primary/30"
          >
            {actionLabel}
          </Button>
        )}
        {secondaryAction}
      </div>
    </div>
  );
}

export default EmptyState;
