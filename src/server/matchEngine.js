import fs from 'fs';
import path from 'path';

// Helper to load system prompt
function getSystemPrompt() {
  const promptPath = path.resolve(process.cwd(), 'system_prompt.txt');
  try {
    return fs.readFileSync(promptPath, 'utf-8');
  } catch (err) {
    console.error("Failed to read system_prompt.txt:", err);
    return "";
  }
}

// Ensure capabilities exist and are enabled in the provided DB
function validateCode(code, dbCategory, preventMutation) {
  if (!code || typeof code !== 'string') return null;
  let cleanCode = code.trim();
  
  if (!preventMutation) {
    // Attempt auto-correct for SN-A01 -> SN-A-01 (Wait, we enforced SN-A01 now, so maybe correct SN-A-01 to SN-A01)
    if (cleanCode.match(/^SN-[A-Z]-\d{2}$/)) {
      cleanCode = cleanCode.replace(/-([A-Z])-/, '-$1');
    }
  }

  const found = dbCategory.find(i => i.code === cleanCode);
  if (!found || found.enabled === false) return null;
  return cleanCode;
}

function processSequence(sequence, validCapabilities) {
  if (!Array.isArray(sequence)) return [];
  
  const validSeq = [];
  let orderCounter = 1;
  const allowedRoles = ["trigger", "perception", "acknowledgement", "expression", "action", "feedback", "recovery"];

  for (const step of sequence) {
    const code = step.code;
    const cat = code.substring(0, 2);
    let isValid = false;

    if (cat === 'SN' && validCapabilities.SN.includes(code)) isValid = true;
    if (cat === 'MP' && validCapabilities.MP.includes(code)) isValid = true;
    if (cat === 'PJ' && validCapabilities.PJ.includes(code)) isValid = true;
    if (cat === 'SP' && validCapabilities.SP.includes(code)) isValid = true;

    if (isValid) {
      validSeq.push({
        order: orderCounter++,
        code: code,
        role: allowedRoles.includes(step.role) ? step.role : "action",
        timing: step.timing || "",
        duration: typeof step.duration === 'number' ? step.duration : null,
        reason: step.reason || ""
      });
    }
  }
  return validSeq;
}

