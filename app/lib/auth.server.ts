import jwt from "jsonwebtoken";
import { createCookieSessionStorage, redirect } from "react-router";

import { getUserById } from "~/db/queries/users.server";
import type { User } from "~/db/schema";

import { ApiRequestError, apiFetch } from "./api.server";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is not set");
}
if (!process.env.JWT_PUBLIC_KEY) {
  throw new Error("JWT_PUBLIC_KEY is not set");
}

// Same single-line-with-\n convention as my-home-backend's JWT_PRIVATE_KEY
// — see that repo's .env.example for why (Docker Compose / VPS shell
// environments don't reliably carry real newlines in a variable's value).
const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY.replace(/\\n/g, "\n");

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  },
});

export type PublicUser = Omit<User, "passwordHash">;

export type LoginResult =
  | { ok: true; accessToken: string; user: PublicUser }
  | { ok: false; reason: "invalid_credentials" | "email_not_verified" };

/**
 * Delegates to the API's POST /auth/login — password verification, timing-
 * attack mitigation, and rate limiting all live there now (see
 * my-home-backend/CLAUDE.md's Authentication section). Same generic
 * "invalid_credentials" result whether the account doesn't exist, the
 * password is wrong, or the attempt was rate-limited — never reveal which.
 * A genuine infrastructure failure (API unreachable, 5xx) is left to
 * propagate rather than folded into that generic result.
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  try {
    const data = await apiFetch<{ accessToken: string; user: PublicUser }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    return { ok: true, ...data };
  } catch (error) {
    if (!(error instanceof ApiRequestError)) throw error;
    const reason = error.errors.some((e) => e.code === "email_not_verified")
      ? "email_not_verified"
      : "invalid_credentials";
    return { ok: false, reason };
  }
}

export type RegisterInput = {
  token: string;
  name: string;
  role: string;
  password: string;
  confirmPassword: string;
};

/** Delegates to the API's POST /auth/register — see my-home-backend/CLAUDE.md's Authentication section. */
export async function registerAccount(
  input: RegisterInput,
): Promise<{ ok: true; email: string }> {
  return apiFetch<{ ok: true; email: string }>("/auth/register", {
    method: "POST",
    body: input,
  });
}

/** Delegates to the API's POST /auth/activate. */
export async function activateAccount(token: string): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>("/auth/activate", {
    method: "POST",
    body: { token },
  });
}

/**
 * Which email an invite token is for, and whether it's still usable — read-
 * only, doesn't consume the invite. Null for a missing, expired, or
 * already-accepted token (the API's GET /invites/:token 404s all three the
 * same way, on purpose — see my-home-backend/CLAUDE.md).
 */
export async function getInviteEmail(token: string): Promise<string | null> {
  try {
    const { email } = await apiFetch<{ email: string }>(`/invites/${encodeURIComponent(token)}`);
    return email;
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function createUserSession(
  request: Request,
  accessToken: string,
  redirectTo: string,
): Promise<Response> {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  session.set("accessToken", accessToken);
  return redirect(redirectTo, {
    headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
  });
}

export async function getAccessToken(request: Request): Promise<string | null> {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const token = session.get("accessToken");
  return typeof token === "string" ? token : null;
}

/** Verifies the JWT locally (no network round trip) and returns the user id it names, or null. */
export async function getSessionUserId(request: Request): Promise<string | null> {
  const accessToken = await getAccessToken(request);
  if (!accessToken) return null;
  try {
    // algorithms restricted to RS256 — without that allow-list, a forged
    // token could set alg: HS256 in its header and get verified using
    // this public key as an HMAC secret, since it isn't a secret.
    const payload = jwt.verify(accessToken, JWT_PUBLIC_KEY, { algorithms: ["RS256"] });
    return typeof payload === "object" && typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

/**
 * Redirects to /login if there's no valid, unexpired JWT, or the session's
 * user no longer exists. The token names a user id only — this app still
 * reads the full user row via Drizzle (same physical database the API
 * writes to; only the Shopping section's own data goes through the API in
 * this step, not user lookups for the sidebar).
 */
export async function requireUser(request: Request): Promise<User> {
  const userId = await getSessionUserId(request);
  if (!userId) {
    throw redirect("/login");
  }
  const user = await getUserById(userId);
  if (!user) {
    throw redirect("/login");
  }
  return user;
}

export async function destroySession(request: Request): Promise<Response> {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  return redirect("/login", {
    headers: { "Set-Cookie": await sessionStorage.destroySession(session) },
  });
}
