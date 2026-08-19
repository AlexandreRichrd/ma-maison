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
};

/**
 * Connects to my-home-backend's /climate namespace. Always same-origin —
 * vite.config.ts's dev proxy and Caddy's prod /api/* route both put it
 * there — so this never needs an environment-specific origin, only the
 * /api/socket.io path both route to the API on. Reconnection is
 * socket.io's default behavior, left untouched.
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

  return socket;
}
