/**
 * 보행자 경로 라우팅 코어 (런타임 공용).
 * api/route.js(Vercel 함수)와 scripts/serve-viewer.mjs(로컬 서버)가 함께 쓴다.
 * 키를 인자로 받고, 전역 fetch(Node 18+/Vercel)를 사용한다 — 환경 비종속.
 *
 * 좌표 규약: 입력/출력 모두 {lat, lng}. T-MAP 응답 [lng,lat]은 여기서 뒤집어 정규화.
 */

const ENDPOINT = 'https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1';
const MAX_PASS = 5; // T-MAP passList 상한
const WINDOW = MAX_PASS + 2; // 출발 + 경유5 + 도착 = 7
const VALID_OPTIONS = new Set([0, 4, 10, 30]);

export function haversine(a, b) {
  const R = 6_371_000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 경유지가 5개를 넘으면 7점 윈도(경계 1점 중첩)로 분할. */
function windowize(points) {
  if (points.length <= WINDOW) return [points];
  const out = [];
  for (let i = 0; i < points.length - 1; i += WINDOW - 1) {
    out.push(points.slice(i, i + WINDOW));
  }
  return out;
}

async function routeSegment(win, searchOption, appKey) {
  const start = win[0];
  const end = win[win.length - 1];
  const passes = win.slice(1, -1);

  const body = {
    startX: String(start.lng),
    startY: String(start.lat),
    endX: String(end.lng),
    endY: String(end.lat),
    startName: encodeURIComponent(start.name || '출발'),
    endName: encodeURIComponent(end.name || '도착'),
    reqCoordType: 'WGS84GEO',
    resCoordType: 'WGS84GEO',
    sort: 'index',
  };
  if (VALID_OPTIONS.has(searchOption)) body.searchOption = String(searchOption);
  if (passes.length) body.passList = passes.map((p) => `${p.lng},${p.lat}`).join('_');

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      appKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`T-MAP ${res.status}: ${(await res.text()).slice(0, 200)}`);

  const data = await res.json();
  const coords = [];
  for (const f of data.features ?? []) {
    if (f.geometry?.type === 'LineString' && f.geometry.coordinates) {
      for (const [lng, lat] of f.geometry.coordinates) coords.push({ lat, lng });
    }
  }
  return coords;
}

function concatPolylines(parts) {
  const out = [];
  for (const part of parts) {
    for (const c of part) {
      const last = out[out.length - 1];
      if (last && last.lat === c.lat && last.lng === c.lng) continue;
      out.push(c);
    }
  }
  return out;
}

function cumulative(poly) {
  const cum = [0];
  for (let i = 1; i < poly.length; i++) cum.push(cum[i - 1] + haversine(poly[i - 1], poly[i]));
  return cum;
}

/**
 * 점 배열(출발…경유…도착)을 라우팅해 폴리라인을 만든다.
 * @returns {{ polyline: {lat,lng}[], totalMeters: number, cumulativeMeters: number[] }}
 */
export async function buildPolyline({ points, searchOption = 0, appKey }) {
  if (!appKey) throw new Error('appKey 없음 (TMAP_APP_KEY 미설정)');
  if (!Array.isArray(points) || points.length < 2) throw new Error('점이 2개 이상 필요');
  if (points.length > 25) throw new Error('점이 너무 많음 (최대 25개)');
  for (const p of points) {
    if (typeof p?.lat !== 'number' || typeof p?.lng !== 'number') {
      throw new Error('각 점에 숫자 lat/lng 필요');
    }
  }

  const opt = Number(searchOption);
  const parts = [];
  for (const win of windowize(points)) parts.push(await routeSegment(win, opt, appKey));

  const polyline = concatPolylines(parts);
  if (polyline.length < 2) throw new Error('폴리라인이 비었음 (좌표/서비스 지역 확인)');

  const cum = cumulative(polyline);
  return {
    polyline,
    cumulativeMeters: cum.map((m) => Math.round(m)),
    totalMeters: Math.round(cum[cum.length - 1]),
  };
}
