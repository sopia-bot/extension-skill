# Build and verify

명령은 생성된 확장앱 루트에서 실행한다. 상위 저장소의 workspace, lockfile, package 설정을 변경하지 않는다.

## worker-only

빌드 없음.

```text
<slug>/
├── manifest.json
└── index.js
```

검증:

- `manifest.json` JSON 파싱
- `main`이 `index.js`를 가리킴
- `index.js` 존재
- 남은 `{{...}}` 토큰 없음

## vanilla-js

빌드 없음.

```text
<slug>/
├── manifest.json
├── index.js
└── renderer/
    ├── index.html
    ├── style.css
    └── script.js
```

검증:

- manifest의 `renderer.baseUrl`과 `renderer.url`을 결합한 파일 존재
- HTML이 상대경로의 CSS와 script만 로드
- `innerHTML`, 원격 script, inline secret 없음

## react-ts

필요 조건: Node.js와 pnpm 또는 npm.

### pnpm

```bash
pnpm install --ignore-workspace
pnpm --dir renderer install --ignore-workspace
pnpm build
```

### npm fallback

```bash
npm install --workspaces=false
npm --prefix renderer install --workspaces=false
npm run build
```

기대 산출물:

```text
<slug>/
├── dist/
│   └── index.js
└── renderer/
    └── dist/
        ├── index.html
        └── assets/
```

검증:

- `dist/index.js` 존재하고 비어 있지 않음
- `renderer/dist/index.html` 존재
- manifest의 `main`은 `dist/index.js`
- manifest의 Renderer는 `renderer/dist/index.html`
- 내부 패키지 import 없음
- source map과 환경 파일을 배포하지 않음

## Contract checks

모든 변형에서 다음을 확인한다.

1. 코드에서 호출한 `sopia` API가 `extension-contract.md`에 존재한다.
2. 이벤트 수신은 `read:lives`, 채팅 전송은 `write:lives`, SQLite는 `sqlite`를 선언한다.
3. 사용하지 않는 permission이 없다.
4. `axios` hostname은 manifest의 정확한 제3자 도메인과 일치한다.
5. SOPIA/ZIZI first-party HTTP endpoint나 내부 모듈 import가 없다.
6. Renderer 입력은 Worker에서 다시 검증한다.
7. 비밀값은 코드·manifest·Renderer·로그에 없다.
8. manifest `_id`가 `^[A-Za-z0-9_-]{12}$`와 일치하고 기존 확장 업데이트에서 유지된다.

## Load into ZIZI

1. SOPIA/ZIZI에서 확장앱 화면을 연다.
2. 로컬 폴더 추가를 선택한다.
3. 생성된 확장앱 루트 폴더를 선택한다.
4. 로그에서 Worker 로드 완료를 확인한다.
5. Confirmed Spec의 이벤트·명령어·설정 저장 경로를 각각 한 번 실제로 실행한다.

런타임을 사용할 수 없으면 빌드와 정적 계약 검증까지만 완료했다고 정확히 보고한다. 로드 성공을 추측하지 않는다.
