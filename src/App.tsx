import { useState } from 'react';
import html2canvas from 'html2canvas';

import { useCapabilityDatabase } from './hooks/useCapabilityDatabase';
import { useSavedScenarios } from './hooks/useSavedScenarios';
import { MatchSettings, BehaviorGrammarResult } from './types/behavior';

import { ScenarioInput } from './components/ScenarioInput';
import { InterpretationPanel } from './components/InterpretationPanel';
import { CapabilityCard } from './components/CapabilityCard';
import { BehaviorSequence } from './components/BehaviorSequence';
import { DatabaseManager } from './components/DatabaseManager';
import { SavedScenarios } from './components/SavedScenarios';
import { SettingsPanel } from './components/SettingsPanel';

export default function App() {
  const { database, loading: dbLoading, error: dbError, saveDatabase } = useCapabilityDatabase();
  const { savedScenarios, saveScenario, deleteScenario } = useSavedScenarios();

  const [activeTab, setActiveTab] = useState<'console' | 'database' | 'history' | 'settings'>('console');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BehaviorGrammarResult | null>(null);
  const [lastInputText, setLastInputText] = useState("");

  const [settings, setSettings] = useState<MatchSettings>({
    selectionMode: 'balanced',
    outputLanguage: 'ko',
    codeValidation: {
      removeNonExistent: true,
      removeDuplicates: true,
      preventMutation: true,
      preventFuzzyDuplicates: false
    }
  });

  const handleAnalyze = async (text: string) => {
    setLoading(true);
    setResult(null);
    setLastInputText(text);

    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { rawText: text },
          settings,
          database
        })
      });

      if (!res.ok) {
        throw new Error("서버와의 통신에 실패했습니다.");
      }

      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }

      setResult(data as BehaviorGrammarResult);
    } catch (err) {
      alert(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPNG = async () => {
    const el = document.getElementById('grammar-result-area');
    if (!el) return;
    try {
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#f9fafb', logging: false });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `Puko_Grammar_${Date.now()}.png`;
      a.click();
    } catch (err) {
      alert("PNG 내보내기 실패");
    }
  };

  const handleSaveToHistory = () => {
    if (result && lastInputText) {
      saveScenario({ scenario: lastInputText }, result);
    }
  };

  if (dbLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <i className="fa-solid fa-circle-notch fa-spin text-4xl text-blue-500 mb-4"></i>
          <p className="text-gray-500 font-medium">데이터베이스를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
          <i className="fa-solid fa-triangle-exclamation text-4xl text-red-500 mb-4"></i>
          <p className="text-red-600 font-bold mb-2">오류가 발생했습니다.</p>
          <p className="text-gray-500">{dbError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl shadow-inner flex items-center justify-center text-white text-xl">
              <i className="fa-solid fa-robot"></i>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight text-gray-900 tracking-tight">PUCO</h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Behavior Grammar</p>
            </div>
          </div>
          
          <nav className="flex space-x-1 overflow-x-auto hide-scrollbar pl-4">
            <button 
              onClick={() => setActiveTab('console')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'console' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>콘솔
            </button>
            <button 
              onClick={() => setActiveTab('database')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'database' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <i className="fa-solid fa-database mr-2"></i>데이터베이스
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'history' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <i className="fa-solid fa-clock-rotate-left mr-2"></i>히스토리
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <i className="fa-solid fa-gear mr-2"></i>설정
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === 'console' && (
          <div className="space-y-6">
            <ScenarioInput onAnalyze={handleAnalyze} loading={loading} />

            {result && (
              <div className="mt-8 relative" id="grammar-result-area">
                <div className="absolute -top-4 right-0 flex gap-2 z-10 print-hide" data-html2canvas-ignore>
                  <button 
                    onClick={handleSaveToHistory}
                    className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-green-600 hover:bg-green-50 hover:border-green-200 flex items-center justify-center shadow-sm transition-all"
                    title="히스토리에 저장"
                  >
                    <i className="fa-solid fa-bookmark"></i>
                  </button>
                  <button 
                    onClick={handleExportPNG}
                    className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 flex items-center justify-center shadow-sm transition-all"
                    title="PNG 이미지로 내보내기"
                  >
                    <i className="fa-solid fa-camera"></i>
                  </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 pt-10">
                  <div className="text-center mb-8 border-b pb-6 border-gray-100">
                    <p className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-2">Generated Grammar</p>
                    <h2 className="text-2xl font-bold text-gray-800">"{result.summary}"</h2>
                  </div>

                  <InterpretationPanel interpretation={result.interpretation} />

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <CapabilityCard 
                      title="Sensing (SN)" 
                      type="SN" 
                      items={database!.SN.filter(i => result.capabilities.SN.includes(i.code))}
                      sequence={result.sequence}
                    />
                    <CapabilityCard 
                      title="Motion (MP)" 
                      type="MP" 
                      items={database!.MP.filter(i => result.capabilities.MP.includes(i.code))}
                      sequence={result.sequence}
                    />
                    <CapabilityCard 
                      title="Projection (PJ)" 
                      type="PJ" 
                      items={database!.PJ.filter(i => result.capabilities.PJ.includes(i.code))}
                      sequence={result.sequence}
                    />
                    <CapabilityCard 
                      title="Speaker (SP)" 
                      type="SP" 
                      items={database!.SP.filter(i => result.capabilities.SP.includes(i.code))}
                      sequence={result.sequence}
                    />
                  </div>

                  <BehaviorSequence sequence={result.sequence} database={database} />

                  {result.warnings && result.warnings.length > 0 && (
                    <div className="mt-6 bg-amber-50 rounded-xl p-4 border border-amber-200" data-html2canvas-ignore>
                      <h4 className="text-amber-800 font-bold mb-2 text-sm flex items-center">
                        <i className="fa-solid fa-triangle-exclamation mr-2"></i>
                        AI 주의 및 경고 메시지
                      </h4>
                      <ul className="list-disc list-inside text-amber-700 text-sm space-y-1">
                        {result.warnings.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'database' && (
          <DatabaseManager database={database} onSave={saveDatabase} />
        )}

        {activeTab === 'history' && (
          <SavedScenarios scenarios={savedScenarios} onDelete={deleteScenario} database={database} />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel settings={settings} onUpdate={setSettings} />
        )}
      </main>
    </div>
  );
}
