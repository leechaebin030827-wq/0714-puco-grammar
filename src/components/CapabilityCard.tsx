import { CapabilityItem } from '../types/capability';
import { BehaviorStep } from '../types/behavior';

interface CapabilityCardProps {
  title: string;
  type: 'SN' | 'MP' | 'PJ' | 'SP';
  items: CapabilityItem[];
  sequence: BehaviorStep[];
}

const TYPE_CONFIG = {
  SN: { icon: 'fa-eye', accent: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', tag: 'bg-emerald-100 text-emerald-700' },
  MP: { icon: 'fa-robot', accent: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', tag: 'bg-blue-100 text-blue-700' },
  PJ: { icon: 'fa-display', accent: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', tag: 'bg-amber-100 text-amber-700' },
  SP: { icon: 'fa-volume-high', accent: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', tag: 'bg-rose-100 text-rose-700' },
};

export function CapabilityCard({ title, type, items, sequence }: CapabilityCardProps) {
  const cfg = TYPE_CONFIG[type];

  return (
    <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-3 flex flex-col gap-2`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <i className={`fa-solid ${cfg.icon} text-xs ${cfg.accent}`}></i>
          <span className={`text-xs font-bold ${cfg.accent}`}>{title}</span>
        </div>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.tag}`}>
          {items.length}
        </span>
      </div>

      {/* Items */}
      <div className="space-y-1.5">
        {items.length > 0 ? items.map(item => {
          const seqInfo = sequence.find(s => s.code === item.code);
          return (
            <div key={item.code} className="bg-white rounded-xl border border-gray-100 p-2.5 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[10px] font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">{item.code}</span>
                {seqInfo && (
                  <span className="text-[9px] font-bold text-indigo-500 uppercase">{seqInfo.role}</span>
                )}
              </div>
              <p className="text-xs font-semibold text-gray-800 leading-tight">{item.name}</p>
              {seqInfo?.reason && (
                <p className="text-[10px] text-gray-400 mt-1 leading-snug">{seqInfo.reason}</p>
              )}
            </div>
          );
        }) : (
          <div className="flex flex-col items-center justify-center py-4 text-gray-300 text-xs gap-1">
            <i className="fa-solid fa-ghost text-lg opacity-40"></i>
            <span>해당 없음</span>
          </div>
        )}
      </div>
    </div>
  );
}
