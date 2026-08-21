console.log('{{EXT_NAME}} 시작');

const DEFAULT_SETTINGS = {
  commandPrefix: '!',
  enableGreeter: false,
  greetMessage: '환영합니다, {nickname}님!',
};

function normalizePrefix(value) {
  if (typeof value !== 'string') return DEFAULT_SETTINGS.commandPrefix;
  const prefix = value.trim();
  return /^\S{1,3}$/.test(prefix) ? prefix : DEFAULT_SETTINGS.commandPrefix;
}

function normalizeMessage(value) {
  if (typeof value !== 'string') return DEFAULT_SETTINGS.greetMessage;
  const message = value.trim().slice(0, 200);
  return message || DEFAULT_SETTINGS.greetMessage;
}

function normalizeSettings(input) {
  const value = input && typeof input === 'object' ? input : {};
  return {
    commandPrefix: normalizePrefix(value.commandPrefix),
    enableGreeter: Boolean(value.enableGreeter),
    greetMessage: normalizeMessage(value.greetMessage),
  };
}

function loadSettings() {
  return normalizeSettings({
    commandPrefix: storage.get('settings.commandPrefix') ?? DEFAULT_SETTINGS.commandPrefix,
    enableGreeter: storage.get('settings.enableGreeter') ?? DEFAULT_SETTINGS.enableGreeter,
    greetMessage: storage.get('settings.greetMessage') ?? DEFAULT_SETTINGS.greetMessage,
  });
}

let settings = loadSettings();
let pingCount = Number(storage.get('stats.pingCount')) || 0;
let lastCommandAt = 0;

function safeNickname(value) {
  return typeof value === 'string' && value.trim()
    ? value.trim().slice(0, 50)
    : '청취자';
}

function parseCommand(value) {
  if (typeof value !== 'string' || value.length > 500) return null;
  if (!value.startsWith(settings.commandPrefix)) return null;

  const parts = value.slice(settings.commandPrefix.length).trim().split(/\s+/);
  if (!parts[0]) return null;
  return {
    name: parts[0].toLowerCase(),
    args: parts.slice(1, 11),
  };
}

const commands = {
  ping: async (_args, generator) => {
    pingCount += 1;
    storage.set('stats.pingCount', pingCount);
    await storage.save();

    const nickname = safeNickname(generator?.nickname);
    await sopia.chat?.send(`pong! (${nickname}님, 총 ${pingCount}회)`);
  },
  time: async () => {
    await sopia.chat?.send(`현재 시간: ${new Date().toLocaleString('ko-KR')}`);
  },
};

sopia.live?.on('ChatMessage', async (data) => {
  try {
    const parsed = parseCommand(data?.message);
    if (!parsed) return;

    const handler = Object.hasOwn(commands, parsed.name) ? commands[parsed.name] : undefined;
    if (typeof handler !== 'function') return;
    const now = Date.now();
    if (now - lastCommandAt < 1000) return;
    lastCommandAt = now;
    await handler(parsed.args, data?.generator);
  } catch (error) {
    console.error('[ChatMessage] 처리 실패:', error instanceof Error ? error.message : String(error));
  }
});

sopia.live?.on('RoomJoin', async (data) => {
  try {
    if (!settings.enableGreeter) return;

    const nickname = safeNickname(data?.generator?.nickname);
    const message = settings.greetMessage.replace(/\{nickname\}/g, nickname).slice(0, 200);
    if (message) await sopia.chat?.send(message);
  } catch (error) {
    console.error('[RoomJoin] 처리 실패:', error instanceof Error ? error.message : String(error));
  }
});

sopia.web.on('settings:updated', (newSettings) => {
  const input = newSettings && typeof newSettings === 'object' ? newSettings : loadSettings();
  settings = normalizeSettings({ ...settings, ...input });
});

console.log(`{{EXT_NAME}} 로드 완료: ${settings.commandPrefix}ping, ${settings.commandPrefix}time`);
