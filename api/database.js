import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const dbPath = path.join(process.cwd(), 'puco_capability_db.json');

  if (req.method === 'GET') {
    try {
      const data = fs.readFileSync(dbPath, 'utf-8');
      return res.status(200).json(JSON.parse(data));
    } catch (err) {
      console.error("GET Database error:", err);
      return res.status(500).json({ error: `데이터베이스 읽기 실패: ${err.message}` });
    }
  }

  if (req.method === 'POST') {
    try {
      const newDb = req.body;
      if (!newDb.SN || !newDb.MP || !newDb.PJ || !newDb.SP) {
        return res.status(400).json({ error: "올바르지 않은 데이터셋 형식입니다." });
      }
      fs.writeFileSync(dbPath, JSON.stringify(newDb, null, 2), 'utf-8');
      return res.status(200).json({ success: true });
    } catch (err) {
      // Return 200 with localOnly flag on read-only serverless platforms like Vercel
      console.warn("POST Database write failed (normal in Serverless environments):", err.message);
      return res.status(200).json({ 
        success: true, 
        localOnly: true, 
        message: "Vercel 서버리스 파일 시스템은 읽기 전용입니다. 변경사항은 브라우저 세션에 저장되었습니다." 
      });
    }
  }

  return res.status(405).json({ error: "지원하지 않는 메소드입니다." });
}
