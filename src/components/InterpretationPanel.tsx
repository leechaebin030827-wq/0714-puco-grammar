import { Interpretation } from '../types/behavior';

export function InterpretationPanel({ interpretation }: { interpretation: Interpretation }) {
  if (!interpretation) return null;

  const fields = [
    { label: 'Scenario', value: interpretation.scenario, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100' },
    { label: 'Stage', value: interpretation.stage, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100' },
    { label: 'Trigger', value: interpretation.trigger, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
    { label: 'User Action', value: interpretation.userAction, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
        <i className="fa-solid fa-brain text-violet-400"></i>AI 상황 해석
      </p>

      <div className="grid grid-cols-2 gap-2 mb-2">
        {fields.map(f => (
          <div key={f.label} className={`rounded-xl border px-3 py-2.5 ${f.bg}`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${f.color} opacity-70`}>{f.label}</p>
            <p className="text-xs text-gray-700 font-medium leading-snug">{f.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-indigo-50 border-indigo-100 px-3 py-2.5">
        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">PUCO Intent</p>
        <p className="text-xs text-indigo-900 font-semibold leading-snug">{interpretation.pucoIntent}</p>
      </div>
    </div>
  );
}
