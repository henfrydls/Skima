import { TeamMatrixTable } from '../components/matrix';

/**
 * TeamMatrixPage
 * 
 * Página wrapper para la matriz de habilidades del equipo.
 */
export default function TeamMatrixPage() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1>Team Matrix</h1>
        <p className="text-gray-600 mt-1">
          Matriz de habilidades del equipo · Scroll para ver más
        </p>
      </div>

      {/* Matrix Table */}
      <TeamMatrixTable />
    </div>
  );
}
