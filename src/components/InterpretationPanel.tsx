import { useState } from 'react';
import { Interpretation } from '../types/behavior';

interface InterpretationPanelProps {
  interpretation: Interpretation;
  defaultOpen?: boolean;
}

export function InterpretationPanel({ interpretation, defaultOpen = false }: InterpretationPanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  if (!interpretation) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-5 py-3.5 text-left hover:bg-gray-50/60 transition-colors"
      >
        <i className="fa-solid fa-brain text-[11px] text-violet-400"></i>
        <span className="text-xs font-bold text-gray-500 flex-1">AI 상황 해석</span>
        <i className={`fa-solid fa-chevron-down text-[10px] text-gray-300 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}></i>
      </button>

      {/* Collapsible content */}
      {open && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-widest mb-1.5">Scenario</p>
              <p className="text-sm font-semibold text-gray-700 leading-snug">{interpretation.scenario}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-widest mb-1.5">Stage</p>
              <p className="text-sm font-semibold text-gray-700 leading-snug">{interpretation.stage}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-widest mb-1.5">Trigger</p>
              <p className="text-sm font-semibold text-gray-700 leading-snug">{interpretation.trigger}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-widest mb-1.5">User Action</p>
              <p className="text-sm font-semibold text-gray-700 leading-snug">{interpretation.userAction}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-50">
            <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-widest mb-1.5">PUCO Intent</p>
            <p className="text-sm font-bold text-gray-900 leading-snug">{interpretation.pucoIntent}</p>
          </div>
        </div>
      )}
    </div>
  );
}
