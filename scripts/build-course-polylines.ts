/**
 * build-course-polylines.ts
 * ------------------------------------------------------------------
 * 빌드타임 스크립트. PM이 정의한 러닝 코스를 T-MAP 보행자 경로안내 API로
 * 라우팅해 정적 폴리라인 JSON 을 생성한다. 런타임에 매번 호출하지 않는다 —
 * 코스 정의가 바뀔 때만 1회 실행해 산출 JSON 을 적재한다.
 *
 *   실행: npm run build:courses   (= tsx scripts/build-course-polylines.ts)
 *   키:   .env 의 TMAP_APP_KEY (하드코딩 금지)
 *
 * 산출물 (data/):
 *   - courses.json       : 무거운 지오메트리 (폴리라인 포함) → 백엔드 DB / 네이티브 번들용. 웹 미사용.
 *   - courses.meta.json  : 가벼운 메타 (이름·거리·범주·지명) → 웹용.
 *
 * 좌표 순서 못박기:
 *   T-MAP 응답 coordinates 는 [경도(lng), 위도(lat)] 순서.
 *   저장 시 {lat, lng} 객체로 정규화한다. (네이티브에서 무명 배열 뒤집힘 사고 방지)
 */

import 'dotenv/config';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  courses,
  type CourseInput,
  type DistanceCategory,
  type Region,
  type SearchOption,
} from './courses.input.ts';

// ── 설정 ────────────────────────────────────────────────────────────
const APP_KEY = process.env.TMAP_APP_KEY;
const ENDPOINT = 'https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1';
const MAX_PASS = 5; // T-MAP passList 상한
const WINDOW_SIZE = MAX_PASS + 2; // 출발 + 경유5 + 도착 = 7
const REQUEST_DELAY_MS = 300; // 호출 간 간격 (rate-limit 예의)

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = resolve(ROOT, 'data');

// ── 타입 ────────────────────────────────────────────────────────────
interface Coord {
  lat: number;
  lng: number;
}
type ResolvedPoint = { name: string; lat: number; lng: number };

interface WaypointAnchor {
  name: string;
  polylineIndex: number; // 경유지에 가장 가까운 polyline 인덱스
}

interface CourseOutput {
  id: string;
  name: string;
  region: Region;
  searchOption: SearchOption; // 이 경로를 뽑은 도보 옵션 (생략 시 0=추천)
  declaredCategory: DistanceCategory;
  measuredCategory: DistanceCategory; // 실측 재분류 결과
  polyline: Coord[]; // 순서 보존, 구간 경계 중복점 제거
  cumulativeMeters: number[]; // polyline[i] 까지 누적거리(m)
  totalMeters: number; // 실측 총거리 (누적값)
  waypointAnchors: WaypointAnchor[];
}

interface CourseMeta {
  id: string;
  name: string;
  region: Region;
  category: DistanceCategory; // 실측 기준
  totalMeters: number;
  placeNames: string[];
  thumbnail: string | null; // TODO: 썸네일 경로/URL 추후 연결
}

// ── 지오메트리 유틸 ──────────────────────────────────────────────────
function haversine(a: Coord, b: Coord): number {
  const R = 6_371_000; // 지구 반경(m)
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function cumulative(poly: Coord[]): number[] {
  const cum = [0];
  for (let i = 1; i < poly.length; i++) {
    cum.push(cum[i - 1] + haversine(poly[i - 1], poly[i]));
  }
  return cum;
}

function nearestIndex(poly: Coord[], pt: Coord): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const d = haversine(poly[i], pt);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/** 반올림한 km 로 범주를 재분류한다. 단거리 <7km, 중거리 7~20km 미만, 장거리 >=20km. */
function classify(totalMeters: number): DistanceCategory {
  const km = Math.round(totalMeters / 1000);
  if (km < 7) return '단거리';
  if (km < 20) return '중거리';
  return '장거리';
}

// ── 라우팅 ──────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 경유지가 5개를 넘으면 7점 윈도(경계 1점 중첩)로 분할한다. */
function windowize(points: ResolvedPoint[]): ResolvedPoint[][] {
  if (points.length <= WINDOW_SIZE) return [points];
  const windows: ResolvedPoint[][] = [];
  for (let i = 0; i < points.length - 1; i += WINDOW_SIZE - 1) {
    windows.push(points.slice(i, i + WINDOW_SIZE));
  }
  return windows;
}

/** 한 윈도(출발 + 경유 ≤5 + 도착)를 라우팅해 폴리라인 좌표를 받는다. */
async function routeSegment(
  win: ResolvedPoint[],
  searchOption?: SearchOption,
): Promise<Coord[]> {
  const start = win[0];
  const end = win[win.length - 1];
  const passes = win.slice(1, -1);

  const body: Record<string, string> = {
    startX: String(start.lng), // X = 경도
    startY: String(start.lat), // Y = 위도
    endX: String(end.lng),
    endY: String(end.lat),
    startName: encodeURIComponent(start.name),
    endName: encodeURIComponent(end.name),
    reqCoordType: 'WGS84GEO', // 보내는 좌표도 위경도
    resCoordType: 'WGS84GEO', // 받는 좌표도 위경도 (EPSG3857 변환 불필요)
    sort: 'index', // 구간 순서 보장
  };
  if (searchOption !== undefined) {
    body.searchOption = String(searchOption); // 0 추천 · 4 대로우선 · 10 최단 · 30 계단제외
  }
  if (passes.length) {
    // passList 형식: "경도,위도_경도,위도"
    body.passList = passes.map((p) => `${p.lng},${p.lat}`).join('_');
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      appKey: APP_KEY as string,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`T-MAP ${res.status} ${res.statusText}: ${await res.text()}`);
  }

  const data = (await res.json()) as {
    features?: Array<{
      geometry?: { type?: string; coordinates?: number[][] };
    }>;
  };

  const coords: Coord[] = [];
  for (const f of data.features ?? []) {
    if (f.geometry?.type === 'LineString' && f.geometry.coordinates) {
      for (const [lng, lat] of f.geometry.coordinates) {
        coords.push({ lat, lng }); // [lng, lat] → {lat, lng} 정규화
      }
    }
  }
  return coords;
}

