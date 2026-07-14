import { BehaviorStep } from '../types/behavior';
import { CapabilityDatabase } from '../types/capability';

interface BehaviorSequenceProps {
  sequence: BehaviorStep[];
  database: CapabilityDatabase | null;
}

const ROLE_PILL: Record<string, string> = {
  trigger:         'bg-emerald-50 text-emerald-600 border-emerald-200',
  perception:      'bg-teal-50 text-teal-600 border-teal-200',
  acknowledgement: 'bg-blue-50 text-blue-600 border-blue-200',
  expression:      'bg-purple-50 text-purple-600 border-purple-200',
  action:          'bg-indigo-50 text-indigo-600 border-indigo-200',
  feedback:        'bg-amber-50 text-amber-600 border-amber-200',
  recovery:        'bg-gray-100 text-gray-500 border-gray-200',
};

const TYPE_DOT: Record<string, string> = {
  SN: 'bg-emerald-400', MP: 'bg-blue-400', PJ: 'bg-amber-400', SP: 'bg-rose-400',
};

export function BehaviorSequence({ sequence, database }: BehaviorSequenceProps) {
  if (!sequence || sequence.length === 0) return null;

  const getName = (code: string) => {
    if (!database) return code;
    return [...database.SN, ...database.MP, ...database.PJ, ...database.SP].find(c => c.code === code)?.name || code;
  };

  const getType = (code: string): string => {
    if (!database) return '';
    if (database.SN.some(c => c.code === code)) return 'SN';
    if (database.MP.some(c => c.code === code)) return 'MP';
    if (database.PJ.some(c => c.code === code)) return 'PJ';
    if (database.SP.some(c => c.code === code)) return 'SP';
    return '';
  };

  const sorted = [...sequence].sort((a, b) => a.order - b.order);

  return (
    <div className="bg-white rounded-xl border border-gray-100">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <i className="fa-solid fa-arrow-right-long text-[10px] text-gray-400"></i>
        <span className="text-xs font-bold text-gray-600">Behavior Sequence</span>
        <span className="ml-auto text-[10px] text-gray-400">{sorted.length}단계</span>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[24px_80px_1fr_auto] gap-3 px-4 py-2 text-[10px] font-bold text-gray-300 uppercase tracking-wider border-b border-gray-50">
        <span>#</span>
        <span>코드</span>
        <span>능력명 / 근거</span>
        <span>타이밍</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-50">
        {sorted.map((step, idx) => {
          const rolePill = ROLE_PILL[step.role] || ROLE_PILL.recovery;
          const typeDot = TYPE_DOT[getType(step.code)] || 'bg-gray-300';
          return (
            <div key={idx} className="grid grid-cols-[24px_80px_1fr_auto] gap-3 px-4 py-3 items-start hover:bg-gray-50/60 transition-colors">
              {/* Step number */}
              <span className="text-[11px] font-bold text-gray-300 mt-0.5">{String(step.order).padStart(2, '0')}</span>

              {/* Code + type dot */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${typeDot}`}></div>
                <span className="font-mono text-[11px] font-bold text-gray-600 bg-gray-100 px-1.5 py-px rounded">{step.code}</span>
              </div>

              {/* Name + role + reason */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-[13px] font-semibold text-gray-800 leading-snug">{getName(step.code)}</span>
                  <span className={`text-[10px] font-bold border px-1.5 py-px rounded-full shrink-0 ${rolePill}`}>{step.role}</span>
                </div>
                {step.reason && (
                  <p className="text-[11px] text-gray-400 leading-snug">{step.reason}</p>
                )}
              </div>

              {/* Timing */}
              <div className="text-right shrink-0 mt-0.5">
                <span className="text-[10px] text-gray-400 whitespace-nowrap">{step.timing}</span>
                {step.duration != null && (
                  <span className="block text-[10px] text-gray-300">{step.duration}ms</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
