import { CapabilityItem } from '../types/capability';
import { BehaviorStep } from '../types/behavior';

interface CapabilityCardProps {
  title: string;
  type: 'SN' | 'MP' | 'PJ' | 'SP';
  items: CapabilityItem[];
  sequence: BehaviorStep[];
}

const TYPE_CONFIG = {
  SN: { icon: 'fa-eye',         accent: 'text-emerald-500', code: 'text-emerald-700 bg-emerald-50' },
  MP: { icon: 'fa-robot',       accent: 'text-blue-500',    code: 'text-blue-700 bg-blue-50'       },
  PJ: { icon: 'fa-display',     accent: 'text-amber-500',   code: 'text-amber-700 bg-amber-50'     },
  SP: { icon: 'fa-volume-high', accent: 'text-rose-500',    code: 'text-rose-700 bg-rose-50'       },
};

const ROLE_COLORS: Record<string, string> = {
  trigger:         'text-emerald-600',
  perception:      'text-teal-600',
  acknowledgement: 'text-blue-600',
  expression:      'text-purple-600',
  action:          'text-indigo-600',
  feedback:        'text-amber-600',
  recovery:        'text-gray-400',
};

export function CapabilityCard({ title, type, items, sequence }: CapabilityCardProps) {
  const cfg = TYPE_CONFIG[type];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
        <i className={`fa-solid ${cfg.icon} text-xs ${cfg.accent}`}></i>
        <span className="text-xs font-bold text-gray-500">{title}</span>
        <span className="ml-auto text-[11px] font-medium text-gray-300">{items.length}</span>
      </div>

      {/* Items */}
      <div className="divide-y divide-gray-50 flex-1 flex flex-col">
        {items.length > 0 ? items.map((item, idx) => {
          const seqInfo = sequence.find(s => s.code === item.code);
          const roleColor = seqInfo ? (ROLE_COLORS[seqInfo.role] || 'text-gray-400') : '';
          return (
            <div key={item.code} className={`px-5 py-4 flex flex-col ${idx === items.length - 1 ? 'flex-1' : ''}`}>
              {/* Code + Role */}
              <div className="flex items-center gap-2 mb-2">
                <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg ${cfg.code}`}>
                  {item.code}
                </span>
                {seqInfo && (
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${roleColor}`}>
                    {seqInfo.role}
                  </span>
                )}
              </div>
              {/* Name */}
              <p className="text-sm font-bold text-gray-800 leading-snug mb-1">{item.name}</p>
              {/* Description */}
              {item.desc && (
                <p className="text-[11px] text-gray-400 leading-relaxed">{item.desc}</p>
              )}
              {/* Reason */}
              {seqInfo?.reason && (
                <p className="text-[11px] text-gray-500 mt-auto pt-3 mt-4 border-t border-gray-100 leading-snug">
                  {seqInfo.reason}
                </p>
              )}
            </div>
          );
        }) : (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-gray-300 text-xs gap-1.5">
            <i className="fa-solid fa-ghost text-xl opacity-40"></i>
            <span>해당 능력 없음</span>
          </div>
        )}
      </div>
    </div>
  );
}
