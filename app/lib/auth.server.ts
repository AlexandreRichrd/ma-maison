import { verify } from "@node-rs/argon2";
import { createCookieSessionStorage, redirect } from "react-router";

import { getUserByEmail, getUserById } from "~/db/queries/users.server";
import type { User } from "~/db/schema";

import { isRateLimited, recordAttempt } from "./rate-limit.server";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is not set");
}

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

// A real argon2id hash of a password nobody uses. Verifying against this
// when the email isn't found keeps the "no such account" path doing the
// same work (and taking about the same time) as the "wrong password"
// path, instead of returning early and leaking account existence via
// timing.
const DUMMY_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$ioSxuYJZObNpknjkAXiaHA$fuvU0zVW56c/NCnBLgVmn9fWMYuuXF0OEDROsvjkJV4";

const MIN_LOGIN_MS = 300;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clientKey(request: Request): string {
  return request.headers.get("x-forwarded-for") ?? "unknown";
}

/**
 * Verifies email + password. Rate-limited per IP and per identifier, with
 * a floor on how fast it can return — so both "no such account" and
 * "wrong password" look the same from outside: same generic result,
 * same rough timing. Callers must show one generic error message
 * regardless of which of these caused the null.
 */
export async function login(
  request: Request,
  email: string,
  password: string,
): Promise<User | null> {
  const started = Date.now();
  const normalizedEmail = email.trim().toLowerCase();
  const ipKey = `ip:${clientKey(request)}`;
  const identifierKey = `email:${normalizedEmail}`;

  if (isRateLimited(ipKey) || isRateLimited(identifierKey)) {
    await sleep(Math.max(0, MIN_LOGIN_MS - (Date.now() - started)));
    return null;
  }
  recordAttempt(ipKey);
  recordAttempt(identifierKey);

  const user = await getUserByEmail(normalizedEmail);
  const ok = await verify(user?.passwordHash ?? DUMMY_HASH, password);

  await sleep(Math.max(0, MIN_LOGIN_MS - (Date.now() - started)));

  return ok && user ? user : null;
}

export async function createUserSession(
  request: Request,
  userId: string,
  redirectTo: string,
): Promise<Response> {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie"),
  );
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
  });
}

export async function getSessionUserId(request: Request): Promise<string | null> {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie"),
  );
  const id = session.get("userId");
  return typeof id === "string" ? id : null;
}

/** Redirects to /login if there's no session, or the session's user no longer exists. */
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
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie"),
  );
  return redirect("/login", {
    headers: { "Set-Cookie": await sessionStorage.destroySession(session) },
  });
}
