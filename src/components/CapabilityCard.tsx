import { CapabilityItem } from '../types/capability';
import { BehaviorStep } from '../types/behavior';

interface CapabilityCardProps {
  title: string;
  type: 'SN' | 'MP' | 'PJ' | 'SP';
  items: CapabilityItem[];
  sequence: BehaviorStep[];
}

const TYPE_CONFIG = {
  SN: { dot: 'bg-emerald-400', label: 'text-emerald-700', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: 'fa-eye' },
  MP: { dot: 'bg-blue-400',    label: 'text-blue-700',    pill: 'bg-blue-50 text-blue-700 border-blue-200',       icon: 'fa-robot' },
  PJ: { dot: 'bg-amber-400',   label: 'text-amber-700',   pill: 'bg-amber-50 text-amber-700 border-amber-200',    icon: 'fa-display' },
  SP: { dot: 'bg-rose-400',    label: 'text-rose-700',    pill: 'bg-rose-50 text-rose-700 border-rose-200',       icon: 'fa-volume-high' },
};

const ROLE_PILL: Record<string, string> = {
  trigger:         'bg-emerald-50 text-emerald-600 border-emerald-200',
  perception:      'bg-teal-50 text-teal-600 border-teal-200',
  acknowledgement: 'bg-blue-50 text-blue-600 border-blue-200',
  expression:      'bg-purple-50 text-purple-600 border-purple-200',
  action:          'bg-indigo-50 text-indigo-600 border-indigo-200',
  feedback:        'bg-amber-50 text-amber-600 border-amber-200',
  recovery:        'bg-gray-100 text-gray-500 border-gray-200',
};

export function CapabilityCard({ title, type, items, sequence }: CapabilityCardProps) {
  const cfg = TYPE_CONFIG[type];

  if (items.length === 0) return null; // 해당 없는 카테고리는 숨김

  return (
    <div className="bg-white rounded-xl border border-gray-100">
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <div className={`w-2 h-2 rounded-full ${cfg.dot}`}></div>
        <span className={`text-xs font-bold ${cfg.label}`}>{title}</span>
        <span className="ml-auto text-[10px] text-gray-400 font-medium">{items.length}개</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-50">
        {items.map(item => {
          const seqInfo = sequence.find(s => s.code === item.code);
          const rolePill = seqInfo ? (ROLE_PILL[seqInfo.role] || ROLE_PILL.recovery) : null;
          return (
            <div key={item.code} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50/60 transition-colors">
              {/* Code */}
              <span className="font-mono text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md shrink-0 mt-0.5 leading-5">
                {item.code}
              </span>
              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-[13px] font-semibold text-gray-800 leading-snug">{item.name}</span>
                  {seqInfo && rolePill && (
                    <span className={`text-[10px] font-bold border px-1.5 py-px rounded-full ${rolePill}`}>
                      {seqInfo.role}
                    </span>
                  )}
                </div>
                {item.desc && (
                  <p className="text-[11px] text-gray-400 leading-snug">{item.desc}</p>
                )}
                {seqInfo?.reason && (
                  <p className="text-[11px] text-gray-500 mt-1 leading-snug italic">→ {seqInfo.reason}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
