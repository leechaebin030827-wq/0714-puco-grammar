import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import dotenv from 'dotenv';
import { executeMatch } from './src/server/matchEngine.js';
import { analyzeInput } from './src/server/analyzeEngine.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5173;
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  const dbPath = path.resolve(__dirname, 'puco_capability_db.json');

  // API Route: /api/database
  app.get('/api/database', (req, res) => {
    try {
      const data = fs.readFileSync(dbPath, 'utf-8');
      res.status(200).json({ success: true, database: JSON.parse(data), persistence: 'file' });
    } catch (err) {
      console.error("GET Database error:", err);
      res.status(500).json({ error: `데이터베이스 읽기 실패: ${err.message}` });
    }
  });

  app.post('/api/database', (req, res) => {
    try {
      const newDb = req.body.database || req.body;
      if (!newDb.SN || !newDb.MP || !newDb.PJ || !newDb.SP) {
        return res.status(400).json({ error: "올바르지 않은 데이터셋 형식입니다." });
      }
      fs.writeFileSync(dbPath, JSON.stringify(newDb, null, 2), 'utf-8');
      res.status(200).json({ success: true, persisted: true, persistence: 'file' });
    } catch (err) {
      console.warn("POST Database write failed:", err.message);
      res.status(200).json({ 
        success: true, 
        persisted: false, 
        persistence: 'browser', 
        message: "로컬 파일 쓰기에 실패하여 브라우저에만 저장되었습니다." 
      });
    }
  });

  // API Route: /api/analyze-input
  app.post('/api/analyze-input', async (req, res) => {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: "입력 텍스트가 없습니다." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    try {
      const analysis = await analyzeInput(text, apiKey);
      res.status(200).json({ success: true, analysis });
    } catch (err) {
      console.error("Input Analysis Error:", err);
      res.status(200).json({ 
        success: false, 
        analysis: {
          scenario: { detected: false, text: "", confidence: 0 },
          stage: { detected: false, text: "", confidence: 0 },
          interaction: { detected: false, text: "", confidence: 0 },
          missing: ["scenario", "stage", "interaction"],
          ready: false
        }
      });
    }
  });

  // API Route: /api/match
  app.post('/api/match', async (req, res) => {
    const { input = {}, settings = {}, database = null } = req.body;
    const { rawText, scenario } = input;
    const textToAnalyze = rawText || scenario || req.body.scenario;

    if (!textToAnalyze || typeof textToAnalyze !== 'string' || !textToAnalyze.trim()) {
      return res.status(400).json({ error: "상황 문장을 입력해주세요." });
    }

    const normalizedInput = { ...input, rawText: textToAnalyze };
    let dbToUse = database;
    if (!dbToUse || !dbToUse.SN) {
      try {
        dbToUse = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      } catch (err) {
        return res.status(500).json({ error: "서버 DB를 읽어오지 못했습니다." });
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;

    try {
      const result = await executeMatch(normalizedInput, settings, dbToUse, apiKey);
      res.status(200).json(result);
    } catch (err) {
      console.error("Match Execution Error:", err);
      res.status(500).json({ error: "매칭 중 서버 오류가 발생했습니다." });
    }
  });

  // Serve static assets in production
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Puko Capability Server listening at http://localhost:${PORT} in ${isProd ? 'production' : 'development'} mode.`);
  });
}

startServer();
