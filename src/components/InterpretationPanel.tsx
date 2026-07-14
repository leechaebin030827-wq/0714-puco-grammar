import { useState } from 'react';
import { Interpretation } from '../types/behavior';

interface InterpretationPanelProps {
  interpretation: Interpretation;
  defaultOpen?: boolean;
}

const ROWS = [
  { key: 'scenario',   label: 'Scenario',    dot: 'bg-violet-400', bold: false },
  { key: 'stage',      label: 'Stage',       dot: 'bg-violet-300', bold: false },
  { key: 'trigger',    label: 'Trigger',     dot: 'bg-blue-400',   bold: false },
  { key: 'userAction', label: 'User Action', dot: 'bg-blue-300',   bold: false },
  { key: 'pucoIntent', label: 'PUCO Intent', dot: 'bg-indigo-500', bold: true  },
] as const;

export function InterpretationPanel({ interpretation, defaultOpen = false }: InterpretationPanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  if (!interpretation) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Toggle trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-5 py-3.5 text-left hover:bg-gray-50/60 transition-colors"
      >
        <i className="fa-solid fa-brain text-[11px] text-violet-400"></i>
        <span className="text-xs font-bold text-gray-500 flex-1">AI 상황 해석</span>
        <i className={`fa-solid fa-chevron-down text-[10px] text-gray-300 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}></i>
      </button>

      {/* List rows (Notion style) */}
      {open && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {ROWS.map(row => (
            <div key={row.key} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors">
              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${row.dot}`}></div>
              <span className="text-[11px] font-bold text-gray-300 w-24 shrink-0 pt-0.5 uppercase tracking-wide">{row.label}</span>
              <p className={`text-[13px] leading-snug flex-1 ${row.bold ? 'font-bold text-indigo-800' : 'font-medium text-gray-700'}`}>
                {interpretation[row.key]}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
