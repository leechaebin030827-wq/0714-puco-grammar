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
        body: JSON.stringify({ input: { rawText: text }, settings, database })
      });
      if (!res.ok) throw new Error("서버와의 통신에 실패했습니다.");
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      setResult(data as BehaviorGrammarResult);
    } catch (err) {
      alert(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPNG = async () => {
    const el = document.getElementById('app-container') || document.body;
    if (!el) return;
    try {
      // Wait for all fonts (like Google Fonts, Font Awesome) to load completely before capturing
      if (document.fonts) {
        await document.fonts.ready;
      }
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: '#f5f5f7',
        logging: false,
        useCORS: true,
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.scrollHeight,
        onclone: (clonedDoc) => {
          // Adjust vertical alignments of texts/badges inside the canvas
          const elements = clonedDoc.querySelectorAll('.capture-adjust-up');
          elements.forEach((element: any) => {
            element.style.position = 'relative';
            element.style.top = '-1.5px';
          });
        }
      });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `PUCO_Page_${Date.now()}.png`;
      a.click();
    } catch (e) {
      console.error(e);
      alert("PNG 내보내기 실패");
    }
  };

  const handleSaveToHistory = () => {
    if (result && lastInputText) saveScenario({ scenario: lastInputText }, result);
  };

  if (dbLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
      <div className="flex flex-col items-center gap-3">
        <i className="fa-solid fa-circle-notch fa-spin text-3xl text-blue-500"></i>
        <p className="text-sm text-gray-400 font-medium">데이터베이스 로딩 중…</p>
      </div>
    </div>
  );

  if (dbError) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
      <div className="bg-white p-6 rounded-2xl shadow-sm text-center max-w-sm">
        <i className="fa-solid fa-triangle-exclamation text-3xl text-red-400 mb-3"></i>
        <p className="text-red-500 font-bold text-sm mb-1">오류</p>
        <p className="text-gray-400 text-xs">{dbError}</p>
      </div>
    </div>
  );

  const tabs = [
    { id: 'console', icon: 'fa-wand-magic-sparkles', label: '검색' },
    { id: 'database', icon: 'fa-database', label: '데이터베이스' },
    { id: 'history', icon: 'fa-clock-rotate-left', label: '저장 목록' },
    { id: 'settings', icon: 'fa-gear', label: '설정' },
  ] as const;

  return (
    <div id="app-container" className="min-h-screen bg-[#f5f5f7] font-sans">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="PUCO Logo" className="w-8 h-8 object-contain" />
            <div>
              <span className="font-bold text-sm text-gray-900 tracking-tight">PUCO</span>
              <span className="text-gray-300 mx-1.5">·</span>
              <span className="text-xs text-gray-400 font-medium">Behavior Grammar</span>
            </div>
          </div>
          <nav className="flex items-center gap-0.5" data-html2canvas-ignore>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                <i className={`fa-solid ${tab.icon} mr-1.5`}></i>{tab.label}
              </button>
            ))}
            <div className="w-px h-4 bg-gray-200 mx-2"></div>
            <button
              onClick={handleExportPNG}
              title="전체 페이지 캡쳐"
              className="w-8 h-8 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center text-xs transition-all"
            >
              <i className="fa-solid fa-camera"></i>
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-6 space-y-3">
        {activeTab === 'console' && (
          <>
            <ScenarioInput onAnalyze={handleAnalyze} loading={loading} />

            {result && (
              <div id="grammar-result-area" className="space-y-3">
                {/* Summary bar */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Generated Grammar</p>
                    <p className="text-sm font-bold text-gray-800 leading-snug">"{result.summary}"</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0" data-html2canvas-ignore>
                    <button onClick={handleSaveToHistory} title="저장"
                      className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-200 text-gray-400 hover:text-green-600 hover:bg-green-50 hover:border-green-200 flex items-center justify-center text-xs transition-all">
                      <i className="fa-solid fa-bookmark"></i>
                    </button>
                  </div>
                </div>

                {/* Interpretation — collapsible toggle */}
                <InterpretationPanel interpretation={result.interpretation} defaultOpen={false} />

                {/* Capability cards — 2-col grid, empty hidden */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(['SN','MP','PJ','SP'] as const).map(type => {
                    const titles = { SN: 'Sensing', MP: 'Motion', PJ: 'Projection', SP: 'Speaker' };
                    const items = database![type].filter(i => result.capabilities[type].includes(i.code));
                    return (
                      <CapabilityCard
                        key={type}
                        title={titles[type]}
                        type={type}
                        items={items}
                        sequence={result.sequence}
                      />
                    );
                  })}
                </div>

                {/* Behavior Sequence */}
                <BehaviorSequence sequence={result.sequence} database={database} />

                {/* Warnings */}
                {result.warnings && result.warnings.length > 0 && (
                  <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-100" data-html2canvas-ignore>
                    <p className="text-xs font-bold text-amber-600 mb-2 flex items-center gap-1.5">
                      <i className="fa-solid fa-triangle-exclamation"></i>AI 주의 메시지
                    </p>
                    <ul className="space-y-1">
                      {result.warnings.map((w, i) => (
                        <li key={i} className="text-xs text-amber-700">• {w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'database' && <DatabaseManager database={database} onSave={saveDatabase} />}
        {activeTab === 'history' && <SavedScenarios scenarios={savedScenarios} onDelete={deleteScenario} database={database} />}
        {activeTab === 'settings' && <SettingsPanel settings={settings} onUpdate={setSettings} />}
      </main>
    </div>
  );
}
