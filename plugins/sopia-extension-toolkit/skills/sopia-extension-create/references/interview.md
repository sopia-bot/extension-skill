# Deep interview

새 확장앱의 동작과 권한을 파일 생성 전에 확정한다. 질문은 이미 답한 내용을 제외하고 가능한 한 한 라운드에 묶는다.

## 질문 원칙

- 사용자의 언어로 질문한다.
- 선택지는 2–5개로 짧게 제시하고 권장안을 표시한다.
- 구현 세부보다 관찰 가능한 동작을 먼저 묻는다.
- 공개 계약에 없는 기능은 선택지에 넣지 않는다.
- 외부 HTTP가 필요하면 사용자가 이용하려는 제3자 서비스와 정확한 도메인을 확인한다. SOPIA/ZIZI first-party endpoint를 제안하지 않는다.
- 승인 게이트 전에는 파일을 만들거나 수정하지 않는다.

## A. 기능

1. 무엇이 기능을 시작하는가?
   - 채팅 명령어
   - 라이브 이벤트
   - 타이머
   - Renderer 사용자 동작
2. 입력과 성공 결과는 무엇인가?
3. 실패하거나 입력이 잘못되면 사용자에게 어떻게 보이는가?
4. 누가 사용할 수 있는가? 모든 청취자, 매니저, DJ 중에서 고른다.
5. 중복 실행, 연속 입력, 빈 입력에 대한 규칙은 무엇인가?

## B. 공개 이벤트

필요한 이벤트만 선택한다.

- `ChatMessage`
- `RoomJoin`
- `RoomKick`
- `LiveMetaUpdate`
- `LiveDonation`
- `LiveFreeLike`
- `LivePaidLike`
- `LiveItemUse`
- `LiveRank`
- 없음

이벤트 이름과 payload는 `extension-contract.md`에 있는 필드만 사용한다.

## C. 변형과 UI

- `worker-only`: 가장 단순. ZIZI의 host-rendered 설정 폼 사용.
- `vanilla-js`: 빌드 없는 사용자 설정 페이지.
- `react-ts`: React 설정 화면이나 실시간 패널이 필요할 때 사용.

Renderer가 필요하면 화면을 고른다.

- 설정 폼
- 읽기 전용 통계
- 최근 이벤트 목록

화면당 주요 동작은 하나만 둔다. 아이콘 전용 버튼은 접근 가능한 이름이 필요하다.

## D. 상태

각 항목을 분류한다.

- 사용자가 바꾸는 값 → `schema.settings`와 `storage`
- 읽기 전용 숫자·상태 → `schema.stats`와 `storage`
- 행 단위 기록·집계 → `sqlite`
- 실행 중에만 필요한 값 → Worker 메모리

키는 camelCase로 정하고 기본값, 타입, 범위를 확정한다. 비밀값은 설정이나 Renderer로 받지 않고 `sopia.secret.get()`으로 읽는다.

## E. 권한

기능에서 역산해 최소 권한만 선택한다.

| 기능 | API | permission |
|---|---|---|
| 라이브 이벤트 수신 | `sopia.live.on/off` | `read:lives` |
| 채팅·좋아요 전송 | `sopia.chat.send/sendLike` | `write:lives` |
| SQLite | `sopia.sqlite.*` | `sqlite` |
| 사용자가 명시한 제3자 HTTP | `axios.*` | 해당 정확한 도메인 |
| `storage`, `sopia.web`, `sopia.secret` | 공개 기본 facade | 추가 선언 없음 |

공개 계약에 포함되지 않은 privileged host capability는 이 스킬의 지원 범위가 아니다.

## F. 메타데이터

- 표시 이름
- kebab-case slug
- 한 줄 설명
- 작성자
- SemVer, 기본 `1.0.0`
- 출력 디렉터리
- 신규 확장 ID는 승인 후 생성, 기존 확장 업데이트는 manifest 값 유지

출력 기본값은 현재 루트에 `extensions/`가 있으면 `./extensions/<slug>`, 없으면 `./<slug>`다.

## Confirmed Spec 형식

```text
Confirmed Spec
- Variant: worker-only | vanilla-js | react-ts
- Name: <display name>
- Slug: <kebab-case>
- Description: <one line>
- Author: <author>
- Version: <semver>
- Output: <path>
- Extension ID: generated after approval | preserve existing
- Triggers: <events, commands, UI actions, timers>
- Behavior: <observable success and failure behavior>
- Roles: <listener | manager | dj>
- Permissions:
  - sopia: <minimal scopes or none>
  - axios: <exact third-party domains or none>
- Settings: <key:type=default or none>
- Stats: <key:type or none>
- SQLite: <tables and retention or none>
- Renderer: <none | vanilla | React, screens>
- Secrets: <key names only or none>
- Unsupported capabilities: none
```

마지막에 다음을 묻는다.

> 이 스펙대로 파일을 생성해도 될까요?

명시적인 승인만 통과로 인정한다. 수정 요청은 스펙을 고친 뒤 다시 확인한다.
