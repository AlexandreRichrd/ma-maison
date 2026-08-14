import { data, Form, Link } from "react-router";

import { Button, Card, Input } from "~/components/ui";
import { ApiRequestError, mapApiErrors } from "~/lib/api.server";
import { forgotPassword } from "~/lib/auth.server";
import { forgotPasswordSchema } from "~/lib/validation";

import type { Route } from "./+types/forgot-password";

export function meta() {
  return [{ title: "Mot de passe oublié · Hearth" }];
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const result = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    await forgotPassword(result.data.email);
  } catch (error) {
    if (error instanceof ApiRequestError) {
      // A malformed address is worth correcting. Anything else (rate
      // limited, a transient failure) still shows the same confirmation
      // as success below — the API never reveals whether an email is
      // registered, and neither should this fall back to a different
      // outward behavior depending on why the request didn't go through.
      const emailErrors = error.errors.filter((e) => e.field === "email");
      if (emailErrors.length > 0) {
        return data({ errors: mapApiErrors(emailErrors) }, { status: error.status });
      }
      return { ok: true as const };
    }
    throw error;
  }

  return { ok: true as const };
}

export default function ForgotPassword({ actionData }: Route.ComponentProps) {
  const errors = actionData && "errors" in actionData ? actionData.errors : undefined;
  const emailErrors = errors && "email" in errors ? errors.email : undefined;
  const succeeded = actionData !== undefined && "ok" in actionData && actionData.ok;

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-5 font-serif text-xl font-bold">Hearth</div>

        {succeeded ? (
          <p className="text-sm font-medium text-foreground" role="status">
            Si un compte existe pour cette adresse, un email avec un lien de
            réinitialisation vient d'être envoyé.
          </p>
        ) : (
          <Form method="post" className="flex flex-col gap-3">
            <p className="text-sm font-medium text-muted">
              Indiquez votre email pour recevoir un lien de réinitialisation.
            </p>
            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              required
            />
            {emailErrors && (
              <p className="text-sm font-medium text-accent" role="alert">
                {emailErrors[0]}
              </p>
            )}
            <Button type="submit" className="mt-2">
              Envoyer le lien
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
