import { Centrifuge } from 'centrifuge';
import { useGameStore } from '@/store/gameStore';

export const WS_URL = 'wss://realtime.meme.skyfly.hackclub.app/connection/websocket';

// Single shared instance — re-used across sessions
let centrifuge: Centrifuge | null = null;

function getCentrifuge(token: string): Centrifuge {
  if (!centrifuge) {
    centrifuge = new Centrifuge(WS_URL, { 
      token,
      debug: true
    });
    
    centrifuge.on('connecting', function (ctx) {
      console.log(`[Centrifuge] connecting: ${ctx.reason}`);
    });

    centrifuge.on('connected', function (ctx) {
      console.log(`[Centrifuge] connected over ${ctx.transport}`);
    });

    centrifuge.on('disconnected', function (ctx) {
      console.log(`[Centrifuge] disconnected: ${ctx.reason}`);
    });

    centrifuge.on('error', function (err) {
      console.error(`[Centrifuge] error`, err);
    });
  } else {
    // If instance exists, just update the token
    centrifuge.setToken(token);
  }

  return centrifuge;
}

export function setupGameSubscriptions(
  gameId: string,
  userId: string,
  tokens: { connection_token: string; game_subscription_token: string; personal_subscription_token: string }
) {
  const client = getCentrifuge(tokens.connection_token);
  client.connect();

  const gameChannel = client.newSubscription(`game:${gameId}`, {
    token: tokens.game_subscription_token,
  });

  gameChannel.on('publication', (ctx) => {
    const envelope = ctx.data as any;
    if (envelope && envelope.payload) {
      const event = { ...envelope.payload, type: envelope.event_type };
      console.log('[Centrifuge] game event:', event);
      useGameStore.getState().processGameEvent(event);
    }
  });

  gameChannel.on('error', (err) => console.error('[Centrifuge] gameChannel error', err));
  gameChannel.on('subscribed', () => console.log('[Centrifuge] gameChannel subscribed'));

  const personalChannel = client.newSubscription(`personal:#${userId}`, {
    token: tokens.personal_subscription_token,
  });

  personalChannel.on('publication', (ctx) => {
    const envelope = ctx.data as any;
    if (envelope && envelope.payload) {
      const event = { ...envelope.payload, type: envelope.event_type };
      console.log('[Centrifuge] personal event:', event);
      useGameStore.getState().processPersonalEvent(event);
    }
  });

  personalChannel.on('error', (err) => console.error('[Centrifuge] personalChannel error', err));
  personalChannel.on('subscribed', () => console.log('[Centrifuge] personalChannel subscribed'));

  gameChannel.subscribe();
  personalChannel.subscribe();

  return () => {
    try {
      gameChannel.unsubscribe();
      client.removeSubscription(gameChannel);
      personalChannel.unsubscribe();
      client.removeSubscription(personalChannel);
      client.disconnect();
    } catch (_) { /* ignore cleanup errors */ }
  };
}
