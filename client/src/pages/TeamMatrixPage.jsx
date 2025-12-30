import { useState } from 'react';
import { TransposedMatrixTable } from '../components/matrix';

// ============================================
// STATIC DATA - Datos para vistas de colaboradores/categorías
// ============================================
const STATIC_DATA = {
  categorias: [
    { id: 1, nombre: 'Innovación', abrev: 'INN', promedio: 2.4 },
    { id: 2, nombre: 'Desarrollo', abrev: 'DEV', promedio: 3.2 },
    { id: 3, nombre: 'Liderazgo', abrev: 'LID', promedio: 2.8 },
    { id: 4, nombre: 'Gestión', abrev: 'GES', promedio: 3.1 },
    { id: 5, nombre: 'Comunicación', abrev: 'COM', promedio: 3.4 },
    { id: 6, nombre: 'Técnico', abrev: 'TEC', promedio: 2.6 },
  ],
  
  colaboradores: [
    { id: 1, nombre: 'María González', rol: 'Product Manager', promedio: 3.2,
      categorias: { INN: 3.5, DEV: 2.8, LID: 3.4, GES: 3.8, COM: 3.2, TEC: 2.5 },
      brechas: ['Cloud Computing', 'DevOps'],
      fortalezas: ['Gestión de Proyectos', 'Liderazgo'] },
    { id: 2, nombre: 'Carlos Rodríguez', rol: 'Tech Lead', promedio: 3.6,
      categorias: { INN: 3.2, DEV: 4.2, LID: 3.5, GES: 3.0, COM: 3.1, TEC: 4.5 },
      brechas: ['Presentaciones Ejecutivas'],
      fortalezas: ['Arquitectura', 'Backend'] },
    { id: 3, nombre: 'Laura Martínez', rol: 'Junior Developer', promedio: 2.1,
      categorias: { INN: 1.8, DEV: 2.5, LID: 1.5, GES: 2.0, COM: 2.2, TEC: 2.6 },
      brechas: ['Arquitectura', 'Testing', 'Cloud'],
      fortalezas: ['Frontend Básico'] },
    { id: 4, nombre: 'Pedro Sánchez', rol: 'UX Designer', promedio: 2.9,
      categorias: { INN: 3.8, DEV: 2.0, LID: 2.5, GES: 3.0, COM: 3.5, TEC: 2.6 },
      brechas: ['Backend', 'DevOps'],
      fortalezas: ['User Research', 'UI Design'] },
    { id: 5, nombre: 'Ana Torres', rol: 'QA Engineer', promedio: 2.7,
      categorias: { INN: 2.2, DEV: 2.8, LID: 2.4, GES: 2.8, COM: 3.0, TEC: 3.0 },
      brechas: ['Arquitectura'],
      fortalezas: ['Testing', 'QA'] },
  ]
};

const getStatusColor = (nivel) => {
  if (nivel >= 3.5) return 'text-primary';
  if (nivel >= 2.5) return 'text-competent';
  return 'text-warning';
};

