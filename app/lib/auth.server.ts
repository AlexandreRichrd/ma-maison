import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { createCookieSessionStorage, redirect } from "react-router";

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

/** `salt:hash` hex pair, as produced by `hashPassword`. */
function verifyPassword(password: string): boolean {
  const stored = process.env.AUTH_PASSWORD_HASH;
  if (!stored) {
    throw new Error("AUTH_PASSWORD_HASH is not set");
  }
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) {
    throw new Error("AUTH_PASSWORD_HASH is malformed, expected salt:hash");
  }
  const hashBuffer = Buffer.from(hash, "hex");
  const candidate = scryptSync(password, salt, hashBuffer.length);
  return (
    candidate.length === hashBuffer.length &&
    timingSafeEqual(candidate, hashBuffer)
  );
}

/** Used to generate AUTH_PASSWORD_HASH for .env — not called at runtime. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export async function login(password: string): Promise<boolean> {
  return verifyPassword(password);
}

export async function createUserSession(
  request: Request,
  redirectTo: string,
): Promise<Response> {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie"),
  );
  session.set("authenticated", true);
  return redirect(redirectTo, {
    headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
  });
}

export async function isAuthenticated(request: Request): Promise<boolean> {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie"),
  );
  return session.get("authenticated") === true;
}

export async function requireSession(request: Request): Promise<void> {
  if (!(await isAuthenticated(request))) {
    throw redirect("/login");
  }
}

/** Which household member the dashboard greeting etc. currently addresses. */
export async function getCurrentMemberId(request: Request): Promise<string | null> {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie"),
  );
  const id = session.get("currentMemberId");
  return typeof id === "string" ? id : null;
}

export async function setCurrentMemberId(
  request: Request,
  memberId: string,
): Promise<string> {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie"),
  );
  session.set("currentMemberId", memberId);
  return sessionStorage.commitSession(session);
}

export async function destroySession(request: Request): Promise<Response> {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie"),
  );
  return redirect("/login", {
    headers: { "Set-Cookie": await sessionStorage.destroySession(session) },
  });
}
