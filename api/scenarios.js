// api/scenarios.js - Vercel Serverless Function
// 외부 API 없이 모듈 레벨 메모리 캐시 사용
// Vercel 서버리스 warm instance에서 메모리 유지

const MAX_SCENARIOS = 500;

// 모듈 레벨 변수 (서버리스 warm instance에서 유지됨)
let scenariosCache = [];

export default async function handler(req, res) {
  // CORS 허용
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json(scenariosCache);
  }

  if (req.method === 'POST') {
    const { action, scenario, id } = req.body || {};

    if (action === 'save' && scenario) {
      const exists = scenariosCache.some(
        s => s.id === scenario.id ||
        (s.scenarioText && scenario.scenarioText &&
         s.scenarioText.trim() === scenario.scenarioText.trim() &&
         JSON.stringify(s.result?.summary) === JSON.stringify(scenario.result?.summary))
      );
      if (!exists) {
        scenariosCache = [scenario, ...scenariosCache].slice(0, MAX_SCENARIOS);
      }
    } else if (action === 'delete' && id) {
      scenariosCache = scenariosCache.filter(s => s.id !== id);
    }

    return res.status(200).json(scenariosCache);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

