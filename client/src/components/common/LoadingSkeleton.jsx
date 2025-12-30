/**
 * LoadingSkeleton Components
 * 
 * Skeleton loaders para estados de carga.
 * Mejora UX: Visibilidad del estado del sistema (Nielsen #1)
 */

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="bg-surface p-8 rounded-lg shadow-sm animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-6" />
      <div className="space-y-3">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-4 bg-gray-200 rounded flex-1" />
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="h-4 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MatrixSkeleton({ columns = 5, rows = 8 }) {
  return (
    <div className="bg-surface rounded-lg shadow-sm overflow-hidden animate-pulse">
      {/* Header row */}
      <div className="p-4 flex gap-4 border-b border-gray-100">
        <div className="w-[280px] h-8 bg-gray-200 rounded" />
        {[...Array(columns)].map((_, i) => (
          <div key={i} className="w-8 h-8 bg-gray-200 rounded-full" />
        ))}
      </div>
      {/* Body rows */}
      <div className="p-4 space-y-3">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <div className="w-[280px] h-6 bg-gray-200 rounded" />
            {[...Array(columns)].map((_, j) => (
              <div key={j} className="w-6 h-6 bg-gray-200 rounded-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function KPISkeleton() {
  return (
    <div className="bg-surface p-12 rounded-lg shadow-sm text-center animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4" />
      <div className="h-20 bg-gray-200 rounded w-32 mx-auto mb-4" />
      <div className="flex items-center justify-center gap-8">
        <div className="h-4 bg-gray-200 rounded w-12" />
        <div className="h-4 bg-gray-200 rounded w-20" />
        <div className="h-4 bg-gray-200 rounded w-20" />
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-surface p-6 rounded-lg shadow-sm animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-2/3 mb-4" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>
    </div>
  );
}

export default {
  TableSkeleton,
  MatrixSkeleton,
  KPISkeleton,
  CardSkeleton,
};
