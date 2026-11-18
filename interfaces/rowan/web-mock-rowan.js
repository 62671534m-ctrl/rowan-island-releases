/* ============================================================================
   WEB MOCK SHIM PARA ROWAN AI (Modo Navegador / Preview Web)
   Simula window.pywebview.api para interactuar con rowan/ui/index.html en web.
   ============================================================================ */
(function () {
  if (window.pywebview) return; // En pywebview real no hace nada

  const LS_KEY_CFG = 'rowan_web_demo_config';
  const LS_KEY_MEM = 'rowan_web_demo_memories';

  let config = {
    user_name: 'Visitante',
    model: 'gemini-2.5-flash',
    voice_enabled: true,
    tts_provider: 'fish',
    fish_model: 's2.1-pro-free',
    fish_speed: 1.25,
    voice_name: 'es-US-AlonsoNeural',
    allow_camera: true,
    allow_screenshots: true,
    allow_pc_control: true,
    allow_file_actions: true,
    visual_start_menu: true,
    provider_order: ['google', 'nvidia', 'openrouter'],
    auto_failover: true,
    api_key: 'demo-preview-key',
    nvidia_api_key: '',
    openrouter_api_key: '',
    fish_api_key: ''
  };

  try {
    const saved = JSON.parse(localStorage.getItem(LS_KEY_CFG) || 'null');
    if (saved && typeof saved === 'object') config = { ...config, ...saved };
  } catch {}

  let memories = [
    { id: 1, key: 'nombre', value: config.user_name, updated_at: 'Hoy' },
    { id: 2, key: 'preferencia_tema', value: 'Modo oscuro minimalista', updated_at: 'Hoy' },
    { id: 3, key: 'idioma', value: 'Español', updated_at: 'Hoy' }
  ];
  try {
    const savedMem = JSON.parse(localStorage.getItem(LS_KEY_MEM) || 'null');
    if (Array.isArray(savedMem)) memories = savedMem;
  } catch {}

  let liveActive = false;

  window.pywebview = {
    api: {
      get_settings: async () => ({ ...config }),
      save_settings: async (next) => {
        config = { ...config, ...(next || {}) };
        try { localStorage.setItem(LS_KEY_CFG, JSON.stringify(config)); } catch {}
        return { ok: true, settings: config };
      },
      get_memories: async () => memories,
      delete_memory: async (id) => {
        memories = memories.filter(m => String(m.id) !== String(id));
        try { localStorage.setItem(LS_KEY_MEM, JSON.stringify(memories)); } catch {}
        return { ok: true };
      },
      get_product_status: async () => ({
        is_product: true,
        has_any_ai_key: true,
        version: '1.0',
        onboarding_needed: false
      }),
      send_message: async (text) => {
        const q = String(text || '').trim();
        const lower = q.toLowerCase();
        let emotion = 'happy';
        let reply = `¡Hola ${config.user_name}! Estás viendo la interfaz interactiva de **Rowan AI** en navegador. `;

        if (lower.includes('docx') || lower.includes('word') || lower.includes('archivo')) {
          emotion = 'focused';
          reply += 'En tu PC Windows creo archivos reales (.docx, .xlsx, .pptx, .pdf) directamente en tu Escritorio u OneDrive.';
        } else if (lower.includes('emoci') || lower.includes('feliz') || lower.includes('triste')) {
          emotion = 'ecstatic';
          reply += 'Tengo 100 emociones distintas que cambian la forma de mis ojos, el brillo del aura y mis animaciones a 60 FPS.';
        } else if (lower.includes('brillo') || lower.includes('volumen') || lower.includes('opencode') || lower.includes('abre')) {
          emotion = 'proud';
          reply += 'Puedo abrir tus programas instalados, ajustar el brillo real de la pantalla, controlar el volumen y sincronizarme con el Dynamic Island.';
        } else {
          reply += `Me dijiste: "${q}". Prueba abrir **Ajustes** (arriba a la derecha) o el **Modo Live** para explorar toda mi interfaz.`;
        }

        if (window.setState) window.setState('think');
        if (window.setEmotion) window.setEmotion('thinking');

        setTimeout(() => {
          if (window.setState) window.setState('speak');
          if (window.setEmotion) window.setEmotion(emotion);
          if (window.startAssistantStream) window.startAssistantStream();

          const words = reply.split(' ');
          let i = 0;
          const iv = setInterval(() => {
            if (i < words.length) {
              window.appendStreamToken?.((i ? ' ' : '') + words[i]);
              i++;
            } else {
              clearInterval(iv);
              window.finalizeAssistantStream?.(reply);
              setTimeout(() => window.setState?.('idle'), 900);
            }
          }, 35);
        }, 450);

        return { ok: true };
      },
      toggle_live_mode: async () => {
        liveActive = !liveActive;
        window.setState?.(liveActive ? 'listen' : 'idle');
        return { active: liveActive, state: liveActive ? 'listening' : 'idle' };
      },
      start_voice_input: async () => {
        window.setState?.('listen');
        setTimeout(() => window.setState?.('idle'), 1200);
        return { ok: true, text: 'Hola Rowan, ¿qué puedes hacer?' };
      },
      toggle_voice: async () => {
        config.voice_enabled = !config.voice_enabled;
        return { voice_enabled: config.voice_enabled };
      },
      search_fish_voices: async (q = '') => [
        { id: 'b91cf7911253411a894268fa773aa621', title: 'Rowan Original (ES)', author: 'Rowan Studio' },
        { id: '612b878b113047d9a770c069c8b4fdfe', title: 'J.A.R.V.I.S. Español', author: 'Fish Studio' }
      ].filter(v => !q || v.title.toLowerCase().includes(q.toLowerCase())),
      apply_fish_voice: async (id) => { config.fish_voice_id = id; return { ok: true }; },
      reset_character_voice: async () => ({ ok: true }),
      test_voice: async () => ({ ok: true }),
      open_external_url: async (url) => { window.open(url, '_blank'); return { ok: true }; },
      window_action: async () => ({ ok: true }),
      dock_to_notch: async () => ({ ok: true })
    }
  };
})();
