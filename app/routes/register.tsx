import { data, Form } from "react-router";

import { Button, Card, Input } from "~/components/ui";
import { ApiRequestError, mapApiErrors } from "~/lib/api.server";
import { getInviteEmail, registerAccount } from "~/lib/auth.server";
import { registerSchema } from "~/lib/validation";

import type { Route } from "./+types/register";

export function meta() {
  return [{ title: "Créer un compte · Hearth" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return { valid: false as const };

  const email = await getInviteEmail(token);
  if (!email) return { valid: false as const };

  return { valid: true as const, email, token };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const result = registerSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    // Re-validated by the API here, not just by the loader's earlier
    // lookup — the invite could expire or get used by a second tab between
    // page load and submit.
    const outcome = await registerAccount(result.data);
    return { ok: true as const, email: outcome.email };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return data({ errors: mapApiErrors(error.errors) }, { status: error.status });
    }
    throw error;
  }
}

export default function Register({ loaderData, actionData }: Route.ComponentProps) {
  const errors = actionData && "errors" in actionData ? actionData.errors : undefined;
  const nameErrors = errors && "name" in errors ? errors.name : undefined;
  const passwordErrors = errors && "password" in errors ? errors.password : undefined;
  const confirmErrors = errors && "confirmPassword" in errors ? errors.confirmPassword : undefined;
  // "token" covers the API's invite_invalid/required codes (the hidden
  // token field has no field-level slot of its own) — same display spot as
  // a whole-form "general" error like email_taken.
  const generalError =
    (errors && "general" in errors ? errors.general?.[0] : undefined) ??
    (errors && "token" in errors ? errors.token?.[0] : undefined);
  const succeeded = actionData !== undefined && "ok" in actionData && actionData.ok;

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-5 font-serif text-xl font-bold">Hearth</div>

        {succeeded ? (
          <p className="text-sm font-medium text-foreground">
            Compte créé ! Vérifiez votre boîte mail ({actionData.email}) pour
            activer votre compte, puis connectez-vous.
          </p>
        ) : !loaderData.valid ? (
          <p className="text-sm font-medium text-foreground">
            Ce lien d'invitation est invalide ou a expiré. Demandez-en un nouveau
            à quelqu'un du foyer.
          </p>
        ) : (
          <Form method="post" className="flex flex-col gap-3">
            <input type="hidden" name="token" value={loaderData.token} />
            <p className="text-sm font-medium text-muted">
              Création du compte pour <span className="text-foreground">{loaderData.email}</span>
            </p>
            <Input label="Nom" name="name" autoComplete="name" autoFocus required />
            {nameErrors && (
              <p className="text-sm font-medium text-accent" role="alert">
                {nameErrors[0]}
              </p>
            )}
            <Input
              label="Mot de passe"
              name="password"
              type="password"
              autoComplete="new-password"
              required
            />
            {passwordErrors && (
              <p className="text-sm font-medium text-accent" role="alert">
                {passwordErrors[0]}
              </p>
            )}
            <Input
              label="Confirmer le mot de passe"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
            />
            {confirmErrors && (
              <p className="text-sm font-medium text-accent" role="alert">
                {confirmErrors[0]}
              </p>
            )}
            {generalError && (
              <p className="text-sm font-medium text-accent" role="alert">
                {generalError}
              </p>
            )}
            <Button type="submit" className="mt-2">
              Créer mon compte
            </Button>
          </Form>
        )}
      </Card>
    </div>
  );
}
