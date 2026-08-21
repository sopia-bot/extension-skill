const enableWelcomeEl = document.getElementById('enableWelcome');
const welcomeMessageEl = document.getElementById('welcomeMessage');
const saveSettingsBtn = document.getElementById('saveSettings');
const statusEl = document.getElementById('status');

let statusTimer;
let saveTimer;

function showStatus(message, type = '') {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    statusEl.textContent = '';
    statusEl.className = 'status';
  }, 3000);
}

function setSaving(isSaving) {
  saveSettingsBtn.disabled = isSaving;
  saveSettingsBtn.textContent = isSaving ? '저장 중...' : '설정 저장';
}

function applySettings(data) {
  const value = data && typeof data === 'object' ? data : {};
  enableWelcomeEl.checked = Boolean(value.enableWelcome);
  welcomeMessageEl.value = typeof value.welcomeMessage === 'string'
    ? value.welcomeMessage.slice(0, 200)
    : '';
}

function handleSaved(result) {
  clearTimeout(saveTimer);
  setSaving(false);
  showStatus(result?.success ? '저장되었습니다.' : '저장에 실패했습니다.', result?.success ? 'success' : 'error');
}

function saveSettings() {
  const welcomeMessage = welcomeMessageEl.value.trim().slice(0, 200);
  if (!welcomeMessage) {
    showStatus('환영 메시지를 입력하세요.', 'error');
    welcomeMessageEl.focus();
    return;
  }

  setSaving(true);
  window.$sopia.emit('save:settings', {
    enableWelcome: enableWelcomeEl.checked,
    welcomeMessage,
  });

  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    setSaving(false);
    showStatus('응답이 없습니다. 다시 시도하세요.', 'error');
  }, 5000);
}

function init() {
  if (!window.$sopia) {
    setSaving(true);
    showStatus('SOPIA/ZIZI 안에서 열어주세요.', 'error');
    return;
  }

  window.$sopia.on('settings', applySettings);
  window.$sopia.on('settings:saved', handleSaved);
  saveSettingsBtn.addEventListener('click', saveSettings);
  window.$sopia.emit('get:settings');

  window.addEventListener('beforeunload', () => {
    window.$sopia?.off('settings', applySettings);
    window.$sopia?.off('settings:saved', handleSaved);
    clearTimeout(statusTimer);
    clearTimeout(saveTimer);
  }, { once: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
