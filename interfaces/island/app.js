// =================================================================
// CUSTOM ISLAND - ADVANCED REACTIVE APPLICATION LOGIC
// Dynamic Island Real-Time Animations, Hardware Radios (Wi-Fi/Bluetooth),
// Smart Pause Handling, Calendar & Task Scheduling, and Zero-Emoji SVGs
// =================================================================

document.addEventListener('DOMContentLoaded', async () => {
  // Root and Notch Container Elements
  const container = document.getElementById('island-container');
  const pill = document.getElementById('island-pill');
  const pillIdleView = document.getElementById('pill-idle-view');
  const pillMusicView = document.getElementById('pill-music-view');
  const pillAlertView = document.getElementById('pill-alert-view');
  const pillAlertIcon = document.getElementById('pill-alert-icon');
  const pillAlertTitle = document.getElementById('pill-alert-title');
  const pillAlertSub = document.getElementById('pill-alert-sub');
  const pillAlertRight = document.getElementById('pill-alert-right');

  const pillClock = document.getElementById('pill-clock');
  const pillBatteryLevel = document.getElementById('pill-battery-level');
  const batteryFill = document.getElementById('battery-fill');
  const pillCoverImg = document.getElementById('pill-cover-img');
  const pillCoverPlaceholder = document.getElementById('pill-cover-placeholder');
  const pillStatusLyric = document.getElementById('pill-status-lyric');
  const pillEqualizer = document.getElementById('pill-equalizer');
  const notchAvatar = document.getElementById('notch-rowan-avatar');
  let isRowanDocked = true;
  const IDLE_PILL_WIDTH = 128;
  const DOCKED_IDLE_PILL_WIDTH = 170;
  container.classList.add('rowan-docked');
  container.style.setProperty('--pill-dynamic-width', `${DOCKED_IDLE_PILL_WIDTH}px`);

  const btnCollapse = document.getElementById('btn-collapse');
  const btnClose = document.getElementById('btn-close');
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // Web Audio Chime Synthesizer
  let audioCtx = null;
  function playHapticChime(freq = 600, type = 'sine', duration = 0.08) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {}
  }

  // ================= EXPAND / COLLAPSE & MOUSE PASS-THROUGH =================
  let pointerInteracting = false;
  let screenToolActive = false;
  container.addEventListener('pointerdown', () => { pointerInteracting = true; clearTimeout(leaveTimer); window.islandAPI.setInteracting?.(true); });
  window.addEventListener('pointerup', () => { pointerInteracting = false; window.islandAPI.setInteracting?.(false); if (!container.matches(':hover')) scheduleCollapse(); });
  window.addEventListener('pointercancel', () => { pointerInteracting = false; window.islandAPI.setInteracting?.(false); });
  let hoverTimer = null;
  let leaveTimer = null;
  // Pin: when active the expanded island stays open until unpinned or collapsed explicitly.
  let islandPinned = false;
  const btnPinIsland = document.getElementById('btn-pin-island');
  function setIslandPinned(value) {
    islandPinned = Boolean(value);
    container.classList.toggle('island-pinned', islandPinned);
    if (btnPinIsland) {
      btnPinIsland.classList.toggle('active', islandPinned);
      btnPinIsland.setAttribute('aria-pressed', String(islandPinned));
      btnPinIsland.title = islandPinned ? 'Desfijar island' : 'Fijar island abierto';
    }
    window.islandAPI.setPinned?.(islandPinned);
    if (islandPinned) {
      clearTimeout(leaveTimer);
    } else if (container.classList.contains('expanded') && !container.matches(':hover')) {
      scheduleCollapse();
    }
  }
  const HOVER_DELAY = 100;
  const LEAVE_DELAY = 500; // Strict 0.5s auto-collapse after mouse leaves

  function expandIsland() {
    if (screenToolActive) return;
    clearTimeout(hoverTimer);
    clearTimeout(leaveTimer);
    clearTimeout(alertTimeout);
    isAlertActive = false;
    container.classList.remove('notch-event-active');
    container.classList.remove('collapsed');
    container.classList.add('expanded');
    window.islandAPI.setIgnoreMouseEvents(false);
    window.islandAPI.expand();
    playHapticChime(580, 'sine', 0.1);
  }

  function collapseIsland() {
    clearTimeout(hoverTimer);
    clearTimeout(leaveTimer);
    container.classList.remove('expanded');
    container.classList.add('collapsed');

    // Close any open popovers or quick menus
    const wifiDrawer = document.getElementById('wifi-menu-drawer');
    const btDrawer = document.getElementById('bt-menu-drawer');
    const speakerDrawer = document.getElementById('speaker-menu-drawer');
    const lyricsDrawer = document.getElementById('lyrics-drawer');
    if (wifiDrawer) { wifiDrawer.classList.remove('open'); wifiDrawer.style.display = 'none'; }
    if (btDrawer) { btDrawer.classList.remove('open'); btDrawer.style.display = 'none'; }
    if (speakerDrawer) { speakerDrawer.classList.remove('open'); speakerDrawer.style.display = 'none'; }
    if (lyricsDrawer) lyricsDrawer.classList.remove('open');

    // Restore proper notch view smoothly
    if (isAlertActive) {
      switchNotchView('alert');
    } else if (currentPlaybackStatus === 'Playing' && container.classList.contains('has-music')) {
      switchNotchView('music');
      syncLyrics(getCurrentEstimatedPosition(), true);
    } else {
      switchNotchView('idle');
      setPillWidthIfChanged(getIdlePillWidth());
    }

    window.islandAPI.setIgnoreMouseEvents(true, { forward: true });
    window.islandAPI.collapse();
    playHapticChime(420, 'sine', 0.08);
  }

  function scheduleCollapse() {
    if (pointerInteracting) return;
    clearTimeout(hoverTimer);
    if (islandPinned && container.classList.contains('expanded')) return;
    if (container.classList.contains('expanded')) {
      clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => {
        collapseIsland();
      }, LEAVE_DELAY);
    } else {
      window.islandAPI.setIgnoreMouseEvents(true, { forward: true });
    }
  }

  if (window.islandAPI && window.islandAPI.onAutoCollapse) {
    window.islandAPI.onAutoCollapse(() => {
      if (pointerInteracting || islandPinned) return;
      collapseIsland();
    });
  }

  container.addEventListener('mouseenter', () => {
    window.islandAPI.setIgnoreMouseEvents(false);
    clearTimeout(leaveTimer);
    if (container.classList.contains('collapsed')) {
      hoverTimer = setTimeout(() => {
        expandIsland();
      }, HOVER_DELAY);
    }
  });

  container.addEventListener('mouseleave', () => {
    scheduleCollapse();
  });

  document.addEventListener('mouseleave', () => {
    scheduleCollapse();
  });

  window.addEventListener('blur', () => {
    scheduleCollapse();
  });

  pill.addEventListener('click', () => {
    expandIsland();
  });

  // Mouse wheel on collapsed pill to adjust volume
  pill.addEventListener('wheel', (e) => {
    if (container.classList.contains('collapsed')) {
      e.preventDefault();
      e.stopPropagation();
      clearTimeout(hoverTimer);
      const step = e.deltaY < 0 ? 5 : -5;
      const currentVal = parseInt(volumeSlider ? volumeSlider.value : masterVolume, 10) || masterVolume || 50;
      const nextVal = Math.max(0, Math.min(100, currentVal + step));
      if (nextVal !== currentVal) {
        updateMasterVolumeUI(nextVal, false);
        setMasterVolumeDebounced(nextVal);
        triggerVolumeAlert(nextVal, false);
      }
    }
  }, { passive: false });

  if (btnCollapse) btnCollapse.addEventListener('click', () => { setIslandPinned(false); collapseIsland(); });
  if (btnPinIsland) btnPinIsland.addEventListener('click', (e) => {
    e.stopPropagation();
    setIslandPinned(!islandPinned);
  });
  if (btnClose) btnClose.addEventListener('click', () => window.islandAPI.quitApp());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && container.classList.contains('expanded')) {
      setIslandPinned(false);
      collapseIsland();
    }
  });

  // ================= DYNAMIC ISLAND ALERT SYSTEM =================
  let currentNotchMode = 'idle'; // 'idle' | 'music' | 'alert'
  let isAlertActive = false;
  let alertTimeout = null;
  let _measureCanvas = null;
  let _measureCtx = null;

  function switchNotchView(targetMode) {
    if (isAlertActive && targetMode !== 'alert') {
      currentNotchMode = targetMode;
      return;
    }

    currentNotchMode = targetMode;
    pillIdleView.classList.toggle('active', targetMode === 'idle');
    pillMusicView.classList.toggle('active', targetMode === 'music');
    pillAlertView.classList.toggle('active', targetMode === 'alert');
  }

  function measureExactTextWidth(text, fontSpec) {
    if (!text) return 0;
    try {
      if (!_measureCanvas) {
        _measureCanvas = document.createElement('canvas');
        _measureCtx = _measureCanvas.getContext('2d');
      }
      _measureCtx.font = fontSpec || '600 12px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif';
      return _measureCtx.measureText(text).width;
    } catch {
      return text.length * 7.2;
    }
  }

  function showNotchAlert({ iconSvg, title, sub = '', rightHtml = '', tintClass = '', duration = 1800, dynamicWidth = null }) {
    if (container.classList.contains('expanded')) return;

    isAlertActive = true;
    container.classList.add('notch-event-active');
    clearTimeout(alertTimeout);

    // Populate alert contents
    pillAlertIcon.className = `pill-alert-icon ${tintClass}`;
    pillAlertIcon.innerHTML = iconSvg || '';
    pillAlertTitle.textContent = title || '';
    pillAlertSub.textContent = sub || '';
    pillAlertRight.innerHTML = rightHtml || '';

    // Measure exact width dynamically to fit the content cleanly
    let targetW = dynamicWidth;
    if (!targetW) {
      const fullText = (title && sub) ? `${title}  ${sub}` : (title || sub || '');
      const textW = measureExactTextWidth(fullText, '600 11px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif');
      const hasRight = Boolean(rightHtml && rightHtml.trim());
      const rightW = hasRight ? 64 : 0;
      targetW = Math.min(500, Math.max(160, Math.round(textW + 24 + 20 + 10 + rightW + 20)));
    }

    container.style.setProperty('--pill-dynamic-width', `${Math.round(targetW)}px`);
    switchNotchView('alert');
    playHapticChime(640, 'triangle', 0.05);

    alertTimeout = setTimeout(() => {
      isAlertActive = false;
      container.classList.remove('notch-event-active');
      // Revert smoothly to whichever mode was active before (music or idle)
      if (currentPlaybackStatus === 'Playing' && container.classList.contains('has-music')) {
        switchNotchView('music');
        syncLyrics(getCurrentEstimatedPosition(), true);
      } else {
        switchNotchView('idle');
        setPillWidthIfChanged(getIdlePillWidth());
      }
    }, duration);
  }

  // ================= TAB NAVIGATION & CONTROL =================
  function switchTab(tabName) {
    if (!tabName || typeof tabName !== 'string') return false;

    const currentNavBtns = document.querySelectorAll('.nav-btn');
    const currentTabContents = document.querySelectorAll('.tab-content');
    const targetBtn = document.querySelector(`.nav-btn[data-tab="${tabName}"]`);
    const targetContent = document.getElementById(`tab-${tabName}`);
    if (!targetBtn || !targetContent) return false;

    currentNavBtns.forEach(b => b.classList.remove('active'));
    currentTabContents.forEach(tc => tc.classList.remove('active'));

    targetBtn.classList.add('active');
    targetContent.classList.add('active');

    // If opening Rowan tab, automatically focus chat input
    if (tabName === 'rowan') {
      const chatInput = document.getElementById('rowan-chat-input');
      if (chatInput) {
        setTimeout(() => chatInput.focus(), 50);
      }
    } else if (tabName === 'clipboard') {
      window.islandAPI?.getClipboard?.().then(items => {
        if (Array.isArray(items)) {
          currentClips = items;
          renderClips();
        }
      }).catch(() => {});
    }

    playHapticChime(680, 'triangle', 0.05);
    return true;
  }

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      if (tabName) switchTab(tabName);
    });
  });

  window.switchTab = switchTab;

  // ================= CLOCK, NOTCH TIMER/STOPWATCH & BATTERY =================
  let timerInitialSeconds = 25 * 60;
  let timerRemainingSeconds = 25 * 60;
  let timerInterval = null;
  let swRunning = false;
  let swStartTime = 0;
  let swElapsed = 0;
  let swInterval = null;
  let swLaps = [];
  let _lastPillDynamicWidthPx = null;

  function setPillWidthIfChanged(px) {
    const rounded = Math.round(Number(px) || IDLE_PILL_WIDTH);
    if (_lastPillDynamicWidthPx === rounded) return;
    _lastPillDynamicWidthPx = rounded;
    container.style.setProperty('--pill-dynamic-width', `${rounded}px`);
  }

  function getIdlePillWidth() {
    const isDocked = Boolean(isRowanDocked || container.classList.contains('rowan-docked'));
    const hasTimer = Boolean(getActiveNotchTimerLabel());
    if (hasTimer) {
      return isDocked ? 186 : 146;
    }
    return isDocked ? DOCKED_IDLE_PILL_WIDTH : IDLE_PILL_WIDTH;
  }

  function getActiveNotchTimerLabel() {
    if (timerInterval !== null) {
      const h = Math.floor(timerRemainingSeconds / 3600);
      const m = Math.floor((timerRemainingSeconds % 3600) / 60);
      const s = timerRemainingSeconds % 60;
      return h > 0
        ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    if (swRunning) {
      const currentMs = swElapsed + (performance.now() - swStartTime);
      const totalSec = Math.floor(currentMs / 1000);
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return null;
  }

  function updateClock() {
    const activeTimerLabel = getActiveNotchTimerLabel();
    const isTimerRunning = Boolean(activeTimerLabel);
    window.rowanSurfaces?.setTimerActive?.(isTimerRunning);

    if (isTimerRunning && currentNotchMode === 'idle' && !isAlertActive) {
      if (pillClock.textContent !== activeTimerLabel) {
        pillClock.textContent = activeTimerLabel;
      }
      pillClock.style.color = '#38bdf8';
      if (container.classList.contains('collapsed')) {
        setPillWidthIfChanged(getIdlePillWidth());
      }
      return;
    }

    pillClock.style.color = '';
    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (pillClock.textContent !== timeLabel) {
      pillClock.textContent = timeLabel;
    }
    if (container.classList.contains('collapsed') && currentNotchMode === 'idle' && !isAlertActive) {
      setPillWidthIfChanged(getIdlePillWidth());
    }
  }
  updateClock();
  setInterval(updateClock, 250);

  const cardBatteryPct = document.getElementById('card-battery-pct');
  const cardBatteryFill = document.getElementById('card-battery-fill');
  const cardBatterySub = document.getElementById('card-battery-sub');
  let lastChargingState = null;

  if (navigator.getBattery) {
    navigator.getBattery().then(bat => {
      function updateBatteryUI(isInitial = false) {
        const pct = Math.round(bat.level * 100);
        pillBatteryLevel.textContent = `${pct}%`;
        batteryFill.style.width = `${pct}%`;
        if (cardBatteryPct) cardBatteryPct.textContent = `${pct}%`;
        if (cardBatteryFill) cardBatteryFill.style.width = `${pct}%`;

        if (bat.charging) {
          batteryFill.style.background = '#06b6d4';
          if (cardBatteryFill) cardBatteryFill.style.background = '#06b6d4';
          if (cardBatterySub) cardBatterySub.textContent = 'Cargando (Mains power)';
        } else {
          const col = pct <= 20 ? '#ef4444' : '#10b981';
          batteryFill.style.background = col;
          if (cardBatteryFill) cardBatteryFill.style.background = col;
          if (cardBatterySub) cardBatterySub.textContent = pct <= 20 ? 'Batería baja' : 'En batería';
        }

        // Trigger dynamic notch animation on charger connect/disconnect
        if (!isInitial && lastChargingState !== null && lastChargingState !== bat.charging) {
          if (bat.charging) {
            window.rowanSurfaces?.notifyActivity?.('charging');
            showNotchAlert({
              iconSvg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="7 12 10 9 10 11 13 11 10 15 10 13 7 13" fill="currentColor"></polygon><rect x="2" y="7" width="16" height="10" rx="2" ry="2"></rect></svg>',
              title: 'Cargando',
              sub: `${pct}%`,
              tintClass: 'green-tint',
              duration: 2500
            });
          } else {
            showNotchAlert({
              iconSvg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="16" height="10" rx="2" ry="2"></rect><line x1="22" y1="11" x2="22" y2="13"></line></svg>',
              title: 'En Batería',
              sub: `${pct}%`,
              duration: 2500
            });
          }
        }
        lastChargingState = bat.charging;
      }

      updateBatteryUI(true);
      bat.addEventListener('levelchange', () => updateBatteryUI(false));
      bat.addEventListener('chargingchange', () => updateBatteryUI(false));
    }).catch(() => {});
  }

  // System info in footer
  try {
    const sys = await window.islandAPI.getSystemInfo();
    const memTag = document.getElementById('sys-memory-tag');
    if (memTag) memTag.textContent = `RAM Island: ${sys.memoryMb} MB`;
  } catch {}

  // ================= MEDIA & SPOTIFY CONTROLS =================
  const albumCoverImg = document.getElementById('album-cover-img');
  const albumPlaceholder = document.getElementById('album-placeholder');
  const playerAmbientBlur = document.getElementById('player-ambient-blur');
  const trackTitle = document.getElementById('track-title');
  const trackArtist = document.getElementById('track-artist');
  const btnPlay = document.getElementById('btn-play');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');
  const playIcon = document.getElementById('play-icon');
  const progressBarBg = document.getElementById('progress-bar-bg');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const timeCurrent = document.getElementById('time-current');
  const timeTotal = document.getElementById('time-total');

  const btnToggleTheme = document.getElementById('btn-toggle-theme');
  const btnOpenLyricsDrawer = document.getElementById('btn-open-lyrics-drawer');
  const homeLyricsDrawer = document.getElementById('home-lyrics-drawer');
  const btnCloseLyricsDrawer = document.getElementById('btn-close-lyrics-drawer');
  const lyricsLines = document.getElementById('lyrics-lines');
  const btnSearchLyrics = document.getElementById('btn-search-lyrics');

  if (btnOpenLyricsDrawer && homeLyricsDrawer) {
    btnOpenLyricsDrawer.addEventListener('click', () => {
      homeLyricsDrawer.classList.toggle('open');
    });
  }
  if (btnCloseLyricsDrawer && homeLyricsDrawer) {
    btnCloseLyricsDrawer.addEventListener('click', () => {
      homeLyricsDrawer.classList.remove('open');
    });
  }

  let lastTrackSong = '';
  let activeMediaDuration = 0;
  let isDraggingProgress = false;
  let dragTargetSeconds = 0;
  let currentPlaybackStatus = 'Paused';
  let lastMediaPosition = 0;
  let lastMediaPositionTimestamp = performance.now();
  let currentLyricsLines = [];
  let lyricsRequestVersion = 0;
  let currentActiveLyricIndex = -1;

  function formatTime(seconds) {
    if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) {
      return '0:00';
    }
    const totalSec = Math.floor(seconds);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const remainingSec = totalSec % 60;
    const paddedSec = remainingSec.toString().padStart(2, '0');
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${paddedSec}`;
    }
    return `${minutes}:${paddedSec}`;
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Dynamic color extractor from album cover
  function updateAmbientColors(imgEl) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 24;
      canvas.height = 24;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgEl, 0, 0, 24, 24);
      const data = ctx.getImageData(0, 0, 24, 24).data;
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] + data[i+1] + data[i+2] > 70) {
          r += data[i];
          g += data[i+1];
          b += data[i+2];
          count++;
        }
      }
      if (count > 0) {
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        const glow1 = `rgba(${r}, ${g}, ${b}, 0.55)`;
        const glow2 = `rgba(${Math.max(0, r-35)}, ${Math.max(0, g-35)}, ${Math.max(0, b+30)}, 0.35)`;
        const subtle = `rgba(${r}, ${g}, ${b}, 0.25)`;
        container.style.setProperty('--cover-glow-1', glow1);
        container.style.setProperty('--cover-glow-2', glow2);
        container.style.setProperty('--cover-glow-subtle', subtle);
        if (playerAmbientBlur) {
          playerAmbientBlur.style.background = `radial-gradient(circle at center, ${glow1} 0%, transparent 70%)`;
        }
      }
    } catch {}
  }

  // ================= ROWAN NOTCH GROOVE DANCING CONTROLLER =================
  function updateNotchGrooveState() {
    const avatar = document.getElementById('notch-rowan-avatar');
    if (!avatar) return false;

    const isDocked = Boolean(isRowanDocked || container.classList.contains('rowan-docked'));
    const isPlaying = currentPlaybackStatus === 'Playing';
    const hasActiveLyric = currentLyricsLines.length > 0 &&
                           currentActiveLyricIndex >= 0 &&
                           Boolean(currentLyricsLines[currentActiveLyricIndex]) &&
                           Boolean(currentLyricsLines[currentActiveLyricIndex].text) &&
                           currentLyricsLines[currentActiveLyricIndex].text.trim() !== '' &&
                           currentLyricsLines[currentActiveLyricIndex].text.trim() !== '...';

    const shouldGroove = Boolean(isDocked && isPlaying);

    avatar.classList.toggle('notch-groove-active', shouldGroove);
    return shouldGroove;
  }

  function setNotchGrooveActive(active) {
    const avatar = document.getElementById('notch-rowan-avatar');
    if (avatar) {
      avatar.classList.toggle('notch-groove-active', Boolean(active));
    }
  }

  // Dynamic Notch Width Calculation based on Active Lyric
  function updateDynamicPillWidth(lyricText) {
    if (isAlertActive) return;
    const isDocked = Boolean(isRowanDocked || container.classList.contains('rowan-docked'));
    const minWidth = isDocked ? DOCKED_IDLE_PILL_WIDTH : IDLE_PILL_WIDTH;
    const overhead = isDocked ? 147 : 94;

    if (currentPlaybackStatus !== 'Playing' || !container.classList.contains('has-music')) {
      container.style.setProperty('--pill-dynamic-width', `${minWidth}px`);
      return;
    }
    const txt = (lyricText || '').trim();
    if (!txt || txt === '...') {
      container.style.setProperty('--pill-dynamic-width', `${minWidth}px`);
      return;
    }

    const textW = measureExactTextWidth(txt, '600 12px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif');
    // Non-text fixed width:
    // Base overhead = 94px; with docked avatar: 137px (94 + 43px expansion)
    const targetW = Math.min(500, Math.max(minWidth, Math.round(textW + overhead)));
    container.style.setProperty('--pill-dynamic-width', `${targetW}px`);
  }

  // Accurate interpolated position
  function getCurrentEstimatedPosition() {
    if (currentPlaybackStatus === 'Playing') {
      const elapsed = (performance.now() - lastMediaPositionTimestamp) / 1000;
      const est = lastMediaPosition + elapsed;
      return (activeMediaDuration > 0 && est > activeMediaDuration) ? activeMediaDuration : est;
    }
    return Math.max(0, lastMediaPosition);
  }

  // ================= LRC PARSER & BINARY SEARCH =================
  function parseLrc(lrcText) {
    if (typeof lrcText !== 'string' || !lrcText.trim()) {
      return { isSynced: false, lines: [] };
    }
    const rawLines = lrcText.split(/\r?\n/);
    const parsedLines = [];
    const hourRegex = /\[(\d{1,2}):(\d{2}):(\d{2})\.(\d{2,3})\]/g;
    const stdRegex = /\[(\d{1,2}):(\d{2})(?:[.:](\d{2,3}))?\]/g;

    for (const rawLine of rawLines) {
      const trimmed = rawLine.trim();
      if (!trimmed) continue;
      let matches = [...trimmed.matchAll(hourRegex)];
      let isHourFormat = matches.length > 0;
      if (!isHourFormat) matches = [...trimmed.matchAll(stdRegex)];
      if (matches.length === 0) continue;

      const text = trimmed.replace(isHourFormat ? hourRegex : stdRegex, '').trim();
      for (const match of matches) {
        let minutes = 0, seconds = 0, subSeconds = 0;
        if (isHourFormat) {
          const hours = parseInt(match[1], 10) || 0;
          minutes = parseInt(match[2], 10) || 0;
          seconds = parseInt(match[3], 10) || 0;
          subSeconds = (match[4] && match[4].length === 2) ? parseInt(match[4], 10)/100 : (parseInt(match[4]||'0', 10)/1000);
          parsedLines.push({ time: hours * 3600 + minutes * 60 + seconds + subSeconds, text });
        } else {
          minutes = parseInt(match[1], 10) || 0;
          seconds = parseInt(match[2], 10) || 0;
          subSeconds = (match[3] && match[3].length === 2) ? parseInt(match[3], 10)/100 : (parseInt(match[3]||'0', 10)/1000);
          parsedLines.push({ time: minutes * 60 + seconds + subSeconds, text });
        }
      }
    }
    parsedLines.sort((a, b) => a.time - b.time);
    return { isSynced: parsedLines.length > 0, lines: parsedLines };
  }

  function findActiveLyricIndex(lines, currentTime) {
    if (!Array.isArray(lines) || lines.length === 0) return -1;
    if (typeof currentTime !== 'number' || Number.isNaN(currentTime)) return -1;
    if (currentTime < lines[0].time) return -1;
    let low = 0, high = lines.length - 1, result = 0;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (lines[mid].time <= currentTime) {
        result = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return result;
  }

  let isUserScrollingLyrics = false;
  let lastUserLyricsScrollTime = 0;
  let userScrollDebounceTimer = null;

  function markUserScrollingLyrics() {
    lastUserLyricsScrollTime = Date.now();
    isUserScrollingLyrics = true;
    if (userScrollDebounceTimer) clearTimeout(userScrollDebounceTimer);
    userScrollDebounceTimer = setTimeout(() => {
      isUserScrollingLyrics = false;
    }, 3500);
  }

  if (lyricsLines) {
    lyricsLines.addEventListener('wheel', markUserScrollingLyrics, { passive: true });
    lyricsLines.addEventListener('touchstart', markUserScrollingLyrics, { passive: true });
  }

  function syncLyrics(currentTime, force = false) {
    if (currentLyricsLines.length === 0) {
      if (currentPlaybackStatus === 'Playing') {
        const title = trackTitle.textContent || 'Reproduciendo';
        if (pillStatusLyric.textContent !== title || force) {
          pillStatusLyric.textContent = title;
          updateDynamicPillWidth(title);
        }
      }
      return;
    }
    const activeIndex = findActiveLyricIndex(currentLyricsLines, currentTime);
    if (activeIndex === currentActiveLyricIndex && !force) return;

    currentActiveLyricIndex = activeIndex;

    // Update Notch Lyric Text & Dynamic Notch Width ONLY if music is Playing!
    if (currentPlaybackStatus === 'Playing') {
      if (activeIndex >= 0 && currentLyricsLines[activeIndex]) {
        const activeLine = currentLyricsLines[activeIndex];
        const txt = (activeLine.text || '').trim() || trackTitle.textContent || 'Reproduciendo';
        pillStatusLyric.textContent = txt;
        updateDynamicPillWidth(txt);
        updateNotchGrooveState();
      } else {
        const fallbackTitle = trackTitle.textContent || 'Reproduciendo';
        pillStatusLyric.textContent = fallbackTitle;
        updateDynamicPillWidth(fallbackTitle);
        setNotchGrooveActive(false);
      }
    } else {
      setNotchGrooveActive(false);
    }

    // Update Drawer line styles
    if (lyricsLines) {
      const lineElements = lyricsLines.querySelectorAll('.lyric-line');
      const suppressed = isUserScrollingLyrics || (Date.now() - lastUserLyricsScrollTime < 3500);
      lineElements.forEach((el, idx) => {
        if (activeIndex === -1) {
          el.className = 'lyric-line upcoming';
        } else if (idx < activeIndex) {
          el.className = 'lyric-line passed';
        } else if (idx === activeIndex) {
          el.className = 'lyric-line active';
          if (!suppressed) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else {
          el.className = 'lyric-line upcoming';
        }
      });
    }
  }

  // Real-time animation ticker for lyric synchronization at 100ms
  setInterval(() => {
    if (currentPlaybackStatus === 'Playing') {
      const estPos = getCurrentEstimatedPosition();
      syncLyrics(estPos);
      if (!isDraggingProgress && activeMediaDuration > 0) {
        const pct = Math.min(100, Math.max(0, (estPos / activeMediaDuration) * 100));
        progressBarFill.style.width = `${pct}%`;
        timeCurrent.textContent = formatTime(estPos);
      }
    }
  }, 100);

  // Fetch Synced Lyrics via LRCLIB
  async function fetchLiveLyrics(title, artist, album = '', duration = 0) {
    const requestVersion = ++lyricsRequestVersion;
    if (!lyricsLines) return;
    lyricsLines.innerHTML = `
      <div class="lyrics-notice">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        <p>Buscando letra sincronizada en LRCLIB...</p>
      </div>
    `;
    currentLyricsLines = [];
    currentActiveLyricIndex = -1;
    syncLyrics(getCurrentEstimatedPosition(), true);

    try {
      const lyrics = await window.islandAPI.getLyrics(title, artist, album, duration);
      if (requestVersion !== lyricsRequestVersion) return;
      if (!lyrics) {
        lyricsLines.innerHTML = `
          <div class="lyrics-notice">
            <p>Letra no encontrada en la base de datos.</p>
          </div>
        `;
        return;
      }

      let parsedLines = [];
      if (Array.isArray(lyrics.lines) && lyrics.lines.length > 0) {
        parsedLines = lyrics.lines;
      } else if (lyrics.syncedLyrics || lyrics.rawSynced) {
        const parsed = parseLrc(lyrics.syncedLyrics || lyrics.rawSynced);
        if (parsed.isSynced) parsedLines = parsed.lines;
      }

      if (parsedLines.length > 0) {
        currentLyricsLines = parsedLines;
        currentActiveLyricIndex = -1;
        lyricsLines.innerHTML = parsedLines.map((line, idx) => {
          return `<p class="lyric-line upcoming" data-index="${idx}" data-time="${line.time}">${escapeHtml(line.text || '...')}</p>`;
        }).join('');
        syncLyrics(getCurrentEstimatedPosition(), true);
      } else if (lyrics.plainLyrics) {
        lyricsLines.innerHTML = lyrics.plainLyrics.split('\n').map(l => `<p class="lyric-line">${escapeHtml(l)}</p>`).join('');
      } else {
        lyricsLines.innerHTML = '<div class="lyrics-notice"><p>Sin letra disponible para esta pista.</p></div>';
      }
    } catch {
      if (requestVersion !== lyricsRequestVersion) return;
      lyricsLines.innerHTML = '<div class="lyrics-notice"><p>Error al conectar con LRCLIB.</p></div>';
    }
  }

  // Click on lyric line in drawer seeks directly
  if (lyricsLines) {
    lyricsLines.addEventListener('click', async (e) => {
      const lineEl = e.target.closest('.lyric-line');
      if (!lineEl) return;
      const timeStr = lineEl.dataset.time;
      if (timeStr !== undefined && timeStr !== null) {
        const sec = parseFloat(timeStr);
        if (!isNaN(sec) && window.islandAPI && window.islandAPI.seekMedia) {
          await window.islandAPI.seekMedia(sec);
          lastMediaPosition = sec;
          lastMediaPositionTimestamp = performance.now();
          syncLyrics(sec, true);
        }
      }
    });
  }

  let manualPlayPauseLockUntil = 0;

  // Listen to Windows GSMTC Media Updates
  window.islandAPI.onMediaUpdate(async (media) => {
    if (media && media.active && performance.now() < manualPlayPauseLockUntil) {
      media.status = currentPlaybackStatus;
    }
    const isMediaPlayingNow = Boolean(media && media.active && (media.status === 'Playing' || media.status === 4 || String(media.status).toLowerCase() === 'playing'));
    // Publish playback before any early return or asynchronous lyric request.
    window.rowanSurfaces?.music(isMediaPlayingNow);
    if (!media || !media.active || !media.title) {
      ++lyricsRequestVersion;
      pillStatusLyric.textContent = '';
      // Idle state
      container.classList.remove('has-music');
      setNotchGrooveActive(false);
      if (!isAlertActive) {
        switchNotchView('idle');
        const isDocked = Boolean(isRowanDocked || container.classList.contains('rowan-docked'));
        container.style.setProperty('--pill-dynamic-width', `${isDocked ? DOCKED_IDLE_PILL_WIDTH : IDLE_PILL_WIDTH}px`);
      }

      if (albumCoverImg) { albumCoverImg.style.display = 'none'; albumCoverImg.src = ''; }
      if (albumPlaceholder) albumPlaceholder.style.display = 'flex';
      if (pillCoverImg) { pillCoverImg.style.display = 'none'; pillCoverImg.src = ''; }
      if (pillCoverPlaceholder) pillCoverPlaceholder.style.display = 'flex';

      trackTitle.textContent = 'Sin reproducción';
      trackArtist.textContent = 'Inicia música en Spotify o reproductor';
      pillEqualizer.classList.remove('playing');
      playIcon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"></polygon>`;
      progressBarFill.style.width = '0%';
      timeCurrent.textContent = '0:00';
      timeTotal.textContent = '0:00';
      activeMediaDuration = 0;
      currentPlaybackStatus = 'Paused';
      currentLyricsLines = [];
      lastTrackSong = '';
      return;
    }

    const isPlaying = media.status === 'Playing';
    const statusChanged = currentPlaybackStatus !== media.status;
    currentPlaybackStatus = media.status || 'Paused';

    // SMART PAUSE RULE: When music is paused, revert notch to normal idle state!
    if (isPlaying) {
      container.classList.add('has-music');
      if (!isAlertActive) switchNotchView('music');
      playIcon.innerHTML = `<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>`;
      pillEqualizer.classList.add('playing');
    } else {
      // Return notch cleanly to normal/idle state when paused!
      container.classList.remove('has-music');
      setNotchGrooveActive(false);
      if (!isAlertActive) {
        switchNotchView('idle');
        const isDocked = Boolean(isRowanDocked || container.classList.contains('rowan-docked'));
        container.style.setProperty('--pill-dynamic-width', `${isDocked ? DOCKED_IDLE_PILL_WIDTH : IDLE_PILL_WIDTH}px`);
      }
      playIcon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"></polygon>`;
      pillEqualizer.classList.remove('playing');
    }

    // Album cover & ambient glow in expanded player
    if (media.thumbnail) {
      if (albumCoverImg.src !== media.thumbnail) {
        albumCoverImg.src = media.thumbnail;
        albumCoverImg.onload = () => updateAmbientColors(albumCoverImg);
      }
      albumCoverImg.style.display = 'block';
      if (albumPlaceholder) albumPlaceholder.style.display = 'none';

      if (pillCoverImg) {
        if (pillCoverImg.src !== media.thumbnail) pillCoverImg.src = media.thumbnail;
        pillCoverImg.style.display = 'block';
      }
      if (pillCoverPlaceholder) pillCoverPlaceholder.style.display = 'none';
    } else {
      if (albumCoverImg) { albumCoverImg.style.display = 'none'; albumCoverImg.src = ''; }
      if (albumPlaceholder) albumPlaceholder.style.display = 'flex';
      if (pillCoverImg) { pillCoverImg.style.display = 'none'; pillCoverImg.src = ''; }
      if (pillCoverPlaceholder) pillCoverPlaceholder.style.display = 'flex';
    }

    // Metadata
    trackTitle.textContent = media.title;
    trackArtist.textContent = `${media.artist || 'Artista desconocido'}${media.album ? ' • ' + media.album : ''}`;

    const incomingPos = typeof media.position === 'number' ? media.position : 0;
    const est = getCurrentEstimatedPosition();
    if (statusChanged || !isPlaying || Math.abs(incomingPos - est) > 0.8) {
      lastMediaPosition = incomingPos;
      lastMediaPositionTimestamp = performance.now();
    }

    activeMediaDuration = (typeof media.duration === 'number' && media.duration > 0) ? media.duration : 0;
    timeTotal.textContent = formatTime(activeMediaDuration);

    // Fetch Lyrics on track change
    const trackKey = `${media.title} - ${media.artist}`;
    if (trackKey !== lastTrackSong) {
      lastTrackSong = trackKey;
      setNotchGrooveActive(false);
      fetchLiveLyrics(media.title, media.artist, media.album, media.duration);
    }

    if (isPlaying) {
      syncLyrics(getCurrentEstimatedPosition());
    }
  });

  // Playback control buttons (with optimistic UI update for instant feedback)
  btnPlay.addEventListener('click', async () => {
    const nextPlaying = currentPlaybackStatus !== 'Playing';
    currentPlaybackStatus = nextPlaying ? 'Playing' : 'Paused';
    manualPlayPauseLockUntil = performance.now() + 1600;
    lastMediaPositionTimestamp = performance.now();
    if (playIcon) {
      playIcon.innerHTML = nextPlaying
        ? `<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>`
        : `<polygon points="5 3 19 12 5 21 5 3"></polygon>`;
    }
    if (pillEqualizer) pillEqualizer.classList.toggle('playing', nextPlaying);
    if (nextPlaying) {
      container.classList.add('has-music');
      if (!isAlertActive) switchNotchView('music');
    } else {
      container.classList.remove('has-music');
      setNotchGrooveActive(false);
      if (!isAlertActive) {
        switchNotchView('idle');
        const isDocked = Boolean(isRowanDocked || container.classList.contains('rowan-docked'));
        container.style.setProperty('--pill-dynamic-width', `${isDocked ? DOCKED_IDLE_PILL_WIDTH : IDLE_PILL_WIDTH}px`);
      }
    }
    window.rowanSurfaces?.music?.(nextPlaying);
    if (nextPlaying) window.rowanSurfaces?.notifyActivity?.('media');
    playHapticChime(640, 'triangle', 0.06);
    await window.islandAPI.controlMedia('toggle');
  });
  btnPrev.addEventListener('click', async () => {
    manualPlayPauseLockUntil = 0;
    playHapticChime(550, 'triangle', 0.05);
    await window.islandAPI.controlMedia('prev');
  });
  btnNext.addEventListener('click', async () => {
    manualPlayPauseLockUntil = 0;
    playHapticChime(720, 'triangle', 0.05);
    await window.islandAPI.controlMedia('next');
  });

  // Scrubber Seeking (Drag and Click)
  function handleSeekFromEvent(e) {
    if (!progressBarBg || activeMediaDuration <= 0) return;
    const rect = progressBarBg.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const seekSec = ratio * activeMediaDuration;
    progressBarFill.style.width = `${ratio * 100}%`;
    timeCurrent.textContent = formatTime(seekSec);
    dragTargetSeconds = seekSec;
  }

  progressBarBg.addEventListener('mousedown', (e) => {
    if (activeMediaDuration <= 0) return;
    isDraggingProgress = true;
    handleSeekFromEvent(e);
  });

  window.addEventListener('mousemove', (e) => {
    if (isDraggingProgress) {
      handleSeekFromEvent(e);
    }
  });

  window.addEventListener('mouseup', async () => {
    if (isDraggingProgress) {
      isDraggingProgress = false;
      if (window.islandAPI && window.islandAPI.seekMedia) {
        await window.islandAPI.seekMedia(dragTargetSeconds);
        lastMediaPosition = dragTargetSeconds;
        lastMediaPositionTimestamp = performance.now();
        syncLyrics(dragTargetSeconds, true);
      }
    }
  });

  // ================= MASTER VOLUME & NOTCH ALERT =================
  const volumeSlider = document.getElementById('volume-slider');
  const volumeVal = document.getElementById('volume-val');
  const btnVolumeMute = document.getElementById('btn-volume-mute');
  let masterVolume = 80;
  let isMasterMuted = false;
  let volumeDebounceTimer = null;

  function triggerVolumeAlert(vol, muted) {
    const volIcon = muted
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"></line><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon></svg>'
      : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';
    showNotchAlert({
      iconSvg: volIcon,
      title: 'Volumen',
      sub: muted ? 'Silenciado' : `${vol}%`,
      rightHtml: `<div class="mini-alert-bar-bg"><div class="mini-alert-bar-fill" style="width:${muted ? 0 : vol}%;"></div></div>`,
      duration: 1500,
      dynamicWidth: 215
    });
  }

  function updateMasterVolumeUI(vol, muted) {
    masterVolume = vol;
    isMasterMuted = muted;
    if (volumeSlider) volumeSlider.value = vol;
    if (volumeVal) volumeVal.textContent = `${vol}`;
  }

  let lastVolumeSentAt = 0;
  function setMasterVolumeDebounced(level) {
    const now = performance.now();
    if (now - lastVolumeSentAt >= 20) {
      lastVolumeSentAt = now;
      window.islandAPI.setMasterVolume(level).catch(() => {});
      return;
    }
    clearTimeout(volumeDebounceTimer);
    volumeDebounceTimer = setTimeout(async () => {
      lastVolumeSentAt = performance.now();
      try {
        await window.islandAPI.setMasterVolume(level);
      } catch {}
    }, 20);
  }

  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      const vol = parseInt(e.target.value, 10);
      updateMasterVolumeUI(vol, false);
      setMasterVolumeDebounced(vol);
      triggerVolumeAlert(vol, false);
    });
  }

  if (btnVolumeMute) {
    btnVolumeMute.addEventListener('click', async () => {
      isMasterMuted = !isMasterMuted;
      try {
        await window.islandAPI.setMasterMute(isMasterMuted);
        const lvl = isMasterMuted ? 0 : (masterVolume || 50);
        updateMasterVolumeUI(lvl, isMasterMuted);
        triggerVolumeAlert(lvl, isMasterMuted);
      } catch {}
    });
  }

  // Load initial volume (non-blocking so UI tabs initialize immediately)
  let isInitialVolumeLoaded = false;
  window.islandAPI?.getMasterVolume?.().then((volData) => {
    if (volData) {
      updateMasterVolumeUI(volData.volume, volData.muted);
    }
  }).catch(() => {});

  // Master Volume Hardware and External change listener (laptop keys, mute keys, Fn keys)
  if (window.islandAPI && window.islandAPI.onMasterVolumeChanged) {
    window.islandAPI.onMasterVolumeChanged((data) => {
      if (!data || typeof data.volume !== 'number') return;
      const vol = Math.max(0, Math.min(100, Math.round(data.volume)));
      const muted = Boolean(data.muted);

      const changed = (vol !== masterVolume || muted !== isMasterMuted);
      updateMasterVolumeUI(vol, muted);

      if (isInitialVolumeLoaded && changed) {
        triggerVolumeAlert(vol, muted);
      }
      isInitialVolumeLoaded = true;
    });
  }

  // ================= TOPBAR MICROPHONE CONTROL & HARDWARE ALERT =================
  const btnToggleMic = document.getElementById('btn-toggle-mic');
  let isMicMuted = false;
  let isInitialMicLoaded = false;

  function triggerMicAlert(muted) {
    const micIcon = muted
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>'
      : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>';

    showNotchAlert({
      iconSvg: micIcon,
      title: muted ? 'Micrófono Silenciado' : 'Micrófono Activado',
      sub: muted ? 'Mudo' : 'Activo',
      tintClass: muted ? 'red-tint' : 'green-tint',
      duration: 2000,
      dynamicWidth: 220
    });
  }

  async function checkMicStatus() {
    try {
      const mic = await window.islandAPI.getMic();
      if (mic) {
        isMicMuted = Boolean(mic.muted);
        if (btnToggleMic) {
          btnToggleMic.style.color = isMicMuted ? '#ef4444' : '#10b981';
        }
      }
    } catch {}
  }
  checkMicStatus();

  // Laptop hardware mic button event & CoreAudio watcher
  if (window.islandAPI && window.islandAPI.onMicChanged) {
    window.islandAPI.onMicChanged((data) => {
      if (!data || typeof data.muted !== 'boolean') return;
      const muted = data.muted;
      if (btnToggleMic) {
        btnToggleMic.style.color = muted ? '#ef4444' : '#10b981';
      }
      if (!isInitialMicLoaded) {
        isInitialMicLoaded = true;
        isMicMuted = muted;
        return;
      }
      if (muted === isMicMuted) return;
      isMicMuted = muted;
      triggerMicAlert(isMicMuted);
    });
  }

  if (btnToggleMic) {
    btnToggleMic.addEventListener('click', async () => {
      try {
        const res = await window.islandAPI.toggleMic();
        const muted = Boolean(res.muted);
        isMicMuted = muted;
        btnToggleMic.style.color = isMicMuted ? '#ef4444' : '#10b981';
        triggerMicAlert(isMicMuted);
      } catch {}
    });
  }

  // ================= CLIPBOARD COPY & PASTE NOTIFICATION ALERTS =================
  let lastPasteAlertTime = 0;
  function triggerPasteAlert() {
    const now = Date.now();
    if (now - lastPasteAlertTime < 800) return;
    lastPasteAlertTime = now;

    showNotchAlert({
      iconSvg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><line x1="12" y1="11" x2="12" y2="17"></line><polyline points="9 14 12 17 15 14"></polyline></svg>',
      title: '¡Pegado!',
      sub: '',
      rightHtml: '',
      tintClass: 'blue-tint',
      duration: 1800,
      dynamicWidth: 165
    });
  }

  window.islandAPI.onClipboardCopied((item) => {
    if (item && item.text) {
      if (typeof currentClips !== 'undefined' && Array.isArray(currentClips)) {
        const existing = currentClips.filter(i => i.text !== item.text);
        currentClips = [item, ...existing].slice(0, 100);
        if (typeof renderClips === 'function') renderClips();
      }
      window.rowanSurfaces?.notifyActivity?.('notification');
      showNotchAlert({
        iconSvg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        title: '¡Copiado!',
        sub: '',
        rightHtml: '',
        tintClass: 'green-tint',
        duration: 1800,
        dynamicWidth: 165
      });
    }
  });

  if (window.islandAPI && window.islandAPI.onClipboardPasted) {
    window.islandAPI.onClipboardPasted(() => {
      triggerPasteAlert();
    });
  }

  document.addEventListener('paste', () => {
    triggerPasteAlert();
  });

  // ================= NATIVE WI-FI & BLUETOOTH CONTROLS =================
  const cardWifi = document.getElementById('card-wifi');
  const wifiStatusText = document.getElementById('wifi-status-text');
  const wifiIconCircle = document.getElementById('wifi-icon-circle');
  const btnWifiMenu = document.getElementById('btn-wifi-menu');
  const wifiMenuDrawer = document.getElementById('wifi-menu-drawer');
  const wifiNetworksList = document.getElementById('wifi-networks-list');
  const btnRefreshWifi = document.getElementById('btn-refresh-wifi');

  const cardBluetooth = document.getElementById('card-bluetooth');
  const bluetoothStatusText = document.getElementById('bluetooth-status-text');
  const btIconCircle = document.getElementById('bt-icon-circle');
  const btnBtMenu = document.getElementById('btn-bt-menu');
  const btMenuDrawer = document.getElementById('bt-menu-drawer');
  const btDevicesList = document.getElementById('bt-devices-list');
  const btnRefreshBt = document.getElementById('btn-refresh-bt');

  let currentWifiState = 'On';
  let currentBtState = 'On';
  let activeWifiSsid = '';
  let connectedBtDevice = '';

  async function loadRadiosStatus() {
    try {
      const status = await window.islandAPI.getRadios();
      if (status) {
        if (status.wifi) {
          currentWifiState = status.wifi.state || 'On';
          activeWifiSsid = status.wifi.ssid || '';
          if (wifiStatusText) {
            wifiStatusText.textContent = currentWifiState === 'On' ? (activeWifiSsid || 'On') : 'Off';
          }
          if (wifiIconCircle) {
            wifiIconCircle.style.background = currentWifiState === 'On' ? '#7c8cf8' : 'rgba(255, 255, 255, 0.1)';
          }
        }
        if (status.bluetooth) {
          currentBtState = status.bluetooth.state || 'On';
          connectedBtDevice = status.bluetooth.connectedDevice || '';
          if (bluetoothStatusText) {
            bluetoothStatusText.textContent = currentBtState === 'On' ? (connectedBtDevice || 'On') : 'Off';
          }
          if (btIconCircle) {
            btIconCircle.style.background = currentBtState === 'On' ? '#7c8cf8' : 'rgba(255, 255, 255, 0.1)';
          }
        }
      }
    } catch {}
  }
  loadRadiosStatus();

  // 1. Wi-Fi Toggle directly from app
  if (cardWifi) {
    cardWifi.addEventListener('click', async (e) => {
      if (e.target.closest('#btn-wifi-menu')) return;
      try {
        const res = await window.islandAPI.toggleRadio('wifi');
        if (res && res.state) {
          currentWifiState = res.state;
          if (wifiStatusText) wifiStatusText.textContent = currentWifiState;
          if (wifiIconCircle) {
            wifiIconCircle.style.background = currentWifiState === 'On' ? '#7c8cf8' : 'rgba(255, 255, 255, 0.1)';
          }
          showNotchAlert({
            iconSvg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path></svg>',
            title: 'Wi-Fi',
            sub: currentWifiState === 'On' ? (activeWifiSsid ? `Conectado a ${activeWifiSsid}` : 'Activado') : 'Desactivado',
            tintClass: currentWifiState === 'On' ? 'blue-tint' : '',
            duration: 2500
          });
        }
      } catch {}
    });
  }

  // 2. Wi-Fi Networks Menu (3 lines button)
  async function fetchWifiNetworks() {
    if (!wifiNetworksList) return;
    wifiNetworksList.innerHTML = '<p class="drawer-loading">Buscando redes Wi-Fi...</p>';
    try {
      const networks = await window.islandAPI.getWifiNetworks();
      if (!Array.isArray(networks) || networks.length === 0) {
        wifiNetworksList.innerHTML = '<p class="drawer-loading">No se encontraron redes visibles.</p>';
        return;
      }
      wifiNetworksList.innerHTML = networks.map(net => `
        <div class="drawer-network-row" data-ssid="${escapeHtml(net.ssid)}">
          <span class="drawer-item-name">${escapeHtml(net.ssid)}</span>
          <span class="drawer-item-action">Conectar</span>
        </div>
      `).join('');

      wifiNetworksList.querySelectorAll('.drawer-network-row').forEach(row => {
        row.addEventListener('click', async () => {
          const ssid = row.getAttribute('data-ssid');
          if (ssid) {
            await window.islandAPI.connectWifi(ssid);
            activeWifiSsid = ssid;
            if (wifiStatusText) wifiStatusText.textContent = ssid;
            showNotchAlert({
              iconSvg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path></svg>',
              title: 'Wi-Fi Conectado',
              sub: ssid,
              tintClass: 'blue-tint',
              duration: 2600
            });
            wifiMenuDrawer.style.display = 'none';
          }
        });
      });
    } catch {
      wifiNetworksList.innerHTML = '<p class="drawer-loading">Error al escanear redes.</p>';
    }
  }

  if (btnWifiMenu) {
    btnWifiMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      if (wifiMenuDrawer.style.display === 'none') {
        wifiMenuDrawer.style.display = 'flex';
        if (btMenuDrawer) btMenuDrawer.style.display = 'none';
        const spkDrawer = document.getElementById('speaker-menu-drawer');
        if (spkDrawer) spkDrawer.style.display = 'none';
        fetchWifiNetworks();
      } else {
        wifiMenuDrawer.style.display = 'none';
      }
    });
  }
  if (btnRefreshWifi) {
    btnRefreshWifi.addEventListener('click', (e) => {
      e.stopPropagation();
      fetchWifiNetworks();
    });
  }

  // 3. Bluetooth Toggle directly from app
  if (cardBluetooth) {
    cardBluetooth.addEventListener('click', async (e) => {
      if (e.target.closest('#btn-bt-menu')) return;
      try {
        const res = await window.islandAPI.toggleRadio('bluetooth');
        if (res && res.state) {
          currentBtState = res.state;
          if (bluetoothStatusText) bluetoothStatusText.textContent = currentBtState;
          if (btIconCircle) {
            btIconCircle.style.background = currentBtState === 'On' ? '#7c8cf8' : 'rgba(255, 255, 255, 0.1)';
          }
          showNotchAlert({
            iconSvg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"></polyline></svg>',
            title: 'Bluetooth',
            sub: currentBtState === 'On' ? (connectedBtDevice ? `${connectedBtDevice} Conectado` : 'Activado') : 'Desactivado',
            tintClass: currentBtState === 'On' ? 'blue-tint' : '',
            duration: 2500
          });
        }
      } catch {}
    });
  }

  // 4. Bluetooth Devices Menu (3 lines button)
  async function fetchBtDevices() {
    if (!btDevicesList) return;
    btDevicesList.innerHTML = '<p class="drawer-loading">Buscando dispositivos vinculados...</p>';
    try {
      const devs = await window.islandAPI.getBluetoothDevices();
      if (!Array.isArray(devs) || devs.length === 0) {
        btDevicesList.innerHTML = '<p class="drawer-loading">No hay dispositivos vinculados.</p>';
        return;
      }
      btDevicesList.innerHTML = devs.map(d => `
        <div class="drawer-device-row" data-name="${escapeHtml(d.name)}">
          <span class="drawer-item-name">${escapeHtml(d.name)}</span>
          <span class="drawer-item-action">${d.connected ? 'Conectado' : 'Vincular'}</span>
        </div>
      `).join('');

      btDevicesList.querySelectorAll('.drawer-device-row').forEach(row => {
        row.addEventListener('click', () => {
          const devName = row.getAttribute('data-name');
          connectedBtDevice = devName;
          if (bluetoothStatusText) bluetoothStatusText.textContent = devName;
          showNotchAlert({
            iconSvg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"></polyline></svg>',
            title: 'Dispositivo Conectado',
            sub: devName,
            tintClass: 'blue-tint',
            duration: 2800
          });
          btMenuDrawer.style.display = 'none';
        });
      });
    } catch {
      btDevicesList.innerHTML = '<p class="drawer-loading">Error al escanear dispositivos.</p>';
    }
  }

  if (btnBtMenu) {
    btnBtMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      if (btMenuDrawer.style.display === 'none') {
        btMenuDrawer.style.display = 'flex';
        if (wifiMenuDrawer) wifiMenuDrawer.style.display = 'none';
        const spkDrawer = document.getElementById('speaker-menu-drawer');
        if (spkDrawer) spkDrawer.style.display = 'none';
        fetchBtDevices();
      } else {
        btMenuDrawer.style.display = 'none';
      }
    });
  }
  if (btnRefreshBt) {
    btnRefreshBt.addEventListener('click', (e) => {
      e.stopPropagation();
      fetchBtDevices();
    });
  }

  // ================= OTHER SYSTEM CONTROLS =================
  const cardDarkTheme = document.getElementById('card-darktheme');
  const cardBattery = document.getElementById('card-battery');
  const btnSysLock = document.getElementById('btn-sys-lock');
  const btnSysSleep = document.getElementById('btn-sys-sleep');
  const btnSysRestart = document.getElementById('btn-sys-restart');
  const btnSysShutdown = document.getElementById('btn-sys-shutdown');

  if (cardBattery) {
    cardBattery.addEventListener('click', () => {
      window.islandAPI.openSettings('battery');
      playHapticChime(640, 'sine', 0.05);
    });
  }
  // Dark / Light Theme Management
  let currentTheme = localStorage.getItem('island_theme') || 'dark';

  function applyTheme(theme) {
    currentTheme = theme;
    const isLight = theme === 'light';
    document.body.classList.toggle('light-theme', isLight);
    try { localStorage.setItem('island_theme', theme); } catch {}

    if (btnToggleTheme) {
      btnToggleTheme.innerHTML = isLight
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 0 0 0 20z" fill="currentColor"></path></svg>';
      btnToggleTheme.title = isLight ? 'Cambiar a Tema Oscuro' : 'Cambiar a Tema Claro';
    }

    if (cardDarkTheme) {
      const titleEl = cardDarkTheme.querySelector('.sys-card-title');
      const subEl = cardDarkTheme.querySelector('.sys-card-sub');
      if (titleEl) titleEl.textContent = isLight ? 'Light theme' : 'Dark theme';
      if (subEl) subEl.textContent = 'On';
    }
  }

  function toggleTheme() {
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
    playHapticChime(nextTheme === 'light' ? 740 : 480, 'sine', 0.08);

    showNotchAlert({
      iconSvg: nextTheme === 'light'
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
      title: nextTheme === 'light' ? 'Tema Claro' : 'Tema Oscuro',
      sub: 'Activado',
      tintClass: nextTheme === 'light' ? 'amber-tint' : 'blue-tint',
      duration: 1800,
      dynamicWidth: 175
    });
  }

  if (cardDarkTheme) {
    cardDarkTheme.addEventListener('click', toggleTheme);
  }
  if (btnToggleTheme) {
    btnToggleTheme.addEventListener('click', toggleTheme);
  }
  applyTheme(currentTheme);

  // Bottom action buttons
  if (btnSysLock) {
    btnSysLock.addEventListener('click', () => {
      playHapticChime(400, 'square', 0.1);
      window.islandAPI.systemAction('lock');
    });
  }
  if (btnSysSleep) {
    btnSysSleep.addEventListener('click', () => {
      playHapticChime(350, 'sine', 0.15);
      window.islandAPI.systemAction('sleep');
    });
  }
  if (btnSysRestart) {
    btnSysRestart.addEventListener('click', () => {
      if (confirm('¿Deseas reiniciar el equipo ahora?')) {
        window.islandAPI.systemAction('restart');
      }
    });
  }
  if (btnSysShutdown) {
    btnSysShutdown.addEventListener('click', () => {
      if (confirm('¿Deseas apagar el equipo ahora?')) {
        window.islandAPI.systemAction('shutdown');
      }
    });
  }

  // ================= HOME DIRECT ACCESS SHORTCUTS =================
  const homeShelfDropzone = document.getElementById('home-shelf-dropzone');
  const homeShelfEmptyPrompt = document.getElementById('home-shelf-empty-prompt');
  const homeShortcutsList = document.getElementById('home-shortcuts-list');
  let directShortcuts = [];

  try {
    const saved = localStorage.getItem('island_home_shortcuts');
    if (saved) directShortcuts = JSON.parse(saved);
  } catch {}

  function getShortcutSvgIcon(filePath) {
    const lower = (filePath || '').toLowerCase();
    if (lower.endsWith('.lnk') || lower.endsWith('.exe')) {
      return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
    }
    if (lower.endsWith('.mp3') || lower.endsWith('.flac') || lower.endsWith('.wav') || lower.endsWith('.ogg')) {
      return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>';
    }
    if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp') || lower.endsWith('.gif')) {
      return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
    }
    if (!lower.includes('.') || lower.endsWith('\\') || lower.endsWith('/')) {
      return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>';
    }
    return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';
  }

  function renderDirectShortcuts() {
    if (!homeShortcutsList || !homeShelfEmptyPrompt) return;
    if (!directShortcuts || directShortcuts.length === 0) {
      homeShortcutsList.style.display = 'none';
      homeShortcutsList.innerHTML = '';
      homeShelfEmptyPrompt.style.display = 'flex';
      return;
    }

    homeShelfEmptyPrompt.style.display = 'none';
    homeShortcutsList.style.display = 'flex';

    homeShortcutsList.innerHTML = directShortcuts.map((item) => `
      <div class="direct-shortcut-item" data-id="${item.id}" title="${escapeHtml(item.path || item.name)}">
        <span class="shortcut-icon">${getShortcutSvgIcon(item.path || item.name)}</span>
        <span class="shortcut-name">${escapeHtml(item.name)}</span>
        <button class="btn-del-shortcut" data-del-id="${item.id}" title="Eliminar acceso directo">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    `).join('') + `
      <div class="direct-shortcut-add" id="btn-add-direct-shortcut" title="Arrastra más accesos directos o archivos aquí">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </div>
    `;

    // Item launch click
    homeShortcutsList.querySelectorAll('.direct-shortcut-item').forEach(itemEl => {
      itemEl.addEventListener('click', (e) => {
        if (e.target.closest('.btn-del-shortcut')) return;
        const id = itemEl.getAttribute('data-id');
        const found = directShortcuts.find(s => String(s.id) === String(id));
        if (found && found.path) {
          playHapticChime(580, 'triangle', 0.08);
          window.islandAPI.launchApp(found.path);
        }
      });
    });

    // Delete click
    homeShortcutsList.querySelectorAll('.btn-del-shortcut').forEach(delBtn => {
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const delId = delBtn.getAttribute('data-del-id');
        directShortcuts = directShortcuts.filter(s => String(s.id) !== String(delId));
        try { localStorage.setItem('island_home_shortcuts', JSON.stringify(directShortcuts)); } catch {}
        renderDirectShortcuts();
        playHapticChime(420, 'sine', 0.06);
      });
    });
  }

  if (homeShelfDropzone) {
    homeShelfDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      homeShelfDropzone.classList.add('drag-active');
    });
    homeShelfDropzone.addEventListener('dragleave', () => {
      homeShelfDropzone.classList.remove('drag-active');
    });
    homeShelfDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      homeShelfDropzone.classList.remove('drag-active');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        for (const f of e.dataTransfer.files) {
          const rawName = f.name || 'Acceso directo';
          const cleanName = rawName.replace(/\.lnk$/i, '');
          directShortcuts.push({
            id: Date.now() + Math.floor(Math.random() * 1000),
            name: cleanName,
            path: f.path || f.name
          });
        }
        try { localStorage.setItem('island_home_shortcuts', JSON.stringify(directShortcuts)); } catch {}
        renderDirectShortcuts();
        playHapticChime(750, 'triangle', 0.09);
      }
    });
  }

  renderDirectShortcuts();

  // ================= CALENDAR & TASK SCHEDULING INTEGRATION =================
  function localDateKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }
  let calendarData = { dates: {} };
  let scheduledTasks = [];
  let currentCalDate = new Date();
  let selectedDateStr = localDateKey();

  const calMonthYear = document.getElementById('cal-month-year');
  const calDaysGrid = document.getElementById('cal-days-grid');
  const btnCalPrev = document.getElementById('btn-cal-prev');
  const btnCalNext = document.getElementById('btn-cal-next');
  const btnCalToday = document.getElementById('btn-cal-today');

  const agendaDateTitle = document.getElementById('agenda-date-title');
  const agendaDateSub = document.getElementById('agenda-date-sub');
  const agendaTasksList = document.getElementById('agenda-tasks-list');
  const agendaNotesList = document.getElementById('agenda-notes-list');
  const agendaNoteInput = document.getElementById('agenda-note-input');
  const btnAddAgendaNote = document.getElementById('btn-add-agenda-note');

  try {
    const loadedCal = await window.islandAPI.loadCalendar();
    if (loadedCal && loadedCal.dates) calendarData = loadedCal;
  } catch {}

  function formatDateSpanish(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  function renderCalendar() {
    if (!calDaysGrid || !calMonthYear) return;
    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();

    const monthName = currentCalDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    calMonthYear.textContent = monthName;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();

    let startDayIndex = (firstDay.getDay() + 6) % 7;
    const todayStr = localDateKey();
    let html = '';

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      html += `<div class="cal-day-cell other-month">${d}</div>`;
    }

    for (let day = 1; day <= totalDays; day++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = dStr === todayStr;
      const isSelected = dStr === selectedDateStr;

      const hasTasks = scheduledTasks.some(t => t.dueDate === dStr && !t.completed);
      const hasNotes = Boolean(calendarData.dates[dStr] && calendarData.dates[dStr].length > 0);

      let dotsHtml = '';
      if (hasTasks || hasNotes) {
        dotsHtml = `
          <div class="cal-dots-row">
            ${hasTasks ? '<span class="cal-dot task-dot"></span>' : ''}
            ${hasNotes ? '<span class="cal-dot note-dot"></span>' : ''}
          </div>
        `;
      }

      html += `
        <div class="cal-day-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-date="${dStr}">
          <span>${day}</span>
          ${dotsHtml}
        </div>
      `;
    }

    calDaysGrid.innerHTML = html;

    calDaysGrid.querySelectorAll('.cal-day-cell[data-date]').forEach(cell => {
      cell.addEventListener('click', () => {
        selectedDateStr = cell.getAttribute('data-date');
        renderCalendar();
        renderAgenda();
      });
    });
  }

  function renderAgenda() {
    if (!agendaDateTitle || !agendaTasksList || !agendaNotesList) return;
    agendaDateTitle.textContent = formatDateSpanish(selectedDateStr);
    const todayStr = localDateKey();
    agendaDateSub.textContent = selectedDateStr === todayStr ? 'Hoy' : (selectedDateStr < todayStr ? 'Fecha pasada' : 'Fecha futura');

    const tasksForDay = scheduledTasks.filter(t => t.dueDate === selectedDateStr);
    if (tasksForDay.length === 0) {
      agendaTasksList.innerHTML = '<p class="agenda-empty">No hay tareas programadas para este día.</p>';
    } else {
      agendaTasksList.innerHTML = tasksForDay.map(t => `
        <div class="agenda-task-item ${t.completed ? 'completed' : ''}" data-id="${t.id}">
          <input type="checkbox" ${t.completed ? 'checked' : ''} class="agenda-task-check">
          <span>${escapeHtml(t.text)}</span>
        </div>
      `).join('');

      agendaTasksList.querySelectorAll('.agenda-task-check').forEach(cb => {
        cb.addEventListener('change', (e) => {
          const id = Number(e.target.closest('.agenda-task-item').getAttribute('data-id'));
          const task = scheduledTasks.find(t => t.id === id);
          if (task) {
            task.completed = e.target.checked;
            saveChecklistTasks();
            renderChecklistUI();
            renderCalendar();
            renderAgenda();
          }
        });
      });
    }

    const notesForDay = calendarData.dates[selectedDateStr] || [];
    if (notesForDay.length === 0) {
      agendaNotesList.innerHTML = '<p class="agenda-empty">Sin notas para esta fecha.</p>';
    } else {
      agendaNotesList.innerHTML = notesForDay.map((n, idx) => `
        <div class="agenda-note-item">
          <span>${escapeHtml(n)}</span>
          <button class="btn-del-task" data-note-idx="${idx}" title="Eliminar"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
      `).join('');

      agendaNotesList.querySelectorAll('button[data-note-idx]').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.getAttribute('data-note-idx'));
          notesForDay.splice(idx, 1);
          if (notesForDay.length === 0) delete calendarData.dates[selectedDateStr];
          window.islandAPI.saveCalendar(calendarData);
          renderCalendar();
          renderAgenda();
        });
      });
    }
  }

  if (btnCalPrev) {
    btnCalPrev.addEventListener('click', () => {
      currentCalDate.setDate(1);
      currentCalDate.setMonth(currentCalDate.getMonth() - 1);
      renderCalendar();
    });
  }
  if (btnCalNext) {
    btnCalNext.addEventListener('click', () => {
      currentCalDate.setDate(1);
      currentCalDate.setMonth(currentCalDate.getMonth() + 1);
      renderCalendar();
    });
  }
  if (btnCalToday) {
    btnCalToday.addEventListener('click', () => {
      currentCalDate = new Date();
      selectedDateStr = localDateKey();
      renderCalendar();
      renderAgenda();
    });
  }

  if (btnAddAgendaNote && agendaNoteInput) {
    function addNoteForDate() {
      const text = agendaNoteInput.value.trim();
      if (!text) return;
      if (!calendarData.dates[selectedDateStr]) {
        calendarData.dates[selectedDateStr] = [];
      }
      calendarData.dates[selectedDateStr].push(text);
      agendaNoteInput.value = '';
      window.islandAPI.saveCalendar(calendarData);
      renderCalendar();
      renderAgenda();
      playHapticChime(750, 'triangle', 0.05);
    }
    btnAddAgendaNote.addEventListener('click', addNoteForDate);
    agendaNoteInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addNoteForDate();
    });
  }

  // ================= TAREAS (CHECKLIST CON FECHA OPCIONAL) =================
  const btnModeChecklist = document.getElementById('btn-mode-checklist');
  const btnModeText = document.getElementById('btn-mode-text');
  const checklistView = document.getElementById('checklist-view');
  const freetextView = document.getElementById('freetext-view');
  const newTaskInput = document.getElementById('new-task-input');
  const newTaskDate = document.getElementById('new-task-date');
  const btnAddTask = document.getElementById('btn-add-task');
  const checklistItems = document.getElementById('checklist-items');
  const freetextArea = document.getElementById('freetext-area');
  const notesSaveIndicator = document.getElementById('notes-save-indicator');

  btnModeChecklist.addEventListener('click', () => {
    btnModeChecklist.classList.add('active');
    btnModeText.classList.remove('active');
    checklistView.style.display = 'flex';
    freetextView.style.display = 'none';
  });

  btnModeText.addEventListener('click', () => {
    btnModeText.classList.add('active');
    btnModeChecklist.classList.remove('active');
    checklistView.style.display = 'none';
    freetextView.style.display = 'flex';
  });

  function renderChecklistUI() {
    if (!checklistItems) return;
    checklistItems.innerHTML = scheduledTasks.map(t => {
      const dateBadge = t.dueDate ? `<span class="task-date-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg> ${t.dueDate}</span>` : '';
      return `
        <li class="checklist-item ${t.completed ? 'completed' : ''}" data-id="${t.id}">
          <input type="checkbox" ${t.completed ? 'checked' : ''} class="task-checkbox">
          <span class="checklist-text">${escapeHtml(t.text)}</span>
          ${dateBadge}
          <button class="btn-del-task" title="Eliminar tarea"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </li>
      `;
    }).join('');

    checklistItems.querySelectorAll('.task-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = Number(e.target.closest('.checklist-item').getAttribute('data-id'));
        const t = scheduledTasks.find(item => item.id === id);
        if (t) {
          t.completed = e.target.checked;
          saveChecklistTasks();
          renderChecklistUI();
          renderCalendar();
          renderAgenda();
        }
      });
    });

    checklistItems.querySelectorAll('.btn-del-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idStr = String(btn.closest('.checklist-item').getAttribute('data-id'));
        scheduledTasks = scheduledTasks.filter(item => String(item.id) !== idStr);
        saveChecklistTasks();
        renderChecklistUI();
        renderCalendar();
        renderAgenda();
        playHapticChime(420, 'sine', 0.06);
      });
    });
  }

  async function saveChecklistTasks() {
    try {
      await window.islandAPI.saveNotes({
        tasks: scheduledTasks,
        text: freetextArea ? freetextArea.value : ''
      });
      if (notesSaveIndicator) {
        notesSaveIndicator.style.opacity = '1';
        setTimeout(() => { notesSaveIndicator.style.opacity = '0.5'; }, 1500);
      }
    } catch {}
  }

  function addNewTask() {
    const text = newTaskInput.value.trim();
    if (!text) return;
    const dueDate = newTaskDate.value || null;
    scheduledTasks.unshift({
      id: Math.max(Date.now(), ...scheduledTasks.map(t => Number(t.id) + 1).filter(Number.isFinite)),
      text,
      completed: false,
      dueDate
    });
    newTaskInput.value = '';
    newTaskDate.value = '';
    saveChecklistTasks();
    renderChecklistUI();
    renderCalendar();
    renderAgenda();
    playHapticChime(680, 'sine', 0.05);
  }

  if (btnAddTask) btnAddTask.addEventListener('click', addNewTask);
  if (newTaskInput) {
    newTaskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addNewTask();
    });
  }

  try {
    const loadedNotes = await window.islandAPI.loadNotes();
    if (loadedNotes) {
      if (Array.isArray(loadedNotes.tasks)) {
        scheduledTasks = loadedNotes.tasks;
      } else if (typeof loadedNotes.text === 'string') {
        const lines = loadedNotes.text.split('\n');
        scheduledTasks = lines.map((l, i) => {
          const checked = l.includes('[x]');
          const cleanText = l.replace(/^-\s*\[[ x]\]\s*/i, '').trim();
          return { id: Date.now() + i, text: cleanText || 'Tarea', completed: checked, dueDate: null };
        }).filter(t => t.text.length > 0);
      }
      if (freetextArea && typeof loadedNotes.text === 'string') {
        freetextArea.value = loadedNotes.text;
      }
      renderChecklistUI();
      renderCalendar();
      renderAgenda();
    }
  } catch {}

  if (freetextArea) {
    let freetextTimer = null;
    freetextArea.addEventListener('input', () => {
      clearTimeout(freetextTimer);
      freetextTimer = setTimeout(() => {
        saveChecklistTasks();
      }, 500);
    });
  }

  // ================= CLIPS TAB =================
  const clipsFeed = document.getElementById('clips-feed');
  const clipsSearchInput = document.getElementById('clips-search-input');
  const btnClearClips = document.getElementById('btn-clear-clips');
  const filterChips = document.querySelectorAll('.filter-chips .chip');
  let currentClips = [];
  let activeFilter = 'all';

  function renderClips() {
    if (!clipsFeed) return;
    const query = (clipsSearchInput ? clipsSearchInput.value : '').toLowerCase();
    const filtered = (Array.isArray(currentClips) ? currentClips : []).filter(c => {
      if (activeFilter !== 'all' && c.kind !== activeFilter) return false;
      if (query && !String(c.text || '').toLowerCase().includes(query)) return false;
      return true;
    });

    if (filtered.length === 0) {
      clipsFeed.innerHTML = '<p class="agenda-empty" style="text-align:center; padding: 20px;">No hay elementos en el portapapeles</p>';
      return;
    }

    clipsFeed.innerHTML = filtered.map(c => `
      <div class="clip-card" data-id="${c.id}">
        <div class="clip-meta">
          <span>${String(c.kind || 'text').toUpperCase()} • ${c.date || ''}</span>
          <span>${c.pinned ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 17v5"></path><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"></path></svg>' : ''}</span>
        </div>
        <div class="clip-text">${escapeHtml(c.text)}</div>
      </div>
    `).join('');

    clipsFeed.querySelectorAll('.clip-card').forEach(card => {
      card.addEventListener('click', async () => {
        const id = Number(card.getAttribute('data-id'));
        const clip = currentClips.find(c => c.id === id);
        if (clip) {
          await window.islandAPI.copyText(clip.text);
          playHapticChime(800, 'sine', 0.05);
        }
      });
    });
  }

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.getAttribute('data-filter');
      renderClips();
    });
  });

  if (clipsSearchInput) clipsSearchInput.addEventListener('input', renderClips);
  if (btnClearClips) {
    btnClearClips.addEventListener('click', async () => {
      const result = await window.islandAPI.clearClipboard();
      currentClips = Array.isArray(result) ? result : await window.islandAPI.getClipboard();
      renderClips();
    });
  }

  try {
    currentClips = await window.islandAPI.getClipboard();
    renderClips();
  } catch {}

  window.islandAPI.onClipboardUpdated?.(items => { currentClips = Array.isArray(items) ? items : []; renderClips(); });

  // ================= SHELF TAB =================
  const shelfCardsGrid = document.getElementById('shelf-cards-grid');
  const shelfDropzone = document.getElementById('shelf-dropzone');
  const btnClearShelf = document.getElementById('btn-clear-shelf');
  let currentShelfItems = [];

  function renderShelf() {
    if (!shelfCardsGrid) return;
    if (currentShelfItems.length === 0) {
      shelfCardsGrid.innerHTML = '<p class="agenda-empty" style="grid-column: 1/-1; text-align:center; padding: 20px;">El Shelf está vacío</p>';
      return;
    }
    shelfCardsGrid.innerHTML = currentShelfItems.map((item, idx) => `
      <div class="shelf-card" data-idx="${idx}">
        <div class="shelf-card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
        </div>
        <div class="shelf-card-name" style="font-size:11px; font-weight:600; color:var(--text-primary); word-break:break-word;">${escapeHtml(item.name)}</div>
      </div>
    `).join('');

    shelfCardsGrid.querySelectorAll('.shelf-card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = Number(card.getAttribute('data-idx'));
        const item = currentShelfItems[idx];
        if (item && item.path) window.islandAPI.launchApp(item.path);
      });
    });
  }

  function handleDroppedFiles(files) {
    for (const f of files) {
      currentShelfItems.push({
        name: f.name,
        path: window.islandAPI.getPathForFile(f),
        size: f.size
      });
    }
    window.islandAPI.saveShelf(currentShelfItems);
    renderShelf();
    playHapticChime(700, 'sine', 0.08);
  }

  if (shelfDropzone) {
    shelfDropzone.addEventListener('dragover', (e) => { e.preventDefault(); });
    shelfDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer.files) handleDroppedFiles(e.dataTransfer.files);
    });
  }

  if (btnClearShelf) {
    btnClearShelf.addEventListener('click', () => {
      currentShelfItems = [];
      window.islandAPI.saveShelf(currentShelfItems);
      renderShelf();
    });
  }

  try {
    currentShelfItems = await window.islandAPI.loadShelf();
    renderShelf();
  } catch {}

  // ================= TAB 6: DEDICATED WEATHER =================
  const weatherCityInput = document.getElementById('weather-city-input');
  const btnUpdateWeather = document.getElementById('btn-update-weather');
  const weatherCityCountry = document.getElementById('weather-city-country');
  const weatherTempDisplay = document.getElementById('weather-temp-display');
  const weatherDescription = document.getElementById('weather-description');
  const weatherFeels = document.getElementById('weather-feels');
  const weatherHum = document.getElementById('weather-hum');
  const weatherWind = document.getElementById('weather-wind');
  const weatherUv = document.getElementById('weather-uv');
  const weatherPrecip = document.getElementById('weather-precip');
  const weatherPressure = document.getElementById('weather-pressure');
  const weatherPresetChips = document.getElementById('weather-preset-chips');

  let weatherRequest = 0;
  const weatherLabel = code => {
    if (code === 0) return 'Despejado';
    if (code <= 3) return 'Parcialmente nublado / Nublado';
    if (code <= 48) return 'Niebla';
    if (code <= 57) return 'Llovizna';
    if (code <= 67) return 'Lluvia';
    if (code <= 77) return 'Nieve';
    if (code <= 82) return 'Chubascos';
    if (code <= 86) return 'Chubascos de nieve';
    return 'Tormenta';
  };
  async function loadWeather(city = 'Lima') {
    const request = ++weatherRequest;
    if (weatherDescription) weatherDescription.textContent = 'Consultando el clima…';
    const fields = [weatherTempDisplay,weatherFeels,weatherHum,weatherWind,weatherUv,weatherPrecip,weatherPressure];
    fields.forEach(el => { if (el) el.textContent = '—'; });
    try {
      const data = await window.islandAPI.getWeather(city);
      if (request !== weatherRequest) return;
      if (!data) throw new Error('No se pudo consultar esta ciudad. Revisa el nombre y tu conexión.');
      const value = (v, unit='') => Number.isFinite(v) ? `${v}${unit}` : '—';
      if (weatherCityCountry) weatherCityCountry.textContent = `${data.city}, ${data.country}`;
      if (weatherDescription) weatherDescription.textContent = `${weatherLabel(data.code)} · ${data.updatedAt?.replace('T',' ') || ''}`;
      const values = [value(data.temp), value(data.feelsLike,'°C'),value(data.humidity,'%'),value(data.wind,' km/h'),value(data.uv,' (máx. hoy)'),value(data.precipitation,' mm'),value(data.pressure,' hPa')];
      fields.forEach((el,i) => { if (el) el.textContent = values[i]; });
    } catch (error) {
      if (request === weatherRequest && weatherDescription) weatherDescription.textContent = error.message;
    }
  }
  loadWeather('Lima');

  if (btnUpdateWeather && weatherCityInput) {
    btnUpdateWeather.addEventListener('click', () => {
      const c = weatherCityInput.value.trim();
      if (c) loadWeather(c);
    });
    weatherCityInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const c = weatherCityInput.value.trim();
        if (c) loadWeather(c);
      }
    });
  }

  if (weatherPresetChips) {
    weatherPresetChips.querySelectorAll('.city-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        weatherPresetChips.querySelectorAll('.city-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const city = chip.getAttribute('data-city');
        loadWeather(city);
        playHapticChime(620, 'sine', 0.05);
      });
    });
  }

  // ================= TAB 7: EDITABLE TIMER & STOPWATCH =================
  const btnSwitchToTimer = document.getElementById('btn-switch-to-timer');
  const btnSwitchToStopwatch = document.getElementById('btn-switch-to-stopwatch');
  const viewTimerMode = document.getElementById('view-timer-mode');
  const viewStopwatchMode = document.getElementById('view-stopwatch-mode');

  if (btnSwitchToTimer && btnSwitchToStopwatch) {
    btnSwitchToTimer.addEventListener('click', () => {
      btnSwitchToTimer.classList.add('active');
      btnSwitchToStopwatch.classList.remove('active');
      if (viewTimerMode) viewTimerMode.classList.add('active');
      if (viewStopwatchMode) viewStopwatchMode.classList.remove('active');
      playHapticChime(640, 'triangle', 0.05);
    });
    btnSwitchToStopwatch.addEventListener('click', () => {
      btnSwitchToStopwatch.classList.add('active');
      btnSwitchToTimer.classList.remove('active');
      if (viewStopwatchMode) viewStopwatchMode.classList.add('active');
      if (viewTimerMode) viewTimerMode.classList.remove('active');
      playHapticChime(640, 'triangle', 0.05);
    });
  }

  // 1. Temporizador
  const timerCountdownDisplay = document.getElementById('timer-countdown-display');
  const timerProgressFill = document.getElementById('timer-progress-fill');
  const btnTimerToggle = document.getElementById('btn-timer-toggle');
  const txtTimerToggle = document.getElementById('txt-timer-toggle');
  const btnTimerReset = document.getElementById('btn-timer-reset');
  const btnTimerAddMin = document.getElementById('btn-timer-add-min');

  const inputTimerHours = document.getElementById('input-timer-hours');
  const inputTimerMins = document.getElementById('input-timer-mins');
  const inputTimerSecs = document.getElementById('input-timer-secs');

  function renderTimerUI() {
    if (!timerCountdownDisplay) return;
    const h = Math.floor(timerRemainingSeconds / 3600);
    const m = Math.floor((timerRemainingSeconds % 3600) / 60);
    const s = timerRemainingSeconds % 60;

    if (h > 0) {
      timerCountdownDisplay.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    } else {
      timerCountdownDisplay.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    if (timerProgressFill && timerInitialSeconds > 0) {
      const pct = Math.max(0, Math.min(100, (timerRemainingSeconds / timerInitialSeconds) * 100));
      timerProgressFill.style.width = `${pct}%`;
    }
  }

  function syncInputsFromSeconds(totalSec) {
    if (inputTimerHours) inputTimerHours.value = String(Math.floor(totalSec / 3600)).padStart(2, '0');
    if (inputTimerMins) inputTimerMins.value = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
    if (inputTimerSecs) inputTimerSecs.value = String(totalSec % 60).padStart(2, '0');
  }

  function readSecondsFromInputs() {
    const h = parseInt(inputTimerHours ? inputTimerHours.value : '0', 10) || 0;
    const m = parseInt(inputTimerMins ? inputTimerMins.value : '0', 10) || 0;
    const s = parseInt(inputTimerSecs ? inputTimerSecs.value : '0', 10) || 0;
    return Math.max(1, h * 3600 + m * 60 + s);
  }

  function onTimeInputsChanged() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
      if (txtTimerToggle) txtTimerToggle.textContent = 'Iniciar';
    }
    const newSec = readSecondsFromInputs();
    timerInitialSeconds = newSec;
    timerRemainingSeconds = newSec;
    renderTimerUI();
  }

  if (inputTimerHours) inputTimerHours.addEventListener('change', onTimeInputsChanged);
  if (inputTimerMins) inputTimerMins.addEventListener('change', onTimeInputsChanged);
  if (inputTimerSecs) inputTimerSecs.addEventListener('change', onTimeInputsChanged);

  // Spinner Buttons
  document.getElementById('btn-hour-up')?.addEventListener('click', () => {
    if (inputTimerHours) { inputTimerHours.value = String(Math.min(23, (parseInt(inputTimerHours.value, 10) || 0) + 1)).padStart(2, '0'); onTimeInputsChanged(); }
  });
  document.getElementById('btn-hour-down')?.addEventListener('click', () => {
    if (inputTimerHours) { inputTimerHours.value = String(Math.max(0, (parseInt(inputTimerHours.value, 10) || 0) - 1)).padStart(2, '0'); onTimeInputsChanged(); }
  });
  document.getElementById('btn-min-up')?.addEventListener('click', () => {
    if (inputTimerMins) { inputTimerMins.value = String(Math.min(59, (parseInt(inputTimerMins.value, 10) || 0) + 1)).padStart(2, '0'); onTimeInputsChanged(); }
  });
  document.getElementById('btn-min-down')?.addEventListener('click', () => {
    if (inputTimerMins) { inputTimerMins.value = String(Math.max(0, (parseInt(inputTimerMins.value, 10) || 0) - 1)).padStart(2, '0'); onTimeInputsChanged(); }
  });
  document.getElementById('btn-sec-up')?.addEventListener('click', () => {
    if (inputTimerSecs) { inputTimerSecs.value = String(Math.min(59, (parseInt(inputTimerSecs.value, 10) || 0) + 1)).padStart(2, '0'); onTimeInputsChanged(); }
  });
  document.getElementById('btn-sec-down')?.addEventListener('click', () => {
    if (inputTimerSecs) { inputTimerSecs.value = String(Math.max(0, (parseInt(inputTimerSecs.value, 10) || 0) - 1)).padStart(2, '0'); onTimeInputsChanged(); }
  });

  // Presets
  document.querySelectorAll('.timer-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.timer-preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const time = parseInt(btn.getAttribute('data-time'), 10) || 1500;
      if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
      if (txtTimerToggle) txtTimerToggle.textContent = 'Iniciar';
      timerInitialSeconds = time;
      timerRemainingSeconds = time;
      syncInputsFromSeconds(time);
      renderTimerUI();
      playHapticChime(700, 'sine', 0.05);
    });
  });

  if (btnTimerToggle) {
    btnTimerToggle.addEventListener('click', () => {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        if (txtTimerToggle) txtTimerToggle.textContent = 'Reanudar';
        playHapticChime(460, 'sine', 0.06);
      } else {
        if (txtTimerToggle) txtTimerToggle.textContent = 'Pausar';
        playHapticChime(640, 'triangle', 0.06);
        timerInterval = setInterval(() => {
          if (timerRemainingSeconds > 0) {
            timerRemainingSeconds--;
            renderTimerUI();
          } else {
            clearInterval(timerInterval);
            timerInterval = null;
            if (txtTimerToggle) txtTimerToggle.textContent = 'Iniciar';
            playHapticChime(880, 'sine', 0.5);
            showNotchAlert({
              iconSvg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>',
              title: 'Temporizador',
              sub: '¡Tiempo completado!',
              tintClass: 'amber-tint',
              duration: 3200,
              dynamicWidth: 200
            });
          }
        }, 1000);
      }
    });
  }

  if (btnTimerReset) {
    btnTimerReset.addEventListener('click', () => {
      if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
      timerRemainingSeconds = timerInitialSeconds;
      renderTimerUI();
      if (txtTimerToggle) txtTimerToggle.textContent = 'Iniciar';
      playHapticChime(420, 'sine', 0.05);
    });
  }

  if (btnTimerAddMin) {
    btnTimerAddMin.addEventListener('click', () => {
      timerRemainingSeconds += 60;
      timerInitialSeconds = Math.max(timerInitialSeconds, timerRemainingSeconds);
      renderTimerUI();
      syncInputsFromSeconds(timerRemainingSeconds);
      playHapticChime(680, 'sine', 0.05);
    });
  }
  renderTimerUI();

  // 2. Cronómetro
  const stopwatchDisplay = document.getElementById('stopwatch-display');
  const btnStopwatchToggle = document.getElementById('btn-stopwatch-toggle');
  const txtStopwatchToggle = document.getElementById('txt-stopwatch-toggle');
  const btnStopwatchLap = document.getElementById('btn-stopwatch-lap');
  const btnStopwatchReset = document.getElementById('btn-stopwatch-reset');
  const stopwatchLapsList = document.getElementById('stopwatch-laps-list');

  function formatStopwatch(ms) {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
  }

  function updateStopwatchUI() {
    if (!stopwatchDisplay) return;
    const current = swRunning ? (swElapsed + (performance.now() - swStartTime)) : swElapsed;
    stopwatchDisplay.textContent = formatStopwatch(current);
  }

  function renderStopwatchLaps() {
    if (!stopwatchLapsList) return;
    if (swLaps.length === 0) {
      stopwatchLapsList.innerHTML = '<p class="empty-laps">Sin vueltas registradas.</p>';
      return;
    }
    stopwatchLapsList.innerHTML = swLaps.map(lap => `
      <div class="stopwatch-lap-row">
        <span>Vuelta ${lap.lapNum}</span>
        <span>+${formatStopwatch(lap.lapTime)}</span>
        <span>${formatStopwatch(lap.totalTime)}</span>
      </div>
    `).join('');
  }

  if (btnStopwatchToggle) {
    btnStopwatchToggle.addEventListener('click', () => {
      if (swRunning) {
        swElapsed += (performance.now() - swStartTime);
        swRunning = false;
        clearInterval(swInterval);
        swInterval = null;
        if (txtStopwatchToggle) txtStopwatchToggle.textContent = 'Reanudar';
        playHapticChime(460, 'sine', 0.06);
      } else {
        swStartTime = performance.now();
        swRunning = true;
        if (txtStopwatchToggle) txtStopwatchToggle.textContent = 'Pausar';
        playHapticChime(640, 'triangle', 0.06);
        swInterval = setInterval(updateStopwatchUI, 25);
      }
    });
  }

  if (btnStopwatchLap) {
    btnStopwatchLap.addEventListener('click', () => {
      if (!swRunning && swElapsed === 0) return;
      const current = swRunning ? (swElapsed + (performance.now() - swStartTime)) : swElapsed;
      const lastTotal = swLaps.length > 0 ? swLaps[0].totalTime : 0;
      const lapTime = current - lastTotal;
      swLaps.unshift({
        lapNum: swLaps.length + 1,
        lapTime: Math.max(0, lapTime),
        totalTime: current
      });
      renderStopwatchLaps();
      playHapticChime(720, 'sine', 0.05);
    });
  }

  if (btnStopwatchReset) {
    btnStopwatchReset.addEventListener('click', () => {
      if (swInterval) clearInterval(swInterval);
      swRunning = false;
      swStartTime = 0;
      swElapsed = 0;
      swInterval = null;
      swLaps = [];
      updateStopwatchUI();
      renderStopwatchLaps();
      if (txtStopwatchToggle) txtStopwatchToggle.textContent = 'Iniciar';
      playHapticChime(420, 'sine', 0.05);
    });
  }

  // ================= TAB 8: HERRAMIENTAS ÚTILES =================
  // 1. Brillo de Pantalla con Animación en Notch
  const toolsBrightnessSlider = document.getElementById('tools-brightness-slider');
  const toolsBrightnessVal = document.getElementById('tools-brightness-val');

  function triggerBrightnessAlert(level) {
    const sunIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>';
    showNotchAlert({
      iconSvg: sunIcon,
      title: 'Brillo',
      sub: `${level}%`,
      rightHtml: `<div class="mini-alert-bar-bg"><div class="mini-alert-bar-fill" style="width:${level}%; background: #f59e0b;"></div></div>`,
      tintClass: 'amber-tint',
      duration: 1500,
      dynamicWidth: 175
    });
  }

  async function updateBrightness(level, showAnim = true) {
    const clamped = Math.max(0, Math.min(100, Math.round(Number(level))));
    if (toolsBrightnessSlider) toolsBrightnessSlider.value = clamped;
    if (toolsBrightnessVal) toolsBrightnessVal.textContent = `${clamped}%`;

    try {
      await window.islandAPI.setBrightness(clamped);
    } catch {}

    if (showAnim) {
      triggerBrightnessAlert(clamped);
    }
  }

  let brightnessDebounceTimer = null;
  let lastBrightnessSentAt = 0;
  let lastUserBrightnessInputAt = 0;
  function setBrightnessRealtime(level) {
    const clamped = Math.max(0, Math.min(100, Math.round(Number(level))));
    const now = performance.now();
    lastUserBrightnessInputAt = now;
    if (now - lastBrightnessSentAt >= 16) {
      lastBrightnessSentAt = now;
      window.islandAPI.setBrightness(clamped).catch(() => {});
      return;
    }
    clearTimeout(brightnessDebounceTimer);
    brightnessDebounceTimer = setTimeout(() => {
      lastBrightnessSentAt = performance.now();
      window.islandAPI.setBrightness(clamped).catch(() => {});
    }, 16);
  }

  if (toolsBrightnessSlider) {
    toolsBrightnessSlider.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      if (toolsBrightnessVal) toolsBrightnessVal.textContent = `${val}%`;
      setBrightnessRealtime(val);
    });
    toolsBrightnessSlider.addEventListener('change', (e) => {
      lastUserBrightnessInputAt = performance.now();
      updateBrightness(Number(e.target.value), true);
    });
  }

  document.querySelectorAll('.btn-util-chip[data-bright]').forEach(chip => {
    chip.addEventListener('click', () => {
      const b = Number(chip.getAttribute('data-bright'));
      lastUserBrightnessInputAt = performance.now();
      updateBrightness(b, true);
      playHapticChime(640, 'sine', 0.05);
    });
  });

  // Initial brightness query
  try {
    window.islandAPI.getBrightness().then((b) => {
      if (typeof b === 'number' && (performance.now() - lastUserBrightnessInputAt > 2200)) {
        if (toolsBrightnessSlider) toolsBrightnessSlider.value = b;
        if (toolsBrightnessVal) toolsBrightnessVal.textContent = `${b}%`;
      }
    });
  } catch {}

  // Hardware brightness key event listener
  if (window.islandAPI && window.islandAPI.onBrightnessChanged) {
    window.islandAPI.onBrightnessChanged((data) => {
      if (performance.now() - lastUserBrightnessInputAt < 2200) return;
      if (data && typeof data.brightness === 'number') {
        const val = data.brightness;
        if (toolsBrightnessSlider) toolsBrightnessSlider.value = val;
        if (toolsBrightnessVal) toolsBrightnessVal.textContent = `${val}%`;
        triggerBrightnessAlert(val);
      }
    });
  }

  // 2. Cuentagotas (Color Picker)
  const btnToolsEyedropper = document.getElementById('btn-tools-eyedropper');
  const btnToolsCopyColor = document.getElementById('btn-tools-copy-color');
  const toolsColorPreview = document.getElementById('tools-color-preview');
  const toolsColorHex = document.getElementById('tools-color-hex');
  const toolsColorRgb = document.getElementById('tools-color-rgb');
  let currentPickedHex = '#3B82F6';

  function hexToRgb(hex) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return `rgb(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255})`;
  }

  if (btnToolsEyedropper) {
    btnToolsEyedropper.addEventListener('click', async () => {
      try {
        if (window.EyeDropper) {
          screenToolActive = true;
          collapseIsland();
          container.style.visibility = 'hidden';
          container.style.opacity = '0';
          const eyeDropper = new EyeDropper();
          const result = await eyeDropper.open();
          if (result && result.sRGBHex) {
            currentPickedHex = result.sRGBHex.toUpperCase();
            if (toolsColorPreview) toolsColorPreview.style.background = currentPickedHex;
            if (toolsColorHex) toolsColorHex.textContent = currentPickedHex;
            if (toolsColorRgb) toolsColorRgb.textContent = hexToRgb(currentPickedHex);

            await window.islandAPI.copyText(currentPickedHex);
            playHapticChime(760, 'triangle', 0.08);

            showNotchAlert({
              iconSvg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m2 22 1-1h3l9-9"></path><path d="M3 21v-3l9-9"></path><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9"></path></svg>',
              title: 'Color Copiado',
              sub: currentPickedHex,
              tintClass: 'blue-tint',
              duration: 2000,
              dynamicWidth: 185
            });
          }
        } else {
          alert('EyeDropper API no compatible con este monitor.');
        }
      } catch (error) {
        if (error.name !== 'AbortError' && toolsColorHex) toolsColorHex.textContent = 'No se pudo elegir el color';
      } finally {
        container.style.visibility = '';
        container.style.opacity = '';
        screenToolActive = false;
        expandIsland();
      }
    });
  }

  if (btnToolsCopyColor) {
    btnToolsCopyColor.addEventListener('click', async () => {
      await window.islandAPI.copyText(currentPickedHex);
      playHapticChime(800, 'sine', 0.05);
      showNotchAlert({
        iconSvg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        title: 'Copiado',
        sub: currentPickedHex,
        tintClass: 'green-tint',
        duration: 1600,
        dynamicWidth: 165
      });
    });
  }

  // 3. Captura de Pantalla
  const btnSnapArea = document.getElementById('btn-snap-area');
  const btnSnapFull = document.getElementById('btn-snap-full');

  if (btnSnapArea) {
    btnSnapArea.addEventListener('click', () => {
      collapseIsland();
      setTimeout(() => {
        window.islandAPI.screenTool('area');
        playHapticChime(600, 'square', 0.08);
        showNotchAlert({
          iconSvg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
          title: 'Captura de Área',
          sub: 'Recorte iniciado',
          tintClass: 'green-tint',
          duration: 1800,
          dynamicWidth: 185
        });
      }, 180);
    });
  }

  if (btnSnapFull) {
    btnSnapFull.addEventListener('click', () => {
      collapseIsland();
      setTimeout(async () => {
        playHapticChime(600, 'square', 0.08);
        const res = await (window.islandAPI.takeFullscreenScreenshot ? window.islandAPI.takeFullscreenScreenshot() : window.islandAPI.screenTool('screen'));
        if (res && res.success) {
          showNotchAlert({
            iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="2" y="3" width="20" height="14" rx="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
            title: 'Captura Guardada',
            sub: 'Copiada al portapapeles',
            tintClass: 'green-tint',
            duration: 2200,
            dynamicWidth: 205
          });
        } else {
          alert(res?.error || 'No se pudo capturar la pantalla.');
        }
      }, 180);
    });
  }

  // 4. Extractor de Texto (OCR Real sin Menús de Configuración)
  const btnOcrScreen = document.getElementById('btn-ocr-screen');
  const ocrPreviewText = document.getElementById('ocr-preview-text');
  const btnCopyOcr = document.getElementById('btn-copy-ocr');

  if (btnOcrScreen) {
    btnOcrScreen.addEventListener('click', () => {
      collapseIsland();
      setTimeout(async () => {
        playHapticChime(680, 'triangle', 0.08);
        showNotchAlert({
          iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>',
          title: 'Extrayendo Texto...',
          sub: 'Analizando pantalla',
          tintClass: 'purple-tint',
          duration: 1800,
          dynamicWidth: 205
        });
        const res = await (window.islandAPI.runOcr ? window.islandAPI.runOcr() : window.islandAPI.screenTool('text'));
        if (res && res.success) {
          if (ocrPreviewText) ocrPreviewText.value = res.text || '';
          showNotchAlert({
            iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>',
            title: res.count ? 'Texto Extraído' : 'Sin texto legible',
            sub: `${res.count || 0} palabras copiadas`,
            tintClass: 'purple-tint',
            duration: 2400,
            dynamicWidth: 215
          });
        } else {
          if (ocrPreviewText) ocrPreviewText.value = res?.error || 'No se pudo extraer texto.';
          expandIsland();
        }
      }, 180);
    });
  }

  if (btnCopyOcr && ocrPreviewText) {
    btnCopyOcr.addEventListener('click', async () => {
      const t = ocrPreviewText.value.trim();
      if (t) {
        await window.islandAPI.copyText(t);
        playHapticChime(800, 'sine', 0.05);
      }
    });
  }

  // 5. Lector de QR
  const qrDropzone = document.getElementById('qr-dropzone');
  const qrResultText = document.getElementById('qr-result-text');
  const btnPasteQr = document.getElementById('btn-paste-qr');
  const btnOpenQrLink = document.getElementById('btn-open-qr-link');
  let lastDecodedQr = '';

  function handleQrText(text) {
    lastDecodedQr = text;
    if (qrResultText) qrResultText.textContent = text;
    if (btnOpenQrLink) {
      const isUrl = /^https?:\/\//i.test(text.trim());
      btnOpenQrLink.style.display = isUrl ? 'inline-flex' : 'none';
    }
    window.islandAPI.copyText(text);
    playHapticChime(760, 'sine', 0.08);

    showNotchAlert({
      iconSvg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
      title: 'QR Decodificado',
      sub: text.slice(0, 24) + (text.length > 24 ? '...' : ''),
      tintClass: 'cyan-tint',
      duration: 2500,
      dynamicWidth: 210
    });
  }

  if (btnOpenQrLink) {
    btnOpenQrLink.addEventListener('click', () => {
      if (lastDecodedQr && /^https?:\/\//i.test(lastDecodedQr)) {
        window.islandAPI.launchApp(lastDecodedQr);
      }
    });
  }

  if (btnPasteQr) {
    btnPasteQr.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          handleQrText(text);
        } else {
          qrResultText.textContent = 'Portapapeles sin texto o QR';
        }
      } catch {
        qrResultText.textContent = 'No se pudo leer portapapeles';
      }
    });
  }

  // 6. Modo Nocturno & No Molestar (Directo sin abrir Configuración)
  const btnToggleNightlight = document.getElementById('btn-toggle-nightlight');
  const nightlightStatusText = document.getElementById('nightlight-status-text');
  const btnToggleDnd = document.getElementById('btn-toggle-dnd');
  const dndStatusText = document.getElementById('dnd-status-text');
  let isNightlightOn = false;
  let isDndOn = false;

  if (btnToggleNightlight) {
    btnToggleNightlight.addEventListener('click', async () => {
      isNightlightOn = !isNightlightOn;
      btnToggleNightlight.classList.toggle('active', isNightlightOn);
      if (nightlightStatusText) nightlightStatusText.textContent = isNightlightOn ? 'Activado' : 'Desactivado';
      if (window.islandAPI.setNightLight) {
        await window.islandAPI.setNightLight(isNightlightOn);
      } else {
        await window.islandAPI.screenTool('nightlight');
      }
      playHapticChime(isNightlightOn ? 700 : 450, 'sine', 0.06);

      showNotchAlert({
        iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
        title: 'Modo Nocturno',
        sub: isNightlightOn ? 'Activado (Cálido)' : 'Desactivado',
        tintClass: isNightlightOn ? 'amber-tint' : '',
        duration: 1900,
        dynamicWidth: 190
      });
    });
  }

  if (btnToggleDnd) {
    btnToggleDnd.addEventListener('click', async () => {
      isDndOn = !isDndOn;
      btnToggleDnd.classList.toggle('active', isDndOn);
      if (dndStatusText) dndStatusText.textContent = isDndOn ? 'Activado' : 'Desactivado';
      if (window.islandAPI.setDnd) {
        await window.islandAPI.setDnd(isDndOn);
      } else {
        await window.islandAPI.screenTool('dnd');
      }
      playHapticChime(isDndOn ? 400 : 650, 'sine', 0.06);

      showNotchAlert({
        iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>',
        title: 'No Molestar',
        sub: isDndOn ? 'Silenciado' : 'Desactivado',
        tintClass: isDndOn ? 'red-tint' : '',
        duration: 1900,
        dynamicWidth: 180
      });
    });
  }

  // 7. Hardware & Fn Key Controls / Animations
  const btnToggleTouchpad = document.getElementById('btn-toggle-touchpad');
  const hwTouchpadStatus = document.getElementById('hw-touchpad-status');
  let isTouchpadActive = true;

  if (btnToggleTouchpad) {
    btnToggleTouchpad.addEventListener('click', () => {
      isTouchpadActive = !isTouchpadActive;
      btnToggleTouchpad.classList.toggle('active', !isTouchpadActive);
      if (hwTouchpadStatus) hwTouchpadStatus.textContent = isTouchpadActive ? 'Activado' : 'Desactivado';
      playHapticChime(isTouchpadActive ? 650 : 380, 'triangle', 0.06);
      showNotchAlert({
        iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="18" height="16" rx="3"></rect><line x1="3" y1="14" x2="21" y2="14"></line><line x1="12" y1="14" x2="12" y2="20"></line></svg>',
        title: 'Touchpad',
        sub: isTouchpadActive ? 'Activado' : 'Desactivado',
        tintClass: isTouchpadActive ? 'blue-tint' : 'red-tint',
        duration: 1800,
        dynamicWidth: 175
      });
    });
  }

  const btnToggleWinlock = document.getElementById('btn-toggle-winlock');
  const hwWinlockStatus = document.getElementById('hw-winlock-status');
  let isWinLockActive = false;

  if (btnToggleWinlock) {
    btnToggleWinlock.addEventListener('click', () => {
      isWinLockActive = !isWinLockActive;
      btnToggleWinlock.classList.toggle('active', isWinLockActive);
      if (hwWinlockStatus) hwWinlockStatus.textContent = isWinLockActive ? 'Bloqueada' : 'Libre';
      playHapticChime(isWinLockActive ? 520 : 720, 'sine', 0.06);
      showNotchAlert({
        iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="8" height="8"></rect><rect x="13" y="3" width="8" height="8"></rect><rect x="3" y="13" width="8" height="8"></rect><rect x="13" y="13" width="8" height="8"></rect></svg>',
        title: 'Tecla Windows',
        sub: isWinLockActive ? 'Bloqueada (Juegos)' : 'Desbloqueada',
        tintClass: isWinLockActive ? 'amber-tint' : 'blue-tint',
        duration: 1900,
        dynamicWidth: 195
      });
    });
  }

  const btnCycleKbBacklight = document.getElementById('btn-cycle-kb-backlight');
  const hwKbStatus = document.getElementById('hw-kb-status');
  const kbLevels = ['Apagado (0%)', 'Medio (50%)', 'Alto (100%)'];
  let kbLevelIdx = 1;

  if (btnCycleKbBacklight) {
    btnCycleKbBacklight.addEventListener('click', () => {
      kbLevelIdx = (kbLevelIdx + 1) % kbLevels.length;
      if (hwKbStatus) hwKbStatus.textContent = kbLevels[kbLevelIdx];
      playHapticChime(400 + kbLevelIdx * 150, 'sine', 0.05);
      showNotchAlert({
        iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="6" width="18" height="12" rx="2"></rect><line x1="6" y1="18" x2="4" y2="21"></line><line x1="18" y1="18" x2="20" y2="21"></line><line x1="12" y1="18" x2="12" y2="21"></line></svg>',
        title: 'Luz Teclado',
        sub: kbLevels[kbLevelIdx],
        tintClass: kbLevelIdx > 0 ? 'amber-tint' : '',
        duration: 1800,
        dynamicWidth: 185
      });
    });
  }

  const btnCyclePerfMode = document.getElementById('btn-cycle-perf-mode');
  const hwPerfStatus = document.getElementById('hw-perf-status');
  const perfModes = [
    { id: 'silent', label: 'Silencioso', tint: 'cyan-tint' },
    { id: 'balanced', label: 'Equilibrado', tint: 'blue-tint' },
    { id: 'turbo', label: 'Turbo (Máximo)', tint: 'red-tint' }
  ];
  let perfModeIdx = 1;

  if (btnCyclePerfMode) {
    btnCyclePerfMode.addEventListener('click', async () => {
      perfModeIdx = (perfModeIdx + 1) % perfModes.length;
      const cur = perfModes[perfModeIdx];
      if (hwPerfStatus) hwPerfStatus.textContent = cur.label;
      if (window.islandAPI.setPerformanceMode) {
        await window.islandAPI.setPerformanceMode(cur.id);
      }
      playHapticChime(500 + perfModeIdx * 180, 'square', 0.06);
      showNotchAlert({
        iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"></circle><path d="m16.2 7.8-4.2 4.2"></path><circle cx="12" cy="12" r="2"></circle></svg>',
        title: 'Rendimiento',
        sub: cur.label,
        tintClass: cur.tint,
        duration: 1900,
        dynamicWidth: 180
      });
    });
  }

  // 8. Hardware Keyboard Listeners (Caps Lock & Num Lock from AudioHelper C# loop)
  if (window.islandAPI && window.islandAPI.onCapsLockChanged) {
    window.islandAPI.onCapsLockChanged((enabled) => {
      playHapticChime(enabled ? 720 : 480, 'triangle', 0.05);
      showNotchAlert({
        iconSvg: enabled
          ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l8 8h-5v10H9V11H4l8-8z"></path></svg>'
          : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 3l8 8h-5v10H9V11H4l8-8z"></path></svg>',
        title: 'Bloq Mayús',
        sub: enabled ? 'Activado' : 'Desactivado',
        tintClass: enabled ? 'blue-tint' : '',
        duration: 1800,
        dynamicWidth: 175
      });
    });
  }

  if (window.islandAPI && window.islandAPI.onNumLockChanged) {
    window.islandAPI.onNumLockChanged((enabled) => {
      playHapticChime(enabled ? 720 : 480, 'triangle', 0.05);
      showNotchAlert({
        iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>',
        title: 'Bloq Num',
        sub: enabled ? 'Activado' : 'Desactivado',
        tintClass: enabled ? 'blue-tint' : '',
        duration: 1800,
        dynamicWidth: 175
      });
    });
  }

  // ================= ROWAN ASSISTANT INTEGRATION (M1/M2 NOTCH DOCKING & STREAMING) =================
  let rowanClient = null;

  // 100-Emotion Catalog Dictionary: O(1) mapping to 16 visual archetypes, aura colors, and micro-animations
  const ROWAN_EMOTIONS = {
    // Default & Aliases
    idle: { arc: 'idle', glow: 'rgba(243, 242, 238, 0.35)' },
    neutral: { arc: 'idle', glow: 'rgba(243, 242, 238, 0.35)' },
    empathetic: { arc: 'puppy', glow: 'rgba(251, 113, 133, 0.45)' },

    // Family 1: Alegria, Exito & Celebracion (15)
    happy: { arc: 'happy', glow: 'rgba(254, 240, 138, 0.45)' },
    cheerful: { arc: 'happy', glow: 'rgba(250, 204, 21, 0.5)', anim: 'bounce' },
    ecstatic: { arc: 'ecstatic', glow: 'rgba(251, 191, 36, 0.55)', anim: 'bounce' },
    laughing: { arc: 'happy', glow: 'rgba(253, 224, 71, 0.5)', anim: 'vibe' },
    giggle: { arc: 'winking', glow: 'rgba(244, 114, 182, 0.45)', anim: 'vibe' },
    proud: { arc: 'happy', glow: 'rgba(167, 243, 208, 0.45)' },
    victorious: { arc: 'ecstatic', glow: 'rgba(251, 191, 36, 0.6)' },
    party: { arc: 'ecstatic', glow: 'rgba(244, 63, 94, 0.55)', anim: 'bounce' },
    grateful: { arc: 'happy', glow: 'rgba(254, 243, 199, 0.45)' },
    greeting: { arc: 'happy', glow: 'rgba(243, 242, 238, 0.45)', anim: 'bounce' },
    playful: { arc: 'happy', glow: 'rgba(232, 121, 249, 0.45)', anim: 'bounce' },
    excited: { arc: 'surprised', glow: 'rgba(250, 204, 21, 0.55)', anim: 'vibe' },
    beaming: { arc: 'happy', glow: 'rgba(255, 255, 255, 0.65)' },
    delighted: { arc: 'happy', glow: 'rgba(245, 158, 11, 0.45)' },
    optimistic: { arc: 'idle', glow: 'rgba(52, 211, 153, 0.45)' },

    // Family 2: Curiosidad, Intelecto & Enfoque (15)
    thinking: { arc: 'thinking', glow: 'rgba(56, 189, 248, 0.45)' },
    focused: { arc: 'focused', glow: 'rgba(96, 165, 250, 0.45)' },
    curious: { arc: 'curious', glow: 'rgba(251, 191, 36, 0.45)' },
    analytical: { arc: 'thinking', glow: 'rgba(56, 189, 248, 0.45)', anim: 'scan' },
    eureka: { arc: 'surprised', glow: 'rgba(255, 255, 255, 0.7)' },
    calculating: { arc: 'thinking', glow: 'rgba(99, 102, 241, 0.45)', anim: 'vibe' },
    observing: { arc: 'thinking', glow: 'rgba(45, 212, 191, 0.45)', anim: 'scan' },
    intrigued: { arc: 'curious', glow: 'rgba(217, 119, 6, 0.45)' },
    studious: { arc: 'thinking', glow: 'rgba(148, 163, 184, 0.4)' },
    brainstorming: { arc: 'thinking', glow: 'rgba(168, 85, 247, 0.55)', anim: 'vibe' },
    reading: { arc: 'thinking', glow: 'rgba(125, 211, 252, 0.45)', anim: 'scan' },
    evaluating: { arc: 'curious', glow: 'rgba(148, 163, 184, 0.45)' },
    puzzled: { arc: 'curious', glow: 'rgba(253, 224, 71, 0.45)' },
    sharp: { arc: 'focused', glow: 'rgba(243, 242, 238, 0.55)' },
    detective: { arc: 'thinking', glow: 'rgba(180, 83, 9, 0.45)' },

    // Family 3: Picardia, Afecto & Complicidad (15)
    amused: { arc: 'mischievous', glow: 'rgba(244, 114, 182, 0.45)' },
    smug: { arc: 'mischievous', glow: 'rgba(251, 191, 36, 0.45)' },
    winking: { arc: 'winking', glow: 'rgba(236, 72, 153, 0.45)' },
    flirty: { arc: 'happy', glow: 'rgba(244, 114, 182, 0.5)' },
    tsundere: { arc: 'angry', glow: 'rgba(244, 63, 94, 0.45)' },
    affectionate: { arc: 'puppy', glow: 'rgba(251, 113, 133, 0.5)', anim: 'zen' },
    bashful: { arc: 'puppy', glow: 'rgba(253, 164, 175, 0.45)' },
    charming: { arc: 'happy', glow: 'rgba(216, 180, 254, 0.45)', anim: 'zen' },
    teasing: { arc: 'mischievous', glow: 'rgba(244, 114, 182, 0.45)' },
    sarcastic: { arc: 'mischievous', glow: 'rgba(148, 163, 184, 0.4)' },
    friendly: { arc: 'relaxed', glow: 'rgba(254, 240, 138, 0.45)', anim: 'zen' },
    cozy: { arc: 'relaxed', glow: 'rgba(253, 186, 116, 0.45)' },
    tender: { arc: 'puppy', glow: 'rgba(167, 243, 208, 0.45)' },
    conspirator: { arc: 'mischievous', glow: 'rgba(192, 132, 252, 0.45)' },
    reassured: { arc: 'relaxed', glow: 'rgba(147, 197, 253, 0.45)' },

    // Family 4: Vulnerabilidad, Tristeza & Empatia (15)
    puppy_eyes: { arc: 'puppy', glow: 'rgba(251, 191, 36, 0.45)' },
    sympathetic: { arc: 'puppy', glow: 'rgba(253, 224, 71, 0.45)' },
    pleading: { arc: 'puppy', glow: 'rgba(244, 114, 182, 0.45)', anim: 'vibe' },
    sad: { arc: 'sad', glow: 'rgba(96, 165, 250, 0.35)' },
    crying: { arc: 'sad', glow: 'rgba(147, 197, 253, 0.5)', anim: 'vibe' },
    heartbroken: { arc: 'sad', glow: 'rgba(59, 130, 246, 0.45)', anim: 'vibe' },
    shy: { arc: 'puppy', glow: 'rgba(244, 114, 182, 0.4)' },
    apologetic: { arc: 'puppy', glow: 'rgba(203, 213, 225, 0.4)' },
    melancholy: { arc: 'sad', glow: 'rgba(100, 116, 139, 0.35)' },
    comforting: { arc: 'relaxed', glow: 'rgba(243, 242, 238, 0.45)' },
    lonely: { arc: 'sad', glow: 'rgba(71, 85, 105, 0.25)' },
    disappointed: { arc: 'sad', glow: 'rgba(148, 163, 184, 0.3)' },
    vulnerable: { arc: 'sad', glow: 'rgba(186, 230, 253, 0.35)' },
    forgiving: { arc: 'relaxed', glow: 'rgba(254, 240, 138, 0.45)' },
    nostalgic: { arc: 'relaxed', glow: 'rgba(199, 210, 254, 0.4)' },

    // Family 5: Intensidad, Determinacion & Tension (15)
    determined: { arc: 'angry', glow: 'rgba(239, 68, 68, 0.5)' },
    angry: { arc: 'angry', glow: 'rgba(239, 68, 68, 0.6)', anim: 'vibe' },
    annoyed: { arc: 'angry', glow: 'rgba(249, 115, 22, 0.5)' },
    glare: { arc: 'angry', glow: 'rgba(220, 38, 38, 0.55)' },
    fierce: { arc: 'angry', glow: 'rgba(244, 63, 94, 0.55)' },
    frustrated: { arc: 'angry', glow: 'rgba(239, 68, 68, 0.55)', anim: 'vibe' },
    impatient: { arc: 'angry', glow: 'rgba(249, 115, 22, 0.45)', anim: 'vibe' },
    defiant: { arc: 'angry', glow: 'rgba(245, 158, 11, 0.5)' },
    protective: { arc: 'focused', glow: 'rgba(59, 130, 246, 0.55)' },
    rebellious: { arc: 'angry', glow: 'rgba(236, 72, 153, 0.5)' },
    serious: { arc: 'focused', glow: 'rgba(148, 163, 184, 0.4)' },
    overheated: { arc: 'angry', glow: 'rgba(220, 38, 38, 0.65)', anim: 'vibe' },
    stubborn: { arc: 'angry', glow: 'rgba(217, 119, 6, 0.45)' },
    commanding: { arc: 'focused', glow: 'rgba(243, 242, 238, 0.6)' },
    hyperfocus: { arc: 'focused', glow: 'rgba(56, 189, 248, 0.55)' },

    // Family 6: Asombro, Confusion & Glitch (15)
    surprised: { arc: 'surprised', glow: 'rgba(255, 255, 255, 0.65)' },
    confused: { arc: 'curious', glow: 'rgba(251, 191, 36, 0.45)' },
    shocked: { arc: 'surprised', glow: 'rgba(239, 68, 68, 0.55)', anim: 'vibe' },
    mindblown: { arc: 'surprised', glow: 'rgba(251, 191, 36, 0.7)' },
    dizzy: { arc: 'glitch', glow: 'rgba(192, 132, 252, 0.45)', anim: 'vibe' },
    hypnotized: { arc: 'glitch', glow: 'rgba(232, 121, 249, 0.5)', anim: 'zen' },
    glitch: { arc: 'glitch', glow: 'rgba(236, 72, 153, 0.65)', anim: 'glitch' },
    paranoid: { arc: 'curious', glow: 'rgba(245, 158, 11, 0.5)', anim: 'scan' },
    skeptical: { arc: 'curious', glow: 'rgba(161, 161, 170, 0.45)' },
    speechless: { arc: 'idle', glow: 'rgba(243, 242, 238, 0.35)' },
    baffled: { arc: 'curious', glow: 'rgba(125, 211, 252, 0.45)' },
    startled: { arc: 'surprised', glow: 'rgba(250, 204, 21, 0.55)', anim: 'bounce' },
    overloaded: { arc: 'glitch', glow: 'rgba(239, 68, 68, 0.55)', anim: 'vibe' },
    disoriented: { arc: 'glitch', glow: 'rgba(168, 85, 247, 0.45)', anim: 'vibe' },
    clueless: { arc: 'idle', glow: 'rgba(148, 163, 184, 0.35)' },

    // Family 7: Calma, Sueno, Musica & Standby (10)
    groove: { arc: 'groove', glow: 'rgba(168, 85, 247, 0.55)' },
    sleepy: { arc: 'sleepy', glow: 'rgba(148, 163, 184, 0.3)' },
    sleeping: { arc: 'sleepy', glow: 'rgba(100, 116, 139, 0.25)', anim: 'zen' },
    yawn: { arc: 'surprised', glow: 'rgba(253, 186, 116, 0.45)', anim: 'zen' },
    zen: { arc: 'relaxed', glow: 'rgba(147, 197, 253, 0.45)', anim: 'zen' },
    meditating: { arc: 'relaxed', glow: 'rgba(167, 243, 208, 0.45)', anim: 'zen' },
    low_battery: { arc: 'standby', glow: 'rgba(239, 68, 68, 0.45)' },
    recharging: { arc: 'relaxed', glow: 'rgba(16, 185, 129, 0.55)' },
    standby: { arc: 'standby', glow: 'rgba(56, 189, 248, 0.4)' },
    cyber: { arc: 'thinking', glow: 'rgba(186, 230, 253, 0.5)', anim: 'scan' }
  };

  let notchEmotionTimer = null;

  function applyNotchEmotion(name, durationMs) {
    const avatar = document.getElementById('notch-rowan-avatar');
    if (!avatar) return;

    if (notchEmotionTimer) {
      clearTimeout(notchEmotionTimer);
      notchEmotionTimer = null;
    }

    const raw = typeof name === 'string' ? name.trim().toLowerCase() : 'idle';
    const entry = ROWAN_EMOTIONS[raw] || ROWAN_EMOTIONS['idle'];

    // Remove existing emotion and animation classes
    const classesToRemove = [];
    for (const c of avatar.classList) {
      if (c.startsWith('notch-emo-') || c.startsWith('notch-anim-')) {
        classesToRemove.push(c);
      }
    }
    classesToRemove.forEach((c) => avatar.classList.remove(c));

    avatar.classList.add(`notch-emo-${entry.arc}`);
    if (entry.anim) {
      avatar.classList.add(`notch-anim-${entry.anim}`);
    }
    avatar.style.setProperty('--notch-glow-color', entry.glow);

    // Auto-decay back to idle after duration
    let duration = typeof durationMs === 'number' && !Number.isNaN(durationMs) ? durationMs : 2500;
    duration = Math.max(100, Math.min(5000, Math.round(duration)));

    notchEmotionTimer = setTimeout(() => {
      const currentClasses = [];
      for (const c of avatar.classList) {
        if (c.startsWith('notch-emo-') || c.startsWith('notch-anim-')) {
          currentClasses.push(c);
        }
      }
      currentClasses.forEach((c) => avatar.classList.remove(c));
      avatar.classList.add('notch-emo-idle');
      avatar.style.setProperty('--notch-glow-color', 'rgba(243, 242, 238, 0.35)');
      notchEmotionTimer = null;
    }, duration);
  }

  // Real-time Audio Level Modulation Engine
  let notchAudioWatchdog = null;
  const NOTCH_MIN_AUDIO_BOOST = 4.0; // px
  const NOTCH_MAX_AUDIO_BOOST = 8.0; // px

  function handleNotchAudioLevel(level) {
    const avatar = document.getElementById('notch-rowan-avatar');
    if (!avatar) return;

    if (notchAudioWatchdog) {
      clearTimeout(notchAudioWatchdog);
      notchAudioWatchdog = null;
    }

    const rawLevel = Number(level);
    const clamped = Number.isFinite(rawLevel) ? Math.max(0.0, Math.min(1.0, rawLevel)) : 0.0;

    if (clamped <= 0.01) {
      // Smooth terminal reset to base height via CSS transition
      avatar.style.setProperty('--notch-audio-boost', '0px');
      return;
    }

    // Scale height organically between +4px and +8px during active speech
    const boost = NOTCH_MIN_AUDIO_BOOST + (clamped * (NOTCH_MAX_AUDIO_BOOST - NOTCH_MIN_AUDIO_BOOST));
    avatar.style.setProperty('--notch-audio-boost', `${boost.toFixed(1)}px`);

    // Safety watchdog: reset to base height if packet flow stops for 220ms
    notchAudioWatchdog = setTimeout(() => {
      avatar.style.setProperty('--notch-audio-boost', '0px');
    }, 220);
  }

  function applyRowanDockedState(docked, collapseWhenUndocking = false) {
    isRowanDocked = Boolean(docked);
    container.classList.toggle('rowan-docked', isRowanDocked);
    if (!isRowanDocked) {
      setNotchGrooveActive(false);
      handleNotchAudioLevel(0.0);
      if (collapseWhenUndocking && container.classList.contains('expanded')) {
        collapseIsland();
      }
    } else {
      updateNotchGrooveState();
    }
    if (container.classList.contains('collapsed')) {
      if (currentPlaybackStatus === 'Playing' && container.classList.contains('has-music') && pillStatusLyric) {
        updateDynamicPillWidth(pillStatusLyric.textContent);
      } else if (!isAlertActive) {
        container.style.setProperty('--pill-dynamic-width', `${isRowanDocked ? DOCKED_IDLE_PILL_WIDTH : IDLE_PILL_WIDTH}px`);
      }
    }
  }

  if (window.islandAPI && typeof window.islandAPI.onRowanWindowVisibility === 'function') {
    window.islandAPI.onRowanWindowVisibility((visible) => {
      applyRowanDockedState(!visible, Boolean(visible));
    });
  }

  // Click restoration handler on avatar
  if (notchAvatar) {
    notchAvatar.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.islandAPI && typeof window.islandAPI.openRowanWindow === 'function') {
        window.islandAPI.openRowanWindow();
      } else if (rowanClient) {
        rowanClient.restoreWindow();
      } else if (window.rowanClient) {
        window.rowanClient.restoreWindow();
      }
    });
  }

  if (typeof RowanClient !== 'undefined' || (typeof window !== 'undefined' && window.RowanClient)) {
    const ClientConstructor = typeof RowanClient !== 'undefined' ? RowanClient : window.RowanClient;
    rowanClient = new ClientConstructor({
      url: 'ws://127.0.0.1:18889',
      initialBackoffMs: 1000,
      maxBackoffMs: 16000
    });

    rowanClient.on('dock_change', (docked) => {
      applyRowanDockedState(docked, !docked);
    });

    rowanClient.on('emotion', (name, durationMs) => {
      applyNotchEmotion(name, durationMs);
    });

    rowanClient.on('audio_level', (level) => {
      handleNotchAudioLevel(level);
    });

    // Start connection loop
    rowanClient.connect();

    // Expose on window for diagnostics and external control
    window.rowanClient = rowanClient;
  }

  // ================= ROWAN MINI-CHAT & LIVE MODE CONTROLLER =================
  const rowanChatInput = document.getElementById('rowan-chat-input');
  const rowanChatSend = document.getElementById('rowan-chat-send') || document.getElementById('btn-rowan-send');
  const rowanMessagesContainer = document.getElementById('rowan-chat-messages');
  const rowanMessagesList = document.getElementById('rowan-messages-list');
  const rowanWelcomeView = document.getElementById('rowan-welcome-view');
  const rowanLiveToggle = document.getElementById('rowan-live-toggle') || document.getElementById('btn-rowan-live');
  const rowanTabLiveBtn = document.getElementById('rowan-tab-live-btn');
  const rowanRestoreBtn = document.getElementById('rowan-restore-btn') || document.getElementById('btn-rowan-restore-win');
  const rowanChatClear = document.getElementById('rowan-chat-clear');
  const rowanStatusPill = document.getElementById('rowan-status-pill');
  const rowanStatusText = document.getElementById('rowan-status-text');
  const rowanLiveBanner = document.getElementById('rowan-live-banner');
  const rowanLivePhaseText = document.getElementById('rowan-live-phase-text');

  let activeStreamTextEl = null;
  let activeStreamCursorEl = null;
  let activeQueryId = null;
  let streamWatchdogTimer = null;
  let isStreamingQuery = false;

  function shouldAutoScroll(containerEl, threshold = 60) {
    if (!containerEl) return true;
    const distanceFromBottom = containerEl.scrollHeight - containerEl.scrollTop - containerEl.clientHeight;
    return distanceFromBottom <= threshold;
  }

  function scrollToBottomIfNeeded() {
    if (rowanMessagesContainer && shouldAutoScroll(rowanMessagesContainer, 60)) {
      rowanMessagesContainer.scrollTop = rowanMessagesContainer.scrollHeight;
    }
  }

  function formatResponseText(rawText) {
    if (!rawText) return '';
    let clean = rawText.replace(/<action:[^>]*>/gi, '');
    clean = clean.replace(/\s+/g, ' ').trim();
    return clean;
  }

  function appendUserMessage(text) {
    if (!text || !text.trim()) return;
    if (rowanWelcomeView) rowanWelcomeView.style.display = 'none';

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgEl = document.createElement('div');
    msgEl.className = 'rowan-msg user chat-msg-user';
    msgEl.innerHTML = `
      <div class="rowan-msg-bubble-user">
        <div class="rowan-msg-meta-user">
          <span>TU</span>
          <span>•</span>
          <span>${timeStr}</span>
        </div>
        <div class="rowan-msg-text-user"></div>
      </div>
    `;
    msgEl.querySelector('.rowan-msg-text-user').textContent = text;
    if (rowanMessagesList) {
      rowanMessagesList.appendChild(msgEl);
    } else if (rowanMessagesContainer) {
      rowanMessagesContainer.appendChild(msgEl);
    }
    if (rowanMessagesContainer) {
      rowanMessagesContainer.scrollTop = rowanMessagesContainer.scrollHeight;
    }
  }

  function resetStreamWatchdog(queryId) {
    if (streamWatchdogTimer) {
      clearTimeout(streamWatchdogTimer);
      streamWatchdogTimer = null;
    }
    streamWatchdogTimer = setTimeout(() => {
      if (activeQueryId === queryId) {
        handleStreamError(queryId, 'Tiempo de espera agotado (30s)');
      }
    }, 30000);
  }

  function startAssistantStream(queryId) {
    if (rowanWelcomeView) rowanWelcomeView.style.display = 'none';

    activeQueryId = queryId;
    isStreamingQuery = true;
    if (rowanChatSend) rowanChatSend.disabled = true;

    const msgEl = document.createElement('div');
    msgEl.className = 'rowan-msg assistant chat-msg-rowan';
    msgEl.innerHTML = `
      <div class="rowan-msg-avatar"><span class="rowan-msg-avatar-letter">R</span></div>
      <div class="rowan-msg-bubble-assistant">
        <div class="rowan-msg-meta-assistant">
          <span>ROWAN</span>
          <span>•</span>
          <span>AHORA</span>
        </div>
        <div class="rowan-msg-text-assistant">
          <span class="stream-cursor chat-typing"></span>
        </div>
      </div>
    `;

    if (rowanMessagesList) {
      rowanMessagesList.appendChild(msgEl);
    } else if (rowanMessagesContainer) {
      rowanMessagesContainer.appendChild(msgEl);
    }

    activeStreamTextEl = msgEl.querySelector('.rowan-msg-text-assistant');
    activeStreamCursorEl = msgEl.querySelector('.stream-cursor');

    resetStreamWatchdog(queryId);
    scrollToBottomIfNeeded();
  }

  function appendStreamToken(queryId, token) {
    if (!token || activeQueryId !== queryId || !activeStreamTextEl) return;
    resetStreamWatchdog(queryId);

    if (activeStreamCursorEl && activeStreamCursorEl.parentNode === activeStreamTextEl) {
      activeStreamTextEl.insertBefore(document.createTextNode(token), activeStreamCursorEl);
    } else {
      activeStreamTextEl.appendChild(document.createTextNode(token));
    }
    scrollToBottomIfNeeded();
  }

  function finalizeAssistantStream(queryId, fullText, emotion) {
    if (activeQueryId !== queryId) return;

    if (streamWatchdogTimer) {
      clearTimeout(streamWatchdogTimer);
      streamWatchdogTimer = null;
    }

    if (activeStreamCursorEl && activeStreamCursorEl.parentNode) {
      activeStreamCursorEl.parentNode.removeChild(activeStreamCursorEl);
    }

    if (activeStreamTextEl) {
      const sanitized = formatResponseText(fullText);
      if (sanitized) {
        activeStreamTextEl.textContent = sanitized;
      }
    }

    if (emotion && typeof applyNotchEmotion === 'function') {
      applyNotchEmotion(emotion, 3000);
    }

    if (rowanChatSend) rowanChatSend.disabled = false;
    activeStreamCursorEl = null;
    activeStreamTextEl = null;
    activeQueryId = null;
    isStreamingQuery = false;

    scrollToBottomIfNeeded();
  }

  function handleStreamError(queryId, errorMsg) {
    if (streamWatchdogTimer) {
      clearTimeout(streamWatchdogTimer);
      streamWatchdogTimer = null;
    }

    if (activeStreamCursorEl && activeStreamCursorEl.parentNode) {
      activeStreamCursorEl.parentNode.removeChild(activeStreamCursorEl);
    }

    if (activeStreamTextEl) {
      const parentBubble = activeStreamTextEl.closest('.rowan-msg') || activeStreamTextEl.closest('.rowan-msg-bubble-assistant');
      if (parentBubble) parentBubble.classList.add('chat-msg-error');
      activeStreamTextEl.textContent = errorMsg || 'Error al comunicarse con Rowan.';
    }

    if (rowanChatSend) rowanChatSend.disabled = false;
    activeStreamCursorEl = null;
    activeStreamTextEl = null;
    activeQueryId = null;
    isStreamingQuery = false;

    scrollToBottomIfNeeded();
  }

  function sendRowanQuery() {
    if (!rowanChatInput) return;
    const rawText = rowanChatInput.value;
    if (!rawText || !rawText.trim()) return;

    const client = rowanClient || window.rowanClient;
    if (!client || !client.isConnected) {
      const offlineMsg = document.createElement('div');
      offlineMsg.className = 'rowan-msg assistant chat-msg-error';
      offlineMsg.innerHTML = `
        <div class="rowan-msg-avatar"><span class="rowan-msg-avatar-letter">R</span></div>
        <div class="rowan-msg-bubble-assistant">
          <div class="rowan-msg-text-assistant">Rowan no esta conectado. Estableciendo conexion...</div>
        </div>
      `;
      if (rowanMessagesList) rowanMessagesList.appendChild(offlineMsg);
      scrollToBottomIfNeeded();
      return;
    }

    if (isStreamingQuery) return;

    const text = rawText.trim().slice(0, 4000);
    rowanChatInput.value = '';

    appendUserMessage(text);
    const queryId = `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    startAssistantStream(queryId);

    if (client && typeof client.sendChatQuery === 'function') {
      client.sendChatQuery(queryId, text);
    }
  }

  function handleNotchLiveState(state) {
    const avatar = document.getElementById('notch-rowan-avatar');
    if (!avatar) return;

    avatar.classList.remove(
      'notch-live-active',
      'notch-live-listening',
      'notch-live-thinking',
      'notch-live-speaking'
    );

    if (state && state !== 'idle') {
      avatar.classList.add('notch-live-active');
      avatar.classList.add(`notch-live-${state}`);
    }
  }

  function updateLiveUI(state) {
    const isLive = Boolean(rowanClient && rowanClient.liveActive);
    if (rowanLiveToggle) {
      rowanLiveToggle.classList.toggle('live-active', isLive);
    }
    if (rowanTabLiveBtn) {
      rowanTabLiveBtn.classList.toggle('live-active', isLive);
      const liveText = document.getElementById('rowan-tab-live-text');
      if (liveText) {
        liveText.textContent = isLive ? 'Detener Live' : 'Modo Live';
      }
    }
    if (rowanLiveBanner) {
      rowanLiveBanner.style.display = isLive ? 'flex' : 'none';
      if (rowanLivePhaseText) {
        const labels = {
          listening: 'Modo Live - Escuchando voz',
          thinking: 'Modo Live - Procesando respuesta',
          speaking: 'Modo Live - Hablando'
        };
        rowanLivePhaseText.textContent = labels[state] || 'Modo Live Activo';
      }
    }
    handleNotchLiveState(state);
  }

  function toggleLiveModeFromUI() {
    const client = rowanClient || window.rowanClient;
    if (client && typeof client.toggleLiveMode === 'function') {
      client.toggleLiveMode();
    }
  }

  function updateConnectionStatusPill(connected) {
    if (!rowanStatusPill) return;
    rowanStatusPill.className = `rowan-status-pill ${connected ? 'connected' : 'disconnected'}`;
    if (rowanStatusText) {
      rowanStatusText.textContent = connected ? 'Conectado' : 'Desconectado';
    }
  }

  // Bind mini-chat listeners
  if (rowanChatSend) {
    rowanChatSend.addEventListener('click', sendRowanQuery);
  }

  if (rowanChatInput) {
    rowanChatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendRowanQuery();
      }
    });
  }

  if (rowanLiveToggle) {
    rowanLiveToggle.addEventListener('click', toggleLiveModeFromUI);
  }

  if (rowanTabLiveBtn) {
    rowanTabLiveBtn.addEventListener('click', toggleLiveModeFromUI);
  }

  if (rowanRestoreBtn) {
    rowanRestoreBtn.addEventListener('click', () => {
      if (window.islandAPI && typeof window.islandAPI.openRowanWindow === 'function') {
        window.islandAPI.openRowanWindow();
      } else {
        const client = rowanClient || window.rowanClient;
        if (client && typeof client.restoreWindow === 'function') {
          client.restoreWindow();
        }
      }
    });
  }

  if (rowanChatClear) {
    rowanChatClear.addEventListener('click', () => {
      if (rowanMessagesList) rowanMessagesList.innerHTML = '';
      if (rowanWelcomeView) rowanWelcomeView.style.display = 'flex';
    });
  }

  // Bind welcome chip suggestions
  const welcomeChips = document.querySelectorAll('.welcome-chip');
  welcomeChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      if (prompt && rowanChatInput) {
        rowanChatInput.value = prompt;
        sendRowanQuery();
      }
    });
  });

  // Connect rowanClient events to UI
  if (rowanClient) {
    rowanClient.on('connected', () => {
      updateConnectionStatusPill(true);
    });

    rowanClient.on('disconnected', () => {
      updateConnectionStatusPill(false);
      if (isStreamingQuery && activeQueryId) {
        handleStreamError(activeQueryId, 'Conexion interrumpida.');
      }
    });

    rowanClient.on('chat_stream', (msg) => {
      if (!msg || !msg.query_id) return;
      if (msg.done) {
        if (msg.token && msg.token.trim().startsWith('Error:')) {
          handleStreamError(msg.query_id, msg.full_text || msg.token);
        } else {
          finalizeAssistantStream(msg.query_id, msg.full_text, msg.emotion);
        }
      } else if (msg.token) {
        appendStreamToken(msg.query_id, msg.token);
      }
    });

    rowanClient.on('live_state', (state) => {
      updateLiveUI(state);
    });

    rowanClient.on('island:action', async (msg) => {
      if (!msg || typeof msg !== 'object') return;
      const { action, payload, id, action_id } = msg;
      const outcome = await handleIslandAction(action, payload || {});
      const actId = action_id || id || null;
      if (typeof rowanClient.sendActionResult === 'function') {
        rowanClient.sendActionResult(action, outcome.success, outcome.result, outcome.error, actId);
      } else {
        rowanClient.send({
          type: 'island:action_result',
          action: action || 'unknown',
          success: Boolean(outcome.success),
          result: outcome.result !== undefined ? outcome.result : null,
          error: outcome.error || null,
          ...(actId ? { id: actId, action_id: actId } : {})
        });
      }
    });

    updateConnectionStatusPill(rowanClient.isConnected);
  }

  // ================= LAYER 4 GUARDRAIL & ISLAND ACTIONS HANDLER =================
  const FORBIDDEN_ISLAND_ACTIONS = new Set([
    'shutdown', 'power_off', 'poweroff', 'restart', 'reboot', 'sleep', 'hibernate', 'system_action',
    'tsshutdn', 'setsuspendstate', 'powrprof', 'lockworkstation', 'lock'
  ]);

  const DANGEROUS_SUBSTRINGS = [
    'shutdown', 'stop-computer', 'restart-computer',
    'tsshutdn', 'setsuspendstate', 'powrprof', 'lockworkstation',
    'exitwindowsex', 'win32shutdown', 'init0', 'init6', 'poweroff', 'halt', 'psshutdown',
    'restart', 'reboot'
  ];

  function isDangerousIslandAction(action, payload) {
    const act = (action || '').toLowerCase().trim();
    if (FORBIDDEN_ISLAND_ACTIONS.has(act)) return true;
    const rawPayload = JSON.stringify(payload || '').toLowerCase();
    const deobfuscated = rawPayload.replace(/[\s"'\\]/g, '');
    if (DANGEROUS_SUBSTRINGS.some(tok => deobfuscated.includes(tok))) {
      return true;
    }
    try {
      if (typeof payload === 'string' || (payload && (payload.command || payload.cmd || payload.text))) {
        const cmd = String(payload.command || payload.cmd || payload.text || payload);
        const b64Match = cmd.match(/[-/](?:e|ec|en|enc[a-z]*)(?:[:=\s]+)["']?\s*([A-Za-z0-9+/=\s]{4,})\s*["']?/i);
        let b64Candidate = (b64Match ? b64Match[1] : cmd).replace(/[\s"'\\]/g, '');
        const pad = b64Candidate.length % 4;
        if (pad) {
          b64Candidate += '='.repeat(4 - pad);
        }
        if (typeof atob === 'function' && b64Candidate.length >= 4) {
          const rawDecoded = atob(b64Candidate).toLowerCase();
          // Strip null bytes for UTF-16LE compatibility
          const cleanDecoded = rawDecoded.replace(/\0/g, '');
          if (DANGEROUS_SUBSTRINGS.some(tok => cleanDecoded.includes(tok))) return true;
          const deobfDecoded = cleanDecoded.replace(/[\s"'\\]/g, '');
          if (DANGEROUS_SUBSTRINGS.some(tok => deobfDecoded.includes(tok))) return true;
        }
      }
    } catch {}
    return false;
  }

  async function handleIslandAction(action, payload = {}) {
    const safePayload = payload && typeof payload === 'object' ? payload : {};
    const act = (action || '').toLowerCase().trim();

    // Layer 4 Guardrail check
    if (isDangerousIslandAction(act, safePayload)) {
      console.warn(`[SECURITY GUARDRAIL Layer 4] Blocked forbidden action '${act}'`);
      return {
        success: false,
        error: 'SECURITY_BLOCKED: Shutdown and power off operations are strictly prohibited.'
      };
    }

    switch (act) {
      case 'list_tasks':
        return { success: true, result: { tasks: scheduledTasks.map(t => ({...t})) } };
      case 'delete_task':
      case 'remove_task':
      case 'complete_task': {
        const candidates = scheduledTasks.filter(t => safePayload.id != null
          ? String(t.id) === String(safePayload.id)
          : typeof safePayload.text === 'string' && t.text.trim().toLocaleLowerCase() === safePayload.text.trim().toLocaleLowerCase());
        if (candidates.length !== 1) return { success: false, error: candidates.length ? 'Hay tareas con el mismo nombre; usa su ID exacto.' : 'No se encontró la tarea; consulta list_tasks.' };
        const target = candidates[0];
        const previous = scheduledTasks.map(t => ({...t}));
        if (act === 'complete_task') target.completed = safePayload.completed !== false && safePayload.completed !== 'false';
        else scheduledTasks = scheduledTasks.filter(t => t !== target);
        try { const saved = await window.islandAPI.saveNotes({tasks: scheduledTasks, text: freetextArea ? freetextArea.value : ''}); if (saved === false) throw new Error('No se pudieron guardar las tareas'); }
        catch (error) { scheduledTasks = previous; return {success:false, error:String(error)}; }
        renderChecklistUI(); renderCalendar(); renderAgenda();
        return {success:true, result:{task:target, totalTasks:scheduledTasks.length}};
      }
      case 'add_task': {
        const text = (safePayload.text || safePayload.task || safePayload.title || '').trim();
        if (!text) {
          return { success: false, error: 'Task text is required' };
        }
        const dueDate = safePayload.dueDate || safePayload.due_date || null;
        const newTask = {
          id: Math.max(Date.now(), ...scheduledTasks.map(t => Number(t.id) + 1).filter(Number.isFinite)),
          text,
          completed: false,
          dueDate
        };
        scheduledTasks.unshift(newTask);
        try { const saved = await window.islandAPI.saveNotes({tasks: scheduledTasks, text: freetextArea ? freetextArea.value : ''}); if (saved === false) throw new Error('No se pudieron guardar las tareas'); }
        catch (error) { scheduledTasks = scheduledTasks.filter(t => t !== newTask); return {success:false, error:String(error)}; }
        renderChecklistUI();
        renderCalendar();
        renderAgenda();
        playHapticChime(680, 'sine', 0.05);
        showNotchAlert({
          title: 'Nueva Tarea',
          sub: newTask.text,
          tintClass: 'cyan-tint',
          duration: 2500,
          dynamicWidth: 220
        });
        return {
          success: true,
          result: {
            id: newTask.id,
            text: newTask.text,
            dueDate: newTask.dueDate,
            totalTasks: scheduledTasks.length
          }
        };
      }

      case 'add_event': {
        const note = (safePayload.note || safePayload.text || safePayload.title || safePayload.event || '').trim();
        if (!note) {
          return { success: false, error: 'Event note is required' };
        }
        let dateStr = safePayload.date || selectedDateStr;
        if (!dateStr || typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          dateStr = localDateKey();
        }
        if (!calendarData.dates) {
          calendarData.dates = {};
        }
        if (!calendarData.dates[dateStr]) {
          calendarData.dates[dateStr] = [];
        }
        calendarData.dates[dateStr].push(note);
        try {
          if (window.islandAPI && window.islandAPI.saveCalendar) {
            await window.islandAPI.saveCalendar(calendarData);
          }
        } catch {}
        renderCalendar();
        renderAgenda();
        playHapticChime(720, 'sine', 0.05);
        showNotchAlert({
          title: 'Nuevo Evento',
          sub: note,
          tintClass: 'cyan-tint',
          duration: 2500,
          dynamicWidth: 220
        });
        return {
          success: true,
          result: {
            date: dateStr,
            note,
            totalEvents: calendarData.dates[dateStr].length
          }
        };
      }

      case 'toggle_night_mode': {
        let targetTheme;
        if (safePayload.theme === 'dark' || safePayload.mode === 'dark' || safePayload.enabled === true) {
          targetTheme = 'dark';
        } else if (safePayload.theme === 'light' || safePayload.mode === 'light' || safePayload.enabled === false) {
          targetTheme = 'light';
        } else {
          targetTheme = currentTheme === 'light' ? 'dark' : 'light';
        }
        applyTheme(targetTheme);
        if (typeof safePayload.nightlight === 'boolean' && window.islandAPI && window.islandAPI.setNightLight) {
          try {
            await window.islandAPI.setNightLight(safePayload.nightlight);
            isNightlightOn = safePayload.nightlight;
          } catch {}
        }
        playHapticChime(targetTheme === 'light' ? 740 : 480, 'sine', 0.08);
        showNotchAlert({
          title: targetTheme === 'light' ? 'Tema Claro' : 'Tema Oscuro',
          sub: 'Activado',
          tintClass: targetTheme === 'light' ? 'amber-tint' : 'cyan-tint',
          duration: 2000,
          dynamicWidth: 190
        });
        return {
          success: true,
          result: {
            theme: currentTheme,
            nightlight: typeof isNightlightOn !== 'undefined' ? isNightlightOn : null
          }
        };
      }

      case 'set_timer': {
        const hours = Math.max(0, parseInt(safePayload.hours, 10) || 0);
        const minutes = Math.max(0, parseInt(safePayload.minutes, 10) || 0);
        const seconds = Math.max(0, parseInt(safePayload.seconds, 10) || 0);
        const durationSec = Math.max(0, parseInt(safePayload.duration_seconds || safePayload.duration, 10) || 0);
        const totalSec = durationSec > 0 ? durationSec : (hours * 3600 + minutes * 60 + seconds);

        if (totalSec <= 0) {
          return { success: false, error: 'Valid timer duration required' };
        }

        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
        timerInitialSeconds = totalSec;
        timerRemainingSeconds = totalSec;
        syncInputsFromSeconds(totalSec);
        renderTimerUI();
        if (txtTimerToggle) txtTimerToggle.textContent = 'Pausar';
        playHapticChime(640, 'triangle', 0.06);

        timerInterval = setInterval(() => {
          if (timerRemainingSeconds > 0) {
            timerRemainingSeconds--;
            renderTimerUI();
          } else {
            clearInterval(timerInterval);
            timerInterval = null;
            if (txtTimerToggle) txtTimerToggle.textContent = 'Iniciar';
            playHapticChime(880, 'sine', 0.5);
            showNotchAlert({
              iconSvg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>',
              title: 'Temporizador',
              sub: '¡Tiempo completado!',
              tintClass: 'amber-tint',
              duration: 3200,
              dynamicWidth: 200
            });
          }
        }, 1000);

        showNotchAlert({
          title: 'Temporizador',
          sub: `Iniciado (${totalSec}s)`,
          tintClass: 'cyan-tint',
          duration: 2000,
          dynamicWidth: 195
        });

        return {
          success: true,
          result: {
            initialSeconds: totalSec,
            remainingSeconds: totalSec,
            running: true
          }
        };
      }

      case 'set_brightness': {
        const lvl = Math.max(0, Math.min(100, Math.round(Number(safePayload.level ?? safePayload.value ?? 70))));
        updateBrightnessUI(lvl);
        window.islandAPI?.setBrightness?.(lvl);
        triggerBrightnessAlert(lvl);
        return {
          success: true,
          result: { level: lvl }
        };
      }

      case 'control_widget': {
        const rawWidget = (safePayload.widget || safePayload.tab || safePayload.name || 'notes').toLowerCase().trim();
        const tabAliases = {
          notas: 'notes',
          notes: 'notes',
          tareas: 'notes',
          tasks: 'notes',
          checklist: 'notes',
          calendario: 'calendar',
          calendar: 'calendar',
          agenda: 'calendar',
          eventos: 'calendar',
          timer: 'timer',
          temporizador: 'timer',
          reloj: 'timer',
          cronometro: 'timer',
          stopwatch: 'timer',
          weather: 'weather',
          clima: 'weather',
          rowan: 'rowan',
          chat: 'rowan',
          musica: 'music',
          music: 'music',
          tools: 'tools',
          herramientas: 'tools',
          home: 'home',
          inicio: 'home',
          dashboard: 'home',
          portapapeles: 'clipboard',
          clipboard: 'clipboard',
          shelf: 'shelf'
        };
        const targetTab = tabAliases[rawWidget] || 'notes';
        if (container.classList.contains('collapsed')) {
          expandIsland();
        }
        switchTab(targetTab);
        return {
          success: true,
          result: {
            widget: targetTab,
            expanded: true
          }
        };
      }

      default:
        return {
          success: false,
          error: `Unknown island action: ${action}`
        };
    }
  }

  // ================= AUDIO OUTPUT / SPEAKERS SELECTOR (HOME TAB) =================
  const btnDeviceSelector = document.getElementById('btn-device-selector');
  const speakerNameLabel = document.getElementById('speaker-name-label');
  const speakerMenuDrawer = document.getElementById('speaker-menu-drawer');
  const speakerDevicesList = document.getElementById('speaker-devices-list');
  const btnOpenWinSound = document.getElementById('btn-open-win-sound');

  async function refreshSpeakerOutputs() {
    if (!window.islandAPI?.getAudioOutputs) return;
    try {
      const info = await window.islandAPI.getAudioOutputs();
      const devices = Array.isArray(info?.devices) ? info.devices : [];
      const active = info?.active || devices[0] || 'Speakers';
      if (speakerNameLabel && active) {
        speakerNameLabel.textContent = active.length > 22 ? active.slice(0, 20) + '…' : active;
        if (btnDeviceSelector) btnDeviceSelector.title = `Salida activa: ${active} (Clic para cambiar altavoces)`;
      }
      if (speakerDevicesList) {
        if (devices.length === 0) {
          speakerDevicesList.innerHTML = '<p class="drawer-loading">Sin dispositivos detectados.</p>';
        } else {
          speakerDevicesList.innerHTML = devices.map(dev => `
            <div class="drawer-device-row" data-speaker="${escapeHtml(dev)}">
              <span class="drawer-item-name">${escapeHtml(dev)}</span>
              <span class="drawer-item-action">${dev === active ? 'Activo ✓' : 'Usar'}</span>
            </div>
          `).join('');
          speakerDevicesList.querySelectorAll('.drawer-device-row').forEach(row => {
            row.addEventListener('click', async () => {
              const chosen = row.getAttribute('data-speaker');
              if (!chosen) return;
              try {
                await window.islandAPI.setAudioOutput?.(chosen);
              } catch {}
              if (speakerNameLabel) {
                speakerNameLabel.textContent = chosen.length > 22 ? chosen.slice(0, 20) + '…' : chosen;
              }
              if (speakerMenuDrawer) speakerMenuDrawer.style.display = 'none';
              playHapticChime(680, 'sine', 0.06);
              showNotchAlert({
                iconSvg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>',
                title: 'Salida de Audio',
                sub: chosen,
                tintClass: 'blue-tint',
                duration: 2200
              });
              refreshSpeakerOutputs();
            });
          });
        }
      }
    } catch {}
  }
  refreshSpeakerOutputs();

  if (btnOpenWinSound) {
    btnOpenWinSound.addEventListener('click', async (e) => {
      e.stopPropagation();
      try { await window.islandAPI.openSoundSettings(); } catch {}
    });
  }

  if (btnDeviceSelector) {
    btnDeviceSelector.addEventListener('click', async (event) => {
      event.stopPropagation();
      if (speakerMenuDrawer) {
        const isHidden = speakerMenuDrawer.style.display === 'none' || !speakerMenuDrawer.style.display;
        speakerMenuDrawer.style.display = isHidden ? 'flex' : 'none';
        if (wifiMenuDrawer) wifiMenuDrawer.style.display = 'none';
        if (btMenuDrawer) btMenuDrawer.style.display = 'none';
        if (isHidden) refreshSpeakerOutputs();
      }
      try {
        await window.islandAPI.openSoundSettings();
      } catch (error) {
        console.error(error);
      }
    });
  }

  // Expose global methods for diagnostics and unit testing
  window.updateNotchGrooveState = updateNotchGrooveState;
  window.setNotchGrooveActive = setNotchGrooveActive;
  window.applyNotchEmotion = applyNotchEmotion;
  window.handleNotchAudioLevel = handleNotchAudioLevel;
  window.ROWAN_EMOTIONS = ROWAN_EMOTIONS;
  window.shouldAutoScroll = shouldAutoScroll;
  window.appendUserMessage = appendUserMessage;
  window.startAssistantStream = startAssistantStream;
  window.appendStreamToken = appendStreamToken;
  window.finalizeAssistantStream = finalizeAssistantStream;
  window.handleStreamError = handleStreamError;
  window.sendRowanQuery = sendRowanQuery;
  window.handleNotchLiveState = handleNotchLiveState;
  window.updateLiveUI = updateLiveUI;
  window.updateConnectionStatusPill = updateConnectionStatusPill;
  window.handleIslandAction = handleIslandAction;

});
