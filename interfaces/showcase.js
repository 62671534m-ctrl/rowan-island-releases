(() => {
  const params = new URLSearchParams(location.search);
  const initialMode = params.get('showcase');
  if (!initialMode) return;

  let animTimer = null;

  function clearAnim() {
    if (animTimer) {
      clearInterval(animTimer);
      animTimer = null;
    }
  }

  function ensureStyle() {
    if (document.getElementById('showcase-lock-style')) return;
    const style = document.createElement('style');
    style.id = 'showcase-lock-style';
    style.textContent = [
      'body { pointer-events: none !important; user-select: none !important; overflow: hidden !important; }',
      '#product-welcome { display: none !important; }',
      '.island-container { top: 14px !important; }',
      '.island-container.expanded .island-expanded { left: 0 !important; transform: none !important; }',
      '.island-container.collapsed .island-expanded { display: none !important; opacity: 0 !important; visibility: hidden !important; }'
    ].join('\n');
    document.head.append(style);
  }

  function pinAndExpandIsland(tabName) {
    const island = document.getElementById('island-container');
    if (!island) return;
    if (!island.classList.contains('expanded')) {
      island.classList.remove('collapsed');
      island.classList.add('expanded');
      window.islandAPI?.expand?.();
    }
    const pinBtn = document.getElementById('btn-pin-island');
    if (pinBtn && !pinBtn.classList.contains('active')) {
      pinBtn.click();
    }
    if (tabName) {
      const btn = document.querySelector(`.nav-btn[data-tab="${tabName}"]`);
      btn?.click();
    }
  }

  function collapseIslandToNotch() {
    const pinBtn = document.getElementById('btn-pin-island');
    if (pinBtn && pinBtn.classList.contains('active')) {
      pinBtn.click();
    }
    const collapseBtn = document.getElementById('btn-collapse-island');
    collapseBtn?.click();
    const island = document.getElementById('island-container');
    island?.classList.remove('expanded');
    island?.classList.add('collapsed');
  }

  function applyIslandFn(fn) {
    clearAnim();
    if (fn === 'notch') {
      collapseIslandToNotch();
      const island = document.getElementById('island-container');
      const notchAvatar = document.getElementById('notch-rowan-avatar');
      let step = 0;
      const runNotchStep = () => {
        step = (step + 1) % 3;
        if (!island) return;
        if (step === 0) {
          island.classList.remove('notch-event-active');
          notchAvatar?.classList.remove('talking');
        } else if (step === 1) {
          island.classList.add('notch-event-active');
        } else {
          island.classList.remove('notch-event-active');
          notchAvatar?.classList.add('talking');
        }
      };
      animTimer = setInterval(runNotchStep, 1800);
      return;
    }

    pinAndExpandIsland(fn);

    if (fn === 'calendar') {
      let idx = 0;
      animTimer = setInterval(() => {
        const days = document.querySelectorAll('#cal-days-grid .cal-day:not(.empty)');
        if (!days.length) return;
        idx = (idx + 3) % days.length;
        days[idx]?.click();
      }, 1700);
    } else if (fn === 'timer') {
      const startBtn = document.getElementById('btn-timer-start');
      if (startBtn && !startBtn.classList.contains('running')) {
        startBtn.click();
      }
    } else if (fn === 'notes') {
      animTimer = setInterval(() => {
        const cb = document.querySelector('#tasks-list .task-checkbox, #tab-notes input[type="checkbox"]');
        cb?.click();
      }, 2200);
    } else if (fn === 'rowan') {
      const input = document.getElementById('rowan-chat-input');
      if (input && !input.value) {
        input.value = 'Crea un resumen en mi escritorio y abre VS Code';
      }
    }
  }

  function applyRowanAppFn(fn) {
    clearAnim();
    document.querySelectorAll('#product-welcome').forEach((e) => e.remove());

    if (fn === 'settings') {
      document.getElementById('open-settings-btn')?.click();
      document.getElementById('tab-btn-pccontrol')?.click();
      return;
    }
    if (fn === 'live') {
      document.body.classList.add('live-mode-active');
      window.setState?.('listen');
      return;
    }

    const emotions = ['greeting', 'happy', 'eureka', 'curious', 'thinking'];
    let eIdx = 0;
    let showSettings = false;
    window.setEmotion?.(emotions[0], 2200);

    animTimer = setInterval(() => {
      eIdx = (eIdx + 1) % emotions.length;
      if (eIdx === 3 && !showSettings) {
        showSettings = true;
        document.getElementById('open-settings-btn')?.click();
      } else {
        if (showSettings) {
          showSettings = false;
          document.getElementById('close-settings-btn')?.click();
        }
        window.setEmotion?.(emotions[eIdx], 1800);
      }
    }, 2200);
  }

  function applyShowcase(fn) {
    document.querySelectorAll('#product-welcome').forEach((e) => e.remove());
    if (document.getElementById('island-container')) {
      applyIslandFn(fn === 'expanded' ? 'home' : fn);
    } else {
      applyRowanAppFn(fn);
    }
  }

  function init() {
    ensureStyle();
    applyShowcase(initialMode);
  }

  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'showcase-select') {
      applyShowcase(event.data.fn);
    }
  });

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init, { once: true });
})();
