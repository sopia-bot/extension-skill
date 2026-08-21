console.log('{{EXT_NAME}} 시작');

const DEFAULT_SETTINGS = {
  enableWelcome: false,
  welcomeMessage: '환영합니다, {nickname}님!',
};

function normalizeSettings(input) {
  const value = input && typeof input === 'object' ? input : {};
  const rawMessage = typeof value.welcomeMessage === 'string'
    ? value.welcomeMessage.trim().slice(0, 200)
    : '';

  return {
    enableWelcome: Boolean(value.enableWelcome),
    welcomeMessage: rawMessage || DEFAULT_SETTINGS.welcomeMessage,
  };
}

function loadSettings() {
  return normalizeSettings({
    enableWelcome: storage.get('settings.enableWelcome') ?? DEFAULT_SETTINGS.enableWelcome,
    welcomeMessage: storage.get('settings.welcomeMessage') ?? DEFAULT_SETTINGS.welcomeMessage,
  });
}

function safeNickname(value) {
  return typeof value === 'string' && value.trim()
    ? value.trim().slice(0, 50)
    : '청취자';
}

let settings = loadSettings();
let lastPingAt = 0;

sopia.live?.on('RoomJoin', async (data) => {
  try {
    if (!settings.enableWelcome) return;

    const nickname = safeNickname(data?.generator?.nickname);
    const message = settings.welcomeMessage.replace(/\{nickname\}/g, nickname).slice(0, 200);
    if (message) await sopia.chat?.send(message);
  } catch (error) {
    console.error('[RoomJoin] 처리 실패:', error instanceof Error ? error.message : String(error));
  }
});

sopia.live?.on('ChatMessage', async (data) => {
  try {
    if (typeof data?.message !== 'string' || data.message.length > 500) return;
    if (data.message.trim().toLowerCase() !== '!ping') return;
    const now = Date.now();
    if (now - lastPingAt < 1000) return;
    lastPingAt = now;

    const nickname = safeNickname(data?.generator?.nickname);
    await sopia.chat?.send(`pong! (${nickname}님)`);
  } catch (error) {
    console.error('[ChatMessage] 처리 실패:', error instanceof Error ? error.message : String(error));
  }
});

sopia.web.on('get:settings', () => {
  sopia.web.emit('settings', settings);
});

sopia.web.on('save:settings', async (input) => {
  try {
    const nextSettings = normalizeSettings(input);
    storage.set('settings.enableWelcome', nextSettings.enableWelcome);
    storage.set('settings.welcomeMessage', nextSettings.welcomeMessage);
    await storage.save();

    settings = nextSettings;
    sopia.web.emit('settings', settings);
    sopia.web.emit('settings:saved', { success: true });
  } catch (error) {
    console.error('[Settings] 저장 실패:', error instanceof Error ? error.message : String(error));
    sopia.web.emit('settings:saved', { success: false });
  }
});

console.log('{{EXT_NAME}} 로드 완료: !ping');
