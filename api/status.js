export default function handler(req, res) {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.trim() === '') {
    return res.status(200).json({ status: 'missing', message: 'API 키 미설정' });
  }
  return res.status(200).json({ status: 'configured', message: 'API 키 설정 완료' });
}
