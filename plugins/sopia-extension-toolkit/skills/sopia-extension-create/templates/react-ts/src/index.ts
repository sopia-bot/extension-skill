/// <reference path="./sopia.d.ts" />

import type { ChatMessagePayload, PublicUser, RoomJoinPayload } from './sopia'

interface ExtensionSettings {
  commandPrefix: string
  welcomeMessage: string
  enableWelcome: boolean
}

interface ExtensionStats {
  messageCount: number
  commandCount: number
}

const DEFAULT_SETTINGS: ExtensionSettings = {
  commandPrefix: '!',
  welcomeMessage: '환영합니다, {nickname}님!',
  enableWelcome: true
}

function normalizePrefix(value: unknown): string {
  if (typeof value !== 'string') return DEFAULT_SETTINGS.commandPrefix
  const prefix = value.trim()
  return /^\S{1,3}$/.test(prefix) ? prefix : DEFAULT_SETTINGS.commandPrefix
}

function normalizeWelcomeMessage(value: unknown): string {
  if (typeof value !== 'string') return DEFAULT_SETTINGS.welcomeMessage
  const message = value.trim().slice(0, 200)
  return message || DEFAULT_SETTINGS.welcomeMessage
}

function normalizeSettings(value: unknown): ExtensionSettings {
  const input = value && typeof value === 'object'
    ? value as Record<string, unknown>
    : {}

  return {
    commandPrefix: normalizePrefix(input.commandPrefix),
    welcomeMessage: normalizeWelcomeMessage(input.welcomeMessage),
    enableWelcome: Boolean(input.enableWelcome)
  }
}

function loadSettings(): ExtensionSettings {
  return normalizeSettings({
    commandPrefix: storage.get('settings.commandPrefix') ?? DEFAULT_SETTINGS.commandPrefix,
    welcomeMessage: storage.get('settings.welcomeMessage') ?? DEFAULT_SETTINGS.welcomeMessage,
    enableWelcome: storage.get('settings.enableWelcome') ?? DEFAULT_SETTINGS.enableWelcome
  })
}

function safeNickname(user: PublicUser | undefined): string {
  const nickname = user?.nickname?.trim()
  return nickname ? nickname.slice(0, 50) : '청취자'
}

let settings = loadSettings()
const stats: ExtensionStats = {
  messageCount: 0,
  commandCount: Number(storage.get('stats.commandCount')) || 0
}
const startedAt = Date.now()
let lastCommandAt = 0

function rendererStats() {
  return {
    ...stats,
    uptime: Math.floor((Date.now() - startedAt) / 1000)
  }
}

async function persistSettings(next: ExtensionSettings): Promise<void> {
  storage.set('settings.commandPrefix', next.commandPrefix)
  storage.set('settings.welcomeMessage', next.welcomeMessage)
  storage.set('settings.enableWelcome', next.enableWelcome)
  await storage.save()
}

async function persistStats(): Promise<void> {
  storage.set('stats.commandCount', stats.commandCount)
  await storage.save()
}

function parseCommand(value: unknown): { name: string; args: string[] } | null {
  if (typeof value !== 'string' || value.length > 500) return null
  if (!value.startsWith(settings.commandPrefix)) return null

  const parts = value.slice(settings.commandPrefix.length).trim().split(/\s+/)
  if (!parts[0]) return null
  return {
    name: parts[0].toLowerCase(),
    args: parts.slice(1, 11)
  }
}

async function handleCommand(name: string, _args: string[], user: PublicUser): Promise<void> {
  if (name !== 'ping') return
  const now = Date.now()
  if (now - lastCommandAt < 1000) return
  lastCommandAt = now

  stats.commandCount += 1
  await persistStats()
  sopia.web.emit('stats', rendererStats())
  await sopia.chat?.send(`pong! (${safeNickname(user)}님, 명령어 ${stats.commandCount}회)`)
}

sopia.live?.on('ChatMessage', async (data: ChatMessagePayload) => {
  try {
    stats.messageCount += 1
    sopia.web.emit('stats', rendererStats())

    const message = typeof data.message === 'string' ? data.message.slice(0, 500) : ''
    sopia.web.emit('chat:message', {
      nickname: safeNickname(data.generator),
      message,
      timestamp: Date.now()
    })

    const parsed = parseCommand(message)
    if (parsed) await handleCommand(parsed.name, parsed.args, data.generator)
  } catch (error) {
    console.error('[ChatMessage] 처리 실패:', error instanceof Error ? error.message : String(error))
  }
})

sopia.live?.on('RoomJoin', async (data: RoomJoinPayload) => {
  try {
    if (!settings.enableWelcome) return

    const nickname = safeNickname(data.generator)
    const message = settings.welcomeMessage.replace(/\{nickname\}/g, nickname).slice(0, 200)
    if (message) await sopia.chat?.send(message)
  } catch (error) {
    console.error('[RoomJoin] 처리 실패:', error instanceof Error ? error.message : String(error))
  }
})

sopia.web.on('get:settings', () => {
  sopia.web.emit('settings', settings)
})

sopia.web.on('get:stats', () => {
  sopia.web.emit('stats', rendererStats())
})

sopia.web.on('save:settings', async (input: unknown) => {
  try {
    const next = normalizeSettings(input)
    await persistSettings(next)
    settings = next
    sopia.web.emit('settings', settings)
    sopia.web.emit('settings:saved', { success: true })
  } catch (error) {
    console.error('[Settings] 저장 실패:', error instanceof Error ? error.message : String(error))
    sopia.web.emit('settings:saved', { success: false })
  }
})

sopia.web.on('settings:updated', (input: unknown) => {
  const value = input && typeof input === 'object' ? input as Record<string, unknown> : loadSettings()
  settings = normalizeSettings({ ...settings, ...value })
  sopia.web.emit('settings', settings)
})

console.log(`{{EXT_NAME}} 로드 완료: ${settings.commandPrefix}ping`)
