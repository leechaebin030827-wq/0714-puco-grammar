import { BehaviorStep } from '../types/behavior';
import { CapabilityDatabase } from '../types/capability';

interface BehaviorSequenceProps {
  sequence: BehaviorStep[];
  database: CapabilityDatabase | null;
}

export function BehaviorSequence({ sequence, database }: BehaviorSequenceProps) {
  if (!sequence || sequence.length === 0) return null;

  const getCapabilityName = (code: string) => {
    if (!database) return 'Unknown';
    const all = [...database.SN, ...database.MP, ...database.PJ, ...database.SP];
    return all.find(c => c.code === code)?.name || 'Unknown';
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'trigger': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'perception': return 'bg-teal-100 text-teal-700 border-teal-200';
      case 'acknowledgement': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'expression': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'action': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'feedback': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'recovery': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
        <i className="fa-solid fa-list-ol text-blue-500 mr-2"></i>
        Behavior Sequence
      </h3>

      <div className="relative border-l-2 border-gray-100 ml-4 space-y-8 pb-4">
        {sequence.sort((a, b) => a.order - b.order).map((step, idx) => (
          <div key={idx} className="relative pl-6">
            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm"></div>
            
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-mono font-bold text-sm">
                    {String(step.order).padStart(2, '0')}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getRoleColor(step.role)} uppercase tracking-wider`}>
                    {step.role}
                  </span>
                </div>
                <div className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-200 flex items-center">
                  <i className="fa-regular fa-clock mr-1.5"></i>
                  {step.timing}
                  {step.duration !== null && <span className="ml-2 pl-2 border-l border-gray-300">{step.duration}ms</span>}
                </div>
              </div>

              <h4 className="font-bold text-gray-800 text-base mb-1">
                <span className="text-blue-600 mr-2 font-mono">{step.code}</span>
                {getCapabilityName(step.code)}
              </h4>
              
              <p className="text-sm text-gray-600 mt-2 bg-white p-3 rounded-lg border border-gray-100">
                {step.reason}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
