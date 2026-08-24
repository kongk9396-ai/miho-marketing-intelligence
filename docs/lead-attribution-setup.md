# 광고별 DB(리드) 어트리뷰션 — DBcart/랜딩 연동 요구사항

## 왜 필요한가

현재 상담팀이 쓰는 Google Sheet(`코첫`/`코재`/`눈` 탭)에는 UTM 정보가 전혀 없어서, 상담신청(DB) 한 건이 어떤 Meta 광고에서 왔는지 연결할 수 없습니다. 상담팀 시트 구조는 절대 건드리지 않고, 같은 스프레드시트 안의 분석 전용 탭(`marketing_attribution_(건드리기x)`)에 UTM 정보만 별도로 기록해 이 문제를 해결합니다.

## 현재 상태 — 완료된 부분

- 분석 탭 생성 완료: **`marketing_attribution_(건드리기x)`**(상담팀이 실수로 건드리지 않도록 이름에 경고를 붙임). 앱은 `LEADS_ATTRIBUTION_SHEET_NAME` 환경변수로 이 정확한 이름을 참조하도록 설정되어 있음.
- 이 탭에 행을 기록하는 **웹훅 엔드포인트 구현·실동작 검증 완료**: `POST /api/leads-attribution/ingest`.
- `/data/leads-sync` 동기화가 이 탭을 읽어 `leads.utm_source/medium/campaign/content`를 채우는 매칭 로직 구현·테스트 완료.

**남은 것은 DBcart(또는 랜딩 폼) 쪽에서 이 웹훅을 호출하도록 연결하는 것뿐입니다.**

## 연동 방법 — 웹훅 (권장)

DBcart가 상담 시트에 폼 제출 행을 쓴 직후, 아래로 HTTP POST 한 번만 보내면 됩니다. **DBcart가 Google Sheets API 자격증명을 직접 다룰 필요가 전혀 없습니다** — Sheets 쓰기는 이 앱이 대신 처리합니다.

```
POST https://<배포 도메인>/api/leads-attribution/ingest
Authorization: Bearer <LEADS_ATTRIBUTION_INGEST_SECRET 값>
Content-Type: application/json

{
  "source_sheet": "코첫",
  "source_row": 42,
  "landing_name": "미호성형외과 코수술 이벤트 페이지",
  "utm_source": "meta",
  "utm_medium": "paid_social",
  "utm_campaign": "firstnose",
  "utm_content": "creative_a"
}
```

- `source_sheet` / `source_row`는 **필수** — DBcart가 상담 시트(`코첫`/`코재`/`눈` 중 하나)에 방금 쓴 행의 시트 이름과 행 번호(헤더 포함 1-indexed)를 그대로 넘겨야 합니다. 이 두 값이 매칭 키입니다.
- `landing_name`/`utm_*`는 없으면 빈 값으로 기록됩니다(추측하지 않음).
- `submitted_at`은 이 앱이 요청을 받은 시각으로 서버가 직접 채웁니다.
- 이름/전화번호/생년월일 등은 이 요청 본문에 **넣지 마세요** — 설령 넣더라도 서버가 읽지 않고 무시합니다.
- 응답: 성공 시 `{"ok": true}`, 인증 실패 401, 필수값 누락 400.

**환경변수 설정 필요**
- `LEADS_ATTRIBUTION_INGEST_SECRET` — DBcart가 `Authorization: Bearer`로 보낼 값. 로컬(.env.local)에는 이미 생성해뒀습니다. **Render(운영) 환경변수에도 별도로 생성해 설정**하고, 그 값을 DBcart 설정에 등록하세요.
- `LEADS_ATTRIBUTION_SHEET_NAME=marketing_attribution_(건드리기x)` — 로컬은 이미 설정됨. **Render 운영 환경변수에도 동일하게 설정 필요**(안 하면 기본값 `marketing_attribution`을 찾다가 못 찾아 조용히 매칭 없이 동작합니다 — 에러는 안 나지만 데이터도 안 채워짐).

`source_row`를 DBcart가 알아내는 방법은 DBcart의 Sheets 쓰기 방식에 따라 다릅니다:
- Apps Script로 `sheet.appendRow(...)` 후 `sheet.getLastRow()`
- Sheets API `values.append` 응답의 `updates.updatedRange`에서 파싱
- 자체 로우코드 연동(Zapier 등)이면 해당 도구가 쓴 행 번호를 반환하는지 확인 필요

## 대안 — Apps Script가 직접 쓰는 경우

DBcart가 웹훅 호출을 지원하지 않고 Apps Script만 가능하다면, 아래처럼 상담 시트 기록 직후 `marketing_attribution_(건드리기x)`에도 직접 추가할 수 있습니다(이 경우 이 앱의 웹훅은 쓰이지 않음):

