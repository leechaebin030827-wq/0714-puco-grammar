import { MatchSettings } from '../types/behavior';

interface SettingsPanelProps {
  settings: MatchSettings;
  onUpdate: (newSettings: MatchSettings) => void;
}

export function SettingsPanel({ settings, onUpdate }: SettingsPanelProps) {
  const handleChange = (key: keyof MatchSettings, value: any) => {
    onUpdate({ ...settings, [key]: value });
  };

  const handleValidationChange = (key: keyof MatchSettings['codeValidation'], value: boolean) => {
    onUpdate({
      ...settings,
      codeValidation: {
        ...settings.codeValidation,
        [key]: value
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
        <i className="fa-solid fa-sliders text-blue-500 mr-3"></i>
        매칭 엔진 설정
      </h2>

      <div className="space-y-6">
        <div>
          <h3 className="font-bold text-gray-700 mb-3 text-sm">Behavior Grammar 선택 강도</h3>
          <div className="flex bg-gray-50 rounded-xl p-1 border border-gray-200">
            {['essential', 'balanced', 'detailed'].map((mode) => (
              <button
                key={mode}
                onClick={() => handleChange('selectionMode', mode)}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  settings.selectionMode === mode 
                    ? 'bg-white text-blue-600 shadow-sm border border-gray-100' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {mode === 'essential' ? 'Essential (최소)' : mode === 'balanced' ? 'Balanced (균형)' : 'Detailed (상세)'}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {settings.selectionMode === 'essential' && '가장 핵심적인 트리거와 반응 능력만 2~4개 선택합니다.'}
            {settings.selectionMode === 'balanced' && '인식, 인지, 표출의 적절한 균형을 맞춰 3~7개를 선택합니다.'}
            {settings.selectionMode === 'detailed' && '피드백, 에러 복구 등을 포함해 풍부하게 5~10개를 선택합니다.'}
          </p>
        </div>

        <div>
          <h3 className="font-bold text-gray-700 mb-3 text-sm">출력 언어</h3>
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="radio" 
                name="lang" 
                checked={settings.outputLanguage === 'ko'}
                onChange={() => handleChange('outputLanguage', 'ko')}
                className="text-blue-500 focus:ring-blue-500 h-4 w-4"
              />
              <span className="text-sm font-medium text-gray-700">한국어 (Korean)</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="radio" 
                name="lang" 
                checked={settings.outputLanguage === 'en'}
                onChange={() => handleChange('outputLanguage', 'en')}
                className="text-blue-500 focus:ring-blue-500 h-4 w-4"
              />
              <span className="text-sm font-medium text-gray-700">영어 (English)</span>
            </label>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h3 className="font-bold text-gray-700 mb-4 text-sm">엔진 검증 및 안전성 규칙</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
              <div>
                <div className="font-bold text-gray-800 text-sm mb-1">유사 기능 중복 방지 (Prevent Fuzzy Duplicates)</div>
                <div className="text-xs text-gray-500">매우 비슷한 기능(예: MP-D01과 MP-D02)을 동시에 추천하지 않습니다.</div>
              </div>
              <input 
                type="checkbox" 
                checked={settings.codeValidation.preventFuzzyDuplicates}
                onChange={e => handleValidationChange('preventFuzzyDuplicates', e.target.checked)}
                className="rounded text-blue-500 focus:ring-blue-500 h-5 w-5"
              />
            </label>
            
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
              <div>
                <div className="font-bold text-gray-800 text-sm mb-1">비존재 코드 제거 (Remove Non-Existent)</div>
                <div className="text-xs text-gray-500">AI가 환각으로 만들어낸 가짜 코드를 서버에서 잘라냅니다.</div>
              </div>
              <input 
                type="checkbox" 
                checked={settings.codeValidation.removeNonExistent}
                onChange={e => handleValidationChange('removeNonExistent', e.target.checked)}
                className="rounded text-blue-500 focus:ring-blue-500 h-5 w-5"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
              <div>
                <div className="font-bold text-gray-800 text-sm mb-1">코드 변형 방지 (Prevent Code Mutation)</div>
                <div className="text-xs text-gray-500">SN-A01을 SN-A-01로 잘못 적는 것을 허용하지 않고 강제로 누락시킵니다.</div>
              </div>
              <input 
                type="checkbox" 
                checked={settings.codeValidation.preventMutation}
                onChange={e => handleValidationChange('preventMutation', e.target.checked)}
                className="rounded text-blue-500 focus:ring-blue-500 h-5 w-5"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
