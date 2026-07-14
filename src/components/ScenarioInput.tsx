import { useState, useEffect, useRef } from 'react';
import { InputRequirementAnalysis } from '../types/behavior';
import { PRESET_SCENARIOS } from '../hooks/useSavedScenarios';

interface ScenarioInputProps {
  onAnalyze: (text: string) => void;
  loading: boolean;
}

export function ScenarioInput({ onAnalyze, loading }: ScenarioInputProps) {
  const [text, setText] = useState("");
  const [analysis, setAnalysis] = useState<InputRequirementAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (text.trim().length < 15) { setAnalysis(null); setAnalyzeError(false); setAnalyzing(false); return; }
    setAnalyzing(true);
    setAnalyzeError(false);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/analyze-input', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
        const data = await res.json();
        if (data.success && data.analysis) setAnalysis(data.analysis);
        else setAnalyzeError(true);
      } catch { setAnalyzeError(true); }
      finally { setAnalyzing(false); }
    }, 800);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [text]);

  const getStatus = (key: string) => {
    if (!analysis) return { icon: 'fa-circle text-gray-200', textClass: 'text-gray-400' };
    if (analysis.missing?.includes(key as 'scenario' | 'stage' | 'interaction')) return { icon: 'fa-xmark text-red-400', textClass: 'text-red-500' };
    const detected = key === 'scenario' ? analysis.scenario?.detected
                   : key === 'stage' ? analysis.stage?.detected
                   : analysis.interaction?.detected;
    if (detected) return { icon: 'fa-check text-green-500', textClass: 'text-green-600 font-semibold' };
    return { icon: 'fa-circle text-gray-200', textClass: 'text-gray-400' };
  };

  const checks = [
    { key: 'scenario', label: '상황' },
    { key: 'stage', label: '현재 단계' },
    { key: 'interaction', label: '상호작용' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      {/* Title + Presets */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
          <i className="fa-solid fa-wand-magic-sparkles text-blue-400"></i>
          시나리오 입력
        </p>
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
          {PRESET_SCENARIOS.map((p, i) => (
            <button key={i} onClick={() => setText(p.text)}
              className="whitespace-nowrap text-[11px] px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 border border-gray-200 transition-colors font-medium">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="상황, 현재 단계, 상호작용을 포함하여 PUCO가 반응해야 할 상황을 자연어로 묘사해주세요."
        disabled={loading}
        className="w-full h-24 px-3.5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none transition-all"
      />

      {/* Status row + Button */}
      <div className="flex items-center justify-between mt-3 gap-3">
        {/* Check items */}
        <div className="flex items-center gap-3">
          {analyzing ? (
            <span className="text-[11px] text-blue-400 flex items-center gap-1">
              <i className="fa-solid fa-circle-notch fa-spin"></i> 분석 중
            </span>
          ) : analyzeError ? (
            <span className="text-[11px] text-orange-400 flex items-center gap-1">
              <i className="fa-solid fa-triangle-exclamation"></i> 분석 실패
            </span>
          ) : (
            checks.map(c => {
              const s = getStatus(c.key);
              return (
                <span key={c.key} className={`text-[11px] flex items-center gap-1 ${s.textClass}`}>
                  <i className={`fa-solid ${s.icon} text-[9px]`}></i>
                  {c.label}
                </span>
              );
            })
          )}
        </div>

        {/* Generate button */}
        <button
          onClick={() => onAnalyze(text)}
          disabled={!text.trim() || loading}
          className={`shrink-0 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all ${
            !text.trim() || loading
              ? 'bg-gray-200 cursor-not-allowed text-gray-400'
              : analysis?.ready
                ? 'bg-blue-500 hover:bg-blue-600 shadow-sm hover:shadow-md'
                : 'bg-indigo-400 hover:bg-indigo-500'
          }`}
        >
          {loading ? <><i className="fa-solid fa-circle-notch fa-spin mr-1.5"></i>생성 중</> : <><i className="fa-solid fa-bolt mr-1.5"></i>생성하기</>}
        </button>
      </div>
    </div>
  );
}
