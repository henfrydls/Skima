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

export function MatrixSkeleton({ columns = 5 }) {
  // Simulate 2 categories with 4 skills each to match the real layout structure
  const categories = [1, 2];
  const skillsPerCategory = 4;

  return (
    <div className="bg-surface rounded-lg shadow-sm overflow-hidden animate-pulse">
      {/* Main Header (Collaborator Names) */}
      <div className="p-4 flex gap-4 border-b border-gray-100 bg-gray-50/50">
        <div className="w-[280px] h-4 bg-gray-200 rounded" /> {/* "Skill" label */}
        <div className="flex-1 flex justify-between px-8">
          {[...Array(columns)].map((_, i) => (
             <div key={i} className="flex flex-col items-center gap-2">
               <div className="w-8 h-8 bg-gray-200 rounded-full" /> {/* Avatar */}
               <div className="w-12 h-3 bg-gray-200 rounded" /> {/* Name */}
             </div>
          ))}
        </div>
      </div>

      {/* Categories Body */}
      <div>
        {categories.map((cat) => (
          <div key={cat}>
            {/* Category Header */}
            <div className="bg-gray-50 p-3 border-y border-gray-100 flex items-center">
               <div className="w-4 h-4 bg-gray-200 rounded mr-3" /> {/* Chevron */}
               <div className="w-48 h-5 bg-gray-300 rounded" /> {/* Category Name */}
            </div>
            
            {/* Skills Rows */}
            <div className="p-4 space-y-4">
              {[...Array(skillsPerCategory)].map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="w-[280px] h-4 bg-gray-200 rounded" /> {/* Skill Name */}
                  <div className="flex-1 flex justify-between px-8">
                    {[...Array(columns)].map((_, j) => (
                      <div key={j} className="w-8 h-8 bg-gray-100 rounded-full" /> /* Score Placeholder */
                    ))}
                  </div>
                </div>
              ))}
            </div>
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

/**
 * DashboardSkeleton - Full Dashboard loading state
 * Matches the exact layout of DashboardView
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-10 bg-gray-200 rounded w-64 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-96" />
      </div>

      {/* Snapshot Selector Skeleton */}
      <div className="bg-surface p-4 rounded-lg shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <div className="h-3 bg-gray-200 rounded w-24 mb-2" />
            <div className="h-10 bg-gray-200 rounded w-48" />
          </div>
          <div className="h-6 bg-gray-200 rounded w-8" />
          <div>
            <div className="h-3 bg-gray-200 rounded w-24 mb-2" />
            <div className="h-10 bg-gray-200 rounded w-48" />
          </div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-40" />
      </div>

      {/* Hero: Health Score */}
      <div className="bg-surface p-8 rounded-lg shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Main KPI */}
          <div className="text-center lg:text-left">
            <div className="h-4 bg-gray-200 rounded w-48 mb-4" />
            <div className="flex items-baseline justify-center lg:justify-start gap-4">
              <div className="h-20 bg-gray-200 rounded w-32" />
              <div className="flex flex-col gap-1">
                <div className="h-6 bg-gray-200 rounded w-16" />
                <div className="h-3 bg-gray-200 rounded w-20" />
              </div>
            </div>
            {/* Progress bar skeleton */}
            <div className="mt-4 max-w-sm">
              <div className="flex justify-between mb-2">
                <div className="h-3 bg-gray-200 rounded w-16" />
                <div className="h-3 bg-gray-200 rounded w-20" />
              </div>
              <div className="h-2 bg-gray-200 rounded-full" />
            </div>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center p-4 bg-gray-100 rounded-lg">
                <div className="h-8 bg-gray-200 rounded w-12 mx-auto mb-2" />
                <div className="h-3 bg-gray-200 rounded w-20 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Distribution + Gaps Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Team Distribution */}
        <div className="bg-surface p-6 rounded-lg shadow-sm">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center p-4 bg-gray-100 rounded-lg">
                <div className="h-8 bg-gray-200 rounded w-10 mx-auto mb-2" />
                <div className="h-4 bg-gray-200 rounded w-16 mx-auto mb-1" />
                <div className="h-3 bg-gray-200 rounded w-8 mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Priority Gaps */}
        <div className="bg-surface p-6 rounded-lg shadow-sm">
          <div className="h-6 bg-gray-200 rounded w-40 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-100 rounded-lg border-l-4 border-gray-300">
                <div className="w-6 h-6 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-1" />
                  <div className="h-3 bg-gray-200 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-surface p-6 rounded-lg shadow-sm">
        <div className="h-4 bg-gray-200 rounded w-32 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 border-2 border-dashed border-gray-200 rounded-lg text-center">
              <div className="w-6 h-6 bg-gray-200 rounded mx-auto mb-2" />
              <div className="h-4 bg-gray-200 rounded w-20 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * CollaboratorListSkeleton - For the "Por Persona" view
 */
export function CollaboratorListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-4 animate-pulse">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-6 bg-white">
          <div className="flex justify-between items-start gap-6 mb-4">
            <div>
              <div className="h-5 bg-gray-200 rounded w-40 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-28" />
            </div>
            <div className="text-right">
              <div className="h-8 bg-gray-200 rounded w-12 mb-1" />
              <div className="h-3 bg-gray-200 rounded w-20" />
            </div>
          </div>
          <div className="flex gap-6">
            {[1, 2, 3, 4, 5, 6].map((j) => (
              <div key={j} className="text-center">
                <div className="h-3 bg-gray-200 rounded w-8 mb-1" />
                <div className="h-4 bg-gray-200 rounded w-6" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default {
  TableSkeleton,
  MatrixSkeleton,
  KPISkeleton,
  CardSkeleton,
  DashboardSkeleton,
  CollaboratorListSkeleton,
};

