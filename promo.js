/* ============================================================================
   PROMO, SCROLL FLUIDO Y ENFOQUE GRADUAL — Rowan Island Website Copy
   ============================================================================ */
(function () {
  window.addEventListener('DOMContentLoaded', () => {
    const reducedMotion = Boolean(
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );

    // -------- 1. ANIMACIÓN DE BIENVENIDA --------
    const intro = document.getElementById('welcome-intro');
    let autoHideTimer = null;

    function closeIntro() {
      if (!intro || intro.classList.contains('is-leaving')) return;
      clearTimeout(autoHideTimer);
      intro.classList.add('is-leaving');
      document.body.classList.remove('intro-locked');
    }

    const params = new URLSearchParams(location.search);
    if (intro && !reducedMotion && params.get('skipIntro') !== '1') {
      document.body.classList.add('intro-locked');
      autoHideTimer = setTimeout(closeIntro, 3350);
    } else if (intro) {
      intro.classList.add('is-leaving');
      document.body.classList.remove('intro-locked');
    }

    if (intro) {
      intro.addEventListener('click', (e) => {
        if (e.target === intro) closeIntro();
      });
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        if (intro && !intro.classList.contains('is-leaving')) {
          e.preventDefault();
          closeIntro();
        }
      }
    });

    // -------- 2. SCROLL FLUIDO CON INERCIA + ENFOQUE BORROSO → NÍTIDO --------
    const revealTargets = [...document.querySelectorAll(
      [
        'main > section:not(#inicio) > .section-index',
        '.promo-head',
        '.promo-layout',
        '#demo h2',
        '#demo > p',
        '.fn-showcase',
        '.intro-grid',
        '.feature-rail .feature',
        '.island-guide-heading',
        '.island-states article',
        '.island-toolbox-intro',
        '.island-tools details',
        '.voice-copy',
        '.voice-visual',
        '.emotion-intro',
        '.emotion-stage',
        '.emotion-browser',
        '.emotion-footnote',
        '.control-grid > div:first-child',
        '.control-list > div',
        '.closing-art',
        '.closing-copy',
        '.faq h2',
        '.faq-items details',
      ].join(', ')
    )];

    if (!reducedMotion && revealTargets.length > 0) {
      revealTargets.forEach((el) => {
        el._clarity = 0;
        el.classList.add('mist-reveal');
      });
    }

    let targetScrollY = window.scrollY || window.pageYOffset || 0;
    let currentScrollY = targetScrollY;
    let lastAppliedY = targetScrollY;
    let isWheelGliding = false;
    let mainRaf = 0;
    let lastFrameTime = 0;

    function getMaxScroll() {
      const doc = document.documentElement;
      return Math.max(0, doc.scrollHeight - (window.innerHeight || doc.clientHeight || 800));
    }

    function hasScrollableParent(el, deltaY) {
      let node = el;
      while (node && node !== document.body && node !== document.documentElement) {
        if (node instanceof Element) {
          const oy = getComputedStyle(node).overflowY;
          if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight + 1) {
            const atTop = node.scrollTop <= 0;
            const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1;
            if ((deltaY < 0 && !atTop) || (deltaY > 0 && !atBottom)) {
              return true;
            }
          }
        }
        node = node.parentNode;
      }
      return false;
    }

    function normalizeWheelDelta(e) {
      let dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 38;
      else if (e.deltaMode === 2) dy *= (window.innerHeight || 800) * 0.85;
      return dy;
    }

    function tickMotion(now) {
      mainRaf = 0;
      const dt = lastFrameTime ? Math.min(0.05, (now - lastFrameTime) / 1000) : 0.016;
      lastFrameTime = now;

      let needsMoreFrames = false;

      // 2a. Inercia suave del scroll con rueda
      if (isWheelGliding && !reducedMotion) {
        const diff = targetScrollY - currentScrollY;
        if (Math.abs(diff) <= 0.45) {
          currentScrollY = targetScrollY;
          isWheelGliding = false;
        } else {
          const factor = 1 - Math.exp(-dt * 9.5);
          currentScrollY += diff * factor;
          needsMoreFrames = true;
        }
        window.scrollTo({ top: currentScrollY, behavior: 'instant' });
        lastAppliedY = window.scrollY || window.pageYOffset || 0;
      }

      // 2b. Enfoque progresivo fluido (borroso abajo → claro al subir)
      if (!reducedMotion && revealTargets.length > 0) {
        const vh = window.innerHeight || document.documentElement.clientHeight || 800;
        const startY = vh * 1.0;
        const endY = vh * 0.7;
        const span = Math.max(120, startY - endY);
        const clarityDamp = 1 - Math.exp(-dt * 14);

        revealTargets.forEach((el) => {
          const prev = el._clarity || 0;
          const rect = el.getBoundingClientRect();
          const naturalTop = rect.top - (el.classList.contains('is-clear') ? 0 : (1 - prev) * 38);
          const linear = Math.max(0, Math.min(1, (startY - naturalTop) / span));
          const targetClarity = linear >= 0.995 ? 1 : 1 - Math.pow(1 - linear, 2.2);

          let next = prev + (targetClarity - prev) * clarityDamp;
          if (Math.abs(targetClarity - next) < 0.004) {
            next = targetClarity;
          } else {
            needsMoreFrames = true;
          }

          if (Math.abs(next - prev) > 0.001 || (next === 1 && !el.classList.contains('is-clear'))) {
            el._clarity = next;
            el.style.setProperty('--clarity', next.toFixed(3));
            el.classList.toggle('is-clear', next >= 0.995);
          }
        });
      }

      if (needsMoreFrames) {
        mainRaf = requestAnimationFrame(tickMotion);
      } else {
        lastFrameTime = 0;
      }
    }

    function requestMotionTick() {
      if (!mainRaf) {
        mainRaf = requestAnimationFrame(tickMotion);
      }
    }

    if (!reducedMotion) {
      window.addEventListener(
        'wheel',
        (e) => {
          if (document.body.classList.contains('intro-locked')) return;
          if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
          const dy = normalizeWheelDelta(e);
          if (!dy || hasScrollableParent(e.target, dy)) return;

          e.preventDefault();
          const actualY = window.scrollY || window.pageYOffset || 0;
          if (!isWheelGliding) {
            currentScrollY = actualY;
            targetScrollY = actualY;
          }
          targetScrollY = Math.max(0, Math.min(getMaxScroll(), targetScrollY + dy * 1.08));
          isWheelGliding = true;
          requestMotionTick();
        },
        { passive: false }
      );
    }

    window.addEventListener(
      'scroll',
      () => {
        const actualY = window.scrollY || window.pageYOffset || 0;
        if (!isWheelGliding || Math.abs(actualY - lastAppliedY) > 10) {
          isWheelGliding = false;
          currentScrollY = actualY;
          targetScrollY = actualY;
          lastAppliedY = actualY;
        }
        requestMotionTick();
      },
      { passive: true }
    );

    window.addEventListener('resize', requestMotionTick, { passive: true });
    requestMotionTick();

    // -------- 3. ESCAPARATE EN MOVIMIENTO SIN BARRA DE REPRODUCCIÓN --------
    const mainVideo = document.getElementById('promo-main-video');
    const soundBtn = document.getElementById('promo-sound-btn');
    const playBtn = document.getElementById('promo-play-btn');
    const chapBtns = [...document.querySelectorAll('.promo-chap-btn')];

    function syncAmbientControls() {
      if (!mainVideo) return;
      if (soundBtn) {
        const hasAudio = !mainVideo.muted;
        soundBtn.setAttribute('aria-pressed', String(hasAudio));
        soundBtn.textContent = hasAudio ? 'Sonido activo' : 'Silenciado';
      }
      if (playBtn) {
        const isPlaying = !mainVideo.paused && !mainVideo.ended;
        playBtn.setAttribute('aria-pressed', String(isPlaying));
        playBtn.textContent = isPlaying ? 'Pausa' : 'Reanudar';
      }
    }

    function jumpToMoment(seconds, withSound = false, shouldScroll = false) {
      if (!mainVideo) return;
      if (shouldScroll) {
        isWheelGliding = false;
        document.getElementById('presentacion')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (withSound) mainVideo.muted = false;
      const applySeek = () => {
        mainVideo.currentTime = Math.max(0, Number(seconds) || 0);
        mainVideo.play().catch(() => {});
        syncAmbientControls();
      };
      if (mainVideo.readyState >= 1) {
        applySeek();
      } else {
        mainVideo.addEventListener('loadedmetadata', applySeek, { once: true });
        mainVideo.load();
      }
    }

    if (mainVideo) {
      mainVideo.addEventListener('click', () => {
        if (mainVideo.paused) {
          mainVideo.play().catch(() => {});
        } else {
          mainVideo.pause();
        }
        syncAmbientControls();
      });
      mainVideo.addEventListener('play', syncAmbientControls);
      mainVideo.addEventListener('pause', syncAmbientControls);
      mainVideo.addEventListener('volumechange', syncAmbientControls);

      mainVideo.addEventListener('timeupdate', () => {
        const cur = mainVideo.currentTime || 0;
        let activeIdx = 0;
        chapBtns.forEach((btn, i) => {
          const t = Number(btn.dataset.time) || 0;
          if (cur >= t - 0.35) activeIdx = i;
        });
        chapBtns.forEach((btn, i) => btn.classList.toggle('active', i === activeIdx));
      });

      if (soundBtn) {
        soundBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          mainVideo.muted = !mainVideo.muted;
          if (!mainVideo.muted && mainVideo.paused) {
            mainVideo.play().catch(() => {});
          }
          syncAmbientControls();
        });
      }

      if (playBtn) {
        playBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (mainVideo.paused) {
            mainVideo.play().catch(() => {});
          } else {
            mainVideo.pause();
          }
          syncAmbientControls();
        });
      }

      syncAmbientControls();
    }

    chapBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        jumpToMoment(btn.dataset.time, false, false);
      });
    });

    document.querySelectorAll('[data-jump-promo]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        jumpToMoment(el.getAttribute('data-jump-promo'), false, true);
      });
    });

    // -------- 4. REPRODUCCIÓN EFICIENTE POR VISIBILIDAD --------
    const autoCanvasVideos = [...document.querySelectorAll('video.clip-loop, #hero-loop-video, #promo-main-video')];
    if ('IntersectionObserver' in window && autoCanvasVideos.length > 0) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const v = entry.target;
            if (entry.isIntersecting) {
              v.play().catch(() => {});
            } else {
              v.pause();
            }
          });
        },
        { threshold: 0.12 }
      );
      autoCanvasVideos.forEach((v) => io.observe(v));
    }

    // -------- 5. CAMBIO INTEGRADO EN ESCENARIO DE EMOCIONES --------
    const emoStage = document.getElementById('emotion-stage');
    const emoToggle = document.getElementById('emo-stage-toggle');
    const emoStageClip = document.getElementById('emo-stage-clip');
    const emoGrid = document.getElementById('emotion-grid');

    if (emoStage && emoToggle && emoStageClip) {
      const setDesktopMode = (active) => {
        emoStage.classList.toggle('is-desktop-mode', active);
        emoToggle.setAttribute('aria-pressed', String(active));
        emoToggle.textContent = active ? 'Volver al rostro' : 'En escritorio';
        if (active) {
          emoStageClip.currentTime = 0;
          emoStageClip.play().catch(() => {});
        } else {
          emoStageClip.pause();
        }
      };

      emoToggle.addEventListener('click', () => {
        setDesktopMode(!emoStage.classList.contains('is-desktop-mode'));
      });

      if (emoGrid) {
        emoGrid.addEventListener('click', () => {
          if (emoStage.classList.contains('is-desktop-mode')) {
            setDesktopMode(false);
          }
        });
      }
    }
  });
})();
