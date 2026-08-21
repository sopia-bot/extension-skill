import { useEffect, useState } from 'react'
import { MessageSquare, RefreshCw, Save, Settings as SettingsIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useSopia, useSopiaEvent, useSopiaRequest } from './hooks/use-sopia'

interface ExtensionSettings {
  commandPrefix: string
  welcomeMessage: string
  enableWelcome: boolean
}

interface Stats {
  messageCount: number
  commandCount: number
  uptime: number
}

interface ChatPreview {
  nickname: string
  message: string
  timestamp: number
}

const EMPTY_STATS: Stats = {
  messageCount: 0,
  commandCount: 0,
  uptime: 0
}

export default function App() {
  const { isReady } = useSopia()
  const [settings, setSettings] = useState<ExtensionSettings | null>(null)
  const [stats, setStats] = useState<Stats>(EMPTY_STATS)
  const [recentChats, setRecentChats] = useState<ChatPreview[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const requestSettings = useSopiaRequest<void, ExtensionSettings>('get:settings', 'settings')
  const requestStats = useSopiaRequest<void, Stats>('get:stats', 'stats')
  const saveSettings = useSopiaRequest<ExtensionSettings, { success: boolean }>(
    'save:settings',
    'settings:saved'
  )

  useEffect(() => {
    if (!isReady) return

    let cancelled = false
    Promise.all([requestSettings(), requestStats()])
      .then(([nextSettings, nextStats]) => {
        if (cancelled) return
        setSettings(nextSettings)
        setStats(nextStats)
      })
      .catch(() => {
        if (!cancelled) setError('설정을 불러오지 못했습니다. 다시 열어주세요.')
      })

    return () => {
      cancelled = true
    }
  }, [isReady, requestSettings, requestStats])

  useSopiaEvent<ExtensionSettings>('settings', setSettings)
  useSopiaEvent<Stats>('stats', setStats)
  useSopiaEvent<ChatPreview>('chat:message', (chat) => {
    if (!chat || typeof chat.nickname !== 'string' || typeof chat.message !== 'string') return
    setRecentChats((previous) => [...previous.slice(-9), chat])
  })

  const updateSettings = (updates: Partial<ExtensionSettings>) => {
    setSettings((previous) => previous ? { ...previous, ...updates } : previous)
  }

  const validateSettings = (value: ExtensionSettings): string | null => {
    if (!/^\S{1,3}$/.test(value.commandPrefix)) {
      return '명령어 접두사는 공백 없는 1–3자여야 합니다.'
    }
    if (!value.welcomeMessage.trim() || value.welcomeMessage.length > 200) {
      return '환영 메시지는 1–200자로 입력하세요.'
    }
    return null
  }

  const handleSave = async () => {
    if (!settings || isSaving) return

    const validationError = validateSettings(settings)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setNotice(null)
    setIsSaving(true)
    try {
      const result = await saveSettings(settings)
      if (!result.success) throw new Error('save failed')
      setNotice('설정이 저장되었습니다.')
    } catch {
      setError('설정 저장에 실패했습니다. 다시 시도하세요.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRefresh = async () => {
    setError(null)
    try {
      setStats(await requestStats())
    } catch {
      setError('통계를 불러오지 못했습니다. 다시 시도하세요.')
    }
  }

  if (!isReady) {
    return (
      <div className="flex h-full items-center justify-center" role="status" aria-live="polite">
        <RefreshCw className="mr-3 h-5 w-5 animate-spin" aria-hidden="true" />
        <span>연결 중...</span>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <main className="mx-auto max-w-3xl space-y-6 p-6">
        <header className="flex items-center gap-3">
          <SettingsIcon className="h-6 w-6" aria-hidden="true" />
          <div>
            <h1 className="text-2xl font-semibold">{{EXT_NAME}}</h1>
            <p className="text-sm text-muted-foreground">확장앱 설정과 실행 상태</p>
          </div>
        </header>

        {error && <p className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm" role="alert">{error}</p>}
        {notice && <p className="rounded-lg border border-border bg-card p-3 text-sm" role="status" aria-live="polite">{notice}</p>}

        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>통계</CardTitle>
              <CardDescription>현재 실행 중 수집된 값입니다.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              새로고침
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="메시지 수" value={stats.messageCount} />
              <Stat label="명령어 수" value={stats.commandCount} />
              <Stat label="실행 시간" value={`${Math.floor(stats.uptime / 60)}분`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>설정</CardTitle>
            <CardDescription>저장한 값은 Worker에 즉시 적용됩니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {settings ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="commandPrefix">명령어 접두사</Label>
                  <Input
                    id="commandPrefix"
                    value={settings.commandPrefix}
                    maxLength={3}
                    onChange={(event) => updateSettings({ commandPrefix: event.target.value })}
                    aria-describedby="commandPrefix-help"
                  />
                  <p id="commandPrefix-help" className="text-xs text-muted-foreground">
                    예: <code>{settings.commandPrefix || '!'}ping</code>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="welcomeMessage">환영 메시지</Label>
                  <Input
                    id="welcomeMessage"
                    value={settings.welcomeMessage}
                    maxLength={200}
                    onChange={(event) => updateSettings({ welcomeMessage: event.target.value })}
                    aria-describedby="welcomeMessage-help"
                  />
                  <p id="welcomeMessage-help" className="text-xs text-muted-foreground">
                    {'{nickname}'}은 입장한 청취자의 닉네임으로 바뀝니다.
                  </p>
                </div>

                <div className="flex min-h-11 items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="enableWelcome">입장 인사 활성화</Label>
                    <p className="text-xs text-muted-foreground">청취자가 입장하면 환영 메시지를 보냅니다.</p>
                  </div>
                  <Switch
                    id="enableWelcome"
                    checked={settings.enableWelcome}
                    onCheckedChange={(checked) => updateSettings({ enableWelcome: checked })}
                  />
                </div>

                <Button className="w-full" disabled={isSaving} onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                  {isSaving ? '저장 중...' : '설정 저장'}
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground" role="status">설정을 불러오는 중...</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" aria-hidden="true" />
              <div>
                <CardTitle>최근 채팅</CardTitle>
                <CardDescription>최근 10개 메시지만 표시합니다.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3" aria-live="polite">
              {recentChats.length ? recentChats.map((chat) => (
                <p key={`${chat.timestamp}-${chat.nickname}`} className="text-sm">
                  <strong className="text-primary">{chat.nickname}</strong>
                  <span className="text-muted-foreground">: </span>
                  <span>{chat.message}</span>
                </p>
              )) : (
                <p className="py-8 text-center text-sm text-muted-foreground">아직 수신한 채팅이 없습니다.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="num mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}
