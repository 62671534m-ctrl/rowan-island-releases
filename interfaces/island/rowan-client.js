/**
 * RowanClient - Zero-Dependency WebSocket IPC Client for Rowan Assistant Integration
 * Connects to ws://127.0.0.1:18889 with exponential backoff and docking lifecycle management.
 * Strict zero-emoji compliance.
 */

class RowanClient {
  /**
   * @param {object} [options]
   * @param {string} [options.url='ws://127.0.0.1:18889']
   * @param {number} [options.initialBackoffMs=1000]
   * @param {number} [options.maxBackoffMs=16000]
   * @param {number} [options.backoffMultiplier=2]
   * @param {typeof WebSocket} [options.WebSocketClass]
   */
  constructor(options = {}) {
    this.url = options.url || 'ws://127.0.0.1:18889';
    this.initialBackoffMs = options.initialBackoffMs || 1000;
    this.maxBackoffMs = options.maxBackoffMs || 16000;
    this.backoffMultiplier = options.backoffMultiplier || 2;
    this.currentBackoffMs = this.initialBackoffMs;

    this.WebSocketClass =
      options.WebSocketClass ||
      (typeof WebSocket !== 'undefined'
        ? WebSocket
        : typeof globalThis !== 'undefined' && globalThis.WebSocket
          ? globalThis.WebSocket
          : null);

    this.ws = null;
    this.reconnectTimer = null;
    this.isExplicitlyClosed = false;

    // State properties
    this.isConnected = false;
    this.isRowanDocked = false;
    this.lastWindowState = null;
    this.liveState = 'idle';
    this.liveActive = false;

    // Event listeners map
    this.listeners = new Map();
  }

  on(event, handler) {
    if (typeof handler !== 'function') return;
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
  }

  off(event, handler) {
    if (!this.listeners.has(event)) return;
    const list = this.listeners.get(event);
    const idx = list.indexOf(handler);
    if (idx !== -1) list.splice(idx, 1);
  }

  emit(event, ...args) {
    if (!this.listeners.has(event)) return;
    const list = this.listeners.get(event);
    for (const fn of list) {
      try {
        fn(...args);
      } catch (err) {
        // Prevent listener error from disrupting loop
      }
    }
  }

  connect() {
    this.isExplicitlyClosed = false;

    if (!this.WebSocketClass) {
      return Promise.resolve(false);
    }

    if (this.ws) {
      const state = this.ws.readyState;
      if (state === 0 || state === 1) { // CONNECTING or OPEN
        return Promise.resolve(true);
      }
    }

    this.clearReconnectTimer();

    return new Promise((resolve) => {
      let resolved = false;
      const safeResolve = (val) => {
        if (!resolved) {
          resolved = true;
          resolve(val);
        }
      };

      try {
        this.ws = new this.WebSocketClass(this.url);
      } catch (err) {
        this.scheduleReconnect();
        safeResolve(false);
        return;
      }

      this.ws.onopen = (event) => {
        this.isConnected = true;
        this.currentBackoffMs = this.initialBackoffMs;
        this.emit('open', event);
        this.emit('connected', event);
        this.sendHello();
        safeResolve(true);
      };

      this.ws.onmessage = (event) => {
        this.handleIncomingRaw(event.data);
      };

      this.ws.onerror = (err) => {
        this.emit('error', err);
      };

      this.ws.onclose = (event) => {
        const wasConnected = this.isConnected;
        const wasDocked = this.isRowanDocked;
        this.isConnected = false;
        this.isRowanDocked = false;

        if (wasDocked) {
          this.emit('dock_change', false);
          this.emit('dock_state', false);
        }
        if (wasConnected) {
          this.emit('close', event);
          this.emit('disconnected', event);
        }

        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
        safeResolve(false);
      };
    });
  }

  scheduleReconnect() {
    if (this.isExplicitlyClosed || this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.currentBackoffMs);

    this.currentBackoffMs = Math.min(
      this.maxBackoffMs,
      Math.round(this.currentBackoffMs * this.backoffMultiplier)
    );
  }

  clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  disconnect() {
    this.isExplicitlyClosed = true;
    this.clearReconnectTimer();

    if (this.ws) {
      try {
        this.ws.close();
      } catch (err) {}
      this.ws = null;
    }

    this.isConnected = false;
    if (this.isRowanDocked) {
      this.isRowanDocked = false;
      this.emit('dock_change', false);
      this.emit('dock_state', false);
    }
  }

  send(data) {
    if (!this.ws || this.ws.readyState !== 1) { // 1 = OPEN
      return false;
    }
    try {
      const text = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws.send(text);
      return true;
    } catch (err) {
      return false;
    }
  }

  sendHello() {
    return this.send({
      type: 'client:hello',
      client: 'custom-island',
      version: '1.0.0'
    });
  }

  restoreWindow() {
    return this.send({
      type: 'rowan:restore_window'
    });
  }

  restoreRowanWindow() {
    return this.restoreWindow();
  }

  toggleLiveMode() {
    return this.send({
      type: 'rowan:toggle_live_mode'
    });
  }

  sendChatQuery(queryId, text) {
    return this.send({
      type: 'rowan:chat_query',
      query_id: queryId,
      text: text
    });
  }

  sendActionResult(action, success, result = null, error = null, id = null) {
    return this.send({
      type: 'island:action_result',
      action: action || 'unknown',
      success: Boolean(success),
      result: result !== undefined ? result : null,
      error: error ? String(error) : null,
      ...(id ? { id, action_id: id } : {})
    });
  }

  handleIncomingRaw(rawData) {
    if (!rawData) return;
    let msg = null;
    try {
      if (typeof rawData !== 'string') return;
      msg = JSON.parse(rawData);
    } catch (err) {
      this.emit('malformed_payload', err);
      return;
    }

    if (!msg || typeof msg !== 'object' || Array.isArray(msg) || typeof msg.type !== 'string' || !msg.type) {
      return;
    }

    this.handleMessage(msg);
  }

  handleMessage(msg) {
    this.emit('message', msg);
    this.emit(msg.type, msg);

    switch (msg.type) {
      case 'rowan:window_state':
        this.handleWindowState(msg);
        break;

      case 'rowan:emotion':
        if (typeof msg.emotion === 'string') {
          const duration = typeof msg.duration_ms === 'number' ? msg.duration_ms : 4000;
          this.emit('emotion', msg.emotion, duration);
        }
        break;

      case 'rowan:audio_level':
        if (typeof msg.level === 'number' && !isNaN(msg.level)) {
          const clamped = Math.max(0.0, Math.min(1.0, msg.level));
          this.emit('audio_level', clamped);
        }
        break;

      case 'rowan:live_state':
        this.liveActive = msg.live_active === true;
        if (typeof msg.state === 'string') {
          this.liveState = msg.state;
          this.emit('live_state', msg.state);
        }
        break;

      case 'rowan:chat_stream':
        this.emit('chat_stream', msg);
        break;

      case 'island:action':
        this.emit('action', msg);
        break;

      default:
        this.emit('custom_message', msg);
        break;
    }
  }

  handleWindowState(msg) {
    if (typeof msg.visible !== 'boolean') return;

    this.lastWindowState = msg.visible;
    const nextDocked = !msg.visible;
    const stateChanged = this.isRowanDocked !== nextDocked;

    this.isRowanDocked = nextDocked;
    if (stateChanged) {
      this.emit('dock_change', this.isRowanDocked);
    }
    this.emit('dock_state', this.isRowanDocked);
    this.emit('window_state', msg.visible);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RowanClient };
}

if (typeof window !== 'undefined') {
  window.RowanClient = RowanClient;
}
