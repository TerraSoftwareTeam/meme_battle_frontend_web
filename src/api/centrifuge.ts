import { useGameStore } from '@/store/gameStore';

export const WS_URL = import.meta.env.DEV
  ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws-proxy/connection/websocket`
  : 'wss://realtime.meme.skyfly.hackclub.app/connection/websocket';

interface SubscriptionEntry {
  token: string;
  onEvent: (event: any) => void;
  offset?: number;
  epoch?: string;
}

class CentrifugoManager {
  private ws: WebSocket | null = null;
  private connectionToken: string | null = null;
  private commandId = 1;
  private subscriptions = new Map<string, SubscriptionEntry>();
  private isConnected = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private idleDisconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private onReconnectListeners = new Set<() => void>();

  onReconnect(cb: () => void): () => void {
    this.onReconnectListeners.add(cb);
    return () => {
      this.onReconnectListeners.delete(cb);
    };
  }

  connect(connectionToken: string) {
    if (this.idleDisconnectTimer) {
      clearTimeout(this.idleDisconnectTimer);
      this.idleDisconnectTimer = null;
    }

    // If already connected with the same token, reuse
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      if (this.connectionToken === connectionToken) {
        return;
      }
      // Token changed: close old socket cleanly before connecting with new token
      this.closeActiveSocket();
    }

    this.connectionToken = connectionToken;
    this.openSocket();
  }

  private closeActiveSocket() {
    if (this.ws) {
      const socket = this.ws;
      this.ws = null;
      this.isConnected = false;
      // Detach listeners so async events from old socket never fire on this manager
      socket.onopen = null;
      socket.onmessage = null;
      socket.onclose = null;
      socket.onerror = null;
      try {
        socket.close(1000, 'Replaced');
      } catch (_) {}
    }
  }

  private openSocket() {
    if (!this.connectionToken) return;

    // Clear any pending reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      const socket = new WebSocket(WS_URL);
      this.ws = socket;

      socket.onopen = () => {
        if (this.ws !== socket) return;
        console.log('[WS] Connection open, authenticating...');
        this.commandId = 1;
        socket.send(JSON.stringify({ id: 1, connect: { token: this.connectionToken } }));
      };

      socket.onmessage = (event) => {
        if (this.ws !== socket) return;

        const raw = String(event.data);
        const lines = raw.trim().split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // Crucial Centrifugo heartbeat: server sends '{}' and expects '{}' pong back!
          if (trimmed === '{}') {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send('{}');
            }
            continue;
          }

          try {
            const parsed = JSON.parse(trimmed);

            // Empty object pong check
            if (Object.keys(parsed).length === 0) {
              if (socket.readyState === WebSocket.OPEN) {
                socket.send('{}');
              }
              continue;
            }

            // Command error from Centrifugo
            if (parsed.error) {
              if (parsed.error.code === 105) {
                // Code 105: "already subscribed", completely harmless
                continue;
              }
              console.error(`[WS] Centrifugo error response (id=${parsed.id}):`, parsed.error);
              if (parsed.error.code === 100 || parsed.error.code === 109 || parsed.error.code === 3000) {
                console.warn('[WS] Token expired or rejected by Centrifugo');
                this.connectionToken = null;
              }
              continue;
            }

            // Connect reply
            if (parsed.id === 1 && parsed.connect) {
              console.log('[WS] Connected & authenticated with Centrifugo');
              this.isConnected = true;
              this.reconnectAttempts = 0;
              this.resubscribeAll();

              // Notify listeners (e.g. gameplay) that reconnect completed so they can resync snapshot
              this.onReconnectListeners.forEach(cb => {
                try {
                  cb();
                } catch (err) {
                  console.error('[WS] Error in onReconnect listener:', err);
                }
              });
              continue;
            }

            // Push event
            if (parsed.push) {
              const channel = parsed.push.channel as string;
              const pub = parsed.push.pub;
              const pubData = pub?.data;
              if (!pubData) continue;

              const sub = this.subscriptions.get(channel);
              // Save stream offset/epoch for reliable recovery on reconnect
              if (sub && pub) {
                if (pub.offset !== undefined) sub.offset = pub.offset;
                if (pub.epoch !== undefined) sub.epoch = pub.epoch;
              }

              const eventType = pubData.event_type || pubData.type || pubData.payload?.type;
              // Merge envelope and payload safely so no fields (user_id, game_id, etc.) are missed
              const eventPayload = {
                ...pubData,
                ...(typeof pubData.payload === 'object' && pubData.payload !== null ? pubData.payload : {}),
                type: eventType,
              };

              if (sub) {
                sub.onEvent(eventPayload);
              }
            }
          } catch (e) {
            console.error('[WS] Failed to parse message line', trimmed, e);
          }
        }
      };

      socket.onclose = (event) => {
        if (this.ws !== socket) return;

        console.log(`[WS] Disconnected: code=${event.code}, reason=${event.reason || 'none'}`);
        this.isConnected = false;
        this.ws = null;

        // Auto-reconnect if there are active subscriptions
        if (this.subscriptions.size > 0 && this.connectionToken) {
          this.scheduleReconnect();
        }
      };

      socket.onerror = (err) => {
        if (this.ws !== socket) return;
        console.error('[WS] Socket error', err);
      };
    } catch (err) {
      console.error('[WS] Failed to create WebSocket', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 8000);
    console.log(`[WS] Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts})...`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.openSocket();
    }, delay);
  }

  private sendSubscribe(channel: string, entry: SubscriptionEntry) {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.commandId++;
    const subscribeData: any = { channel, token: entry.token };
    if (entry.offset !== undefined && entry.epoch) {
      subscribeData.recover = true;
      subscribeData.offset = entry.offset;
      subscribeData.epoch = entry.epoch;
    }
    console.log(`[WS] Subscribing to channel: ${channel}${subscribeData.recover ? ' (with recovery)' : ''}`);
    this.ws.send(JSON.stringify({ id: this.commandId, subscribe: subscribeData }));
  }

  private resubscribeAll() {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    for (const [channel, entry] of this.subscriptions.entries()) {
      this.sendSubscribe(channel, entry);
    }
  }

  subscribe(channel: string, token: string, onEvent: (event: any) => void) {
    if (this.idleDisconnectTimer) {
      clearTimeout(this.idleDisconnectTimer);
      this.idleDisconnectTimer = null;
    }

    const existing = this.subscriptions.get(channel);
    const isAlreadySubscribed = existing && existing.token === token;

    const entry: SubscriptionEntry = {
      token,
      onEvent,
      offset: existing?.offset,
      epoch: existing?.epoch,
    };
    this.subscriptions.set(channel, entry);

    if (!isAlreadySubscribed && this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendSubscribe(channel, entry);
    }
  }

  unsubscribe(channel: string) {
    if (this.subscriptions.has(channel)) {
      this.subscriptions.delete(channel);
      if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.commandId++;
        this.ws.send(JSON.stringify({ id: this.commandId, unsubscribe: { channel } }));
      }
    }

    // If no subscriptions left, close connection after 5 seconds of inactivity
    if (this.subscriptions.size === 0) {
      if (!this.idleDisconnectTimer) {
        this.idleDisconnectTimer = setTimeout(() => {
          this.idleDisconnectTimer = null;
          if (this.subscriptions.size === 0) {
            console.log('[WS] No active subscriptions, closing socket');
            this.disconnect();
          }
        }, 5000);
      }
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.idleDisconnectTimer) {
      clearTimeout(this.idleDisconnectTimer);
      this.idleDisconnectTimer = null;
    }
    this.connectionToken = null;
    this.subscriptions.clear();
    this.closeActiveSocket();
  }
}

// Global singleton instance
export const socketManager = new CentrifugoManager();

export function setupGameSubscriptions(
  gameId: string,
  userId: string,
  tokens: { connection_token: string; game_subscription_token: string; personal_subscription_token: string }
) {
  socketManager.connect(tokens.connection_token);

  const gameChannel = `game:${gameId}`;
  const personalChannel = `personal:#${userId}`;

  socketManager.subscribe(gameChannel, tokens.game_subscription_token, (event) => {
    console.log('[WS] Game event:', event);
    useGameStore.getState().processGameEvent(event);
  });

  socketManager.subscribe(personalChannel, tokens.personal_subscription_token, (event) => {
    console.log('[WS] Personal event:', event);
    useGameStore.getState().processPersonalEvent(event);
  });

  return () => {
    socketManager.unsubscribe(gameChannel);
    socketManager.unsubscribe(personalChannel);
  };
}

export function setupLobbiesSubscription(
  tokens: { connection_token: string; lobbies_subscription_token: string },
  onEvent: (event: any) => void
) {
  socketManager.connect(tokens.connection_token);

  const channel = 'lobbies';
  socketManager.subscribe(channel, tokens.lobbies_subscription_token, (event) => {
    console.log('[WS] Lobby event:', event);
    onEvent(event);
  });

  return () => {
    socketManager.unsubscribe(channel);
  };
}
