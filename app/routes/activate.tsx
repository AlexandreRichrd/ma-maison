import { redirect } from "react-router";

import { Card } from "~/components/ui";
import {
  consumeEmailVerification,
  getEmailVerificationByToken,
  isVerificationUsable,
} from "~/db/queries/email-verifications.server";

import type { Route } from "./+types/activate";

export function meta() {
  return [{ title: "Activation du compte · Hearth" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const token = new URL(request.url).searchParams.get("token");
  const verification = token ? await getEmailVerificationByToken(token) : null;

  if (!verification || !isVerificationUsable(verification)) {
    return { valid: false as const };
  }

  await consumeEmailVerification(verification);
  throw redirect("/login?activated=1");
}

export default function Activate({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <Card className="w-full max-w-sm">
        <div className="mb-5 font-serif text-xl font-bold">Hearth</div>
        {!loaderData.valid && (
          <p className="text-sm font-medium text-foreground">
            Ce lien d'activation est invalide ou a expiré. Demandez une nouvelle
            invitation à quelqu'un du foyer.
          </p>
        )}
      </Card>
    </div>
  );
}
