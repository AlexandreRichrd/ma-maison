import { data, useFetcher } from "react-router";

import { PageHeader } from "~/components/layout/PageHeader";
import { Card } from "~/components/ui";
import { ApiRequestError, mapApiErrors } from "~/lib/api.server";
import { requireUser } from "~/lib/auth.server";
import { getOrderedUsers, updateMemberNotificationPreference } from "~/lib/household-api.server";
import { updateNotificationPreferenceSchema } from "~/lib/validation";

import type { Route } from "./+types/account";

export function meta() {
  return [{ title: "Mon compte · Hearth" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const currentUser = await requireUser(request);
  const users = await getOrderedUsers(request);
  // No dedicated "get one user" endpoint — this page's own account is
  // already fetched as part of the household member list every other page
  // needs too (see _layout.tsx), so reusing it here avoids a bespoke
  // endpoint for a single row.
  const user = users.find((u) => u.id === currentUser.id);
  if (!user) {
    // requireUser()'s claim outliving the user it names — see
    // my-home/CLAUDE.md's Authentication section on why this is trusted
    // without a DB round trip, and the one window where it can be stale.
    throw data("Introuvable", { status: 404 });
  }
  return { user };
}

export async function action({ request }: Route.ActionArgs) {
  const currentUser = await requireUser(request);
  const formData = await request.formData();

  try {
    // Always the signed-in user's own row — never a client-submitted
    // target id, unlike the household-wide settings elsewhere. This page
    // is "my preferences", not an admin panel over other members.
    const result = updateNotificationPreferenceSchema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }
    await updateMemberNotificationPreference(
      request,
      currentUser.id,
      result.data.receiveClimateAlerts,
    );
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return data({ errors: mapApiErrors(error.errors) }, { status: error.status });
    }
    throw error;
  }
}

export default function Account({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;
  const fetcher = useFetcher();
  const checked =
    fetcher.state !== "idle" ? !user.receiveClimateAlerts : user.receiveClimateAlerts;

  function toggle() {
    const formData = new FormData();
    formData.set("intent", "updateNotificationPreference");
    formData.set("receiveClimateAlerts", checked ? "false" : "true");
    void fetcher.submit(formData, { method: "post" });
  }

  return (
    <div>
      <PageHeader
        title="Mon compte"
        subtitle={user.name}
        back={{ to: "/", label: "← Tableau de bord" }}
      />
      <Card className="max-w-[480px]">
        <h2 className="mb-3.5 font-serif text-lg font-semibold">Notifications</h2>
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={checked}
            onChange={toggle}
            className="size-5 shrink-0 accent-accent"
          />
          <span>Recevoir les alertes climat</span>
        </label>
      </Card>
    </div>
  );
}
