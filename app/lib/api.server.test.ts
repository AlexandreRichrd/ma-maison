import { afterEach, describe, expect, it, vi } from "vitest";

// api.server.ts (and session.server.ts, which it now imports) read
// process.env at module-evaluation time and throw if unset — set these
// before each dynamic import rather than as static imports, since static
// imports are hoisted above any process.env assignment in this file.
function freshApiServer() {
  process.env.API_URL = "http://api.test";
  process.env.SESSION_SECRET = "test-secret-at-least-32-bytes-long!!";
  vi.resetModules();
  return import("./api.server");
}

const originalFetch = globalThis.fetch;

describe("apiFetch", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns the parsed body on a 200", async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
    ) as unknown as typeof fetch;
    const { apiFetch } = await freshApiServer();

    await expect(apiFetch("/whatever")).resolves.toEqual({ ok: true });
  });

  it("throws ApiRequestError for a 401 with no accessToken, without redirecting — an ordinary rejection like a wrong login password", async () => {
    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            statusCode: 401,
            errors: [{ field: "form", code: "invalid_credentials" }],
          }),
          { status: 401 },
        ),
    ) as unknown as typeof fetch;
    const { apiFetch, ApiRequestError } = await freshApiServer();

    const rejection = apiFetch("/auth/login", {
      method: "POST",
      body: { email: "x@example.com", password: "wrong" },
    });

    await expect(rejection).rejects.toBeInstanceOf(ApiRequestError);
    await rejection.catch((error: unknown) => {
      expect(error).toBeInstanceOf(ApiRequestError);
      expect((error as InstanceType<typeof ApiRequestError>).status).toBe(401);
      expect((error as InstanceType<typeof ApiRequestError>).errors).toEqual([
        { field: "form", code: "invalid_credentials" },
      ]);
    });
  });

  it("clears the session and redirects to /login for a 401 on a call that carried an accessToken", async () => {
    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            statusCode: 401,
            errors: [{ field: "authorization", code: "unauthenticated" }],
          }),
          { status: 401 },
        ),
    ) as unknown as typeof fetch;
    const { apiFetch } = await freshApiServer();

    let caught: unknown;
    try {
      await apiFetch("/households/me", { accessToken: "a-token-for-a-deleted-user" });
      throw new Error("expected apiFetch to throw a redirect");
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(Response);
    const response = caught as Response;
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/login");
    // Confirms the cookie is actually cleared (an expired/zeroed Max-Age),
    // not just replayed unchanged — a session-storage implementation
    // detail, but the one that matters: a stale cookie that survives this
    // response would immediately re-trigger the same redirect loop.
    const setCookie = response.headers.get("Set-Cookie");
    expect(setCookie).toMatch(/^__session=;/);
    expect(setCookie).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/);
  });
});
