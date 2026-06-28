# tmap — 러닝 코스 폴리라인 파이프라인

## 무엇 / 왜

PM이 잡은 러닝 코스를 T-MAP **보행자 경로안내** API로 라우팅해 정적 폴리라인 JSON을 만든다.
런타임 호출 아님 — 코스 정의가 바뀔 때만 빌드타임에 1회 실행한다.

- 경로 데이터 생성: **T-MAP** (카카오는 공개 REST로 도보 경로 미제공 — 자동차만).
- 지도 렌더링: **카카오맵 SDK** (네이티브).
- 타깃 지역: 전북 군산·전주 (둘 다 T-MAP 보행자 서비스 지역).

## 아키텍처 경계

- **폴리라인 좌표는 웹을 거치지 않는다.** 그릴 주체가 네이티브(카카오맵)이므로 백엔드 DB / 네이티브 번들에 저장 → 네이티브가 직접 로드.
- **웹은 코스 메타데이터만** 받음(이름·거리·범주·지명·썸네일). 사용자가 코스 선택 시 웹은 `courseId`만 브릿지로 네이티브에 전달.
- 그래서 산출물을 둘로 분리: 무거운 지오메트리(`courses.json`) / 가벼운 메타(`courses.meta.json`).

## 좌표 순서 (반드시 못박기)

- T-MAP 응답 `coordinates` 는 `[lng, lat]`. 저장 시 `{ lat, lng }` 객체로 정규화한다.
- 이유: 네이티브에서 카카오맵 `MapPoint(longitude:latitude:)` 와 iOS 표준 `CLLocationCoordinate2D`(lat-first)가 한 코드베이스에 공존 → 무명 배열은 뒤집힘 사고 유발. 필드명으로 모호함 제거.

## 산출 스키마 (iOS 개발자와 합의 필요)

```ts
interface Coord { lat: number; lng: number }

// data/courses.json — 무거운 지오메트리 (백엔드/네이티브)
interface CourseOutput {
  id: string;
  name: string;
  declaredCategory: '단거리' | '중거리' | '장거리'; // PM 명시
  measuredCategory: '단거리' | '중거리' | '장거리'; // API 실측 재분류
  polyline: Coord[];            // 순서 보존, 구간 경계 중복점 제거
  cumulativeMeters: number[];   // polyline[i] 까지 누적거리(m), km별 POI 앵커링용
  totalMeters: number;          // 실측 총거리(누적값)
  waypointAnchors: { name: string; polylineIndex: number }[];
}

// data/courses.meta.json — 가벼운 메타 (웹)
interface CourseMeta {
  id: string;
  name: string;
  category: '단거리' | '중거리' | '장거리';
  totalMeters: number;
  placeNames: string[];
  thumbnail: string | null;
}
```

## 실행

```bash
printf 'TMAP_APP_KEY=발급키\n' > .env   # .env 직접 생성 (.gitignore 로 차단됨, 커밋 금지)
# scripts/courses.input.ts 의 좌표 TODO(null) 를 지도에서 찍어 채운 뒤:
npm run build:courses         # = tsx scripts/build-course-polylines.ts
```

## 거리 범주 (실측, 반올림 km 기준)

| 범주 | 거리 |
| --- | --- |
| 단거리 | 7km 미만 |
| 중거리 | 7km 이상 ~ 20km 미만 |
| 장거리 | 20km 이상 |

실측이 PM의 "약 Nkm" 추정과 다르면 빌드 시 경고를 출력한다.

## 코스 현황

- 군산 6개: `scripts/courses.input.ts` 에 정의 (좌표 TODO).
  - ⚠️ 새만금 방파제 런: 신규 매립지라 T-MAP 도로 데이터가 얇을 수 있음 → 결과 별도 검증.
- 전주: PM 미제공. 정의되면 동일 패턴으로 추가.
