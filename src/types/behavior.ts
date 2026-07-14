export type SequenceRole = 
  | "trigger" 
  | "perception" 
  | "acknowledgement" 
  | "expression" 
  | "action" 
  | "feedback" 
  | "recovery";

export interface Interpretation {
  scenario: string;
  stage: string;
  trigger: string;
  userAction: string;
  pucoIntent: string;
}

export interface BehaviorStep {
  order: number;
  code: string;
  role: SequenceRole;
  timing: string;
  duration: number | null;
  reason: string;
}

export interface BehaviorGrammarResult {
  interpretation: Interpretation;
  capabilities: {
    SN: string[];
    MP: string[];
    PJ: string[];
    SP: string[];
  };
  sequence: BehaviorStep[];
  summary: string;
  warnings: string[];
}

export interface InputRequirementAnalysis {
  scenario: { detected: boolean; text: string; confidence: number };
  stage: { detected: boolean; text: string; confidence: number };
  interaction: { detected: boolean; text: string; confidence: number };
  missing: Array<"scenario" | "stage" | "interaction">;
  ready: boolean;
}

export interface InputPayload {
  rawText: string;
  scenario?: string;
  stage?: string;
  interaction?: string;
  context?: string;
}

export interface MatchSettings {
  selectionMode: 'essential' | 'balanced' | 'detailed';
  outputLanguage: 'ko' | 'en';
  codeValidation: {
    removeNonExistent: boolean;
    removeDuplicates: boolean;
    preventMutation: boolean;
    preventFuzzyDuplicates: boolean;
  };
}
