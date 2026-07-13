import fs from 'fs';
import path from 'path';

// Module-level warm cache to store list across serverless function invocations
let warmCacheScenarios = null;

export default async function handler(req, res) {
  const dbPath = path.join(process.cwd(), 'scenarios.json');

  const getScenarios = async () => {
    try {
      const response = await fetch('https://extendsclass.com/api/json-storage/bin/eccbeea');
      if (response.ok) {
        const list = await response.json();
        if (Array.isArray(list)) {
          warmCacheScenarios = list;
          return list;
        }
      }
    } catch (e) {
      console.warn("Cloud read failed in serverless, checking cache/local:", e.message);
    }

    if (warmCacheScenarios && warmCacheScenarios.length > 0) {
      return warmCacheScenarios;
    }

    // Fallback to local scenarios.json
    try {
      if (fs.existsSync(dbPath)) {
        const data = fs.readFileSync(dbPath, 'utf-8');
        const diskList = JSON.parse(data || '[]');
        if (diskList && diskList.length > 0) {
          warmCacheScenarios = diskList;
          return diskList;
        }
      }
    } catch (e) {}

    return null; // Return null to signal temporary API error
  };

  const saveScenarios = async (list) => {
    warmCacheScenarios = list;
    try {
      await fetch('https://extendsclass.com/api/json-storage/bin/eccbeea', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Security-key': 'yoon-puko-1234'
        },
        body: JSON.stringify(list)
      });
    } catch (e) {
      console.warn("Cloud write failed in serverless:", e.message);
    }
    // Best-effort local file write
    try {
      fs.writeFileSync(dbPath, JSON.stringify(list, null, 2), 'utf-8');
    } catch (e) {}
  };

  if (req.method === 'GET') {
    const list = await getScenarios();
    if (list === null) {
      return res.status(503).json({ error: "공유 데이터베이스 일시적 연결 장애" });
    }
    return res.status(200).json(list);
  }

  if (req.method === 'POST') {
    const { action, scenario, id, list } = req.body;
    let current = await getScenarios();

    // If fetch failed completely and returned null, fallback to current local state if client sent list
    if (current === null) {
      if (action === 'set' && Array.isArray(list)) {
        current = list;
      } else if (warmCacheScenarios) {
        current = warmCacheScenarios;
      } else {
        current = [];
      }
    }

    if (action === 'save' && scenario) {
      const exists = current.some(s => s.scenarioText.trim() === scenario.scenarioText.trim() && JSON.stringify(s.result.summary) === JSON.stringify(scenario.result.summary));
      if (!exists) {
        current = [scenario, ...current];
      }
    } else if (action === 'delete' && id) {
      current = current.filter(s => s.id !== id);
    } else if (action === 'set' && Array.isArray(list)) {
      current = list;
    }

    await saveScenarios(current);
    return res.status(200).json(current);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
