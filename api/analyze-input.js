import { analyzeInput } from '../src/server/analyzeEngine.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: "입력 텍스트가 없습니다." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  try {
    const analysis = await analyzeInput(text, apiKey);
    return res.status(200).json({ success: true, analysis });
  } catch (err) {
    console.error("Input Analysis Error:", err);
    // Even if it fails entirely, return a graceful fallback rather than a 500
    // so the app doesn't break
    return res.status(200).json({ 
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
}