/** 윈도별 폴리라인을 이어붙이며 경계/연속 중복점을 제거한다. */
function concatPolylines(parts: Coord[][]): Coord[] {
  const out: Coord[] = [];
  for (const part of parts) {
    for (const c of part) {
      const last = out[out.length - 1];
      if (last && last.lat === c.lat && last.lng === c.lng) continue;
      out.push(c);
    }
  }
  return out;
}

// ── 메인 ────────────────────────────────────────────────────────────
async function buildCourse(
  course: CourseInput,
): Promise<{ heavy: CourseOutput; meta: CourseMeta } | null> {
  const missing = course.points.filter((p) => p.lat == null || p.lng == null);
  if (missing.length) {
    console.warn(
      `  ⏭  건너뜀 [${course.id}] — 좌표 미입력: ${missing
        .map((p) => p.name)
        .join(', ')}`,
    );
    return null;
  }

  const points = course.points as ResolvedPoint[];
  const windows = windowize(points);

  const parts: Coord[][] = [];
  for (let i = 0; i < windows.length; i++) {
    parts.push(await routeSegment(windows[i], course.searchOption));
    if (i < windows.length - 1) await sleep(REQUEST_DELAY_MS);
  }

  const polyline = concatPolylines(parts);
  if (polyline.length < 2) {
    console.warn(
      `  ⚠  [${course.id}] 폴리라인이 비었거나 너무 짧음 (${polyline.length}점) — 좌표/서비스 지역 확인.`,
    );
    return null;
  }

  const cum = cumulative(polyline);
  const totalMeters = Math.round(cum[cum.length - 1]);
  const measuredCategory = classify(totalMeters);

  if (measuredCategory !== course.declaredCategory) {
    console.warn(
      `  ⚠  [${course.id}] 범주 불일치 — PM: ${course.declaredCategory}(약 ${course.declaredKm}km), 실측: ${measuredCategory}(${(totalMeters / 1000).toFixed(2)}km)`,
    );
  }
  if (course.verifyNote) {
    console.warn(`  🔎 [${course.id}] 검증 필요: ${course.verifyNote}`);
  }

  const waypointAnchors: WaypointAnchor[] = points.map((p) => ({
    name: p.name,
    polylineIndex: nearestIndex(polyline, p),
  }));

  const heavy: CourseOutput = {
    id: course.id,
    name: course.name,
    region: course.region,
    searchOption: course.searchOption ?? 0,
    declaredCategory: course.declaredCategory,
    measuredCategory,
    polyline,
    cumulativeMeters: cum.map((m) => Math.round(m)),
    totalMeters,
    waypointAnchors,
  };

  const meta: CourseMeta = {
    id: course.id,
    name: course.name,
    region: course.region,
    category: measuredCategory,
    totalMeters,
    placeNames: points.map((p) => p.name),
    thumbnail: null,
  };

  console.log(
    `  ✅ [${course.id}] ${polyline.length}점, ${(totalMeters / 1000).toFixed(2)}km, ${measuredCategory}`,
  );
  return { heavy, meta };
}

async function main() {
  console.log(`코스 폴리라인 생성 시작 — 대상 ${courses.length}개\n`);

  if (!APP_KEY) {
    console.warn(
      '⚠  TMAP_APP_KEY 가 비어 있습니다. .env 에 키를 넣으세요 (좌표가 채워진 코스는 라우팅에 실패합니다).\n',
    );
  }

  const heavyOut: CourseOutput[] = [];
  const metaOut: CourseMeta[] = [];

  for (const course of courses) {
    try {
      const built = await buildCourse(course);
      if (built) {
        heavyOut.push(built.heavy);
        metaOut.push(built.meta);
      }
    } catch (err) {
      console.error(`  ❌ [${course.id}] 실패:`, (err as Error).message);
    }
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(
    resolve(OUT_DIR, 'courses.json'),
    JSON.stringify(heavyOut, null, 2) + '\n',
    'utf8',
  );
  await writeFile(
    resolve(OUT_DIR, 'courses.meta.json'),
    JSON.stringify(metaOut, null, 2) + '\n',
    'utf8',
  );

  console.log(
    `\n완료 — ${heavyOut.length}/${courses.length}개 생성. → data/courses.json, data/courses.meta.json`,
  );
  if (heavyOut.length < courses.length) {
    console.log('   (건너뛴 코스는 좌표 TODO 를 채운 뒤 다시 실행하세요.)');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
