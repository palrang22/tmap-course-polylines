# scripts/

빌드타임 도구. 앱 런타임 코드 아님 (`src/` 밖에 두는 이유: Vite 번들 유입·appKey 유출 방지).

## 코스 폴리라인 생성

PM이 정의한 러닝 코스를 T-MAP 보행자 경로안내 API로 라우팅해 정적 폴리라인 JSON을 만든다.
코스 정의가 바뀔 때만 1회 실행한다.

```bash
# 1) 키 준비 (.env 직접 생성, 커밋 금지 — .gitignore 로 차단됨)
printf 'TMAP_APP_KEY=발급키\n' > .env

# 2) 좌표 채우기
#    scripts/courses.input.ts 의 각 point lat/lng (현재 TODO=null) 를
#    지도에서 찍어 채운다. (가능하면 카카오 공유 링크로 정확한 좌표)

# 3) 실행
npm run build:courses
```

### 산출물 (`data/`)

| 파일 | 내용 | 소비자 |
| --- | --- | --- |
| `courses.json` | 무거운 지오메트리 (폴리라인·누적거리·앵커) | 백엔드 DB / 네이티브 번들 (웹 미사용) |
| `courses.meta.json` | 가벼운 메타 (이름·거리·범주·지명) | 웹 |

### 동작 요약

- 요청: `POST /tmap/routes/pedestrian?version=1`, JSON 바디, `reqCoordType=resCoordType=WGS84GEO` (EPSG3857 변환 없음).
- 응답에서 `LineString` 의 `coordinates`(`[lng,lat]`)만 추려 `{lat,lng}` 로 정규화.
- 경유지 5개 초과 시 7점 윈도(경계 1점 중첩)로 분할 호출 후 이어붙임.
- 누적거리(haversine)로 `totalMeters` 산출 → 범주 재분류, PM 추정치와 불일치 시 경고.
- 좌표 미입력 코스는 건너뛰고 경고 출력.

### 거리 범주 (실측 재분류)

| 범주 | 거리 |
| --- | --- |
| 단거리 | 7km 미만 |
| 중거리 | 7km 이상 ~ 20km 미만 |
| 장거리 | 20km 이상 |