```javascript
function onFormSubmit(e, utmParams) {
  var ss = SpreadsheetApp.getActive();

  var consultSheet = ss.getSheetByName('코첫');
  consultSheet.appendRow([ /* 기존 컬럼들 그대로 */ ]);
  var sourceRow = consultSheet.getLastRow();

  var attrSheet = ss.getSheetByName('marketing_attribution_(건드리기x)');
  attrSheet.appendRow([
    new Date(),
    utmParams.landing_name || '',
    utmParams.utm_source || '',
    utmParams.utm_medium || '',
    utmParams.utm_campaign || '',
    utmParams.utm_content || '',
    '', '', // result_status, booking_status — 제출 시점엔 비워둠
    '코첫',
    sourceRow
  ]);
}
```

## 폼 페이지에서 UTM 값 확보 (hidden field)

```html
<input type="hidden" name="utm_source">
<input type="hidden" name="utm_medium">
<input type="hidden" name="utm_campaign">
<input type="hidden" name="utm_content">
<script>
(function () {
  var params = new URLSearchParams(window.location.search);
  ["utm_source", "utm_medium", "utm_campaign", "utm_content"].forEach(function (key) {
    var el = document.querySelector('input[name="' + key + '"]');
    if (el && params.get(key)) el.value = params.get(key);
  });
})();
</script>
```

랜딩 URL 예: `?utm_source=meta&utm_medium=paid_social&utm_campaign=firstnose&utm_content=creative_a`

## `marketing_attribution_(건드리기x)` 탭 헤더 (이미 생성됨, 순서 고정)

| 순서 | 컬럼명 | 설명 |
|---|---|---|
| 1 | `submitted_at` | 기록 시각 (서버가 채움) |
| 2 | `landing_name` | 랜딩페이지 식별자/제목 |
| 3 | `utm_source` | |
| 4 | `utm_medium` | |
| 5 | `utm_campaign` | |
| 6 | `utm_content` | |
| 7 | `result_status` | 항상 빈 값(참고용 예약 컬럼) — 이 앱은 상담 시트만 상태 판정 기준으로 씀 |
| 8 | `booking_status` | 위와 동일 |
| 9 | `source_sheet` | 상담 시트 탭 이름 |
| 10 | `source_row` | 상담 시트에 방금 추가된 행 번호 |

**이름/전화번호/생년월일 등 개인정보는 이 탭에 절대 쓰지 않습니다.**

## 알려진 제약 (정직하게 남겨둠)

- **행 번호 매칭은 상담 시트가 append-only일 때만 정확합니다.** 상담팀이 나중에 그 위쪽 행을 정렬하거나 삭제하면, 이미 기록된 과거 `source_row` 값이 어긋나 잘못된 행과 매칭될 수 있습니다. 상담팀에게 "행 삽입/정렬/삭제 지양"을 안내하거나, 추후 더 견고한 매칭(예: 별도 고유 ID 컬럼)으로 개선할 수 있습니다.
- `landing_url`/`fbclid`는 현재 이 앱이 읽지 않습니다(별도 alias·DB 컬럼 추가가 필요, 이번 범위 밖). 웹훅 payload나 시트에 넣어도 무해하며, 나중에 붙일 수 있습니다.
- `result_status`/`booking_status`는 웹훅 스키마에는 존재하지만 이 앱은 항상 빈 값으로 기록하고 읽지도 않습니다 — 상담 시트의 최신 상태만 신뢰합니다.

## 테스트 절차

1. DBcart 쪽에 웹훅 URL + `LEADS_ATTRIBUTION_INGEST_SECRET`을 설정.
2. 테스트용 값(예: `utm_campaign=test_verify`)으로 실제 폼을 1건만 제출.
3. `marketing_attribution_(건드리기x)` 탭에 새 행이 정상 기록됐는지, `source_sheet`/`source_row`가 상담 시트의 실제 위치와 일치하는지 확인. (웹훅 자체의 append 동작은 실 시트에 대해 이미 검증 완료 — 이 단계는 DBcart 쪽 연동만 확인하면 됨)
4. `/data/leads-sync`에서 동기화 실행 → 해당 리드의 `utm_campaign`이 채워졌는지 확인.
5. `/ads-analysis/campaigns`에서 해당 광고의 DB/유효DB/예약 수치가 연결되는지 확인.
6. 확인 후 정리: 이 앱은 리드 삭제 기능이 없으므로, 상담 시트/attribution 탭에서 테스트 행을 수동으로 지우고 Supabase `leads` 테이블의 해당 행도 필요 시 수동으로 삭제(운영 DB 직접 삭제는 신중하게 — Supabase 대시보드에서 처리 권장).
