import { Fragment } from 'react';
import { Popover, Transition } from '@headlessui/react';
import { Calendar, ChevronDown, Check, Clock, RotateCcw } from 'lucide-react';

/**
 * DashboardHeader - Controls for Time Travel & Global Actions
 * 
 * Uses Headless UI Popover for a robust period selector.
 * Supports: Year, Quarter, Month granularity.
 */
export default function DashboardHeader({
  periods = [],
  selectedPeriod,
  onPeriodChange,
  granularity,
  onGranularityChange,
  teamSize = null
}) {
  
  // Helper to get button text
  const getPeriodLabel = () => {
    if (!selectedPeriod) return "Vista Actual (Live)";
    const p = periods.find(p => p.id === selectedPeriod);
    return p ? p.label : "Histórico";
  };

  const isLive = !selectedPeriod;

  // Granularity logic: Ensure we have a valid default.
  // If parent doesn't provide onGranularityChange, we hide toggles to avoid errors.
  const showGranularity = typeof onGranularityChange === 'function';
  const currentDate = new Date().toLocaleDateString('es', { 
    weekday: 'long',
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-light text-gray-900">
            Resumen Ejecutivo
          </h1>
          {teamSize != null && (
            <span className="relative -top-px px-2.5 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-full border border-gray-200">
              {teamSize} {teamSize === 1 ? 'colaborador' : 'colaboradores'}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1 capitalize">
          {isLive ? currentDate : `Viendo snapshot: ${getPeriodLabel()}`}
        </p>
      </div>

      <div className="flex items-center gap-3">
        
        {/* Granularity Tabs - Visible in Toolbar */}
        {showGranularity && (
          <div className="flex bg-white border border-gray-200 rounded-lg p-1 mr-2 shadow-sm">
            {['year', 'quarter', 'month'].map((g) => (
              <button
                key={g}
                onClick={() => onGranularityChange(g)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all
                  ${granularity === g 
                    ? 'bg-gray-100 text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                {g === 'year' ? 'Año' : g === 'quarter' ? 'Trim.' : 'Mes'}
              </button>
            ))}
          </div>
        )}

        {/* Period Selector Popover */}
        <Popover className="relative">
          <Popover.Button className={`
            flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors outline-none
            ${isLive 
              ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50' 
              : 'bg-indigo-50 border-indigo-200 text-indigo-700'
            }
          `}>
            {isLive ? <Clock size={16} /> : <Calendar size={16} />}
            <span className="truncate max-w-[150px]">{getPeriodLabel()}</span>
            <ChevronDown size={14} className="opacity-50" />
          </Popover.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute right-0 z-50 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-4 transform">
              
              {/* Live Option */}
              <div className="mb-2 pb-2 border-b border-gray-100">
                <button
                  onClick={() => onPeriodChange(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between
                    ${isLive ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}
                  `}
                >
                  <span className="flex items-center gap-2">
                    <RotateCcw size={14} /> Vista Actual (Live)
                  </span>
                  {isLive && <Check size={14} />}
                </button>
              </div>

              {/* Periods List */}
              <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {periods
                  .filter(p => p.type === granularity)
                  .map(period => (
                    <button
                      key={period.id}
                      onClick={() => onPeriodChange(period.id)}
                      className={`
                        w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors
                        ${selectedPeriod === period.id 
                          ? 'bg-indigo-50 text-indigo-700 font-medium' 
                          : 'text-gray-600 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{period.label}</span>
                        <span className="text-[10px] text-gray-400">
                           {period.startDate ? new Date(period.startDate).toLocaleDateString() : ''} - {period.endDate ? new Date(period.endDate).toLocaleDateString() : ''}
                        </span>
                      </div>
                      {selectedPeriod === period.id && <Check size={14} />}
                    </button>
                  ))
                }
                
                {periods.filter(p => p.type === granularity).length === 0 && (
                   <div className="text-center py-6 text-gray-400">
                      <p className="text-xs">No hay evaluaciones históricas</p>
                      <p className="text-[10px] mt-1">en este rango de tiempo</p>
                   </div>
                )}
              </div>

            </Popover.Panel>
          </Transition>
        </Popover>

      </div>
    </div>
  );
}
