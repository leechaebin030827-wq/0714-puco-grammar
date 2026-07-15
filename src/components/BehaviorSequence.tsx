import { BehaviorStep } from '../types/behavior';
import { CapabilityDatabase } from '../types/capability';

interface BehaviorSequenceProps {
  sequence: BehaviorStep[];
  database: CapabilityDatabase | null;
}

const ROLE_COLOR: Record<string, string> = {
  trigger:         'text-emerald-500',
  perception:      'text-teal-500',
  acknowledgement: 'text-blue-500',
  expression:      'text-purple-500',
  action:          'text-indigo-500',
  feedback:        'text-amber-500',
  recovery:        'text-gray-400',
};

const TYPE_CODE_COLOR: Record<string, string> = {
  SN: 'text-emerald-700 bg-emerald-50',
  MP: 'text-blue-700 bg-blue-50',
  PJ: 'text-amber-700 bg-amber-50',
  SP: 'text-rose-700 bg-rose-50',
};

export function BehaviorSequence({ sequence, database }: BehaviorSequenceProps) {
  if (!sequence || sequence.length === 0) return null;

  const getName = (code: string) => {
    if (!database) return code;
    return [...database.SN, ...database.MP, ...database.PJ, ...database.SP].find(c => c.code === code)?.name || code;
  };

  const getType = (code: string) => {
    if (!database) return '';
    if (database.SN.some(c => c.code === code)) return 'SN';
    if (database.MP.some(c => c.code === code)) return 'MP';
    if (database.PJ.some(c => c.code === code)) return 'PJ';
    return 'SP';
  };

  const sorted = [...sequence].sort((a, b) => a.order - b.order);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
        <i className="fa-solid fa-arrow-trend-up text-xs text-gray-400"></i>
        <span className="text-xs font-bold text-gray-500">Behavior Sequence</span>
        <span className="ml-auto text-[11px] font-medium text-gray-300">{sorted.length}단계</span>
      </div>

      {/* Steps */}
      <div className="divide-y divide-gray-50">
        {sorted.map((step, idx) => {
          const codeColor = TYPE_CODE_COLOR[getType(step.code)] || 'text-gray-600 bg-gray-100';
          const roleColor = ROLE_COLOR[step.role] || 'text-gray-400';
          return (
            <div key={idx} className="flex gap-4 px-5 py-4">
              {/* Step number */}
              <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                <span className="text-[11px] font-bold text-gray-200 tabular-nums">{String(step.order).padStart(2,'0')}</span>
                {idx < sorted.length - 1 && (
                  <div className="w-px flex-1 min-h-[16px] bg-gray-100"></div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-0.5">
                {/* Code + Role + Timing */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg inline-flex items-center leading-none ${codeColor}`}>
                    <span className="capture-adjust-up">{step.code}</span>
                  </span>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider inline-flex items-center leading-none ${roleColor}`}>
                    <span className="capture-adjust-up">{step.role}</span>
                  </span>
                  <span className="ml-auto text-[10px] text-gray-300 whitespace-nowrap">
                    {step.timing}{step.duration != null ? ` · ${step.duration}ms` : ''}
                  </span>
                </div>

                {/* Name */}
                <p className="text-sm font-bold text-gray-800 leading-snug mb-1">
                  {getName(step.code)}
                </p>

                {/* Reason */}
                {step.reason && (
                  <p className="text-[11px] text-gray-400 leading-relaxed">{step.reason}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
