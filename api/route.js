// Vercel 서버리스 함수 — 점 배열을 받아 T-MAP 보행자 경로를 라우팅해 폴리라인 반환.
// T-MAP 키(TMAP_APP_KEY)는 서버 환경변수로만 존재 → 브라우저에 노출 안 됨.
import { buildPolyline } from '../lib/route-core.mjs';

function readRaw(req) {
  return new Promise((resolve, reject) => {
    let d = '';
    req.on('data', (c) => (d += c));
    req.on('end', () => resolve(d));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  res.setHeader('content-type', 'application/json; charset=utf-8');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' });
    return;
  }
  try {
    let body = req.body;
    if (!body || typeof body === 'string') {
      const raw = typeof body === 'string' ? body : await readRaw(req);
      body = raw ? JSON.parse(raw) : {};
    }
    const { points, searchOption } = body;
    const result = await buildPolyline({
      points,
      searchOption,
      appKey: process.env.TMAP_APP_KEY,
    });
    res.status(200).json(result);
  } catch (e) {
    res.status(400).json({ error: String(e?.message || e) });
  }
}
