import { data, Form, redirect } from "react-router";

import { Button, Card, Input } from "~/components/ui";
import { createUserSession, getSessionUserId, login } from "~/lib/auth.server";
import { loginSchema } from "~/lib/validation";

import type { Route } from "./+types/login";

export function meta() {
  return [{ title: "Connexion · Hearth" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  if (await getSessionUserId(request)) {
    throw redirect("/");
  }
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const result = loginSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
  }

  const user = await login(request, result.data.email, result.data.password);
  if (!user) {
    // Deliberately not attached to either field, and the same message
    // whether the account doesn't exist, the password is wrong, or the
    // attempt was rate-limited — never reveal which.
    return data(
      { errors: { general: ["Email ou mot de passe incorrect"] } },
      { status: 400 },
    );
  }

  return createUserSession(request, user.id, "/");
}

export default function Login({ actionData }: Route.ComponentProps) {
  const errors = actionData && "errors" in actionData ? actionData.errors : undefined;
  const generalError =
    errors && "general" in errors ? errors.general?.[0] : undefined;
  const emailError = errors && "email" in errors ? errors.email?.[0] : undefined;
  const passwordError =
    errors && "password" in errors ? errors.password?.[0] : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-5 font-serif text-xl font-bold">Hearth</div>
        <Form method="post" className="flex flex-col gap-3">
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            required
          />
          {emailError && (
            <p className="text-sm font-medium text-accent" role="alert">
              {emailError}
            </p>
          )}
          <Input
            label="Mot de passe"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          {passwordError && (
            <p className="text-sm font-medium text-accent" role="alert">
              {passwordError}
            </p>
          )}
          {generalError && (
            <p className="text-sm font-medium text-accent" role="alert">
              {generalError}
            </p>
          )}
          <Button type="submit" className="mt-2">
            Se connecter
          </Button>
        </Form>
      </Card>
    </div>
  );
}
