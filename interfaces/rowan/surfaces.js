(() => {
  const params = new URLSearchParams(location.search);
  const surface = params.get('surface');
  if (surface) document.documentElement.dataset.surface = surface;
  const theme = params.get('theme');
  if (theme) document.documentElement.dataset.theme = theme;

  // Habilitar copia rápida con Ctrl+C o menú contextual en mensajes de chat
  document.addEventListener('contextmenu', (e) => {
    if (surface === 'notch') return;
    const msgTarget = e.target.closest('#messages-container, #messages-list');
    if (!msgTarget) return;
    const selectedText = (window.getSelection?.()?.toString() || '').trim();
    if (selectedText && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(selectedText).then(() => {
        window.showToast?.('Texto copiado al portapapeles');
      }).catch(() => {});
    }
  });

  if (!surface) return;

  let socket = null;
  let activeStream = false;

  // =========================================================================
  // PACK DE 20 ANIMACIONES EXCLUSIVAS PARA EL NOTCH (surface === 'notch')
  // =========================================================================
  const NOTCH_DANCE_STEPS = [
    { anim: 'dance_bounce', emotion: 'groove' },
    { anim: 'dance_wave', emotion: 'happy' },
    { anim: 'dance_pulse', emotion: 'cheerful' },
    { anim: 'dance_sway', emotion: 'friendly' },
    { anim: 'dance_funk', emotion: 'delighted' },
    { anim: 'dance_strobe', emotion: 'zen' },
  ];

  const NOTCH_IDLE_MICRO_ANIMS = [
    { anim: 'notch_peek', emotion: 'curious', duration: 2400 },
    { anim: 'notch_scan', emotion: 'observing', duration: 2600 },
    { anim: 'notch_float', emotion: 'zen', duration: 2800 },
    { anim: 'notch_stretch', emotion: 'playful', duration: 2200 },
    { anim: 'notch_double_blink', emotion: 'winking', duration: 1900 },
    { anim: 'notch_daydream', emotion: 'optimistic', duration: 2700 },
    { anim: 'notch_curious_tilt', emotion: 'intrigued', duration: 2400 },
    { anim: 'notch_micro_nap', emotion: 'sleepy', duration: 2600 },
    { anim: 'notch_glitch_pop', emotion: 'cyber', duration: 1600 },
    { anim: 'notch_float', emotion: 'happy', duration: 2400 },
    { anim: 'notch_scan', emotion: 'detective', duration: 2400 },
    { anim: 'notch_curious_tilt', emotion: 'amused', duration: 2200 },
  ];

  const NOTCH_REACTIVE_MAP = {
    chrome: { anim: 'reactive_chrome', emotion: 'reading', duration: 3000 },
    typing: { anim: 'reactive_typing', emotion: 'focused', duration: 2200 },
    notification: { anim: 'dance_bounce', emotion: 'surprised', duration: 2000 },
    charging: { anim: 'notch_float', emotion: 'recharging', duration: 3200 },
    media: { anim: 'dance_pulse', emotion: 'excited', duration: 2500 },
  };

  let notchMusicActive = false;
  let notchTimerActive = false;
  let notchDanceIndex = 0;
  let notchDanceInterval = null;
  let notchIdleInterval = null;
  let notchAnimClearTimer = null;

  function setNotchAnimAttr(animName, durationMs = 0) {
    if (surface !== 'notch') return;
    if (notchAnimClearTimer) {
      clearTimeout(notchAnimClearTimer);
      notchAnimClearTimer = null;
    }
    if (!animName) {
      delete document.documentElement.dataset.notchAnim;
      return;
    }
    document.documentElement.dataset.notchAnim = animName;
    if (durationMs > 0) {
      notchAnimClearTimer = setTimeout(() => {
        if (!notchMusicActive && !notchTimerActive) {
          delete document.documentElement.dataset.notchAnim;
        }
      }, durationMs);
    }
  }

  function syncNotchState() {
    if (surface !== 'notch') return;

    // Prioridad 1: Música activa -> rotar entre los 6 pasos de baile suaves y fluidos
    if (notchMusicActive) {
      if (!notchDanceInterval) {
        const applyStep = () => {
          const step = NOTCH_DANCE_STEPS[notchDanceIndex % NOTCH_DANCE_STEPS.length];
          notchDanceIndex += 1;
          setNotchAnimAttr(step.anim, 0);
          window.setEmotion?.(step.emotion, 4600);
        };
        applyStep();
        notchDanceInterval = setInterval(applyStep, 4400);
      }
      return;
    }

    if (notchDanceInterval) {
      clearInterval(notchDanceInterval);
      notchDanceInterval = null;
      window.setEmotion?.('happy', 1500);
    }

    // Prioridad 2: Temporizador o cronómetro activo en la isla (sin música)
    if (notchTimerActive) {
      setNotchAnimAttr('', 0);
      window.setEmotion?.('focused', 4000);
      return;
    }

    // Prioridad 3: Reposo normal
    setNotchAnimAttr('', 0);
  }

  function triggerNotchActivity(activityType) {
    if (surface !== 'notch' || notchMusicActive || notchTimerActive || window.isLiveModeActive) return;
    const spec = NOTCH_REACTIVE_MAP[String(activityType || '').toLowerCase()];
    if (!spec) return;
    setNotchAnimAttr(spec.anim, spec.duration);
    window.setEmotion?.(spec.emotion, spec.duration);
  }

  if (surface === 'notch') {
    notchIdleInterval = setInterval(() => {
      if (notchMusicActive || notchTimerActive || window.isLiveModeActive) return;
      const pick = NOTCH_IDLE_MICRO_ANIMS[Math.floor(Math.random() * NOTCH_IDLE_MICRO_ANIMS.length)];
      setNotchAnimAttr(pick.anim, pick.duration);
      window.setEmotion?.(pick.emotion, pick.duration);
    }, 9500);
  }

  let rpcSeq = 0;
  const pendingRpc = new Map();

  function send(payload) {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }

  function surfaceRpc(method, ...args) {
    return new Promise((resolve, reject) => {
      const callWhenOpen = (attempt = 0) => {
        if (socket?.readyState === WebSocket.OPEN) {
          const id = `srpc-${++rpcSeq}-${Date.now()}`;
          const timer = setTimeout(() => {
            pendingRpc.delete(id);
            reject(new Error('Tiempo de espera agotado'));
          }, 25000);
          pendingRpc.set(id, { resolve, reject, timer });
          send({ type: 'rowan:surface_rpc', id, method, args });
          return;
        }
        if (attempt >= 30) {
          reject(new Error('Motor de Rowan desconectado'));
          return;
        }
        setTimeout(() => callWhenOpen(attempt + 1), 150);
      };
      callWhenOpen(0);
    });
  }

  function openFullRowanWindow(openSettings = false) {
    send({ type: 'rowan:restore_window' });
    try {
      window.parent?.postMessage({ type: 'rowan:open-full-window', openSettings: Boolean(openSettings) }, '*');
    } catch {}
  }

  function applySettingsToDom(s) {
    if (!s || typeof s !== 'object') return;
    if (s.user_name) {
      window.currentUserName = String(s.user_name).trim().toUpperCase();
      const uInput = document.getElementById('user-name-input');
      if (uInput && document.activeElement !== uInput) {
        uInput.value = s.user_name;
      }
      document.querySelectorAll('.user-sender-label').forEach((el) => {
        el.textContent = s.user_name;
      });
    }
    if (typeof s.live_mode_enabled === 'boolean') {
      window.isLiveModeActive = Boolean(s.live_mode_enabled);
      window.setLiveMode?.({ live_active: Boolean(s.live_mode_enabled) });
    }
  }

  function installPywebviewBridge() {
    window.pywebview = {
      api: {
        async get_settings() {
          const s = await surfaceRpc('get_settings');
          applySettingsToDom(s);
          return s;
        },
        async save_settings(payloadJson) {
          const res = await surfaceRpc('save_settings', payloadJson);
          try {
            const parsed = typeof payloadJson === 'string' ? JSON.parse(payloadJson) : payloadJson;
            applySettingsToDom(parsed);
          } catch {}
          return res;
        },
        async get_memories() {
          return await surfaceRpc('get_memories');
        },
        async delete_memory(memId) {
          return await surfaceRpc('delete_memory', memId);
        },
        async send_message(text) {
          send({ type: 'rowan:chat_query', query_id: `surface-${Date.now()}`, text });
          return { status: 'processing' };
        },
        async listen_voice() {
          if (window.isLiveModeActive) {
            return await this.toggle_live_mode();
          }
          window.setState?.('listen');
          send({ type: 'rowan:dictate', request_id: `dictate-${Date.now()}` });
          return { status: 'listening' };
        },
        async toggle_live_mode() {
          try {
            const res = await surfaceRpc('toggle_live_mode');
            const active = Boolean(res?.live_active);
            window.isLiveModeActive = active;
            return { status: active ? 'started' : 'stopped', live_active: active, live_mode: active };
          } catch {
            const next = !window.isLiveModeActive;
            window.isLiveModeActive = next;
            send({ type: 'rowan:toggle_live_mode', enabled: next });
            return { status: next ? 'started' : 'stopped', live_active: next, live_mode: next };
          }
        },
        async toggle_voice(enabled) {
          return await surfaceRpc('toggle_voice', enabled);
        },
        async reset_character_voice() {
          return await surfaceRpc('reset_character_voice');
        },
        async search_fish_voices(query, tempKey = '') {
          return await surfaceRpc('search_fish_voices', query, tempKey);
        },
        async apply_fish_voice(voiceId, label = '', preview = true) {
          return await surfaceRpc('apply_fish_voice', voiceId, label, preview);
        },
        async open_file(filePath) {
          send({ type: 'rowan:open_file', path: filePath });
          return { status: 'ok' };
        },
        async set_voice_enabled(enabled) {
          send({ type: 'rowan:voice_enabled', enabled: Boolean(enabled) });
          return { voice_enabled: Boolean(enabled) };
        },
        async get_product_status() {
          return await surfaceRpc('get_product_status');
        },
        async connect_product_provider(provider, key, model = '') {
          return await surfaceRpc('connect_product_provider', provider, key, model);
        },
        async open_help_link(url) {
          return await surfaceRpc('open_help_link', url);
        },
        async finish_onboarding() {
          return await surfaceRpc('finish_onboarding');
        },
      },
    };
  }

  function handleIpc(message) {
    if (message?.type === 'rowan:surface_rpc_result') {
      const item = pendingRpc.get(message.id);
      if (item) {
        clearTimeout(item.timer);
        pendingRpc.delete(message.id);
        if (message.error) item.reject(new Error(message.error));
        else item.resolve(message.result);
      }
      return;
    }

    const type = message?.type;
    const data = message?.data || message || {};
    if (type === 'rowan:emotion' && data.emotion) {
      if (surface === 'notch' && window.isLiveModeActive) {
        setNotchAnimAttr('', 0);
      }
      window.setEmotion?.(data.emotion, data.duration_ms || 12000);
    } else if (type === 'rowan:audio_level') {
      const level = Number(data.level) || 0;
      window.updateAudioLevel?.(level);
      if (level > 0.02) window.setState?.('speak');
    } else if (type === 'rowan:live_state') {
      const state = data.state || 'idle';
      if (typeof data.live_active === 'boolean') {
        window.isLiveModeActive = Boolean(data.live_active);
        window.setLiveMode?.({ live_active: Boolean(data.live_active) });
      }
      if (state === 'listening') {
        window.setState?.('listen');
        if (surface === 'notch' && window.isLiveModeActive) {
          setNotchAnimAttr('', 0);
          window.setEmotion?.('curious', 5000);
        }
      } else if (state === 'thinking') {
        window.setState?.('think');
        if (surface === 'notch' && window.isLiveModeActive) {
          window.setEmotion?.('thinking', 5000);
        }
      } else if (state === 'speaking') {
        window.setState?.('speak');
      } else {
        window.setState?.('idle');
      }
    } else if (type === 'rowan:live_caption') {
      if (data.clear) {
        window.clearLiveUserCaption?.();
      } else if (data.text) {
        window.setLiveUserCaption?.(data.text, Boolean(data.final));
      }
    } else if (type === 'rowan:dictation' && surface === 'mini') {
      const spoken = String(data.text || '').trim();
      if (spoken) {
        window.appendMessage?.('user', spoken);
        window.setState?.('think');
        send({ type: 'rowan:chat_query', query_id: `dict-${Date.now()}`, text: spoken });
      } else {
        window.setState?.('idle');
        if (data.error) {
          window.showToast?.('No se detectó voz en el micrófono', 'error');
        }
      }
    } else if (type === 'rowan:media_card' && surface === 'mini' && data.data_uri) {
      window.appendMediaCard?.(data.data_uri, data.path || '');
    } else if (type === 'rowan:settings_updated') {
      applySettingsToDom(data);
    } else if (type === 'rowan:user_message' && surface === 'mini' && data.text) {
      window.appendMessage?.('user', data.text);
    } else if (type === 'rowan:chat_stream' && surface === 'mini') {
      if (!data.done && data.token) {
        if (!activeStream) {
          activeStream = true;
          window.startAssistantStream?.();
        }
        window.appendStreamChunk?.(data.token);
      }
      if (data.done) {
        if (!activeStream && data.full_text) {
          window.startAssistantStream?.();
          window.appendStreamChunk?.(data.full_text);
        }
        window.finishAssistantStream?.(data.full_text);
        activeStream = false;
        window.setState?.(window.isLiveModeActive ? 'listen' : 'idle');
      }
    }
  }

  function connect() {
    socket = new WebSocket('ws://127.0.0.1:18889');
    socket.addEventListener('open', () => {
      try {
        window.dispatchEvent(new Event('pywebviewready'));
      } catch {}
      if (surface === 'mini') {
        surfaceRpc('get_settings').then(applySettingsToDom).catch(() => {});
      }
    });
    socket.addEventListener('message', (event) => {
      try {
        handleIpc(JSON.parse(event.data));
      } catch {}
    });
    socket.addEventListener('close', () => setTimeout(connect, 1200));
  }

  window.addEventListener('message', (event) => {
    const data = event.data || {};
    if (data.type === 'rowan:surface') {
      if (typeof data.dark === 'boolean') {
        document.documentElement.dataset.theme = data.dark ? 'dark' : 'light';
        document.documentElement.classList.toggle('light-surface', !data.dark);
        document.documentElement.classList.toggle('dark', Boolean(data.dark));
      }
      if (data.cursor && surface === 'notch') {
        window.dispatchEvent(
          new MouseEvent('mousemove', { clientX: data.cursor.x, clientY: data.cursor.y, bubbles: true })
        );
      }
      if (typeof data.music === 'boolean' && surface === 'notch') {
        const nextMusic = Boolean(data.music);
        if (notchMusicActive !== nextMusic) {
          notchMusicActive = nextMusic;
          if (!notchMusicActive) {
            window.stopMusicReaction?.();
          }
          syncNotchState();
        }
      }
      if (typeof data.timerActive === 'boolean' && surface === 'notch') {
        const nextTimer = Boolean(data.timerActive);
        if (notchTimerActive !== nextTimer) {
          notchTimerActive = nextTimer;
          syncNotchState();
        }
      }
      if (data.activity && surface === 'notch') {
        triggerNotchActivity(data.activity);
      }
      return;
    }

    if (data.type === 'rowan:cursor' && surface === 'notch') {
      window.dispatchEvent(
        new MouseEvent('mousemove', { clientX: data.x, clientY: data.y, bubbles: true })
      );
    } else if (data.type === 'rowan:music' && surface === 'notch') {
      notchMusicActive = Boolean(data.playing);
      if (!notchMusicActive) {
        window.stopMusicReaction?.();
      }
      syncNotchState();
    } else if (data.type === 'rowan:timer' && surface === 'notch') {
      notchTimerActive = Boolean(data.active);
      syncNotchState();
    } else if (data.type === 'rowan:activity' && surface === 'notch') {
      triggerNotchActivity(data.activity);
    } else if (data.type === 'rowan:battery' && surface === 'notch') {
      if (data.charging) window.setEmotion?.('recharging', 5000);
      else if (Number(data.level) <= 20) window.setEmotion?.('low_battery', 6000);
    } else if (data.type === 'rowan:theme') {
      const isLight = data.theme === 'light';
      document.documentElement.dataset.theme = isLight ? 'light' : 'dark';
      document.documentElement.classList.toggle('light-surface', isLight);
      document.documentElement.classList.toggle('dark', !isLight);
    }
  });

  installPywebviewBridge();
  window.addEventListener('DOMContentLoaded', () => {
    connect();
    if (surface === 'notch') {
      document.getElementById('eye-socket')?.addEventListener('click', (event) => {
        event.stopPropagation();
        openFullRowanWindow(false);
      });
    } else if (surface === 'mini') {
      const fullWinBtn = document.getElementById('open-full-window-btn');
      if (fullWinBtn) {
        fullWinBtn.onclick = (event) => {
          event.preventDefault();
          event.stopPropagation();
          openFullRowanWindow(false);
        };
      }
    }
  });
})();
