# Public manifest contract

`manifest.json`은 유효한 JSON이어야 한다. JSONC 주석, trailing comma, 환경별 절대 경로를 사용하지 않는다.

## 기본 구조

```json
{
  "name": "Example Extension",
  "version": "1.0.0",
  "description": "One-line description",
  "main": "index.js",
  "author": "Author",
  "schema": {
    "settings": {},
    "stats": {}
  },
  "permissions": {
    "sopia": []
  },
  "_id": "eNA5svbH_qIx"
}
```

| 필드 | 필수 | 규칙 |
|---|---:|---|
| `name` | 예 | 사용자에게 보이는 이름 |
| `version` | 예 | SemVer |
| `description` | 예 | 한 줄 설명 |
| `main` | 예 | Worker 엔트리 상대경로 |
| `author` | 권장 | 작성자 또는 조직 |
| `icon` | 아니요 | 번들 내부 상대경로 |
| `renderer` | 아니요 | 사용자 설정 페이지 |
| `schema` | 아니요 | 설정·통계 선언 |
| `permissions` | 아니요 | 실제 코드가 쓰는 최소 권한 |
| `files` | 아니요 | 배포 번들 포함 경로 |
| `_id` | 예 | 최초 생성 시 만든 12자 URL-safe ID. 업데이트 시 유지 |

새 확장앱 scaffold는 `scripts/generate-extension-id.mjs`로 `_id`를 한 번 생성한다. 형식은 `^[A-Za-z0-9_-]{12}$`다. 같은 확장앱의 업데이트에서 값을 바꾸면 별도 확장으로 인식될 수 있으므로 다시 생성하지 않는다.

## Renderer

```json
{
  "renderer": {
    "url": "index.html",
    "baseUrl": "renderer"
  }
}
```

React 빌드 결과:

```json
{
  "renderer": {
    "url": "index.html",
    "baseUrl": "renderer/dist"
  }
}
```

로컬 파일만 사용한다. 외부 URL Renderer는 이 공개 스킬에서 생성하지 않는다.

## Settings

지원 타입은 `string`, `boolean`, `number`다.

```json
{
  "schema": {
    "settings": {
      "commandPrefix": {
        "type": "string",
        "title": "명령어 접두사",
        "description": "채팅 명령어 앞에 붙는 문자열",
        "default": "!"
      },
      "enabled": {
        "type": "boolean",
        "title": "기능 활성화",
        "description": "기능을 켜거나 끕니다.",
        "default": true
      },
      "cooldownSeconds": {
        "type": "number",
        "title": "재사용 대기시간",
        "description": "명령어를 다시 사용할 수 있을 때까지의 초",
        "default": 10
      }
    }
  }
}
```

모든 설정에는 `type`, `title`, `description`, `default`를 둔다. Worker의 fallback 기본값과 정확히 일치시킨다. 비밀값은 settings에 넣지 않는다.

## Stats

읽기 전용 상태를 선언한다.

```json
{
  "schema": {
    "stats": {
      "commandCount": {
        "type": "number",
        "title": "명령어 실행 횟수",
        "description": "정상 처리된 명령어의 누적 횟수"
      }
    }
  }
}
```

통계 값은 `storage`의 `stats.<key>`에 저장한다.

## Permissions

이 공개 스킬이 생성할 수 있는 permission은 다음뿐이다.

### Spoon semantic facade

```json
{
  "permissions": {
    "sopia": [
      {
        "scope": "read:lives",
        "reason": "채팅과 입장 이벤트를 수신합니다."
      },
      {
        "scope": "write:lives",
        "reason": "명령어 응답을 현재 채팅으로 전송합니다."
      }
    ]
  }
}
```

지원 scope:

| scope | 사용 조건 |
|---|---|
| `read:users` | `sopia.user`의 조회 메서드를 사용할 때 |
| `write:users` | `sopia.user`의 팔로우·팬 공지 변경 메서드를 사용할 때 |
| `read:lives` | 라이브 이벤트, 방송·랭킹 조회, 투표·편지함 조회를 사용할 때 |
| `write:lives` | 채팅·좋아요, 방송 변경, 투표·편지함 변경을 사용할 때 |
| `read:store` | `sopia.store.getInventory`를 사용할 때 |
| `read:feeds` | `sopia.feed`의 조회 메서드를 사용할 때 |
| `write:feeds` | `sopia.feed`의 좋아요·댓글·포스트 작성 메서드를 사용할 때 |
| `sqlite` | `sopia.sqlite.*`를 사용할 때 |

`storage`, `sopia.web`, `sopia.secret`에는 추가 선언을 만들지 않는다.

### Third-party HTTP

```json
{
  "permissions": {
    "axios": [
      {
        "domain": "api.example.com",
        "reason": "사용자가 선택한 Example 서비스에서 공개 데이터를 조회합니다."
      }
    ]
  }
}
```

- 정확한 hostname만 쓴다. scheme, path, query를 넣지 않는다.
- 사용자가 명시하지 않은 도메인을 추가하지 않는다.
- SOPIA/ZIZI first-party 도메인을 넣지 않는다.
- wildcard는 이 공개 스킬에서 사용하지 않는다.

## Files allowlist

빌드 산출물만 배포할 때 사용한다.

```json
{
  "files": ["dist/", "renderer/dist/", "assets/"]
}
```

`manifest.json`에서 참조하는 모든 파일이 포함되는지 확인한다. source map, 로그, 로컬 설정, 비밀값, 테스트 fixture는 배포 목록에 넣지 않는다.

## Permission derivation

1. `sopia.user` 조회는 `read:users`, 팔로우·팬 공지 변경은 `write:users`.
2. 라이브 이벤트·방송/랭킹 조회·투표/편지함 조회는 `read:lives`.
3. 채팅·좋아요·방송 변경·투표/편지함 변경은 `write:lives`.
4. 인벤토리 조회는 `read:store`.
5. 피드 조회는 `read:feeds`, 피드 좋아요·댓글·포스트 작성은 `write:feeds`.
6. SQLite 메서드를 쓰면 `sqlite`.
7. 제3자 HTTP를 호출하면 실제 고정 hostname별 `axios` 항목.
8. 코드에서 제거한 기능의 permission도 제거.
9. 이유는 사용자가 이해할 수 있는 기능 단위 문장으로 작성.
