# Public extension security review

생성된 확장앱만 검사한다. ZIZI 내부 구현이나 보안 메커니즘을 분석·설명하지 않는다.

## 1. 공개 계약 경계

- 코드가 `extension-contract.md`에 있는 facade만 사용한다.
- Spoon 기능은 `sopia.user/live/play/store/feed` semantic facade만 사용하고 raw `sopia.api`를 만들지 않는다.
- 내부 package, IPC, transport, protocol 타입을 import하거나 재현하지 않는다.
- SOPIA/ZIZI first-party HTTP endpoint를 직접 호출하지 않는다.
- 공개 계약에 포함되지 않은 privileged host capability를 생성하지 않는다.
- 참조에 없는 기능을 우회 구현하지 않는다.

위반이 있으면 해당 기능을 제거하거나 공개 계약 안의 대안으로 바꾼다.

## 2. 최소 권한

코드에서 실제 사용하는 기능과 manifest를 양방향으로 비교한다.

- 사용자 조회 ↔ `read:users`
- 팔로우·팬 공지 변경 ↔ `write:users`
- 이벤트·방송/랭킹·투표/편지함 조회 ↔ `read:lives`
- 채팅·좋아요·방송·투표/편지함 변경 ↔ `write:lives`
- 인벤토리 조회 ↔ `read:store`
- 피드 조회 ↔ `read:feeds`
- 피드 변경 ↔ `write:feeds`
- SQLite ↔ `sqlite`
- 제3자 HTTP hostname ↔ 정확한 `axios` domain

미사용 permission을 제거하고, 모든 `reason`을 사용자가 이해할 수 있는 기능 문장으로 작성한다.

## 3. 비밀값

다음 형태의 하드코딩을 찾는다.

- API key, token, password, Authorization header
- 긴 고정 hex·base64 문자열
- `.env`, 로컬 설정, 인증 파일 내용

비밀값은 `sopia.secret.get('KEY')`으로만 읽는다. 값은 로그, 채팅, Renderer 이벤트, storage, SQLite에 저장하지 않는다. 문서에는 필요한 키 이름만 쓴다.

## 4. 사용자 입력

채팅과 Renderer 입력을 신뢰하지 않는다.

- 문자열 타입과 최대 길이 확인
- 명령어와 허용 인자를 allowlist로 파싱
- 숫자의 유한성, 정수 여부, 범위 확인
- 알려진 설정 키만 복사
- 역할 제한이 있으면 공개 payload의 역할 필드로 확인
- 반복 명령에 cooldown 적용
- 오류 응답에 원본 예외나 민감 데이터를 포함하지 않음

## 5. SQL

- 모든 값은 `?` placeholder로 바인딩
- 테이블·열 이름을 사용자 입력으로 조립하지 않음
- `exec()`은 코드에 고정된 DDL에만 사용
- 조회 결과 건수에 상한 적용
- 사용자별 데이터가 필요하면 사용자 ID를 명시적으로 조건에 포함

## 6. Third-party HTTP

- hostname은 코드의 고정 상수
- manifest에 정확한 hostname과 이유 선언
- wildcard domain 금지
- 사용자 입력 URL, redirect 대상, loopback·private network 호출 금지
- timeout 설정
- 응답의 타입·크기 검증
- 오류 객체나 인증 header를 사용자에게 노출하지 않음

## 7. Worker and Renderer

- Renderer에서 받은 값은 Worker가 다시 검증
- Worker는 Renderer에 필요한 필드만 전송
- DOM에 `innerHTML` 사용 금지
- 이벤트 handler를 화면 unmount 시 해제
- 요청·응답 helper에 timeout과 cleanup 적용
- 설정 저장 중 중복 제출 방지
- Renderer에서 `crypto.randomUUID()` 사용 금지; 내장 브라우저 런타임에 존재하지 않음

## 8. Async failures

- 이벤트 handler의 실패 가능한 작업을 `try/catch`로 격리
- 하나의 실패가 이후 이벤트 처리를 중단하지 않음
- 사용자 메시지는 일반화하고, 로그에도 비밀값을 넣지 않음
- 저장 성공을 확인한 뒤 성공 상태 전송

## 9. 배포 산출물

- `node_modules`, 로그, source map, 로컬 설정, 비밀 파일 제외
- 모든 placeholder 제거
- manifest JSON 파싱
- manifest 참조 파일 존재
- React Worker와 Renderer 실제 빌드 성공
- manifest `_id`가 12자 URL-safe 형식이며 최초 생성 후 안정적으로 유지됨

## 결과 형식

```text
Security Review
- Contract boundary: PASS | FIXED | BLOCKED
- Least privilege: PASS | FIXED | BLOCKED
- Secrets: PASS | FIXED | BLOCKED
- Input validation: PASS | FIXED | BLOCKED
- SQL: PASS | N/A | FIXED | BLOCKED
- Third-party HTTP: PASS | N/A | FIXED | BLOCKED
- Worker/Renderer boundary: PASS | N/A | FIXED | BLOCKED
- Build artifacts: PASS | FIXED | BLOCKED
- Remaining risks: <none or exact risk>
```

수정 가능한 항목은 `FIXED`로 만든 후 다시 검사한다. `BLOCKED`가 하나라도 있으면 배포 준비 완료라고 말하지 않는다.
