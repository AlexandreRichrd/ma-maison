import { stringifySetCookie } from "cookie";
import { createCookieSessionStorage } from "react-router";

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

// Must match my-home-backend's ACCESS_TOKEN_COOKIE_NAME (auth/access-token-cookie.ts) exactly.
const ACCESS_TOKEN_COOKIE_NAME = "access_token";

const ACCESS_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

// Plain (unsigned, unencrypted) cookie carrying the same JWT __session
// wraps, read directly by my-home-backend's WsAuthAdapter for the climate
// socket handshake. Not a second source of truth: written and cleared
// everywhere __session is (see auth.server.ts's createUserSession/
// destroySession and api.server.ts's 401 handler) so the two can never
// diverge — a stale access_token here would mean REST keeps working off
// __session while the websocket handshake silently rejects, which is
// painful to diagnose. The JWT still never reaches browser JS: this is
// HttpOnly, just like __session, only readable by the server that set it
// and by whatever server the browser addresses it to.
//
// Deliberately NOT built with react-router's createCookie(): that always
// JSON.stringify()s and base64-encodes its value (see
// react-router/dist/.../cookies.js's encodeCookieValue) — fine for a
// cookie only react-router itself reads back, but this one's whole job is
// to be read by a plain `cookie.parse()` on the NestJS side (WsAuthAdapter,
// and JwtStrategy's REST fallback), which expects the raw JWT string with
// no wrapping. Using createCookie here silently produced a cookie neither
// of those could ever actually parse as a token — caught by testing the
// websocket handshake against a real browser, not by any unit test, since
// nothing here exercises what the backend does with the raw header.
export function serializeAccessTokenCookie(token: string): string {
  return stringifySetCookie({
    name: ACCESS_TOKEN_COOKIE_NAME,
    value: token,
    ...ACCESS_TOKEN_COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearAccessTokenCookie(): string {
  return stringifySetCookie({
    name: ACCESS_TOKEN_COOKIE_NAME,
    value: "",
    ...ACCESS_TOKEN_COOKIE_OPTIONS,
    maxAge: 0,
  });
}
