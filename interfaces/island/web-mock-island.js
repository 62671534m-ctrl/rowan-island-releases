/* ============================================================================
   WEB MOCK SHIM PARA DYNAMIC ISLAND (Modo Navegador / Preview Web)
   Permite usar custom-island/src/renderer/index.html sin Electron.
   ============================================================================ */
(function () {
  if (window.islandAPI) return; // En Electron real no hace nada

  // Fondo oscuro agradable cuando se abre directo en navegador
  const style = document.createElement('style');
  style.textContent = `
    html, body {
      background: radial-gradient(circle at 50% 0%, #161822 0%, #09090d 65%, #050507 100%) !important;
      min-height: 100vh !important;
      overflow-x: hidden !important;
    }
    .island-container {
      top: 14px !important;
    }
  `;
  document.head.appendChild(style);

  const LS_PREFIX = 'rowan_island_web_';
  const loadLS = (k, def) => {
    try {
      const v = localStorage.getItem(LS_PREFIX + k);
      return v ? JSON.parse(v) : def;
    } catch { return def; }
  };
  const saveLS = (k, v) => {
    try { localStorage.setItem(LS_PREFIX + k, JSON.stringify(v)); } catch {}
  };

  let masterVolume = 72;
  let masterMuted = false;
  let brightness = 85;
  let micMuted = false;
  let wifiState = 'On';
  let wifiSsid = 'Rowan-5G';
  let btState = 'On';
  let activeSpeaker = 'Altavoces (Realtek Audio)';
  let mediaPlaying = false;
  let mediaIndex = 0;

  const demoTracks = [
    { title: 'Midnight City', artist: 'M83', album: 'Hurry Up, We\'re Dreaming', duration: 243, position: 48 },
    { title: 'Resonance', artist: 'HOME', album: 'Odyssey', duration: 212, position: 32 },
    { title: 'Starboy', artist: 'The Weeknd', album: 'Starboy', duration: 230, position: 65 }
  ];

  let clips = loadLS('clips', [
    { id: 1, text: 'https://github.com/rowan-island', kind: 'url', pinned: true, date: '12:10' },
    { id: 2, text: 'const rowan = await RowanFace.mount("#app");\nrowan.setEmotion("ecstatic");', kind: 'code', pinned: false, date: '12:08' },
    { id: 3, text: 'Recordatorio: probar el Modo Live de Rowan desde el notch', kind: 'text', pinned: false, date: '11:55' }
  ]);

  let notes = loadLS('notes', {
    tasks: [
      { id: 1, text: 'Probar las 100 emociones de Rowan', completed: true, dueDate: null },
      { id: 2, text: 'Subir Rowan Island v1.0 a la web', completed: false, dueDate: new Date().toISOString().slice(0, 10) }
    ],
    text: 'Notas rápidas del Island:\n- Arrastra archivos al Shelf\n- Usa la rueda del mouse sobre el notch para el volumen'
  });

  let shelf = loadLS('shelf', [
    { name: 'Rowan-Island-Setup-1.0.exe', path: 'C:\\Rowan\\Rowan-Island-Setup-1.0.exe', size: 102400 },
    { name: 'Presentacion-Rowan.docx', path: 'C:\\Users\\Usuario\\Escritorio\\Presentacion-Rowan.docx', size: 45200 }
  ]);

  let calendar = loadLS('calendar', { dates: {} });

  const listeners = {};
  const emit = (ev, payload) => {
    (listeners[ev] || []).forEach(cb => { try { cb(payload); } catch {} });
  };

  function emitMedia() {
    const t = demoTracks[mediaIndex % demoTracks.length];
    emit('media:updated', {
      status: mediaPlaying ? 'Playing' : 'Paused',
      title: t.title,
      artist: t.artist,
      album: t.album,
      duration: t.duration,
      position: t.position,
      thumbnail: ''
    });
  }

  window.islandAPI = {
    getPathForFile: (f) => f?.name || '',
    setInteracting: () => {},
    onCursor: (cb) => {
      window.addEventListener('mousemove', (e) => cb({ x: e.clientX, y: e.clientY }));
    },
    reportFileDrag: () => {},
    expand: () => {},
    collapse: () => {},
    setPinned: () => {},
    toggle: () => {},
    setIgnoreMouseEvents: () => {},
    openRowanWindow: async () => {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'open-rowan-full' }, '*');
      } else {
        window.open('../rowan/index.html', '_blank');
      }
      return { ok: true };
    },
    onRowanWindowVisibility: (cb) => { (listeners['rowan:vis'] ||= []).push(cb); },
    quitApp: () => {},
    onMediaUpdate: (cb) => {
      (listeners['media:updated'] ||= []).push(cb);
      setTimeout(emitMedia, 200);
    },
    controlMedia: async (action) => {
      if (action === 'playpause' || action === 'toggle') mediaPlaying = !mediaPlaying;
      if (action === 'next') { mediaIndex = (mediaIndex + 1) % demoTracks.length; mediaPlaying = true; }
      if (action === 'prev') { mediaIndex = (mediaIndex - 1 + demoTracks.length) % demoTracks.length; mediaPlaying = true; }
      emitMedia();
      return { ok: true, status: mediaPlaying ? 'Playing' : 'Paused' };
    },
    seekMedia: async (sec) => {
      demoTracks[mediaIndex % demoTracks.length].position = Number(sec) || 0;
      emitMedia();
      return { ok: true };
    },
    getMasterVolume: async () => ({ volume: masterVolume, muted: masterMuted }),
    setMasterVolume: async (lvl) => { masterVolume = Math.max(0, Math.min(100, Number(lvl))); return { volume: masterVolume }; },
    setMasterMute: async (m) => { masterMuted = Boolean(m); return { muted: masterMuted }; },
    onMasterVolumeChanged: (cb) => { (listeners['vol'] ||= []).push(cb); },
    getAppVolumes: async () => [
      { pid: 101, name: 'Spotify.exe', volume: 80, muted: false },
      { pid: 102, name: 'chrome.exe', volume: 65, muted: false },
      { pid: 103, name: 'Discord.exe', volume: 90, muted: false }
    ],
    setAppVolume: async () => ({ ok: true }),
    setAppMute: async () => ({ ok: true }),
    onClipboardUpdated: (cb) => { (listeners['clipboard:updated'] ||= []).push(cb); },
    getClipboard: async () => clips,
    copyText: async (text) => {
      try { await navigator.clipboard?.writeText?.(text); } catch {}
      return { ok: true };
    },
    clearClipboard: async () => {
      clips = clips.filter(c => c.pinned);
      saveLS('clips', clips);
      emit('clipboard:updated', clips);
      return clips;
    },
    togglePinClip: async (id) => {
      clips = clips.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c);
      saveLS('clips', clips);
      return clips;
    },
    getSystemInfo: async () => ({ cpu: 18, ram: 46, battery: 92 }),
    launchApp: async () => ({ ok: true }),
    saveNotes: async (n) => { notes = n; saveLS('notes', notes); return { ok: true }; },
    loadNotes: async () => notes,
    saveShelf: async (items) => { shelf = items; saveLS('shelf', shelf); return { ok: true }; },
    loadShelf: async () => shelf,
    saveCalendar: async (d) => { calendar = d; saveLS('calendar', calendar); return { ok: true }; },
    loadCalendar: async () => calendar,
    systemAction: async () => ({ ok: true }),
    openSettings: async () => ({ ok: true }),
    openSoundSettings: async () => ({ ok: true }),
    getAudioOutputs: async () => ({ devices: ['Altavoces (Realtek Audio)', 'Auriculares Bluetooth', 'Monitor HDMI Audio'], active: activeSpeaker }),
    setAudioOutput: async (name) => { activeSpeaker = name; return { ok: true }; },
    onPcActivity: (cb) => { (listeners['pc'] ||= []).push(cb); },
    getRadios: async () => ({
      wifi: { state: wifiState, ssid: wifiSsid },
      bluetooth: { state: btState, connectedDevice: 'AirPods Pro' }
    }),
    toggleRadio: async (target) => {
      if (target === 'wifi') { wifiState = wifiState === 'On' ? 'Off' : 'On'; return { state: wifiState }; }
      btState = btState === 'On' ? 'Off' : 'On';
      return { state: btState };
    },
    getWifiNetworks: async () => [
      { ssid: 'Rowan-5G', signal: 95 },
      { ssid: 'Casa-Fibra', signal: 82 },
      { ssid: 'Invitados', signal: 60 }
    ],
    connectWifi: async (ssid) => { wifiSsid = ssid; return { ok: true }; },
    getBluetoothDevices: async () => [
      { name: 'AirPods Pro', connected: true },
      { name: 'Teclado Mecánico BT', connected: false }
    ],
    getMic: async () => ({ muted: micMuted }),
    toggleMic: async () => { micMuted = !micMuted; return { muted: micMuted }; },
    onMicChanged: (cb) => { (listeners['mic'] ||= []).push(cb); },
    onClipboardCopied: (cb) => { (listeners['clip-copied'] ||= []).push(cb); },
    onClipboardPasted: (cb) => { (listeners['clip-pasted'] ||= []).push(cb); },
    onAutoCollapse: () => {},
    getBrightness: async () => brightness,
    setBrightness: async (val) => { brightness = Number(val); return { brightness }; },
    onBrightnessChanged: () => {},
    screenTool: async () => ({ color: '#38bdf8', ok: true }),
    takeFullscreenScreenshot: async () => ({ ok: true, path: 'captura.png' }),
    runOcr: async () => ({ ok: true, text: 'Texto extraído de ejemplo (Demo Web)' }),
    setNightLight: async () => ({ ok: true }),
    setDnd: async () => ({ ok: true }),
    setPerformanceMode: async () => ({ ok: true }),
    onCapsLockChanged: () => {},
    onNumLockChanged: () => {},
    getWeather: async (city = 'Lima') => {
      try {
        const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=es`).then(r => r.json());
        const loc = geo?.results?.[0];
        if (loc) {
          const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m&daily=uv_index_max&timezone=auto`).then(r => r.json());
          return {
            city: loc.name,
            country: loc.country || '',
            temp: Math.round(w.current.temperature_2m),
            feelsLike: Math.round(w.current.apparent_temperature),
            humidity: Math.round(w.current.relative_humidity_2m),
            wind: Math.round(w.current.wind_speed_10m),
            uv: Math.round(w.daily?.uv_index_max?.[0] || 5),
            precipitation: w.current.precipitation || 0,
            pressure: Math.round(w.current.surface_pressure || 1013),
            code: w.current.weather_code || 0,
            updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        }
      } catch {}
      return {
        city, country: 'Demo', temp: 22, feelsLike: 22, humidity: 65, wind: 14, uv: 6, precipitation: 0, pressure: 1015, code: 1,
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    },
    getLyrics: async () => null
  };

  // Mock de WebSocket local (ws://127.0.0.1:18889) para que RowanClient funcione en la pestaña Rowan del Island
  const NativeWebSocket = window.WebSocket;
  class MockRowanWebSocket {
    constructor(url) {
      this.url = url;
      this.readyState = 0;
      setTimeout(() => {
        this.readyState = 1;
        this.onopen?.({});
        this._dispatch({ type: 'state_sync', docked: true, live_active: false, live_state: 'idle' });
      }, 120);
    }
    _dispatch(obj) {
      this.onmessage?.({ data: JSON.stringify(obj) });
    }
    send(raw) {
      let msg = {};
      try { msg = JSON.parse(raw); } catch {}
      if (msg.type === 'chat_query') {
        const q = String(msg.text || '').trim();
        const streamId = 'demo_' + Date.now();
        this._dispatch({ type: 'chat_stream_start', stream_id: streamId });
        this._dispatch({ type: 'emotion', emotion: 'happy' });
        const reply = `¡Hola! Estás probando el mini-chat de **Rowan** dentro del Dynamic Island en modo web interactivo. Escribiste: "${q}". En la app real de Windows puedo crear documentos .docx, abrir programas, controlar el brillo, tomar fotos y hablar contigo en Modo Live.`;
        const words = reply.split(' ');
        let i = 0;
        const iv = setInterval(() => {
          if (i < words.length) {
            this._dispatch({ type: 'chat_stream_token', stream_id: streamId, token: (i ? ' ' : '') + words[i] });
            i++;
          } else {
            clearInterval(iv);
            this._dispatch({ type: 'chat_stream_end', stream_id: streamId, full_text: reply });
          }
        }, 35);
      } else if (msg.type === 'live_toggle') {
        this._live = !this._live;
        this._dispatch({ type: 'live_state', active: this._live, state: this._live ? 'listening' : 'idle' });
      } else if (msg.type === 'surface_rpc') {
        this._dispatch({ type: 'surface_rpc_result', id: msg.id, result: { ok: true, user_name: 'Usuario' } });
      }
    }
    close() { this.readyState = 3; }
  }
  window.WebSocket = function (url, protocols) {
    if (String(url).includes('127.0.0.1:18889')) {
      return new MockRowanWebSocket(url);
    }
    return protocols ? new NativeWebSocket(url, protocols) : new NativeWebSocket(url);
  };
})();
