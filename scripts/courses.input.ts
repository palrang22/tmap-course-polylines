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
      { name: '은파호수공원', lat: 35.9554, lng: 126.6892 }, 
      { name: '은파호수 둘레길1', lat: 35.9492, lng: 126.6921 }, 
      { name: '은파호수 둘레길2', lat: 35.9456, lng: 126.7068 }, 
      { name: '은파호수 둘레길3', lat: 35.9474, lng: 126.6976 },
      { name: '은파호수 둘레길4', lat: 35.9505, lng: 126.6997 }, 
      { name: '은파호수 둘레길5', lat: 35.9516, lng: 126.7043 }, 
      { name: '군산 근대 역사 박물관', lat: 35.9907, lng: 126.7120 }, 
    ],
  },
  {
    id: 'gunsan-saemangeum-run',
    name: '새만금 방파제 런',
    declaredCategory: '장거리',
    declaredKm: 24,
    points: [
      { name: '새만금 비응공원', lat: 35.9437, lng: 126.5368 }, 
      { name: '장자도 방파제', lat: 35.8103, lng: 126.3947 }, 
    ],
  },
  {
    id: 'gunsan-jjamppong-run',
    name: '짬뽕런',
    declaredCategory: '단거리',
    declaredKm: 6,
    points: [
      { name: '군산수송공원', lat: 35.9658, lng: 126.7209 },
      { name: '경유지1', lat: 35.9679, lng: 126.7234 },
      { name: '경유지2', lat: 35.9755, lng: 126.7266 },
      { name: '경암동철길마을', lat: 35.9814, lng: 126.7368 },
      { name: '조선은행', lat: 35.9890, lng: 126.7143 },
      { name: '짬뽕특화거리', lat: 35.9881, lng: 126.7139 },
    ],
  },
  {
    id: 'gunsan-seonyudo-beach-run',
    name: '선유도 해변 런',
    declaredCategory: '단거리',
    declaredKm: 5,
    points: [
      { name: '옥돌해변', lat: 35.8076, lng: 126.4101 }, 
      { name: '경유지1', lat: 35.8079, lng: 126.4124 },
      { name: '경유지2', lat: 35.8133, lng: 126.4157 },
      { name: '선유도 방파제', lat: 35.8267, lng: 126.4165 }, 
      { name: '몽돌해변', lat: 35.8288, lng: 126.4021 }, 
    ],
  },
  {
    id: 'gunsan-wetland-eco-run',
    name: '습지 생태 공원 런',
    declaredCategory: '중거리',
    declaredKm: 7,
    points: [
      { name: '군산시청', lat: 35.9675, lng: 126.7369 },
      { name: '군산 습지 생태 공원', lat: 36.0228, lng: 126.7678 }, 
    ],
  },
  {
    id: 'gunsan-cypress-forest-run',
    name: '편백나무 숲 런',
    declaredCategory: '중거리',
    declaredKm: 8,
    points: [
      { name: '군산시청', lat: 35.9675, lng: 126.7369 }, 
      { name: '편백치유의 숲', lat: 35.9595, lng: 126.8122 }, 
    ],
  },
  // ── 전주 ──────────────────────────────────────────────────────────
  // : 전주 코스는 PM 미제공. 정의되면 위와 동일 패턴으로 추가.
];
