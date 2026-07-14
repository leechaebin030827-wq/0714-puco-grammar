import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const dbPath = path.join(process.cwd(), 'puco_capability_db.json');

  if (req.method === 'GET') {
    try {
      const data = fs.readFileSync(dbPath, 'utf-8');
      return res.status(200).json({ success: true, database: JSON.parse(data), persistence: 'file' });
    } catch (err) {
      console.error("GET Database error:", err);
      return res.status(500).json({ error: `데이터베이스 읽기 실패: ${err.message}` });
    }
  }

  if (req.method === 'POST') {
    try {
      const newDb = req.body.database || req.body;
      if (!newDb.SN || !newDb.MP || !newDb.PJ || !newDb.SP) {
        return res.status(400).json({ error: "올바르지 않은 데이터셋 형식입니다." });
      }
      fs.writeFileSync(dbPath, JSON.stringify(newDb, null, 2), 'utf-8');
      return res.status(200).json({ success: true, persisted: true, persistence: 'file' });
    } catch (err) {
      console.warn("POST Database write failed (normal in Serverless environments):", err.message);
      return res.status(200).json({ 
        success: true, 
        persisted: false, 
        persistence: 'browser', 
        message: "변경 사항이 이 브라우저에 저장되었습니다. 다른 기기나 브라우저에는 반영되지 않습니다." 
      });
    }
  }

  return res.status(405).json({ error: "지원하지 않는 메소드입니다." });
}
