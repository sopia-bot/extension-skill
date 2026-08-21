# Public extension contract

이 문서는 확장앱과 ZIZI 사이에서 확장앱 코드가 사용할 수 있는 공개 계약만 정의한다. 내부 구현, 전송 방식, 프로토콜 메시지, first-party HTTP endpoint는 이 계약이 아니다.

참조에 없는 API나 필드는 추측하지 않는다.

## Worker globals

Worker 엔트리는 별도 import 없이 다음 전역을 사용한다.

```ts
declare const sopia: SopiaAPI
declare const storage: StorageAPI
declare const axios: AxiosAPI
declare const console: Console
```

permission이 필요한 facade는 선언되지 않았거나 승인되지 않으면 `undefined`일 수 있다. 해당 permission을 선언한 뒤에도 선택적 접근과 오류 처리를 유지한다.

## Live events

`read:lives` 필요:

```ts
sopia.live?.on(event, handler)
sopia.live?.off(event, handler)
```

지원 이벤트와 공개 payload:

```ts
interface PublicUser {
  id: number
  nickname: string
  profileUrl?: string
  isDj?: boolean
  isManager?: boolean
  isZiziSelf?: boolean
}

interface RoomJoinPayload {
  generator: PublicUser
}

interface ChatMessagePayload {
  message: string
  messageType: string
  generator: PublicUser
}

interface RoomKickPayload {
  targetUser: { id: number; nickname: string }
  generator: { id: number; nickname: string }
}

interface LiveMetaUpdatePayload {
  title: string
  notice: string
  isCalling: boolean
  isMute: boolean
  likeCount: number
  memberCount: number
  spoonCount: number
  streamStatus: string
}

interface LiveDonationPayload {
  userId: number
  nickname: string
  sticker: string
  amount: number
  stickerType: string
  donationMessage?: string
  combo?: number
}

interface LiveFreeLikePayload {
  userId: number
  nickname: string
  count: number
}

interface LivePaidLikePayload {
  userId: number
  nickname: string
  stickerId: number
  sticker: string
  amount: number
}

interface LiveItemUsePayload {
  userId: number
  nickname: string
  itemId: number
  effectType: string
}

interface LiveRankPayload {
  nowRank: string
  prevRank: string
  riseRank?: number
}
```

이벤트 핸들러에서 optional 필드는 확인하고, 사용자 제공 문자열 길이를 제한한다. payload 전체를 Renderer나 외부 서비스로 전달하지 않는다.

## Chat

`write:lives` 필요:

```ts
sopia.chat?.send(message: string): Promise<void>
sopia.chat?.sendLike(): Promise<void>
```

빈 메시지는 보내지 않는다. 사용자 입력을 그대로 재전송하지 말고 길이와 허용 형식을 검증한다. 반복 응답 기능에는 사용자별 또는 전체 cooldown을 둔다.

## Worker and Renderer bridge

추가 permission 없음:

```ts
interface SopiaWebAPI {
  emit(event: string, ...args: unknown[]): void
  on(event: string, handler: (...args: unknown[]) => void): void
  off(event: string, handler: (...args: unknown[]) => void): void
  removeAllListeners(event?: string): void
}

sopia.web.emit(event, payload)
sopia.web.on(event, handler)
```

Renderer에는 다음 객체가 주입된다.

```ts
interface SopiaRendererAPI {
  emit(event: string, ...args: unknown[]): void
  on(event: string, handler: (...args: unknown[]) => void): void
  off(event: string, handler: (...args: unknown[]) => void): void
  once(event: string, handler: (...args: unknown[]) => void): void
  removeAllListeners(event?: string): void
}

declare global {
  interface Window {
    $sopia?: SopiaRendererAPI
  }
}
```

Renderer에서 받은 객체는 신뢰하지 않는다. Worker에서 알려진 키만 선택하고 타입·길이·범위를 다시 검증한 뒤 저장한다. 비밀값이나 불필요한 사용자 payload를 Renderer로 보내지 않는다.

### Embedded browser runtime limit

내장 Renderer 브라우저 런타임에는 `crypto.randomUUID()`가 없다. Renderer에서 호출하거나 가용성을 추측하지 않는다. 확장 `_id`는 scaffold 시 Node.js의 `scripts/generate-extension-id.mjs`로 생성한다. Renderer 내부의 비보안성 요청 상관관계 값이 필요하면 페이지 수명에 한정된 단조 증가 counter를 사용한다.

## Storage

추가 permission 없음:

```ts
interface StorageAPI {
  get<T = unknown>(key: string): T | undefined
  set<T = unknown>(key: string, value: T): void
  delete(key: string): void
  has(key: string): boolean
  getAll(): Record<string, unknown>
  save(): Promise<void>
}
```

- 사용자 설정: `settings.<key>`
- 읽기 전용 통계: `stats.<key>`
- 저장 변경 후 `await storage.save()` 호출
- 설정 기본값은 Worker와 manifest에서 일치시킨다.

## Secrets

추가 permission 없음:

```ts
sopia.secret.get(key: string): Promise<string | null>
```

키 이름만 코드와 README에 기록한다. 값은 코드, manifest, 설정, 로그, Renderer 이벤트에 넣지 않는다.

## SQLite

`sqlite` 필요:

```ts
interface SqliteRunResult {
  changes: number
  lastInsertRowid: number | bigint
}

sopia.sqlite?.run(sql: string, params?: unknown[]): Promise<SqliteRunResult>
sopia.sqlite?.get<T>(sql: string, params?: unknown[]): Promise<T | undefined>
sopia.sqlite?.all<T>(sql: string, params?: unknown[]): Promise<T[]>
sopia.sqlite?.exec(sql: string): Promise<void>
```

값은 반드시 `?` placeholder와 params로 바인딩한다. 식별자는 사용자 입력으로 조립하지 않는다. `exec()`은 확정된 정적 DDL에만 사용한다.

## External HTTP

manifest에 사용자가 명시한 정확한 제3자 도메인을 선언해야 한다.

```ts
interface AxiosResponse<T = unknown> {
  data: T
  status: number
  statusText: string
  headers: Record<string, string>
}

interface AxiosRequestConfig {
  headers?: Record<string, string>
  params?: Record<string, string | number | boolean>
  timeout?: number
}

interface AxiosAPI {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>
  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>
}
```

- hostname은 코드의 고정 상수로 둔다.
- 사용자가 제공한 URL을 그대로 호출하지 않는다.
- timeout과 오류 처리를 둔다.
- 오류 객체나 인증 header를 채팅·Renderer에 노출하지 않는다.
- SOPIA/ZIZI first-party HTTP endpoint를 호출하지 않는다.

## Unsupported by this public skill

다음 기능은 이 공개 계약에 포함하지 않는다.

- 공개 계약에 포함되지 않은 privileged host capability
- 임의 파일시스템 접근
- 내부 인증 정보
- 내부 IPC·transport·protocol
- first-party HTTP API 직접 호출

요청에 이 기능이 필요하면 가짜 구현이나 우회 경로를 만들지 않는다.
