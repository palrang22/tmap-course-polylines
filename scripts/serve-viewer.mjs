/**
 * 폴리라인 뷰어용 최소 정적 서버.
 * 프로젝트 루트를 서빙해 /viewer/ 에서 /data/courses.json 을 읽게 한다.
 * 또한 /api/kakao-key 를 .env 의 KAKAO_JS_KEY 로 응답해 배포본과 동일하게
 * 동작시킨다(로컬에서도 카카오 키 프롬프트가 뜨지 않음).
 *   실행: npm run viewer  →  http://localhost:5173/viewer/
 */
import 'dotenv/config';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, dirname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 5173;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
};

createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);

    // 배포본의 서버리스 함수(api/kakao-key.js)를 로컬에서 흉내낸다.
    if (p === '/api/kakao-key') {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      res.end(JSON.stringify({ key: process.env.KAKAO_JS_KEY || '' }));
      return;
    }

    if (p === '/') p = '/viewer/index.html';
    if (p.endsWith('/')) p += 'index.html';
    const fp = normalize(resolve(ROOT, '.' + p));
    if (!fp.startsWith(ROOT)) {
      res.writeHead(403).end('forbidden');
      return;
    }
    const data = await readFile(fp);
    res.writeHead(200, { 'content-type': TYPES[extname(fp)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('404: ' + req.url);
  }
}).listen(PORT, () => {
  console.log(`viewer → http://localhost:${PORT}/viewer/`);
});
