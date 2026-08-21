---
name: sopia-extension-create
description: Creates a new SOPIA/ZIZI extension through a deep interview, confirmed specification, scaffolding, build, verification, and security review. Use when the user asks to create or build a new SOPIA or ZIZI extension. 새 SOPIA/ZIZI 확장앱을 만들거나 스캐폴딩해 달라는 요청에 사용한다.
license: MIT
compatibility: Designed for Claude Code and OpenAI Codex CLI/IDE. Requires Node.js, a writable workspace, and shell access. React templates require pnpm or npm.
metadata:
  author: sopia-bot
  version: "1.0.1"
---

# SOPIA extension creator

딥인터뷰 → 스펙 확인 → 스캐폴딩 → 빌드 → 검증 → 보안리뷰 순서로 새 SOPIA/ZIZI 확장앱을 만든다.

## 공개 계약 경계

이 스킬에 포함된 `references/`가 사용할 수 있는 API의 전부다.

- 확장앱 Worker/Renderer와 ZIZI 사이의 공개 계약만 사용한다.
- SOPIA/ZIZI 소스 코드, 내부 IPC, 전송 프로토콜, 서버·관리자 구현, 비공개 endpoint를 찾거나 설명하지 않는다.
- SOPIA/ZIZI가 운영하는 first-party HTTP endpoint를 직접 호출하지 않는다. ZIZI가 주입한 `sopia`, `storage`, `axios` facade만 사용한다.
- `axios`는 사용자가 명시한 제3자 도메인에만 사용한다.
- 참조 문서에 없는 메서드, 이벤트, payload 필드, permission을 추측하지 않는다.
- Spoon API 기능은 `sopia.user`, `sopia.live`, `sopia.play`, `sopia.store`, `sopia.feed` semantic facade로 구현한다. 확장 런타임에 존재하지 않는 raw `sopia.api`를 생성하지 않는다.
- 요청 기능에 공개 계약 밖의 기능이 필요하면 구현을 꾸미지 말고 지원 범위를 설명한 뒤 공개 계약 안의 대안을 제안한다.
- 이 문서에 없는 privileged host capability는 이 공개 스킬의 지원 범위가 아니다.
- 내장 Renderer 브라우저 런타임에는 `crypto.randomUUID()`가 없다. Renderer 코드에서 사용하거나 존재를 추측하지 않는다. 확장 `_id`는 scaffold 시 Node.js 스크립트로 생성한다.

## 1. 기능 재진술

요청 기능을 한 줄로 재진술한다. 기능 인자가 비어 있으면 먼저 정확히 다음처럼 묻는다.

> 어떤 확장앱을 만들까요? 한 줄로 알려주세요

## 2. 딥인터뷰

`references/interview.md`를 읽고 관련 질문을 가능한 한 적은 라운드로 묶는다. 호스트에 대화형 질문 도구가 있으면 사용하고, 없으면 한 메시지에 질문을 묶는다.

반드시 확정할 항목:

- `worker-only`, `vanilla-js`, `react-ts` 중 변형
- 이벤트와 채팅 명령어
- 사용자 설정과 읽기 전용 통계
- Renderer 선택
- 필요한 최소 permission
- 사용자가 명시한 제3자 HTTP 도메인
- 표시 이름, kebab-case slug, 설명, 작성자, SemVer
- 출력 디렉터리

이미 요청에 있는 정보는 다시 묻지 않는다.

## 3. Confirmed Spec 승인 게이트

`references/interview.md` 형식으로 `Confirmed Spec`을 출력하고 명시적 승인을 요청한다.

승인 전에는 디렉터리 생성, 템플릿 복사, 설치, 코드 작성, manifest 작성을 포함한 어떠한 파일 변경도 하지 않는다. 사용자가 수정하면 스펙을 갱신하고 다시 승인받는다.

## 4. 스캐폴딩

