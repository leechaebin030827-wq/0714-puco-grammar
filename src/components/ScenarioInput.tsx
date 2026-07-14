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
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced Analysis
  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (text.trim().length < 15) {
      setAnalysis(null);
      setAnalyzeError(false);
      setAnalyzing(false);
      return;
    }

    setAnalyzing(true);
    setAnalyzeError(false);

    typingTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/analyze-input', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
        
        if (!res.ok) throw new Error("분석 실패");
        
        const data = await res.json();
        if (data.success && data.analysis) {
          setAnalysis(data.analysis);
        } else {
          setAnalyzeError(true);
        }
      } catch (err) {
        setAnalyzeError(true);
      } finally {
        setAnalyzing(false);
      }
    }, 800); // 800ms debounce

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [text]);

  const handleGenerate = () => {
    onAnalyze(text);
  };

  const getStatusColor = (detected?: boolean, missingArray?: string[], key?: string) => {
    if (!analysis) return 'text-gray-400';
    if (missingArray?.includes(key || '')) return 'text-red-500 font-medium';
    if (detected) return 'text-green-500 font-bold';
    return 'text-gray-400';
  };

  const getStatusIcon = (detected?: boolean, missingArray?: string[], key?: string) => {
    if (!analysis) return 'fa-circle-dot';
    if (missingArray?.includes(key || '')) return 'fa-xmark';
    if (detected) return 'fa-check';
    return 'fa-circle-dot';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <i className="fa-solid fa-wand-magic-sparkles text-blue-500 mr-3"></i>
          Behavior Grammar 생성
        </h2>
        
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar mt-3 md:mt-0">
          {PRESET_SCENARIOS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => setText(preset.text)}
              className="whitespace-nowrap px-3 py-1.5 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 text-sm rounded-lg transition-colors border border-gray-200"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="상황, 현재 단계, 상호작용을 포함하여 푸코가 반응해야 할 상황을 묘사해주세요."
        className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-shadow mb-4"
        disabled={loading}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end">
        <div className="mb-4 md:mb-0 space-y-2 text-sm w-full md:w-2/3">
          <p className="text-gray-500 font-medium mb-1">
            {analyzing ? (
              <span className="text-blue-500"><i className="fa-solid fa-circle-notch fa-spin mr-2"></i>입력 내용을 분석하고 있습니다...</span>
            ) : analyzeError ? (
              <span className="text-orange-500"><i className="fa-solid fa-triangle-exclamation mr-2"></i>입력 구조를 자동으로 확인하지 못했습니다. 직접 다시 시도해주세요.</span>
            ) : analysis?.ready ? (
              <span className="text-green-600"><i className="fa-solid fa-check-double mr-2"></i>Behavior Grammar를 생성할 준비가 되었습니다.</span>
            ) : text.trim().length >= 15 && analysis ? (
              <span className="text-gray-600">입력 내용이 충분하지 않습니다. AI가 일부 내용을 추론하여 생성할 수 있습니다.</span>
            ) : (
              "다음 세 가지 요소를 포함하여 입력해주세요."
            )}
          </p>
          <ul className="space-y-1">
            <li className={getStatusColor(analysis?.scenario?.detected, analysis?.missing, 'scenario')}>
              <i className={`fa-solid ${getStatusIcon(analysis?.scenario?.detected, analysis?.missing, 'scenario')} w-5`}></i> 상황
              {analysis?.missing?.includes('scenario') && <span className="text-gray-400 font-normal ml-2 text-xs hidden sm:inline">(예: 사용자 출근 준비 상황)</span>}
            </li>
            <li className={getStatusColor(analysis?.stage?.detected, analysis?.missing, 'stage')}>
              <i className={`fa-solid ${getStatusIcon(analysis?.stage?.detected, analysis?.missing, 'stage')} w-5`}></i> 현재 단계
              {analysis?.missing?.includes('stage') && <span className="text-gray-400 font-normal ml-2 text-xs hidden sm:inline">(예: 사용자의 입력을 기다리는 단계)</span>}
            </li>
            <li className={getStatusColor(analysis?.interaction?.detected, analysis?.missing, 'interaction')}>
              <i className={`fa-solid ${getStatusIcon(analysis?.interaction?.detected, analysis?.missing, 'interaction')} w-5`}></i> PUCO와 사용자의 상호작용
              {analysis?.missing?.includes('interaction') && <span className="text-gray-400 font-normal ml-2 text-xs hidden sm:inline">(예: 사용자가 손을 흔들어 인사함)</span>}
            </li>
          </ul>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!text.trim() || loading}
          className={`px-8 py-3 rounded-xl font-bold text-white transition-all shadow-md ${
            !text.trim() || loading
              ? 'bg-gray-300 cursor-not-allowed shadow-none'
              : analysis?.ready 
                ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5' 
                : 'bg-indigo-500 hover:bg-indigo-600'
          }`}
        >
          {loading ? (
            <><i className="fa-solid fa-circle-notch fa-spin mr-2"></i>생성 중...</>
          ) : (
            <><i className="fa-solid fa-bolt mr-2"></i>생성하기</>
          )}
        </button>
      </div>
    </div>
  );
}
