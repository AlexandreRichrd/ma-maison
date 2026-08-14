import { data, Form, Link, redirect } from "react-router";

import { Button, Card, Input } from "~/components/ui";
import { ApiRequestError, mapApiErrors } from "~/lib/api.server";
import { resetPassword } from "~/lib/auth.server";
import { resetPasswordSchema } from "~/lib/validation";

import type { Route } from "./+types/reset-password";

export function meta() {
  return [{ title: "Réinitialiser le mot de passe · Hearth" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return { valid: false as const };
  return { valid: true as const, token };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const result = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    // Re-validated by the API here, not just by the loader's earlier
    // presence check — the token could expire or get consumed by a
    // second tab between page load and submit.
    await resetPassword(result.data);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return data({ errors: mapApiErrors(error.errors) }, { status: error.status });
    }
    throw error;
  }

  return redirect("/login?reset=1");
}

export default function ResetPassword({ loaderData, actionData }: Route.ComponentProps) {
  const errors = actionData && "errors" in actionData ? actionData.errors : undefined;
  const passwordErrors = errors && "password" in errors ? errors.password : undefined;
  const confirmErrors = errors && "confirmPassword" in errors ? errors.confirmPassword : undefined;
  // "token" covers the API's reset_invalid code (there's no field-level
  // slot for the hidden token field) — same display spot as a whole-form
  // "general" error.
  const generalError =
    (errors && "general" in errors ? errors.general?.[0] : undefined) ??
    (errors && "token" in errors ? errors.token?.[0] : undefined);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-5 font-serif text-xl font-bold">Hearth</div>

        {!loaderData.valid ? (
          <p className="text-sm font-medium text-foreground">
            Ce lien de réinitialisation est invalide ou a expiré. Demandez-en
            un nouveau depuis la page de connexion.
          </p>
        ) : (
          <Form method="post" className="flex flex-col gap-3">
            <input type="hidden" name="token" value={loaderData.token} />
            <Input
              label="Nouveau mot de passe"
              name="password"
              type="password"
              autoComplete="new-password"
              autoFocus
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
              Réinitialiser le mot de passe
            </Button>
          </Form>
        )}

        <Link to="/login" className="mt-4 inline-block text-sm font-semibold">
          Retour à la connexion
        </Link>
      </Card>
    </div>
  );
}
