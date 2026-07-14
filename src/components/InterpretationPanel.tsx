import { Interpretation } from '../types/behavior';

export function InterpretationPanel({ interpretation }: { interpretation: Interpretation }) {
  if (!interpretation) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center border-b pb-3">
        <i className="fa-solid fa-brain text-purple-500 mr-2"></i>
        AI 상황 해석 결과
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
          <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">Scenario</div>
          <div className="text-gray-800 font-medium">{interpretation.scenario}</div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
          <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">Stage</div>
          <div className="text-gray-800 font-medium">{interpretation.stage}</div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Trigger</div>
          <div className="text-gray-800 font-medium">{interpretation.trigger}</div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">User Action</div>
          <div className="text-gray-800 font-medium">{interpretation.userAction}</div>
        </div>
        
        <div className="md:col-span-2 bg-indigo-50 p-4 rounded-xl border border-indigo-100 mt-2">
          <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">PUCO Intent</div>
          <div className="text-indigo-900 font-bold">{interpretation.pucoIntent}</div>
        </div>
      </div>
    </div>
  );
}
