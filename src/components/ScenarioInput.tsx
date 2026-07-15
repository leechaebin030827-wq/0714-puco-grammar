import { useState, useEffect, useRef } from 'react';
import { InputRequirementAnalysis } from '../types/behavior';
import { PRESET_SCENARIOS } from '../hooks/useSavedScenarios';

interface ScenarioInputProps {
  onAnalyze: (text: string) => void;
  loading: boolean;
}

interface ApiStatus {
  status: 'missing' | 'rate_limited' | 'configured' | 'error';
  message: string;
}

export function ScenarioInput({ onAnalyze, loading }: ScenarioInputProps) {
  const [text, setText] = useState("");
  const [analysis, setAnalysis] = useState<InputRequirementAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check API Status on load
  useEffect(() => {
    const checkApi = async () => {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        setApiStatus({ status: data.status, message: data.message });
      } catch {
        setApiStatus({ status: 'error', message: 'API 상태 확인 실패' });
      }
    };
    checkApi();
    const interval = setInterval(checkApi, 15000); // refresh status every 15s
    return () => clearInterval(interval);
  }, []);

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
    }, 1500);
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

  const getApiStatusBadge = () => {
    if (!apiStatus) return 'bg-gray-100 text-gray-400';
    switch (apiStatus.status) {
      case 'configured': return 'bg-green-50 text-green-600 border-green-200';
      case 'rate_limited': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'missing': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-red-50 text-red-600 border-red-200';
    }
  };

  const checks = [
    { key: 'scenario', label: '상황' },
    { key: 'stage', label: '현재 단계' },
    { key: 'interaction', label: '상호작용' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      {/* Title + API Key Status */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
          <i className="fa-solid fa-wand-magic-sparkles text-blue-400"></i>
          시나리오 입력
        </p>
        
        {/* API Status Badge */}
        {apiStatus && (
          <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full inline-flex items-center gap-1 leading-none ${getApiStatusBadge()}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              apiStatus.status === 'configured' ? 'bg-green-500' :
              apiStatus.status === 'rate_limited' ? 'bg-amber-500' : 'bg-red-500'
            }`}></span>
            {apiStatus.message}
          </span>
        )}
      </div>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="상황, 현재 단계, 상호작용을 포함하여 PUCO가 반응해야 할 상황을 자연어로 묘사해주세요."
        disabled={loading}
        className="w-full h-24 px-3.5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none transition-all"
      />

      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-3 border-b border-gray-50">
        <span className="text-[10px] font-bold text-gray-300 shrink-0 uppercase tracking-wider">추천:</span>
        {PRESET_SCENARIOS.map((p, i) => {
          const isSelected = text === p.text;
          return (
            <button
              key={i}
              onClick={() => setText(p.text)}
              className={`whitespace-nowrap text-[11px] px-2.5 py-1 rounded-lg border transition-all font-medium ${
                isSelected
                  ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm'
                  : 'bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 border-gray-200'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Status row + Button */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {/* Check items */}
        <div className="flex items-center gap-3">
          {analyzing ? (
            <span className="text-[11px] text-blue-400 inline-flex items-center gap-1 leading-none">
              <i className="fa-solid fa-circle-notch fa-spin shrink-0"></i> 분석 중
            </span>
          ) : analyzeError ? (
            <span className="text-[11px] text-orange-400 inline-flex items-center gap-1 leading-none">
              <i className="fa-solid fa-triangle-exclamation shrink-0"></i> 분석 실패
            </span>
          ) : (
            checks.map(c => {
              const s = getStatus(c.key);
              return (
                <span key={c.key} className={`text-[11px] inline-flex items-center gap-1 leading-none ${s.textClass}`}>
                  <i className={`fa-solid ${s.icon} text-[9px] shrink-0`}></i>
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

      {/* Accuracy Helper Info */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-gray-50 text-[10px] text-gray-400">
        <i className="fa-solid fa-circle-info text-blue-400/80"></i>
        <span>세 조건(상황, 현재 단계, 상호작용)을 충족하여 자세히 적어주실수록 분석 정확도가 높아집니다.</span>
      </div>
    </div>
  );
}
