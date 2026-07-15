import { useState } from 'react';
import { SavedScenario } from '../hooks/useSavedScenarios';
import { CapabilityDatabase } from '../types/capability';
import { BehaviorSequence } from './BehaviorSequence';

interface SavedScenariosProps {
  scenarios: SavedScenario[];
  onDelete: (id: string) => void;
  database: CapabilityDatabase | null;
}

const CODE_COLOR: Record<string, string> = {
  SN: 'text-emerald-700 bg-emerald-50',
  MP: 'text-blue-700 bg-blue-50',
  PJ: 'text-amber-700 bg-amber-50',
  SP: 'text-rose-700 bg-rose-50',
};

export function SavedScenarios({ scenarios, onDelete, database }: SavedScenariosProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = scenarios.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.input.scenario.toLowerCase().includes(q) ||
           s.result.summary.toLowerCase().includes(q) ||
           s.result.interpretation?.stage?.toLowerCase().includes(q);
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-clock-rotate-left text-xs text-gray-400"></i>
          <span className="text-xs font-bold text-gray-500">Saved Scenarios</span>
          <span className="text-[11px] font-medium text-gray-300 ml-1">{scenarios.length}개</span>
        </div>
        {/* Search */}
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-300"></i>
          <input
            type="text"
            placeholder="상황·결과 검색"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-48 pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all placeholder:text-gray-300"
          />
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-50">
        {filtered.map(scenario => {
          const isOpen = expandedId === scenario.id;
          const allCodes = [
            ...scenario.result.capabilities.SN,
            ...scenario.result.capabilities.MP,
            ...scenario.result.capabilities.PJ,
            ...scenario.result.capabilities.SP,
          ];
          return (
            <div key={scenario.id} className="group">
              {/* Summary row */}
              <div
                className="flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50/60 transition-colors"
                onClick={() => setExpandedId(isOpen ? null : scenario.id)}
              >
                {/* Expand chevron */}
                <i className={`fa-solid fa-chevron-right text-[10px] text-gray-300 mt-0.5 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-90' : ''}`}></i>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-gray-300 mb-0.5">
                    <i className="fa-regular fa-clock mr-1"></i>{scenario.createdAt}
                  </p>
                  <p className="text-xs font-bold text-gray-700 leading-snug mb-1.5 truncate">
                    "{scenario.input.scenario}"
                  </p>
                  <p className="text-[11px] text-gray-500 leading-snug mb-2">{scenario.result.summary}</p>

                  {/* Code badges */}
                  <div className="flex flex-wrap gap-1">
                    {allCodes.map(code => (
                      <span
                        key={code}
                        className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md ${CODE_COLOR[code.substring(0, 2)] || 'text-gray-600 bg-gray-100'}`}
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={e => { e.stopPropagation(); onDelete(scenario.id); }}
                  className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[11px] text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                  title="삭제"
                >
                  <i className="fa-solid fa-trash-can"></i>
                </button>
              </div>

              {/* Expanded: Behavior Sequence */}
              {isOpen && (
                <div className="px-5 pb-4">
                  <BehaviorSequence sequence={scenario.result.sequence} database={database} />
                  {scenario.result.warnings && scenario.result.warnings.length > 0 && (
                    <div className="mt-3 bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">
                      <p className="text-[11px] text-amber-600 font-bold flex items-center gap-1.5 mb-1">
                        <i className="fa-solid fa-triangle-exclamation"></i>AI 주의 메시지
                      </p>
                      <p className="text-[11px] text-amber-700">{scenario.result.warnings[0]}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 text-gray-300 gap-2">
            <i className="fa-regular fa-folder-open text-2xl opacity-40"></i>
            <p className="text-xs">저장된 시나리오가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