// ============================================
// COLLABORATOR LIST VIEW
// ============================================
function CollaboratorListView({ onSelect }) {
  return (
    <div className="space-y-4">
      {STATIC_DATA.colaboradores.map(col => (
        <button
          key={col.id}
          onClick={() => onSelect(col)}
          className="w-full text-left border border-gray-200 rounded-lg p-6 bg-white 
                     hover:border-primary hover:shadow-md transition-all"
        >
          <div className="flex justify-between items-start gap-6 mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-800">{col.nombre}</h3>
              <p className="text-sm text-gray-500">{col.rol}</p>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-light ${getStatusColor(col.promedio)}`}>
                {col.promedio.toFixed(1)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {col.promedio >= 3.5 ? 'Fortaleza' : col.promedio >= 2.5 ? 'Competente' : 'Requiere atención'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-6 flex-wrap">
            {Object.entries(col.categorias).map(([key, valor]) => (
              <div key={key} className="text-center">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{key}</p>
                <p className={`text-sm font-semibold ${getStatusColor(valor)}`}>
                  {valor.toFixed(1)}
                </p>
              </div>
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}

// ============================================
// COLLABORATOR DETAIL VIEW
// ============================================
function CollaboratorDetailView({ colaborador, onBack }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface p-6 rounded-lg shadow-sm">
        <button 
          onClick={onBack}
          className="mb-4 text-sm font-medium text-gray-500 hover:text-primary transition-colors"
        >
          ← Volver a colaboradores
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-light text-primary mb-2">{colaborador.nombre}</h2>
            <p className="text-lg text-gray-500">{colaborador.rol}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">Promedio General</p>
            <p className={`text-5xl font-light ${getStatusColor(colaborador.promedio)}`}>
              {colaborador.promedio.toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className={`text-2xl font-light mb-2 ${
            colaborador.brechas.length > 2 ? 'text-critical' : 
            colaborador.brechas.length > 0 ? 'text-warning' : 'text-competent'
          }`}>
            {colaborador.brechas.length > 2 ? 'CRÍTICO' : 
             colaborador.brechas.length > 0 ? 'MODERADO' : 'BAJO'}
          </div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Nivel de Riesgo</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-light text-warning mb-2">{colaborador.brechas.length}</div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Brechas</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-light text-primary mb-2">{colaborador.fortalezas.length}</div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Fortalezas</p>
        </div>
      </div>

      {/* Barras Lollipop */}
      <div className="bg-surface p-6 rounded-lg shadow-sm">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Nivel por Categoría
        </h4>
        <div className="space-y-4">
          {Object.entries(colaborador.categorias).map(([key, valor]) => (
            <div key={key} className="flex items-center gap-4">
              <span className="w-12 text-sm font-medium text-gray-600">{key}</span>
              <div className="flex-1 relative">
                <div className="h-2 bg-gray-100 rounded-full" />
                <div 
                  className={`absolute top-0 h-2 rounded-full ${
                    valor >= 3.5 ? 'bg-primary' : valor >= 2.5 ? 'bg-competent' : 'bg-warning'
                  }`}
                  style={{ width: `${(valor / 5) * 100}%` }}
                />
                <div 
                  className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 ${
                    valor >= 3.5 ? 'border-primary' : valor >= 2.5 ? 'border-competent' : 'border-warning'
                  }`}
                  style={{ left: `calc(${(valor / 5) * 100}% - 8px)` }}
                />
              </div>
              <span className={`w-10 text-right text-sm font-semibold ${getStatusColor(valor)}`}>
                {valor.toFixed(1)}
              </span>
            </div>
          ))}
        </div>

        {/* Brechas y Fortalezas */}
        <div className="flex flex-wrap gap-4 mt-6">
          {colaborador.brechas.length > 0 && (
            <div className="flex-1">
              <h5 className="text-xs text-gray-500 uppercase mb-2">Brechas</h5>
              <div className="flex flex-wrap gap-2">
                {colaborador.brechas.map((b, i) => (
                  <span key={i} className="px-2 py-1 bg-warning/10 text-warning text-xs rounded-full">{b}</span>
                ))}
              </div>
            </div>
          )}
          {colaborador.fortalezas.length > 0 && (
            <div className="flex-1">
              <h5 className="text-xs text-gray-500 uppercase mb-2">Fortalezas</h5>
              <div className="flex flex-wrap gap-2">
                {colaborador.fortalezas.map((f, i) => (
                  <span key={i} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">{f}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// CATEGORY GRID VIEW
// ============================================
function CategoryGridView() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {STATIC_DATA.categorias.map(cat => (
        <div 
          key={cat.id}
          className="bg-surface p-6 rounded-lg shadow-sm border border-gray-100 
                     hover:border-primary hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-800">{cat.nombre}</h3>
              <p className="text-xs text-gray-400 uppercase tracking-wide">{cat.abrev}</p>
            </div>
            <p className={`text-4xl font-light ${getStatusColor(cat.promedio)}`}>
              {cat.promedio.toFixed(1)}
            </p>
          </div>
          
          <div className="relative mt-4">
            <div className="h-2 bg-gray-100 rounded-full" />
            <div 
              className={`absolute top-0 h-2 rounded-full ${
                cat.promedio >= 3.5 ? 'bg-primary' : cat.promedio >= 2.5 ? 'bg-competent' : 'bg-warning'
              }`}
              style={{ width: `${(cat.promedio / 5) * 100}%` }}
            />
          </div>
          
          <p className="text-xs text-gray-400 mt-3">
            {cat.promedio >= 3.5 ? 'Fortaleza del equipo' : 
             cat.promedio >= 2.5 ? 'Nivel competente' : 'Requiere desarrollo'}
          </p>
        </div>
      ))}
    </div>
  );
}

// ============================================
// TEAM MATRIX PAGE - Con pestañas
// ============================================
export default function TeamMatrixPage() {
  const [currentView, setCurrentView] = useState('matriz');
  const [selectedColaborador, setSelectedColaborador] = useState(null);

  const tabs = [
    { id: 'matriz', label: 'Matriz' },
    { id: 'colaboradores', label: 'Por Colaborador' },
    { id: 'categorias', label: 'Por Categoría' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Team Matrix</h1>
        <p className="text-gray-600 mt-1">
          Visualización de competencias del equipo
        </p>
      </div>

      {/* Pestañas de navegación */}
      <div className="flex gap-6 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setCurrentView(tab.id);
              setSelectedColaborador(null);
            }}
            className={`pb-3 font-medium transition-all border-b-2 ${
              currentView === tab.id 
                ? 'text-primary border-primary' 
                : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Vista activa */}
      {currentView === 'matriz' && (
        <TransposedMatrixTable />
      )}
      
      {currentView === 'colaboradores' && !selectedColaborador && (
        <CollaboratorListView onSelect={(col) => setSelectedColaborador(col)} />
      )}
      
      {currentView === 'colaboradores' && selectedColaborador && (
        <CollaboratorDetailView 
          colaborador={selectedColaborador} 
          onBack={() => setSelectedColaborador(null)} 
        />
      )}
      
      {currentView === 'categorias' && (
        <CategoryGridView />
      )}
    </div>
  );
}
