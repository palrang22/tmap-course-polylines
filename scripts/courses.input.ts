export type DistanceCategory = '단거리' | '중거리' | '장거리';

export type Region = '군산' | '전주';

export interface CoursePoint {
  name: string;
  lat: number | null;
  lng: number | null;
}

export interface CourseInput {
  id: string;
  name: string;
  region: Region;
  declaredCategory: DistanceCategory;
  declaredKm: number;
  points: CoursePoint[];
  verifyNote?: string;
}

export const courses: CourseInput[] = [
  // ── 군산 ──────────────────────────────────────────────────────────
    {
    id: 'gunsan-modern-history-run',
    name: '근대 역사 박물관 런',
    region: '군산',
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
    region: '군산',
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
    region: '군산',
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
    region: '군산',
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
    region: '군산',
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
    region: '군산',
    declaredCategory: '중거리',
    declaredKm: 8,
    points: [
      { name: '군산시청', lat: 35.9675, lng: 126.7369 }, 
      { name: '편백치유의 숲', lat: 35.9595, lng: 126.8122 }, 
    ],
  },
  // ── 전주 ──────────────────────────────────────────────────────────
  {
    id: 'jeonju-hanok-village-run',
    name: '한옥마을 둘레길 코스',
    region: '전주',
    declaredCategory: '단거리',
    declaredKm: 3.2,
    points: [
      { name: '전주경기전 정문', lat: 35.8141, lng: 127.1501 }, 
      { name: '한벽당', lat: 35.8119, lng: 127.1609 }, 
      { name: '경유지(청연루 입구)', lat: 35.8102, lng: 127.1532 },
      { name: '경유지(청연루 출구)', lat: 35.8118, lng: 127.1531 },
      { name: '전동성당', lat: 35.8133, lng: 127.1489 }, 
    ],
  },
  {
    id: 'jeonju-ajung-lake-run',
    name: '아중호수 둘레길 코스',
    region: '전주',
    declaredCategory: '단거리',
    declaredKm: 5.8,
    points: [
      { name: '전주경기전 정문', lat: 35.8141, lng: 127.1501 },
      { name: '경유지1', lat: 35.8259, lng: 127.1753 },
      { name: '경유지2', lat: 35.8210, lng: 127.1757 },
      { name: '경유지3', lat: 35.8178, lng: 127.1796 },
      { name: '경유지4', lat: 35.8209, lng: 127.1804 },
      { name: '도착지', lat: 35.8262, lng: 127.1769 },
    ],
  },
  {
    id: 'jeonju-zoo-run',
    name: '전주동물원 코스',
    region: '전주',
    declaredCategory: '단거리',
    declaredKm: 3.8,
    points: [
      { name: '덕진공원 3층 석탑', lat: 35.8475, lng: 127.1214 },
      { name: '경유지1', lat: 35.8498, lng: 127.1211 },
      { name: '경유지2', lat: 35.8497, lng: 127.1242 },
      { name: '경유지3', lat: 35.8478, lng: 127.1226 },
      { name: '경유지4', lat: 35.8490, lng: 127.1254 },
      { name: '전주동물원', lat: 35.8576, lng: 127.1428 }, 
    ],
  },
  {
    id: 'jeonju-catholic-shrine-run',
    name: '천주교 성지 코스',
    region: '전주',
    declaredCategory: '단거리',
    declaredKm: 6.2,
    points: [
      { name: '전주 고속버스 터미널', lat: 35.8352, lng: 127.1289 },
      { name: '치명자산성지 평화의전당', lat: 35.8032, lng: 127.1677 }, 
    ],
  },
];
