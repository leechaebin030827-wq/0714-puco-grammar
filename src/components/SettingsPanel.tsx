import { MatchSettings } from '../types/behavior';

interface SettingsPanelProps {
  settings: MatchSettings;
  onUpdate: (newSettings: MatchSettings) => void;
}

const SELECTION_MODES = [
  { id: 'essential', label: 'Essential',  sub: '최소', desc: '가장 핵심적인 트리거와 반응 능력만 2~4개 선택합니다.' },
  { id: 'balanced',  label: 'Balanced',   sub: '균형', desc: '인식, 인지, 표출의 적절한 균형을 맞춰 3~7개를 선택합니다.' },
  { id: 'detailed',  label: 'Detailed',   sub: '상세', desc: '피드백, 에러 복구 등을 포함해 풍부하게 5~10개를 선택합니다.' },
] as const;

const VALIDATION_OPTIONS = [
  {
    key: 'removeNonExistent' as const,
    label: 'Remove Non-Existent',
    sub: '비존재 코드 제거',
    desc: 'AI가 환각으로 만들어낸 가짜 코드를 서버에서 잘라냅니다.',
  },
  {
    key: 'removeDuplicates' as const,
    label: 'Remove Duplicates',
    sub: '중복 코드 제거',
    desc: '동일한 코드가 여러 번 등장하면 하나만 남기고 제거합니다.',
  },
  {
    key: 'preventMutation' as const,
    label: 'Prevent Code Mutation',
    sub: '코드 변형 방지',
    desc: 'SN-A01을 SN-A-01로 잘못 적는 변형된 코드를 허용하지 않습니다.',
  },
  {
    key: 'preventFuzzyDuplicates' as const,
    label: 'Prevent Fuzzy Duplicates',
    sub: '유사 기능 중복 방지',
    desc: '매우 비슷한 기능(예: MP-D01과 MP-D02)을 동시에 추천하지 않습니다.',
  },
] as const;

export function SettingsPanel({ settings, onUpdate }: SettingsPanelProps) {
  const handleChange = (key: keyof MatchSettings, value: any) => {
    onUpdate({ ...settings, [key]: value });
  };

  const handleValidationChange = (key: keyof MatchSettings['codeValidation'], value: boolean) => {
    onUpdate({
      ...settings,
      codeValidation: { ...settings.codeValidation, [key]: value },
    });
  };

  const activeMode = SELECTION_MODES.find(m => m.id === settings.selectionMode);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <i className="fa-solid fa-gear text-xs text-gray-400"></i>
        <span className="text-xs font-bold text-gray-500">Engine Settings</span>
      </div>

      <div className="divide-y divide-gray-50">

        {/* Selection Mode */}
        <div className="px-5 py-5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            Behavior Grammar 선택 강도
          </p>
          <div className="flex gap-2 mb-2">
            {SELECTION_MODES.map(mode => (
              <button
                key={mode.id}
                onClick={() => handleChange('selectionMode', mode.id)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  settings.selectionMode === mode.id
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : 'bg-gray-50 text-gray-400 border-gray-100 hover:text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div>{mode.label}</div>
                <div className={`text-[10px] font-medium mt-0.5 ${settings.selectionMode === mode.id ? 'text-blue-400' : 'text-gray-300'}`}>
                  {mode.sub}
                </div>
              </button>
            ))}
          </div>
          {activeMode && (
            <p className="text-[11px] text-gray-400 leading-relaxed">{activeMode.desc}</p>
          )}
        </div>

        {/* Output Language */}
        <div className="px-5 py-5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            출력 언어
          </p>
          <div className="flex gap-2">
            {[
              { id: 'ko', label: '한국어', flag: '🇰🇷' },
              { id: 'en', label: 'English', flag: '🇺🇸' },
            ].map(lang => (
              <button
                key={lang.id}
                onClick={() => handleChange('outputLanguage', lang.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  settings.outputLanguage === lang.id
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : 'bg-gray-50 text-gray-400 border-gray-100 hover:text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{lang.flag}</span>
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Validation Rules */}
        <div className="px-5 py-5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            엔진 검증 및 안전성 규칙
          </p>
          <div className="space-y-2">
            {VALIDATION_OPTIONS.map(opt => {
              const enabled = settings.codeValidation[opt.key];
              return (
                <label
                  key={opt.key}
                  className={`flex items-center justify-between gap-4 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                    enabled
                      ? 'bg-blue-50/60 border-blue-100'
                      : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-gray-700">{opt.label}</span>
                      <span className="text-[10px] font-medium text-gray-400">{opt.sub}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">{opt.desc}</p>
                  </div>
                  {/* Custom Toggle */}
                  <div
                    className={`shrink-0 w-9 h-5 rounded-full relative transition-colors ${enabled ? 'bg-blue-500' : 'bg-gray-200'}`}
                    onClick={() => handleValidationChange(opt.key, !enabled)}
                  >
                    <span className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${enabled ? 'translate-x-4' : ''}`}></span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
