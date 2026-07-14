export async function analyzeInput(text, apiKey) {
  if (!text || text.trim().length < 15) {
    return createEmptyResponse();
  }

  const isPlaceholder = !apiKey || apiKey.trim() === '' || apiKey.startsWith('sk-ant-api03-placeholder');
  
  if (isPlaceholder) {
    return analyzeLocal(text);
  }

  const systemPrompt = `You are a natural language analyzer for a social robot named PUCO.
Your task is to analyze the user's input sentence and extract 3 key elements:
1. scenario (상황): The overall context or situation.
2. stage (현재 단계): The current specific phase or state within the scenario.
3. interaction (상호작용): The physical interaction, trigger, or explicit action between the user and PUCO.

Rules:
- Even if the words "상황", "단계", or "상호작용" are not explicitly in the text, try to infer them from the context.
- If an element is completely missing or impossible to infer, set "detected" to false and "text" to empty.
- "confidence" should be a float between 0.0 and 1.0.
- "missing" should be an array of the keys ("scenario", "stage", "interaction") that have detected = false.
- "ready" should be true ONLY if all 3 elements are detected (missing array is empty).

Output strictly a single JSON object matching this schema:
{
  "scenario": { "detected": boolean, "text": "...", "confidence": number },
  "stage": { "detected": boolean, "text": "...", "confidence": number },
  "interaction": { "detected": boolean, "text": "...", "confidence": number },
  "missing": ["scenario", "stage", "interaction"],
  "ready": boolean
}`;

  try {
    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        system_instruction: {
          parts: { text: systemPrompt }
        },
        contents: [{
          parts: [{ text: `Analyze this text in Korean: "${text.trim()}"` }]
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
    const cleanedText = replyText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    
    return JSON.parse(cleanedText);
  } catch (err) {
    console.error("AI Analysis failed, falling back to local:", err);
    return analyzeLocal(text);
  }
}

function createEmptyResponse() {
  return {
    scenario: { detected: false, text: "", confidence: 0 },
    stage: { detected: false, text: "", confidence: 0 },
    interaction: { detected: false, text: "", confidence: 0 },
    missing: ["scenario", "stage", "interaction"],
    ready: false
  };
}

// Basic heuristic fallback for when AI fails or no API key is provided
function analyzeLocal(text) {
  const result = createEmptyResponse();
  const missing = [];
  
  // Very rough heuristics
  if (text.includes('상황') || text.includes('때') || text.includes('중') || text.length > 20) {
    result.scenario.detected = true;
    result.scenario.text = "입력된 상황 추정";
    result.scenario.confidence = 0.6;
  } else {
    missing.push('scenario');
  }

  if (text.includes('단계') || text.includes('기다') || text.includes('상태') || text.includes('준비')) {
    result.stage.detected = true;
    result.stage.text = "현재 단계 추정";
    result.stage.confidence = 0.6;
  } else {
    missing.push('stage');
  }

  if (text.includes('상호작용') || text.includes('바라') || text.includes('말') || text.includes('흔들') || text.includes('다가') || text.includes('터치') || text.includes('요청')) {
    result.interaction.detected = true;
    result.interaction.text = "사용자 상호작용 추정";
    result.interaction.confidence = 0.6;
  } else {
    missing.push('interaction');
  }

  result.missing = missing;
  result.ready = missing.length === 0;

  return result;
}
