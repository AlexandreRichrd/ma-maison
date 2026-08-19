import { redirect } from "react-router";

import { clearAccessTokenCookie, sessionStorage } from "./session.server";

const API_URL = process.env.API_URL;
if (!API_URL) {
  throw new Error("API_URL is not set");
}

export type ApiFieldError = { field: string; code: string };

/** Thrown for any non-2xx response — carries the API's own {statusCode, errors} shape. */
export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly errors: ApiFieldError[],
  ) {
    super(`API request failed with status ${status}`);
  }
}

export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; accessToken?: string | null } = {},
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  // A 401 on a call that carried a JWT means the session is dead — the
  // token passed requireUser()'s local signature/expiry check (see
  // auth.server.ts), but the API rejected it for real, e.g. the user it
  // names was deleted after the token was issued (see CLAUDE.md's
  // Authentication section). Every authenticated endpoint's 401 means
  // exactly this, with no exception that should be shown inline instead —
  // clear the cookie and bounce to /login rather than let the error
  // surface as a raw ApiRequestError (which is what turned this into a
  // 500 "oups" page before).
  //
  // A 401 with no accessToken attached is a different thing entirely — a
  // public endpoint's ordinary rejection (wrong password on /auth/login,
  // an unverified account), which its caller already catches as an
  // ApiRequestError. Redirecting for that case would swallow those errors
  // and silently bounce the login page back to itself.
  if (response.status === 401 && options.accessToken) {
    const session = await sessionStorage.getSession();
    const headers = new Headers();
    headers.append("Set-Cookie", await sessionStorage.destroySession(session));
    // Cleared alongside __session — see session.server.ts's accessTokenCookie
    // comment for why the two must never diverge.
    headers.append("Set-Cookie", clearAccessTokenCookie());
    throw redirect("/login", { headers });
  }

  const json: unknown = await response.json();

  if (!response.ok) {
    const errors =
      typeof json === "object" && json !== null && "errors" in json
        ? ((json as { errors: ApiFieldError[] }).errors ?? [])
        : [];
    throw new ApiRequestError(response.status, errors);
  }

  return json as T;
}

/**
 * The API returns machine-readable {field, code} pairs with no display
 * copy (see my-home-backend/CLAUDE.md's API surface section) — this app
 * owns the French text. Maps back to the {field: string[]} shape Zod's
 * flatten().fieldErrors already produces, so existing form-rendering code
 * doesn't change. The API's whole-form field is "form"; this app's
 * convention for the same concept is "general".
 */
const ERROR_MESSAGES: Record<string, string> = {
  invalid_email: "Adresse email invalide",
  required: "Ce champ est requis",
  too_short: "Le mot de passe doit contenir au moins 8 caractères",
  invalid_type: "Valeur invalide",
  invalid_id: "Identifiant invalide",
  matches: "Format invalide",
  password_mismatch: "Les mots de passe ne correspondent pas",
  invalid_credentials: "Email ou mot de passe incorrect",
  email_not_verified:
    "Ce compte n'est pas encore activé — vérifiez votre boîte mail pour le lien d'activation",
  email_taken: "Un compte existe déjà pour cette adresse",
  invite_invalid: "Ce lien d'invitation est invalide ou a expiré",
  verification_invalid: "Ce lien d'activation est invalide ou a expiré",
  reset_invalid: "Ce lien de réinitialisation est invalide ou a expiré",
  not_found: "Introuvable",
  invalid_target: "Cible invalide",
  unauthenticated: "Merci de vous reconnecter",
  too_small: "Valeur trop petite",
  // Only reachable via a stale/replayed toggle — the UI never renders a
  // checkbox for a chore that isn't scheduled this week.
  chore_not_scheduled: "Cette tâche n'est pas prévue cette semaine",
};

export function mapApiErrors(errors: ApiFieldError[]): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const { field, code } of errors) {
    const key = field === "form" ? "general" : field;
    const message = ERROR_MESSAGES[code] ?? "Une erreur est survenue";
    fieldErrors[key] = [...(fieldErrors[key] ?? []), message];
  }
  return fieldErrors;
}
