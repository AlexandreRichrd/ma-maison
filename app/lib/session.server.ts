import { createCookie, createCookieSessionStorage } from "react-router";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is not set");
}

// Split out of auth.server.ts so api.server.ts can clear the cookie(s) on a
// 401 without an api.server.ts <-> auth.server.ts import cycle (auth.server.ts
// already imports apiFetch/ApiRequestError from api.server.ts).
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  },
});

// Plain (unsigned, unencrypted) cookie carrying the same JWT __session
// wraps, read directly by my-home-backend's WsAuthAdapter for the climate
// socket handshake (see that repo's auth/access-token-cookie.ts —
// ACCESS_TOKEN_COOKIE_NAME must match this cookie's name exactly). Not a
// second source of truth: written and cleared everywhere __session is
// (see auth.server.ts's createUserSession/destroySession and
// api.server.ts's 401 handler) so the two can never diverge — a stale
// access_token here would mean REST keeps working off __session while the
// websocket handshake silently rejects, which is painful to diagnose. The
// JWT still never reaches browser JS: this is HttpOnly, just like
// __session, only readable by the server that set it and by whatever
// server the browser addresses it to.
export const accessTokenCookie = createCookie("access_token", {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 30,
});
