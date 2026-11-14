/* ============================================================================
   DEMO ANIMATIONS — Vitrina Animada con las Interfaces Reales (Rowan Island)
   ============================================================================ */
(function () {
  const root = document.getElementById('fn-showcase');
  if (!root) return;

  const tabs = [
    { id: 'notch', target: 'island', num: '01', label: 'Notch & Alertas', kicker: '01 / NOTCH INTELIGENTE', desc: 'La cápsula superior muta en tiempo real entre reloj, música, alertas del sistema y avatar de Rowan.' },
    { id: 'home', target: 'island', num: '02', label: 'Home (Control PC)', kicker: '02 / CENTRO DE CONTROL', desc: 'Panel rápido real con reproductor multimedia, brillo, volumen por aplicación, Wi-Fi, Bluetooth y energía.' },
    { id: 'rowan', target: 'island', num: '03', label: 'Rowan Mini-Chat', kicker: '03 / ASISTENTE EN EL ISLAND', desc: 'Mini chat integrado dentro del Island con voz Live, dictado, expresiones y acceso a la ventana grande.' },
    { id: 'calendar', target: 'island', num: '04', label: 'Calendario & Agenda', kicker: '04 / AGENDA INTEGRADA', desc: 'Calendario mensual real con indicadores de tareas pendientes y notas rápidas por fecha.' },
    { id: 'notes', target: 'island', num: '05', label: 'Tareas & Notas', kicker: '05 / PRODUCTIVIDAD RÁPIDA', desc: 'Checklist con fecha límite y bloc de notas persistente dentro de la cápsula expandida.' },
    { id: 'clipboard', target: 'island', num: '06', label: 'Clips (Portapapeles)', kicker: '06 / HISTORIAL DE COPIADO', desc: 'Historial automático de textos, enlaces y rutas copiadas en Windows con búsqueda instantánea.' },
    { id: 'shelf', target: 'island', num: '07', label: 'Shelf (Bandeja)', kicker: '07 / ARRASTRA Y SUELTA', desc: 'Bandeja temporal para dejar archivos o accesos directos y abrirlos sin desordenar el escritorio.' },
    { id: 'weather', target: 'island', num: '08', label: 'Clima en Vivo', kicker: '08 / CLIMA INTEGRADO', desc: 'Pronóstico actual por ciudad directamente en tu barra superior sin abrir el navegador.' },
    { id: 'timer', target: 'island', num: '09', label: 'Temporizador & Reloj', kicker: '09 / CUENTA REGRESIVA ESTABLE', desc: 'Temporizador y cronómetro sincronizados con el notch sin vibraciones.' },
    { id: 'tools', target: 'island', num: '10', label: 'Herramientas Útiles', kicker: '10 / UTILIDADES RÁPIDAS', desc: 'Cuentagotas de color, captura de pantalla, OCR de texto y utilidades del sistema.' },
    { id: 'rowan-app', target: 'rowan', num: '11', label: 'Rowan Ventana & Ajustes', kicker: '11 / VENTANA INDEPENDIENTE', desc: 'La aplicación completa de Rowan AI con sus ojos expresivos, Modo Live y panel de Ajustes.' }
  ];

  const navEl = document.getElementById('fn-nav');
  const kickerEl = document.getElementById('fn-stage-kicker');
  const descEl = document.getElementById('fn-stage-desc');
  const autoBtn = document.getElementById('fn-auto-btn');
  const islandFrame = document.getElementById('fn-frame-island');
  const rowanFrame = document.getElementById('fn-frame-rowan');

  let activeIdx = 0;
  let autoCycle = true;
  let autoTimer = null;

  navEl.innerHTML = tabs.map((t, i) => `
    <button type="button" class="fn-tab ${i === 0 ? 'active' : ''}" data-idx="${i}">
      <span class="fn-tab-num">${t.num}</span>
      <span class="fn-tab-title">${t.label}</span>
    </button>
  `).join('');

  const tabBtns = navEl.querySelectorAll('.fn-tab');

  function syncFrame(item) {
    const isRowan = item.target === 'rowan';
    islandFrame?.classList.toggle('active', !isRowan);
    rowanFrame?.classList.toggle('active', isRowan);
    const frame = isRowan ? rowanFrame : islandFrame;
    try {
      frame?.contentWindow?.postMessage({ type: 'showcase-select', fn: item.id }, '*');
    } catch (_) {}
  }

  function activate(idx) {
    activeIdx = ((idx % tabs.length) + tabs.length) % tabs.length;
    const item = tabs[activeIdx];
    tabBtns.forEach((b, i) => b.classList.toggle('active', i === activeIdx));
    if (kickerEl) kickerEl.textContent = item.kicker;
    if (descEl) descEl.textContent = item.desc;
    syncFrame(item);
  }

  islandFrame?.addEventListener('load', () => {
    const current = tabs[activeIdx];
    if (current && current.target === 'island') syncFrame(current);
  });

  rowanFrame?.addEventListener('load', () => {
    const current = tabs[activeIdx];
    if (current && current.target === 'rowan') syncFrame(current);
  });

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      autoCycle = false;
      autoBtn?.classList.remove('on');
      const labelSpan = autoBtn?.querySelector('span:last-child');
      if (labelSpan) labelSpan.textContent = 'Manual';
      clearInterval(autoTimer);
      activate(Number(btn.dataset.idx));
    });
  });

  function startAuto() {
    clearInterval(autoTimer);
    if (!autoCycle) return;
    autoTimer = setInterval(() => activate(activeIdx + 1), 5200);
  }

  if (autoBtn) {
    autoBtn.addEventListener('click', () => {
      autoCycle = !autoCycle;
      autoBtn.classList.toggle('on', autoCycle);
      const labelSpan = autoBtn.querySelector('span:last-child');
      if (labelSpan) labelSpan.textContent = autoCycle ? 'Tour automático' : 'Manual';
      if (autoCycle) startAuto();
      else clearInterval(autoTimer);
    });
  }

  activate(0);
  startAuto();
})();
