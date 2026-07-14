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
    text: "사용자와 PUCO가 같은 공간에 있으며, PUCO가 대기 중인 단계에서 사용자가 PUCO를 바라보면 PUCO가 반가움을 표현한다.", 
    label: "얼굴 인식 & 인사 반응" 
  },
  { 
    text: "사용자가 PUCO를 통해 문서를 보는 상황이고, 문서를 다 읽은 단계에서 사용자가 손을 좌우로 움직이면 PUCO가 다음 화면으로 전환한다.", 
    label: "제스처 & 화면 전환" 
  },
  { 
    text: "사용자가 이동 중인 상황이며, PUCO가 경로를 주시하는 단계에서 사용자가 갑자기 가까이 접근하면 PUCO가 위험을 알린다.", 
    label: "거리 감지 & 안전 확보" 
  },
  { 
    text: "사용자가 궁금증이 생긴 상황이고, 조용히 책상에 앉아 있는 단계에서 사용자가 PUCO에게 말을 걸면 PUCO가 차분하게 반응한다.", 
    label: "음성 인식 & 발화 반응" 
  }
];
