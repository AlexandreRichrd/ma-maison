import { data, Form } from "react-router";

import { Button, Card, Input } from "~/components/ui";
import { getInviteByToken, isInviteUsable } from "~/db/queries/invites.server";
import { getUserByEmail } from "~/db/queries/users.server";
import { sendActivationEmail } from "~/lib/mail.server";
import { registerFromInvite } from "~/lib/registration.server";
import { registerSchema } from "~/lib/validation";

import type { Route } from "./+types/register";

export function meta() {
  return [{ title: "Créer un compte · Hearth" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return { valid: false as const };

  const invite = await getInviteByToken(token);
  if (!invite || !isInviteUsable(invite)) return { valid: false as const };

  return { valid: true as const, email: invite.email, token };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const result = registerSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
  }

  // Re-checked here, not just in the loader — the invite could expire or
  // get used by a second tab between page load and submit.
  const invite = await getInviteByToken(result.data.token);
  if (!invite || !isInviteUsable(invite)) {
    return data(
      { errors: { general: ["Ce lien d'invitation est invalide ou a expiré"] } },
      { status: 400 },
    );
  }

  // A previous invite to the same address could already have been
  // completed (or a second invite issued before the first was used) —
  // catch it here rather than hitting the DB's unique constraint.
  const existing = await getUserByEmail(invite.email);
  if (existing) {
    return data(
      { errors: { general: ["Un compte existe déjà pour cette adresse"] } },
      { status: 400 },
    );
  }

  const { verificationToken } = await registerFromInvite({
    inviteId: invite.id,
    householdId: invite.householdId,
    email: invite.email,
    name: result.data.name,
    role: result.data.role,
    password: result.data.password,
  });
  await sendActivationEmail(invite.email, verificationToken);

  return { ok: true as const, email: invite.email };
}

export default function Register({ loaderData, actionData }: Route.ComponentProps) {
  const errors = actionData && "errors" in actionData ? actionData.errors : undefined;
  const nameErrors = errors && "name" in errors ? errors.name : undefined;
  const roleErrors = errors && "role" in errors ? errors.role : undefined;
  const passwordErrors = errors && "password" in errors ? errors.password : undefined;
  const confirmErrors = errors && "confirmPassword" in errors ? errors.confirmPassword : undefined;
  const generalError = errors && "general" in errors ? errors.general?.[0] : undefined;
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
            <Input label="Rôle" name="role" placeholder="Parent, Partenaire…" required />
            {roleErrors && (
              <p className="text-sm font-medium text-accent" role="alert">
                {roleErrors[0]}
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
