import jwt from "jsonwebtoken";
import { redirect } from "react-router";

import type { User } from "~/db/schema";

import { ApiRequestError, apiFetch } from "./api.server";
import { sessionStorage } from "./session.server";

if (!process.env.JWT_PUBLIC_KEY) {
  throw new Error("JWT_PUBLIC_KEY is not set");
}

// Same single-line-with-\n convention as my-home-backend's JWT_PRIVATE_KEY
// — see that repo's .env.example for why (Docker Compose / VPS shell
// environments don't reliably carry real newlines in a variable's value).
const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY.replace(/\\n/g, "\n");

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
 * Delegates to the API's POST /auth/forgot-password, which always returns
 * { ok: true } whether or not the email has an account — never reveal
 * which. Only a genuine request failure (network error, rate limit) throws.
 */
export async function forgotPassword(email: string): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export type ResetPasswordInput = {
  token: string;
  password: string;
  confirmPassword: string;
};

/** Delegates to the API's POST /auth/reset-password. */
export async function resetPassword(
  input: ResetPasswordInput,
): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>("/auth/reset-password", {
    method: "POST",
    body: input,
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

export type SessionUser = { id: string };

/**
 * Redirects to /login if there's no valid, unexpired JWT. Trusts the JWT's
 * `sub` as-is — no DB or API call to confirm the user it names still
 * exists (see CLAUDE.md's Authentication section for the tradeoff this
 * accepts, and when it needs revisiting).
 */
export async function requireUser(request: Request): Promise<SessionUser> {
  const userId = await getSessionUserId(request);
  if (!userId) {
    throw redirect("/login");
  }
  return { id: userId };
}

export async function destroySession(request: Request): Promise<Response> {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  return redirect("/login", {
    headers: { "Set-Cookie": await sessionStorage.destroySession(session) },
  });
}