승인 후 다음 템플릿 하나를 복사한다.

- `templates/worker-only`: 빌드 없는 JavaScript Worker. ZIZI가 `schema.settings`로 설정 폼을 렌더링한다.
- `templates/vanilla-js`: 빌드 없는 JavaScript Worker와 HTML/CSS/JS Renderer.
- `templates/react-ts`: TypeScript Worker와 React/Tailwind/shadcn Renderer.

출력 기본값:

- 현재 루트에 `extensions/`가 있으면 `./extensions/<slug>`
- 없으면 `./<slug>`
- 사용자가 경로를 지정하면 그 경로

승인 후 이 스킬 루트 기준 `scripts/generate-extension-id.mjs`를 Node.js로 한 번 실행해 12자 URL-safe ID를 생성한다. 프로젝트 루트 상대경로로 해석하지 않는다. 생성 결과가 `^[A-Za-z0-9_-]{12}$`와 일치하는지 확인하고 `{{EXT_ID}}`에 사용한다.

다음 토큰을 모든 템플릿 파일에서 치환한다.

| 토큰 | 값 |
|---|---|
| `{{EXT_NAME}}` | 표시 이름 |
| `{{EXT_SLUG}}` | kebab-case 폴더·패키지 이름 |
| `{{DESCRIPTION}}` | 한 줄 설명 |
| `{{AUTHOR}}` | 작성자 |
| `{{VERSION}}` | SemVer, 기본 `1.0.0` |
| `{{EXT_ID}}` | 새 확장앱의 12자 URL-safe 고유 ID |

기존 확장앱을 업데이트할 때는 manifest의 `_id`를 유지하고 다시 생성하지 않는다.

`references/extension-contract.md`, `references/manifest.md`, `references/design.md`만 근거로 Worker, Renderer, manifest를 확정된 스펙에 맞게 수정한다. 템플릿 예제 중 요청하지 않은 기능과 permission은 제거한다.

## 5. 빌드

`references/build-and-verify.md`를 따른다.

- `worker-only`, `vanilla-js`: 빌드 없음
- `react-ts`: Worker와 Renderer 의존성을 설치한 뒤 실제 빌드

Node package manager는 pnpm을 우선하고, 사용할 수 없으면 npm을 사용한다. 저장소의 다른 workspace나 lockfile을 변경하지 않는다.

## 6. 검증

다음을 실제 파일과 빌드 결과로 확인한다.

- 모든 `{{...}}` 토큰 제거
- `manifest.json` JSON 파싱 성공
- 코드에서 사용하는 API와 manifest permission 일치
- `worker-only`, `vanilla-js`: `manifest.json`과 `index.js` 존재
- `react-ts`: `dist/index.js`와 `renderer/dist/index.html` 존재
- first-party endpoint와 내부 모듈 import 없음

사용자에게 로컬 로드 절차를 제공한다.

1. SOPIA/ZIZI의 확장앱 화면 열기
2. 로컬 폴더 추가 선택
3. 생성된 `<output>/<slug>` 폴더 선택

## 7. 인라인 보안리뷰

`references/security.md`를 직접 적용한다. 별도 에이전트 존재를 가정하지 않는다.

최소 권한, 사용자 입력 검증, 비밀값 처리, SQL 파라미터 바인딩, 고정 제3자 도메인, Worker→Renderer 데이터 최소화를 검사한다. 수정 가능한 문제는 보고만 하지 말고 먼저 수정한 뒤 결과를 요약한다.

## 참조 색인

- `references/interview.md`: 딥인터뷰와 Confirmed Spec 형식
- `references/extension-contract.md`: 공개 Worker/Renderer 계약
- `references/manifest.md`: 공개 manifest·permission 계약
- `references/design.md`: Renderer 디자인·접근성 기준
- `references/build-and-verify.md`: 빌드와 산출물 검증
- `references/security.md`: 공개 확장앱 보안 체크리스트
