import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const dbPath = path.join(process.cwd(), 'scenarios.json');

  const getScenarios = async () => {
    try {
      const response = await fetch('https://extendsclass.com/api/json-storage/bin/eccbeea');
      if (response.ok) {
        const list = await response.json();
        return list || [];
      }
    } catch (e) {
      console.warn("Cloud read failed in serverless, falling back to local file:", e.message);
    }
    // Fallback to local scenarios.json
    try {
      if (fs.existsSync(dbPath)) {
        const data = fs.readFileSync(dbPath, 'utf-8');
        return JSON.parse(data || '[]');
      }
    } catch (e) {}
    return [];
  };

  const saveScenarios = async (list) => {
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
    // Best-effort local file write (fails gracefully on Vercel read-only)
    try {
      fs.writeFileSync(dbPath, JSON.stringify(list, null, 2), 'utf-8');
    } catch (e) {}
  };

  if (req.method === 'GET') {
    const list = await getScenarios();
    return res.status(200).json(list);
  }

  if (req.method === 'POST') {
    const { action, scenario, id, list } = req.body;
    let current = await getScenarios();

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