export async function executeMatch(input, settings, database, apiKey) {
  const isPlaceholder = !apiKey || apiKey.trim() === '' || apiKey.startsWith('sk-ant-api03-placeholder');

  const { rawText, scenario, stage, interaction } = input;
  const combinedInput = `Scenario: ${scenario || ''}\nStage: ${stage || ''}\nInteraction: ${interaction || ''}\nRaw text: ${rawText || ''}`;

  if (isPlaceholder) {
    return executeLocalMatch(combinedInput, database);
  }

  // Build the DB context string from the currently ACTIVE capabilities only
  const buildList = (catArray) => catArray.filter(i => i.enabled !== false).map(i => `${i.code}|${i.category || ''}|${i.name}`).join('\n');
  
  let sysPrompt = getSystemPrompt()
    .replace('[SN_CONDENSED_DATA]', buildList(database.SN))
    .replace('[MP_CONDENSED_DATA]', buildList(database.MP))
    .replace('[PJ_CONDENSED_DATA]', buildList(database.PJ))
    .replace('[SP_CONDENSED_DATA]', buildList(database.SP));

  const selectionMode = settings.selectionMode || 'essential';
  if (selectionMode === 'essential') {
    sysPrompt += "\n\nCRITICAL SELECTION MODE RULE: Focus on 'Essential Only' (2-4 capabilities total).";
  } else if (selectionMode === 'detailed') {
    sysPrompt += "\n\nCRITICAL SELECTION MODE RULE: Focus on 'Detailed' mapping (5-10 capabilities total including feedback and recovery).";
  } else {
    sysPrompt += "\n\nCRITICAL SELECTION MODE RULE: Focus on 'Balanced' mapping (3-7 capabilities total).";
  }

  if (settings.outputLanguage === 'en') {
    sysPrompt += "\n\nCRITICAL LANGUAGE RULE: Write interpretation values, timing, reason, summary, and warnings strictly in English.";
  } else {
    sysPrompt += "\n\nCRITICAL LANGUAGE RULE: Write interpretation values, timing, reason, summary, and warnings strictly in Korean.";
  }

  if (settings.codeValidation?.preventFuzzyDuplicates) {
    sysPrompt += "\n\nCRITICAL SIMILARITY RULE: Prevent duplicate selection of similar functions. Do not select multiple codes that perform almost the exact same action.";
  }

  let messages = [{ role: 'user', content: `Analyze the following scenario and generate a Behavior Grammar JSON:\n${combinedInput}` }];
  let retries = 0;
  let success = false;
  let resultJSON = null;

  while (retries < 3 && !success) {
    try {
      const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          system_instruction: {
            parts: { text: sysPrompt }
          },
          contents: [{
            parts: [{ text: `Analyze the following scenario and generate a Behavior Grammar JSON:\n${combinedInput}` }]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!apiResponse.ok) {
        throw new Error(`Gemini API status ${apiResponse.status}`);
      }

      const data = await apiResponse.json();
      const replyText = data.candidates[0].content.parts[0].text.trim();

      try {
        const cleanedText = replyText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
        const parsed = JSON.parse(cleanedText);
        
        if (parsed.interpretation && parsed.capabilities && parsed.sequence) {
          resultJSON = parsed;
          success = true;
        } else {
          throw new Error("Missing required Behavior Grammar fields");
        }
      } catch (jsonErr) {
        retries++;
      }
    } catch (err) {
      console.error("Match Engine AI error:", err);
      return executeLocalMatch(combinedInput, database, err instanceof Error ? err.message : String(err));
    }
  }

  if (!success) {
    return executeLocalMatch(combinedInput, database, "AI 응답 파싱 실패 (3회 재시도 초과)");
  }

  return validateAndRecover(resultJSON, database, settings);
}

function validateAndRecover(json, db, settings) {
  const preventMutation = settings.codeValidation?.preventMutation !== false;

  const validCaps = { SN: [], MP: [], PJ: [], SP: [] };
  
  // Validate capabilities
  ['SN', 'MP', 'PJ', 'SP'].forEach(cat => {
    if (Array.isArray(json.capabilities[cat])) {
      json.capabilities[cat].forEach(code => {
        const valid = validateCode(code, db[cat], preventMutation);
        if (valid && !validCaps[cat].includes(valid)) {
          validCaps[cat].push(valid);
        }
      });
    }
  });

  // Validate sequence and sync with capabilities
  const validSequence = processSequence(json.sequence, validCaps);
  
  // Re-sync capabilities based on what survived in sequence (if it's in sequence, keep it. Wait, some might just be listed in caps but no sequence? We should force them to match)
  const finalCaps = { SN: [], MP: [], PJ: [], SP: [] };
  validSequence.forEach(step => {
    const cat = step.code.substring(0, 2);
    if (!finalCaps[cat].includes(step.code)) {
      finalCaps[cat].push(step.code);
    }
  });

  return {
    interpretation: {
      scenario: json.interpretation?.scenario || "",
      stage: json.interpretation?.stage || "",
      trigger: json.interpretation?.trigger || "",
      userAction: json.interpretation?.userAction || "",
      pucoIntent: json.interpretation?.pucoIntent || ""
    },
    capabilities: finalCaps,
    sequence: validSequence,
    summary: json.summary || "Summary generation failed.",
    warnings: Array.isArray(json.warnings) ? json.warnings : []
  };
}

// Simple fallback matcher returning the new schema
function executeLocalMatch(text, db, errorReason = "") {
  const lowerText = text.toLowerCase();
  
  let summaryText = "로컬 룰 기반 매칭 결과입니다. (API 키 미설정 또는 오류)";
  let errorWarning = "AI 매칭에 실패하여 로컬 룰 엔진으로 임시 분석되었습니다.";

  if (errorReason.includes("429")) {
    summaryText = "API 요청 한도 초과 (429 Too Many Requests)로 인한 로컬 룰 매칭입니다.";
    errorWarning = "Gemini API 무료 등급의 분당 요청 제한(15회)을 초과했습니다. 약 1분 후 다시 시도해 주세요.";
  } else if (errorReason) {
    summaryText = `AI 매칭 실패: ${errorReason}`;
    errorWarning = `AI 호출 도중 오류가 발생했습니다: ${errorReason}`;
  }

  const result = {
    interpretation: {
      scenario: "로컬 기본 상황",
      stage: "로컬 기본 단계",
      trigger: "로컬 트리거",
      userAction: "로컬 행동",
      pucoIntent: "로컬 의도"
    },
    capabilities: { SN: [], MP: [], PJ: [], SP: [] },
    sequence: [],
    summary: summaryText,
    warnings: [errorWarning]
  };

  let order = 1;
  const addStep = (cat, code, role, timing, reason) => {
    const found = db[cat].find(i => i.code === code);
    if (found && found.enabled !== false) {
      if (!result.capabilities[cat].includes(code)) {
        result.capabilities[cat].push(code);
      }
      result.sequence.push({
        order: order++,
        code,
        role,
        timing,
        duration: role === 'trigger' ? null : 1000,
        reason
      });
    }
  };

  if (lowerText.includes('위험') || lowerText.includes('접근')) {
    addStep('SN', 'SN-A01', 'trigger', '물체가 다가올 때', '근접 거리 감지');
    addStep('MP', 'MP-B03', 'action', '감지 직후', '뒤로 물러나며 경고');
    addStep('SP', 'SP-A03', 'feedback', '동시에', '경고음 발생');
  } else if (lowerText.includes('안녕') || lowerText.includes('반갑')) {
    addStep('SN', 'SN-B01', 'trigger', '사용자 발견 시', '얼굴 인식');
    addStep('MP', 'MP-B05', 'action', '인식 후', '반갑게 흔들기');
    addStep('SP', 'SP-E01', 'expression', '동시에', '활기찬 목소리');
  } else {
    // Default generic fallback if nothing matches
    addStep('SN', 'SN-C01', 'trigger', '기본', '자세 추정');
    addStep('MP', 'MP-A01', 'action', '기본', '기본 모션');
  }

  return result;
}
