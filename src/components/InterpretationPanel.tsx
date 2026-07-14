import { Interpretation } from '../types/behavior';

export function InterpretationPanel({ interpretation }: { interpretation: Interpretation }) {
  if (!interpretation) return null;

  const rows = [
    { label: 'Scenario',    value: interpretation.scenario,   dot: 'bg-violet-400' },
    { label: 'Stage',       value: interpretation.stage,      dot: 'bg-violet-300' },
    { label: 'Trigger',     value: interpretation.trigger,    dot: 'bg-blue-400' },
    { label: 'User Action', value: interpretation.userAction, dot: 'bg-blue-300' },
    { label: 'PUCO Intent', value: interpretation.pucoIntent, dot: 'bg-indigo-500', bold: true },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <i className="fa-solid fa-brain text-[10px] text-violet-400"></i>
        <span className="text-xs font-bold text-gray-600">AI 상황 해석</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-50">
        {rows.map(row => (
          <div key={row.label} className="flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50/50 transition-colors">
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${row.dot}`}></div>
            <span className="text-[11px] font-bold text-gray-300 w-24 shrink-0 pt-0.5 uppercase tracking-wide">{row.label}</span>
            <p className={`text-[13px] leading-snug flex-1 ${row.bold ? 'font-bold text-indigo-800' : 'text-gray-700 font-medium'}`}>
              {row.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
