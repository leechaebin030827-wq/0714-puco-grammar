import { useState, useEffect } from 'react';
import { BehaviorGrammarResult } from '../types/behavior';

export interface SavedScenario {
  id: string;
  createdAt: string;
  input: {
    scenario: string;
    stage?: string;
    interaction?: string;
    context?: string;
  };
  result: BehaviorGrammarResult;
}

export function useSavedScenarios() {
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);

  useEffect(() => {
    const savedLocal = localStorage.getItem('puko_saved_scenarios');
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        // Migration logic for older formats
        const migrated = parsed.map((s: any) => {
          if (!s.createdAt) s.createdAt = s.timestamp || new Date().toLocaleString();
          
          if (!s.input) {
            s.input = { scenario: s.scenarioText || "이전 버전에서 저장됨" };
          }

          if (!s.result.interpretation) {
            s.result = {
              interpretation: {
                scenario: s.input.scenario,
                stage: "불명확 (구 버전 데이터)",
                trigger: "불명확",
                userAction: "불명확",
                pucoIntent: "불명확"
              },
              capabilities: {
                SN: s.result.SN?.map((i: any) => i.code) || [],
                MP: s.result.MP?.map((i: any) => i.code) || [],
                PJ: s.result.PJ?.map((i: any) => i.code) || [],
                SP: s.result.SP?.map((i: any) => i.code) || []
              },
              sequence: [],
              summary: s.result.summary || "구 버전 데이터",
              warnings: ["이전 버전의 형식으로 저장된 데이터입니다. Sequence 정보를 표시할 수 없습니다."]
            };
          }
          return s as SavedScenario;
        });
        setSavedScenarios(migrated);
      } catch (e) {
        console.error("Failed to parse saved scenarios", e);
      }
    }
  }, []);

  const saveScenario = (input: SavedScenario['input'], result: BehaviorGrammarResult) => {
    const isDuplicate = savedScenarios.some(
      s => s.input.scenario === input.scenario && s.result.summary === result.summary
    );

    if (isDuplicate) {
      alert("이미 동일하게 저장된 시나리오가 존재합니다.");
      return;
    }

    const newSaved: SavedScenario = {
      id: Date.now().toString(),
      createdAt: new Date().toLocaleString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      input,
      result
    };

    setSavedScenarios(prev => {
      const updated = [newSaved, ...prev];
      localStorage.setItem('puko_saved_scenarios', JSON.stringify(updated));
      return updated;
    });
    alert("시나리오가 저장되었습니다!");
  };

  const deleteScenario = (id: string) => {
    if (!confirm("정말 이 시나리오를 삭제하시겠습니까?")) return;
    setSavedScenarios(prev => {
      const updated = prev.filter(s => s.id !== id);
      localStorage.setItem('puko_saved_scenarios', JSON.stringify(updated));
      return updated;
    });
  };

  return { savedScenarios, saveScenario, deleteScenario };
}

export const PRESET_SCENARIOS = [
  { 
    text: "사용자가 PUCO가 제공하는 가상 골프 환경에서 연습할 필드를 선택하고 있다. 실제 스윙을 시작하기 전 필드 옵션을 탐색하고 결정하는 단계이다. 사용자가 발을 좌우로 움직여 필드 옵션을 넘기고 원하는 필드를 선택하면, PUCO는 사용자의 발동작과 선택 상태를 인식하며 선택이 완료될 때까지 기다린다.", 
    label: "푸코와 함께 골프 · 필드 선택" 
  }
];
