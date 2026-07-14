import fs from 'fs';
import path from 'path';
import { executeMatch } from '../src/server/matchEngine.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { input = {}, settings = {}, database = null } = req.body;
  const { rawText, scenario } = input;

  // Backwards compatibility for old requests that just sent `{ scenario: "..." }`
  const textToAnalyze = rawText || scenario || req.body.scenario;

  if (!textToAnalyze || typeof textToAnalyze !== 'string' || !textToAnalyze.trim()) {
    return res.status(400).json({ error: "상황 문장을 입력해주세요." });
  }

  // Ensure input object has at least rawText
  const normalizedInput = {
    ...input,
    rawText: textToAnalyze
  };

  // Resolve Database
  let dbToUse = database;
  if (!dbToUse || !dbToUse.SN) {
    // Fallback to static db if not provided by client
    const dbPath = path.join(process.cwd(), 'puco_capability_db.json');
    try {
      dbToUse = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    } catch (err) {
      console.error("Failed to read fallback DB:", err);
      return res.status(500).json({ error: "서버 설정 파일(DB)을 읽어오지 못했습니다." });
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;

  try {
    const result = await executeMatch(normalizedInput, settings, dbToUse, apiKey);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Match Execution Error:", err);
    return res.status(500).json({ error: "매칭 중 서버 오류가 발생했습니다." });
  }
}
