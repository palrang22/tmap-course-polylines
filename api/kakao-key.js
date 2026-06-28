// Vercel 서버리스 함수 — 카카오 JS 앱키를 환경변수에서 클라이언트로 내려준다.
// 키는 레포에 커밋하지 않고 Vercel 프로젝트 환경변수(KAKAO_JS_KEY)로만 존재.
// (카카오 JS 키는 도메인 잠금이 걸리는 공개용 키이며, 브라우저 네트워크 탭에는 어차피 노출됨 —
//  실제 보호는 카카오 콘솔의 Web 플랫폼 도메인 등록으로 이뤄진다.)
export default function handler(req, res) {
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.status(200).json({ key: process.env.KAKAO_JS_KEY || '' });
}
