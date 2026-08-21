# SOPIA Extension Toolkit

Claude Code와 OpenAI Codex에서 새 SOPIA/ZIZI 확장앱을 만드는 공개 Agent Skill입니다.

확장앱 생성 흐름을 강제합니다.

1. 딥인터뷰
2. Confirmed Spec 사용자 승인
3. 템플릿 스캐폴딩
4. 실제 빌드
5. 산출물 검증
6. 인라인 보안리뷰

## Supported hosts

- Claude Code
- OpenAI Codex CLI/IDE

두 제품이 지원하는 공개 [Agent Skills](https://agentskills.io) 형식을 공통 소스로 사용합니다. Node.js, 로컬 파일 쓰기와 shell 실행이 가능한 환경이 필요합니다. React 템플릿은 pnpm 또는 npm도 필요합니다.

## Public boundary

이 저장소는 **확장앱과 ZIZI 사이의 공개 계약만** 포함합니다.

포함:

- 라이브 이벤트 수신
- 채팅·좋아요 전송
- Worker와 Renderer 통신
- 사용자·방송·투표·편지함·인벤토리·피드 semantic facade
- extension storage와 SQLite
- secret 조회
- 사용자가 명시한 제3자 HTTP 호출
- 공개 manifest와 permission
- 최초 생성 후 유지되는 12자 URL-safe 확장 ID

포함하지 않음:

- SOPIA/ZIZI 소스 코드나 내부 package
- 내부 IPC, transport, protocol 구현
- 서버·관리자 구현
- first-party HTTP API 직접 호출
- 내부 인증 정보
- 공개 계약에 포함되지 않은 privileged host capability

스킬은 포함된 참조에 없는 API를 추측하거나 내부 구현을 탐색하지 않습니다.

> MIT 라이선스는 이 저장소의 스킬, 문서, 템플릿에만 적용됩니다. SOPIA/ZIZI 애플리케이션, 서비스, 상표, 비공개 구현 또는 별도 배포물에 대한 권리를 부여하지 않습니다.

## Install for Claude Code

### Marketplace

Claude Code에서 실행합니다.

```text
/plugin marketplace add sopia-bot/extension-skill
/plugin install sopia-extension-toolkit@sopia-tools
```

호출:

```text
/sopia-extension-toolkit:sopia-extension-create 입장한 청취자에게 환영 메시지를 보내는 확장앱
```

### Direct project install

다음 폴더를 프로젝트에 복사합니다.

```text
plugins/sopia-extension-toolkit/skills/sopia-extension-create
→ <project>/.claude/skills/sopia-extension-create
```

호출:

```text
/sopia-extension-create 입장한 청취자에게 환영 메시지를 보내는 확장앱
```

로컬 플러그인 테스트:

```bash
claude --plugin-dir ./plugins/sopia-extension-toolkit
```

## Install for Codex

### Direct project install

다음 폴더를 프로젝트에 복사합니다.

```text
plugins/sopia-extension-toolkit/skills/sopia-extension-create
→ <project>/.agents/skills/sopia-extension-create
```

Codex CLI/IDE에서 `/skills`로 선택하거나 다음처럼 호출합니다.

```text
$sopia-extension-create 입장한 청취자에게 환영 메시지를 보내는 확장앱
```

### Marketplace

```bash
codex plugin marketplace add sopia-bot/extension-skill
```

저장소의 `.agents/plugins/marketplace.json`과 `.codex-plugin/plugin.json`은 Codex/ChatGPT 플러그인 디렉터리용 메타데이터를 제공합니다.

## Templates

| Variant | Worker | Renderer | Build |
|---|---|---|---|
| `worker-only` | JavaScript | host-rendered settings | 없음 |
| `vanilla-js` | JavaScript | HTML/CSS/JavaScript | 없음 |
| `react-ts` | TypeScript | React 19, Vite, Tailwind CSS v4, shadcn/ui | 필요 |

세 템플릿 모두 SOPIA 모노레포나 내부 패키지에 의존하지 않습니다.

## Validate repository

```bash
npm run validate
```

Claude plugin validator가 설치되어 있으면 추가로 실행합니다.

```bash
claude plugin validate --strict ./plugins/sopia-extension-toolkit
```

React 템플릿은 placeholder를 치환한 임시 복사본에서 설치·빌드해야 합니다. 자세한 절차는 스킬의 `references/build-and-verify.md`를 따릅니다.

## Repository layout

```text
.claude-plugin/marketplace.json
.agents/plugins/marketplace.json
plugins/sopia-extension-toolkit/
├── .claude-plugin/plugin.json
├── .codex-plugin/plugin.json
└── skills/sopia-extension-create/
    ├── SKILL.md
    ├── references/
    └── templates/
```

## Security reports

공개 issue에 민감한 내용을 작성하지 마세요. GitHub의 [private vulnerability reporting](https://github.com/sopia-bot/extension-skill/security/advisories/new)을 사용하세요.

## License

MIT. `LICENSE`를 확인하세요.
