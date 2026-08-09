import { data, Form, redirect } from "react-router";

import { Button, Card, Input } from "~/components/ui";
import { createUserSession, isAuthenticated, login } from "~/lib/auth.server";
import { loginSchema } from "~/lib/validation";

import type { Route } from "./+types/login";

export function meta() {
  return [{ title: "Sign in · Hearth" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  if (await isAuthenticated(request)) {
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

  const ok = await login(result.data.password);
  if (!ok) {
    return data(
      { errors: { password: ["Incorrect password"] } },
      { status: 400 },
    );
  }

  return createUserSession(request, "/");
}

export default function Login({ actionData }: Route.ComponentProps) {
  const errors = actionData && "errors" in actionData ? actionData.errors : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-5 font-serif text-xl font-bold">Hearth</div>
        <Form method="post" className="flex flex-col gap-3">
          <Input
            label="Household password"
            name="password"
            type="password"
            autoFocus
            required
          />
          {errors?.password && (
            <p className="text-sm font-medium text-accent" role="alert">
              {errors.password[0]}
            </p>
          )}
          <Button type="submit" className="mt-2">
            Sign in
          </Button>
        </Form>
      </Card>
    </div>
  );
}
