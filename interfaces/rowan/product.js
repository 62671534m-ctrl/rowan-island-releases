(() => {
  if (new URLSearchParams(location.search).has('surface')) return;

  const DEFAULT_GUIDES = [
    {
      id: 'google',
      name: 'Google AI Studio',
      tag: 'Chat y Live nativo',
      url: 'https://aistudio.google.com/apikey',
      docs: 'https://ai.google.dev/gemini-api/docs/api-key',
      video: 'https://www.youtube.com/watch?v=JdKcFCLotZY',
      steps: [
        'Abre Google AI Studio e inicia sesión con tu cuenta de Google. Revisa los requisitos de acceso de tu cuenta y región.',
        'En API keys busca una clave existente o pulsa Create API key. Si pide un proyecto, selecciona uno o crea uno nuevo.',
        'Copia la clave completa. Es privada: pégala abajo, no en la conversación ni en una captura compartida.',
        'Pulsa Probar y guardar. Rowan hará una petición breve al modelo configurado; puede consumir cuota del proveedor.',
        'Cuando aparezca Conectado, cierra Ayuda y escribe Hola. Para Live, usa el botón de ondas y permite el micrófono.'
      ]
    },
    {
      id: 'openrouter',
      name: 'OpenRouter',
      tag: 'Chat con distintos modelos',
      url: 'https://openrouter.ai/settings/keys',
      docs: 'https://openrouter.ai/docs/quickstart',
      steps: [
        'Crea una cuenta o inicia sesión en OpenRouter. Abre Settings y después API Keys.',
        'Crea una clave nueva, ponle un nombre como Rowan y define los límites que prefieras. Copia la clave completa.',
        'Consulta el saldo, la cuota y las condiciones del modelo en OpenRouter. Tener una clave no garantiza que cualquier modelo esté disponible.',
        'Pégala abajo y pulsa Probar y guardar. La prueba utiliza openrouter/free y puede fallar si no tiene capacidad o cuota.',
        'Si aparece Conectado, abre Modelos & APIs para ordenar tus proveedores. Rowan puede cambiar al siguiente si el primero falla.'
      ]
    },
    {
      id: 'nvidia',
      name: 'NVIDIA',
      tag: 'Chat con modelos del catálogo',
      url: 'https://build.nvidia.com/',
      docs: 'https://docs.api.nvidia.com/nim/docs/api-quickstart',
      steps: [
        'Abre NVIDIA Build, inicia sesión o crea una cuenta. Completa las verificaciones que solicite NVIDIA.',
        'Elige un modelo de texto en el catálogo y busca Get API Key en su página. Sigue el proceso de generación y copia la clave.',
        'Copia también el identificador del modelo que aparece en su ejemplo de API. No es el nombre comercial ni la URL completa.',
        'Pega la clave y el identificador abajo. Pulsa Probar y guardar para comprobar que tu cuenta realmente puede usar ese modelo.',
        'Si funciona, escribe tu primer mensaje. Si aparece 403 o modelo no disponible, revisa permisos y el identificador en NVIDIA Build.'
      ]
    },
    {
      id: 'fish',
      name: 'Fish Audio',
      tag: 'Voz opcional',
      url: 'https://fish.audio/app/developers/',
      docs: 'https://docs.fish.audio/developer-guide/getting-started/api-key',
      steps: [
        'Crea tu cuenta en Fish Audio y verifica el correo. Entra en Get Started o Developers.',
        'Busca Get your API key o Create API Key. Genera la clave y cópiala cuando se muestre.',
        'Revisa la cuota y las condiciones de la API en tu cuenta; la suscripción de la web puede ser distinta del acceso API.',
        'Pega la clave abajo y pulsa Probar y guardar. La prueba genera una frase corta para verificar la síntesis y puede consumir cuota.',
        'En Ajustes > Voz elige una voz del catálogo. Activa el altavoz de Rowan. Fish aporta la voz: aún necesitas Google, NVIDIA u OpenRouter para conversar.'
      ]
    }
  ];

  let guides = DEFAULT_GUIDES.slice();
  let selected = 0;
  let step = 0;
  let readyCalled = false;
  let readyInFlight = false;

  const byId = (id) => document.getElementById(id);
  const api = () => window.pywebview?.api;
  const openExternal = (url) => {
    try {
      Promise.resolve(api()?.open_help_link?.(url)).catch(() => {});
    } catch {}
  };

  function dismissWelcome() {
    document.querySelectorAll('#product-welcome').forEach((el) => el.remove());
    try {
      Promise.resolve(api()?.finish_onboarding?.()).catch(() => {});
    } catch {}
  }

  function openHelp() {
    const settingsModal = byId('settings-modal');
    if (!settingsModal || settingsModal.classList.contains('hidden')) {
      byId('open-settings-btn')?.click();
    }
    byId('tab-btn-help')?.click();
    requestAnimationFrame(() => {
      byId('tab-btn-help')?.click();
    });
  }

  function render() {
    const guide = guides[selected];
    if (!guide) return;
    if (byId('help-title')) byId('help-title').textContent = guide.name;
    if (byId('help-tag')) byId('help-tag').textContent = guide.tag;
    if (byId('help-progress')) byId('help-progress').textContent = `PASO ${step + 1} DE ${guide.steps.length}`;
    if (byId('help-instruction')) byId('help-instruction').textContent = guide.steps[step];
    if (byId('help-prev')) byId('help-prev').disabled = step === 0;
    if (byId('help-next')) byId('help-next').textContent = step === guide.steps.length - 1 ? 'Volver al inicio' : 'Siguiente';
    if (byId('help-model')) byId('help-model').hidden = guide.id !== 'nvidia';
    if (byId('help-official-video')) byId('help-official-video').hidden = !guide.video;
    byId('help-providers')?.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', String(i === selected)));
  }

  function renderProviders() {
    const container = byId('help-providers');
    if (!container) return;
    container.replaceChildren();
    for (const [i, guide] of guides.entries()) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = guide.name;
      button.onclick = () => {
        selected = i;
        step = 0;
        if (byId('help-key')) byId('help-key').value = '';
        if (byId('help-result')) byId('help-result').textContent = '';
        const video = byId('help-video');
        if (video) {
          video.pause();
          video.hidden = true;
        }
        render();
      };
      container.append(button);
    }
    render();
  }

  async function ready() {
    if (readyCalled || readyInFlight || !api()?.get_product_status) return;
    readyInFlight = true;
    let state;
    try {
      state = await api()?.get_product_status();
    } catch {
      readyInFlight = false;
      return;
    }
    readyInFlight = false;
    if (!state) return;
    readyCalled = true;

    if (state.needs_setup) {
      document.querySelectorAll('#product-welcome').forEach((el) => el.remove());
      const welcome = document.createElement('div');
      welcome.id = 'product-welcome';
      welcome.className = 'product-help';
      welcome.innerHTML =
        '<div>' +
        '<h3>Vamos a preparar a Rowan</h3>' +
        '<p>Tu asistente empieza contigo. Conecta una cuenta de IA para conversar; te acompaño paso a paso. Solo necesitas una. La voz Fish Audio es opcional.</p>' +
        '<div class="help-controls">' +
        '<button type="button" id="welcome-start">Preparar mi Rowan</button> ' +
        '<button type="button" id="welcome-later">Ahora no</button>' +
        '</div>' +
        '<p>Podrás volver desde Ajustes → Ayuda. La instalación no incluye claves.</p>' +
        '</div>';
      document.body.append(welcome);

      const startBtn = welcome.querySelector('#welcome-start');
      const laterBtn = welcome.querySelector('#welcome-later');

      if (startBtn) {
        startBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          dismissWelcome();
          openHelp();
          window.showToast?.('Puedes volver a esta configuración desde Ajustes → Ayuda.');
        });
      }

      if (laterBtn) {
        laterBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          dismissWelcome();
          window.showToast?.('Puedes volver a esta configuración cuando quieras desde Ajustes → Ayuda.');
        });
      }
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    renderProviders();

    fetch('help-guides.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((loaded) => {
        if (Array.isArray(loaded) && loaded.length > 0) {
          guides = loaded;
          renderProviders();
        }
      })
      .catch(() => {});

    if (byId('help-prev')) {
      byId('help-prev').onclick = () => {
        step = Math.max(0, step - 1);
        render();
      };
    }
    if (byId('help-next')) {
      byId('help-next').onclick = () => {
        if (!guides[selected]) return;
        step = (step + 1) % guides[selected].steps.length;
        render();
      };
    }
    if (byId('help-site')) byId('help-site').onclick = () => guides[selected] && openExternal(guides[selected].url);
    if (byId('help-docs')) byId('help-docs').onclick = () => guides[selected] && openExternal(guides[selected].docs);
    if (byId('help-official-video')) {
      byId('help-official-video').onclick = () => guides[selected]?.video && openExternal(guides[selected].video);
    }
    if (byId('help-watch')) {
      byId('help-watch').onclick = () => {
        const video = byId('help-video');
        if (!video || !guides[selected]) return;
        video.src = `tutorials/${guides[selected].id}.mp4`;
        video.hidden = false;
        video.play().catch(() => {});
      };
    }
    if (byId('help-connect')) {
      byId('help-connect').onclick = async () => {
        const button = byId('help-connect');
        if (!button || !guides[selected]) return;
        button.disabled = true;
        if (byId('help-result')) byId('help-result').textContent = 'Probando una petición breve al proveedor…';
        try {
          const result = await api().connect_product_provider(
            guides[selected].id,
            byId('help-key')?.value || '',
            byId('help-model')?.value || ''
          );
          if (byId('help-result')) {
            byId('help-result').textContent = result.success
              ? guides[selected].id === 'fish'
                ? 'Voz conectada. Puedes elegir tu voz en Ajustes → Voz. Recuerda conectar también una IA.'
                : 'Conectado. La clave quedó guardada. Ya puedes cerrar Ayuda y conversar.'
              : result.error;
          }
          if (result.success) {
            if (byId('help-key')) byId('help-key').value = '';
            window.dispatchEvent(new Event('pywebviewready'));
          }
        } catch {
          if (byId('help-result')) byId('help-result').textContent = 'No se pudo completar la prueba. Inténtalo otra vez.';
        } finally {
          button.disabled = false;
        }
      };
    }
    if (byId('help-quit')) byId('help-quit').onclick = () => api()?.quit_product?.();
    if (byId('help-explain')) {
      byId('help-explain').onclick = () => {
        byId('close-settings-btn')?.click();
        if (byId('chat-input')) {
          byId('chat-input').value =
            'Enséñame a usar tu interfaz y tus ajustes, paso a paso. Empecemos por los botones del chat.';
        }
        byId('send-btn')?.click();
      };
    }

    if (api()) ready();
  });

  window.addEventListener('pywebviewready', ready);
})();
