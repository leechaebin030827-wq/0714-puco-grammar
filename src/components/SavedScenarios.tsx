import { useState } from 'react';
import { SavedScenario } from '../hooks/useSavedScenarios';
import { CapabilityDatabase } from '../types/capability';
import { BehaviorSequence } from './BehaviorSequence';

interface SavedScenariosProps {
  scenarios: SavedScenario[];
  onDelete: (id: string) => void;
  database: CapabilityDatabase | null;
}

export function SavedScenarios({ scenarios, onDelete, database }: SavedScenariosProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = scenarios.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.input.scenario.toLowerCase().includes(q) || 
           s.result.summary.toLowerCase().includes(q) ||
           s.result.interpretation?.stage?.toLowerCase().includes(q);
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Saved Grammar Scenarios</h2>
          <p className="text-sm text-gray-500 mt-1">저장된 Behavior Grammar 결과 기록입니다.</p>
        </div>
        
        <div className="mt-4 md:mt-0 relative w-full md:w-64">
          <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="상황 또는 결과 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>
      </div>

      <div className="space-y-6">
        {filtered.map(scenario => (
          <div key={scenario.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow relative overflow-hidden bg-white">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-bold text-gray-400 mb-1 block"><i className="fa-regular fa-clock mr-1"></i>{scenario.createdAt}</span>
                <h3 className="font-bold text-gray-800 text-lg">"{scenario.input.scenario}"</h3>
              </div>
              <button
                onClick={() => onDelete(scenario.id)}
                className="text-gray-400 hover:text-red-500 p-2 transition-colors"
                title="삭제"
              >
                <i className="fa-solid fa-trash-can"></i>
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-100">
              <p className="text-gray-700 font-medium mb-3">{scenario.result.summary}</p>
              <div className="flex flex-wrap gap-2">
                {[...scenario.result.capabilities.SN, 
                  ...scenario.result.capabilities.MP, 
                  ...scenario.result.capabilities.PJ, 
                  ...scenario.result.capabilities.SP].map(code => (
                  <span key={code} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-bold text-gray-600">
                    {code}
                  </span>
                ))}
              </div>
            </div>

            {scenario.result.sequence && scenario.result.sequence.length > 0 && (
              <div className="mt-4">
                <BehaviorSequence sequence={scenario.result.sequence} database={database} />
              </div>
            )}
            
            {scenario.result.warnings && scenario.result.warnings.length > 0 && (
              <div className="mt-4 bg-amber-50 text-amber-700 p-3 rounded-lg text-sm border border-amber-200">
                <i className="fa-solid fa-triangle-exclamation mr-2"></i>
                {scenario.result.warnings[0]}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <i className="fa-regular fa-folder-open text-4xl mb-3 opacity-30"></i>
            <p>저장된 시나리오가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
