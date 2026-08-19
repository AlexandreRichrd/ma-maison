import { io, type Socket } from "socket.io-client";

export type ClimateMeasurement = {
  deviceName: string;
  type: string;
  value: string;
  recordedAt: string;
};

export type ClimateSocketHandlers = {
  onMeasurement: (measurements: ClimateMeasurement[]) => void;
  /** Fired when a connection succeeds after a previous one was lost — not on the first connect. */
  onReconnect: () => void;
  /** Fired when the server ended the connection itself — see the 'disconnect' listener below. */
  onServerDisconnect: () => void;
};

/**
 * Connects to my-home-backend's /climate namespace. Always same-origin —
 * vite.config.ts's dev proxy and Caddy's prod /api/* route both put it
 * there — so this never needs an environment-specific origin, only the
 * /api/socket.io path both route to the API on. Reconnection is
 * socket.io's default behavior, left untouched — except for the one
 * disconnect reason it deliberately doesn't cover, see below.
 */
export function connectClimateSocket(handlers: ClimateSocketHandlers): Socket {
  const socket = io("/climate", { path: "/api/socket.io" });

  socket.on("measurement", handlers.onMeasurement);

  // 'connect' also fires on the very first connection, when there's no gap
  // to fill — the loader's SSR data is already current. Only reconnects
  // after a real disconnect need to trigger a refetch.
  let hasConnectedBefore = false;
  socket.on("connect", () => {
    if (hasConnectedBefore) {
      handlers.onReconnect();
    }
    hasConnectedBefore = true;
  });

  // A disconnect reason of "io server disconnect" means the server called
  // socket.disconnect() on us — as opposed to every other reason (network
  // blip, ping timeout, backend restart), which the client's default
  // reconnection logic already retries on its own. socket.io treats a
  // server-initiated disconnect as intentional and, by design, does NOT
  // auto-reconnect for it (confirmed against socket.io-client's source:
  // Socket.ondisconnect() calls destroy(), which unsubscribes from the
  // Manager specifically so reconnection won't fire) — the app has to
  // react itself, or the widget goes silently, permanently dead.
  //
  // Today ClimateGateway's token-expiry timer is the only thing that ever
  // calls socket.disconnect(true) server-side, so in practice this always
  // means the access token expired and reconnecting with the same cookie
  // would just be rejected again anyway (no refresh token exists — see
  // my-home-backend/CLAUDE.md's Authentication section). Revalidating
  // forces a real API call, which 401s and lets apiFetch's existing
  // handler clear the cookies and redirect to /login — the same recovery
  // REST already has, reused rather than reinvented.
  //
  // If a second reason to call socket.disconnect(true) server-side is ever
  // added, it will hit this same branch and log the user out — harmless
  // if revalidating doesn't actually 401, but worth knowing before adding
  // one.
  socket.on("disconnect", (reason) => {
    if (reason === "io server disconnect") {
      handlers.onServerDisconnect();
    }
  });

  return socket;
}
