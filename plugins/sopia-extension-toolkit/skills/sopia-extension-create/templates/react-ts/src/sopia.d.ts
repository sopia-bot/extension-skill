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

export interface SopiaPage<T> {
  statusCode: number
  detail: string
  next: string | null
  previous: string | null
  results: T[]
}

export interface SopiaUserProfile {
  id: number
  nickname: string
  tag: string
  description: string
  profileUrl: string
  profileCoverUrl: string
  followerCount: number
  followingCount: number
  isVip: boolean
  isVerified: boolean
  isDj: boolean
}

export interface LiveInfo {
  id: number
  title: string
  memberCount: number
  likeCount: number
  spoonCount: number
  isLive: boolean
  streamStatus: string
  managerIds: number[]
  dj: {
    id: number
    nickname: string
    profileUrl?: string
  }
}

export interface SopiaPageOptions {
  pageSize?: number
  page?: number
}

export interface SopiaPopularLiveOptions extends SopiaPageOptions {
  category?: string
}

export interface SopiaCreatePostInput {
  type: 'DJ' | 'FAN'
  targetUserId: number
  contents: string
  visibleOption?: 'ALL' | 'ONLYME' | 'ONLYFAN'
}

export interface SopiaAPI {
  user?: {
    getInfo(userId: number): Promise<SopiaUserProfile | null>
    search(keyword: string, limit?: number): Promise<SopiaPage<SopiaUserProfile>>
    getFollowings(userId: number, nickname?: string): Promise<SopiaPage<SopiaUserProfile>>
    getFollowers(userId: number, nickname?: string): Promise<SopiaPage<SopiaUserProfile>>
    getCurrentLive(userId: number): Promise<Record<string, unknown> | null>
    getMeta(userIds: number[], includeCurrentLive?: boolean): Promise<Record<string, unknown>[]>
    getChannel(userId: number): Promise<Record<string, unknown> | null>
    follow(userId: number): Promise<void>
    unfollow(userId: number): Promise<void>
    saveFanNotice(notice: string, sendNotification?: boolean): Promise<string>
    deleteFanNotice(): Promise<string>
  }
  live?: {
    getInfo(): Promise<LiveInfo | null>
    getBanners(): Promise<SopiaPage<Record<string, unknown>>>
    getPopular(options?: SopiaPopularLiveOptions): Promise<SopiaPage<Record<string, unknown>>>
    getSubscribed(options?: SopiaPageOptions): Promise<SopiaPage<Record<string, unknown>>>
    getById(liveId: number): Promise<Record<string, unknown> | null>
    checkUser(userId: number): Promise<Record<string, unknown> | null>
    getListeners(next?: string): Promise<SopiaPage<Record<string, unknown>>>
    getSponsorRank(next?: string): Promise<SopiaPage<Record<string, unknown>>>
    getCumulativeRank(next?: string): Promise<SopiaPage<Record<string, unknown>>>
    getLikeRank(next?: string): Promise<SopiaPage<Record<string, unknown>>>
    getMemberProfile(userId: number): Promise<Record<string, unknown> | null>
    uploadBackgroundImage(input: {
      base64Data: string
      filename: string
    }): Promise<{ imageKey: string }>
    updateLiveInfo(input: Record<string, unknown>): Promise<void>
    blockUser(userId: number): Promise<SopiaPage<SopiaUserProfile>>
    setManagers(userIds: number[]): Promise<SopiaPage<SopiaUserProfile>>
    on<T extends LiveEventName>(event: T, handler: (data: LiveEventPayloadMap[T]) => void): void
    off<T extends LiveEventName>(event: T, handler: (data: LiveEventPayloadMap[T]) => void): void
  }
  play?: {
    getStatus(): Promise<Record<string, unknown> | null>
    createPoll(title: string, items: string[]): Promise<Record<string, unknown> | null>
    votePoll(pollId: number, itemId: number): Promise<Record<string, unknown> | null>
    getPoll(pollId: number): Promise<Record<string, unknown> | null>
    closePoll(pollId: number): Promise<Record<string, unknown> | null>
    createMailbox(title: string): Promise<Record<string, unknown> | null>
    sendMailbox(mailboxId: number, message: string, isAnonymous?: boolean): Promise<Record<string, unknown> | null>
    getMailbox(mailboxId: number): Promise<Record<string, unknown> | null>
    getMailboxMessages(mailboxId: number): Promise<SopiaPage<Record<string, unknown>>>
    getCurrentMailbox(mailboxId: number): Promise<Record<string, unknown> | null>
    setCurrentMailbox(mailboxId: number, messageId: number, isPublished: boolean): Promise<Record<string, unknown> | null>
    removeMailboxMessage(mailboxId: number, messageId: number): Promise<Record<string, unknown> | null>
    closeMailbox(mailboxId: number): Promise<Record<string, unknown> | null>
  }
  store?: {
    getInventory(
      userType: 'DJ' | 'LISTENER',
      permanenceType: string,
      envelope?: boolean
    ): Promise<SopiaPage<Record<string, unknown>>>
  }
  feed?: {
    getFeed(userId: number, options?: Record<string, unknown>): Promise<SopiaPage<Record<string, unknown>>>
    getFanFeed(userId: number, options?: Record<string, unknown>): Promise<SopiaPage<Record<string, unknown>>>
    getPost(postId: number): Promise<Record<string, unknown> | null>
    getComments(postId: number): Promise<Record<string, unknown>[]>
    getReplies(postId: number, commentId: number): Promise<Record<string, unknown>[]>
    likePost(postId: number): Promise<void>
    unlikePost(postId: number): Promise<void>
    createComment(postId: number, contents: string): Promise<void>
    createReply(postId: number, commentId: number, contents: string): Promise<void>
    createPost(input: SopiaCreatePostInput): Promise<Record<string, unknown> | null>
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
