export interface PublicUser {
  id: number
  nickname: string
  profileUrl?: string
  isDj?: boolean
  isManager?: boolean
  isZiziSelf?: boolean
}

export interface RoomJoinPayload {
  generator: PublicUser
}

export interface ChatMessagePayload {
  message: string
  messageType: string
  generator: PublicUser
}

export interface RoomKickPayload {
  targetUser: { id: number; nickname: string }
  generator: { id: number; nickname: string }
}

export interface LiveMetaUpdatePayload {
  title: string
  notice: string
  isCalling: boolean
  isMute: boolean
  likeCount: number
  memberCount: number
  spoonCount: number
  streamStatus: string
}

export interface LiveDonationPayload {
  userId: number
  nickname: string
  sticker: string
  amount: number
  stickerType: string
  donationMessage?: string
  combo?: number
}

export interface LiveFreeLikePayload {
  userId: number
  nickname: string
  count: number
}

export interface LivePaidLikePayload {
  userId: number
  nickname: string
  stickerId: number
  sticker: string
  amount: number
}

export interface LiveItemUsePayload {
  userId: number
  nickname: string
  itemId: number
  effectType: string
}

export interface LiveRankPayload {
  nowRank: string
  prevRank: string
  riseRank?: number
}

export type LiveEventName =
  | 'ChatMessage'
  | 'RoomJoin'
  | 'RoomKick'
  | 'LiveMetaUpdate'
  | 'LiveDonation'
  | 'LiveFreeLike'
  | 'LivePaidLike'
  | 'LiveItemUse'
  | 'LiveRank'

export interface LiveEventPayloadMap {
  ChatMessage: ChatMessagePayload
  RoomJoin: RoomJoinPayload
  RoomKick: RoomKickPayload
  LiveMetaUpdate: LiveMetaUpdatePayload
  LiveDonation: LiveDonationPayload
  LiveFreeLike: LiveFreeLikePayload
  LivePaidLike: LivePaidLikePayload
  LiveItemUse: LiveItemUsePayload
  LiveRank: LiveRankPayload
}

export interface SopiaWebAPI {
  emit(event: string, ...args: unknown[]): void
  on(event: string, handler: (...args: unknown[]) => void): void
  off(event: string, handler: (...args: unknown[]) => void): void
  removeAllListeners(event?: string): void
}

export interface SqliteRunResult {
  changes: number
  lastInsertRowid: number | bigint
}

export interface SopiaAPI {
  live?: {
    on<T extends LiveEventName>(event: T, handler: (data: LiveEventPayloadMap[T]) => void): void
    off<T extends LiveEventName>(event: T, handler: (data: LiveEventPayloadMap[T]) => void): void
  }
  chat?: {
    send(message: string): Promise<void>
    sendLike(): Promise<void>
  }
  web: SopiaWebAPI
  secret: {
    get(key: string): Promise<string | null>
  }
  sqlite?: {
    run(sql: string, params?: unknown[]): Promise<SqliteRunResult>
    get<T = unknown>(sql: string, params?: unknown[]): Promise<T | undefined>
    all<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>
    exec(sql: string): Promise<void>
  }
}

export interface StorageAPI {
  get<T = unknown>(key: string): T | undefined
  set<T = unknown>(key: string, value: T): void
  delete(key: string): void
  has(key: string): boolean
  getAll(): Record<string, unknown>
  save(): Promise<void>
}

export interface AxiosResponse<T = unknown> {
  data: T
  status: number
  statusText: string
  headers: Record<string, string>
}

export interface AxiosRequestConfig {
  headers?: Record<string, string>
  params?: Record<string, string | number | boolean>
  timeout?: number
}

export interface AxiosAPI {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>
  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>
}

declare global {
  const sopia: SopiaAPI
  const storage: StorageAPI
  const axios: AxiosAPI
}
