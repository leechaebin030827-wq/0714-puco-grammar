import { CapabilityItem } from '../types/capability';
import { BehaviorStep } from '../types/behavior';

interface CapabilityCardProps {
  title: string;
  type: 'SN' | 'MP' | 'PJ' | 'SP';
  items: CapabilityItem[];
  sequence: BehaviorStep[];
}

export function CapabilityCard({ title, type, items, sequence }: CapabilityCardProps) {
  const getIcon = () => {
    switch (type) {
      case 'SN': return 'fa-eye text-emerald-500';
      case 'MP': return 'fa-robot text-blue-500';
      case 'PJ': return 'fa-projector text-amber-500';
      case 'SP': return 'fa-volume-high text-rose-500';
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'SN': return 'bg-emerald-50 border-emerald-100';
      case 'MP': return 'bg-blue-50 border-blue-100';
      case 'PJ': return 'bg-amber-50 border-amber-100';
      case 'SP': return 'bg-rose-50 border-rose-100';
    }
  };

  return (
    <div className={`rounded-2xl shadow-sm border p-5 h-full flex flex-col ${getBgColor()}`}>
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-black/5">
        <h3 className="font-bold text-gray-800 flex items-center">
          <i className={`fa-solid ${getIcon()} mr-2 text-lg`}></i>
          {title}
        </h3>
        <span className="text-xs font-bold text-gray-400 bg-white px-2 py-1 rounded-md shadow-sm">
          {items.length} matched
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto hide-scrollbar">
        {items.length > 0 ? (
          items.map(item => {
            const seqInfo = sequence.find(s => s.code === item.code);
            return (
              <div key={item.code} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="inline-block px-2 py-0.5 bg-gray-800 text-white text-xs font-bold rounded">
                    {item.code}
                  </span>
                  {seqInfo && (
                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {seqInfo.role.toUpperCase()}
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-gray-800 text-sm mb-1">{item.name}</h4>
                <p className="text-xs text-gray-500 leading-relaxed mb-2">{item.desc}</p>
                {seqInfo && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs text-gray-700 border border-gray-100">
                    <span className="font-semibold text-gray-500 block mb-1">Reason:</span>
                    {seqInfo.reason}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm py-8">
            <i className="fa-solid fa-ghost text-2xl mb-2 opacity-20"></i>
            해당 없음
          </div>
        )}
      </div>
    </div>
  );
}
