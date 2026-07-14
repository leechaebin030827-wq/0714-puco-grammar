import { BehaviorStep } from '../types/behavior';
import { CapabilityDatabase } from '../types/capability';

interface BehaviorSequenceProps {
  sequence: BehaviorStep[];
  database: CapabilityDatabase | null;
}

const ROLE_CONFIG: Record<string, string> = {
  trigger:         'bg-emerald-100 text-emerald-700',
  perception:      'bg-teal-100 text-teal-700',
  acknowledgement: 'bg-blue-100 text-blue-700',
  expression:      'bg-purple-100 text-purple-700',
  action:          'bg-indigo-100 text-indigo-700',
  feedback:        'bg-amber-100 text-amber-700',
  recovery:        'bg-gray-100 text-gray-500',
};

const DOT_COLOR: Record<string, string> = {
  trigger: 'bg-emerald-400',
  perception: 'bg-teal-400',
  acknowledgement: 'bg-blue-400',
  expression: 'bg-purple-400',
  action: 'bg-indigo-400',
  feedback: 'bg-amber-400',
  recovery: 'bg-gray-400',
};

export function BehaviorSequence({ sequence, database }: BehaviorSequenceProps) {
  if (!sequence || sequence.length === 0) return null;

  const getName = (code: string) => {
    if (!database) return code;
    return [...database.SN, ...database.MP, ...database.PJ, ...database.SP].find(c => c.code === code)?.name || code;
  };

  const sorted = [...sequence].sort((a, b) => a.order - b.order);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
        <i className="fa-solid fa-list-ol text-blue-400"></i>Behavior Sequence
      </p>

      <div className="space-y-2">
        {sorted.map((step, idx) => {
          const roleClass = ROLE_CONFIG[step.role] || 'bg-gray-100 text-gray-500';
          const dotClass = DOT_COLOR[step.role] || 'bg-gray-400';
          return (
            <div key={idx} className="flex gap-3 items-start">
              {/* Step number + dot */}
              <div className="flex flex-col items-center gap-0.5 pt-1 shrink-0">
                <div className={`w-5 h-5 rounded-full ${dotClass} flex items-center justify-center`}>
                  <span className="text-white text-[9px] font-bold">{step.order}</span>
                </div>
                {idx < sorted.length - 1 && (
                  <div className="w-px h-full min-h-[12px] bg-gray-100"></div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 bg-gray-50 rounded-xl border border-gray-100 px-3 py-2.5 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${roleClass}`}>{step.role}</span>
                  <span className="font-mono text-[10px] font-bold text-gray-600">{step.code}</span>
                  <span className="text-[10px] text-gray-400 ml-auto">{step.timing}{step.duration != null ? ` · ${step.duration}ms` : ''}</span>
                </div>
                <p className="text-xs font-semibold text-gray-800 mb-0.5">{getName(step.code)}</p>
                <p className="text-[10px] text-gray-400 leading-snug">{step.reason}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
