/**
 * 코스 정의 (입력)
 * ------------------------------------------------------------------
 * PM이 스크린샷으로 준 코스를 좌표로 옮긴 곳.
 * 각 point 의 lat/lng 는 지도(가능하면 카카오 공유 링크)에서 직접 찍어 채운다.
 * lat/lng 가 null 이면 빌드 스크립트가 해당 코스를 건너뛰고 경고를 출력한다.
 *
 * points 순서 = 라우팅 순서 (출발 → 경유… → 도착).
 *   - 첫 원소 = 출발지, 마지막 원소 = 도착지, 중간 = 경유지(passList).
 *   - 경유지가 5개를 넘으면 빌드 스크립트가 자동으로 구간 분할 호출 후 이어붙인다.
 */

export type DistanceCategory = '단거리' | '중거리' | '장거리';

export interface CoursePoint {
  name: string;
  /** 위도 (WGS84). TODO: 지도에서 추출해 채울 것 */
  lat: number | null;
  /** 경도 (WGS84). TODO: 지도에서 추출해 채울 것 */
  lng: number | null;
}

export interface CourseInput {
  id: string;
  name: string;
  /** PM이 명시한 범주 — API 실측으로 재분류해 불일치 시 경고 */
  declaredCategory: DistanceCategory;
  /** PM이 명시한 "약 Nkm" 추정치 (참고/로그용) */
  declaredKm: number;
  points: CoursePoint[];
  /** 결과를 별도 검증해야 하는 코스에 사유를 남긴다 */
  verifyNote?: string;
}

export const courses: CourseInput[] = [
  // ── 군산 ──────────────────────────────────────────────────────────
    {
    id: 'gunsan-modern-history-run',
    name: '근대 역사 박물관 런',
    declaredCategory: '중거리',
    declaredKm: 10,
    points: [
      { name: '은파호수공원', lat: 35.9554, lng: 126.6892 }, // TODO
      { name: '은파호수 둘레길1', lat: 35.9492, lng: 126.6921 }, // TODO
      { name: '은파호수 둘레길2', lat: 35.9474, lng: 126.6976 }, // TODO
      { name: '은파호수 둘레길3', lat: 35.9516, lng: 126.7043 }, // TODO
      { name: '군산 근대 역사 박물관', lat: 35.9907, lng: 126.7120 }, // TODO
    ],
  },
  {
    id: 'gunsan-jjamppong-run',
    name: '짬뽕런',
    declaredCategory: '단거리',
    declaredKm: 6,
    points: [
      { name: '군산수송공원', lat: null, lng: null }, // TODO
      { name: '경암동철길마을', lat: null, lng: null }, // TODO
      { name: '짬뽕특화거리', lat: null, lng: null }, // TODO
    ],
  },
  {
    id: 'gunsan-seonyudo-beach-run',
    name: '선유도 해변 런',
    declaredCategory: '단거리',
    declaredKm: 5,
    points: [
      { name: '옥돌해변', lat: null, lng: null }, // TODO
      { name: '선유도 방파제', lat: null, lng: null }, // TODO
      { name: '몽돌해변', lat: null, lng: null }, // TODO
    ],
  },
  {
    id: 'gunsan-wetland-eco-run',
    name: '습지 생태 공원 런',
    declaredCategory: '중거리',
    declaredKm: 7,
    // TODO: 금강 미래 체험관의 포함 여부/순서 PM 확인 (현재는 경유지로 배치)
    points: [
      { name: '군산시청', lat: null, lng: null }, // TODO
      { name: '금강 미래 체험관', lat: null, lng: null }, // TODO
      { name: '군산 습지 생태 공원', lat: null, lng: null }, // TODO
    ],
  },
  {
    id: 'gunsan-cypress-forest-run',
    name: '편백나무 숲 런',
    declaredCategory: '중거리',
    declaredKm: 8,
    points: [
      { name: '군산시청', lat: null, lng: null }, // TODO
      { name: '편백치유의 숲', lat: null, lng: null }, // TODO
    ],
  },
  {
    id: 'gunsan-saemangeum-run',
    name: '새만금 방파제 런',
    declaredCategory: '장거리',
    declaredKm: 24,
    verifyNote:
      '새만금은 신규 매립지라 T-MAP 도로 데이터가 얇을 수 있음 → 결과(폴리라인 누락/우회) 별도 검증 필요.',
    points: [
      { name: '새만금 비응공원', lat: null, lng: null }, // TODO
      { name: '장자도', lat: null, lng: null }, // TODO
    ],
  },

  // ── 전주 ──────────────────────────────────────────────────────────
  // TODO: 전주 코스는 PM 미제공. 정의되면 위와 동일 패턴으로 추가.
];
