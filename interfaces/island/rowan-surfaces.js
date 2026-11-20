(() => {
  let music = false;
  let timerActive = false;
  let lastCursor = null;

  document.addEventListener('dragover', event => {
    if (Array.from(event.dataTransfer?.types || []).includes('Files')) window.islandAPI.reportFileDrag?.(true);
  });
  for (const name of ['drop', 'dragend']) document.addEventListener(name, () => window.islandAPI.reportFileDrag?.(false));

  const frames = () => [...document.querySelectorAll('iframe[data-rowan-surface]')];

  function sync(cursor = lastCursor, extra = {}) {
    if (cursor) lastCursor = cursor;
    for (const frame of frames()) {
      const bounds = frame.getBoundingClientRect();
      frame.contentWindow?.postMessage({
        type: 'rowan:surface',
        music,
        timerActive,
        dark: !document.body.classList.contains('light-theme'),
        cursor: lastCursor ? { x: lastCursor.x - bounds.x, y: lastCursor.y - bounds.y } : null,
        ...extra
      }, '*');
    }
  }

  window.rowanSurfaces = {
    music(value) {
      music = Boolean(value);
      sync();
    },
    setTimerActive(value) {
      const next = Boolean(value);
      if (timerActive !== next) {
        timerActive = next;
        sync();
      }
    },
    notifyActivity(activity) {
      if (!activity) return;
      sync(lastCursor, { activity: String(activity) });
    }
  };

  window.addEventListener('message', (event) => {
    const data = event.data || {};
    if (data.type === 'rowan:open-full-window') {
      window.islandAPI.openRowanWindow?.({ openSettings: Boolean(data.openSettings) });
    }
  });

  window.addEventListener('DOMContentLoaded', () => {
    const avatar = document.getElementById('notch-rowan-avatar');
    const notch = document.createElement('iframe');
    notch.dataset.rowanSurface = 'notch';
    notch.title = 'Rowan';
    notch.src = '../rowan/index.html?surface=notch';
    avatar.replaceChildren(notch);

    const panel = document.getElementById('tab-rowan');
    const mini = document.createElement('iframe');
    mini.dataset.rowanSurface = 'mini';
    mini.title = 'Chat de Rowan';
    mini.src = '../rowan/index.html?surface=mini';
    panel.appendChild(mini);

    for (const frame of frames()) frame.addEventListener('load', () => sync());
    new MutationObserver(() => sync()).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    window.islandAPI.onCursor?.((point) => {
      if (!point) return;
      lastCursor = point;
      const bounds = notch.getBoundingClientRect();
      notch.contentWindow?.postMessage({
        type: 'rowan:cursor',
        x: point.x - bounds.x,
        y: point.y - bounds.y
      }, '*');
    });
    window.islandAPI.onPcActivity?.(act => window.rowanSurfaces.notifyActivity(act));
  });
})();

