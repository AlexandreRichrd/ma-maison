import { createCookieSessionStorage } from "react-router";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is not set");
}

// Split out of auth.server.ts so api.server.ts can clear the cookie on a
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
