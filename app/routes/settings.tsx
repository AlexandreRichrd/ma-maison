import { data } from "react-router";

import { PageHeader } from "~/components/layout/PageHeader";
import { HouseholdSettingsCard } from "~/components/settings/HouseholdSettingsCard";
import { PersonalPreferencesCard } from "~/components/settings/PersonalPreferencesCard";
import { ApiRequestError, mapApiErrors } from "~/lib/api.server";
import { requireUser } from "~/lib/auth.server";
import {
  getOrderedUsers,
  updateMemberNotificationPreference,
  updateMemberOrder,
} from "~/lib/household-api.server";
import { getSettings, updateSettings } from "~/lib/settings-api.server";
import {
  updateMemberOrderSchema,
  updateNotificationPreferenceSchema,
  updateSettingsSchema,
} from "~/lib/validation";

import type { Route } from "./+types/settings";

export function meta() {
  return [{ title: "Paramètres · Hearth" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const currentUser = await requireUser(request);
  const [users, settings] = await Promise.all([
    getOrderedUsers(request),
    getSettings(request),
  ]);
  const user = users.find((u) => u.id === currentUser.id);
  if (!user) {
    // requireUser()'s claim outliving the user it names — see
    // my-home/CLAUDE.md's Authentication section on why this is trusted
    // without a DB round trip, and the one window where it can be stale.
    throw data("Introuvable", { status: 404 });
  }
  return { settings, users, user };
}

export async function action({ request }: Route.ActionArgs) {
  const currentUser = await requireUser(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "updateSettings") {
      const result = updateSettingsSchema.safeParse(Object.fromEntries(formData));
      if (!result.success) {
        return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
      }
      await updateSettings(request, result.data);
      return { ok: true };
    }

    if (intent === "updateMemberOrder") {
      // memberOrder is submitted as several same-named fields — Object.
      // fromEntries would collapse them to just the last one, same reason
      // reorderChoreSubtasks parses the raw FormData instead.
      const result = updateMemberOrderSchema.safeParse({
        intent: formData.get("intent"),
        memberOrder: formData.getAll("memberOrder"),
      });
      if (!result.success) {
        return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
      }
      await updateMemberOrder(request, result.data.memberOrder);
      return { ok: true };
    }

    // updateNotificationPreference — always the signed-in user's own row,
    // never a client-submitted target. This page is "my preferences" for
    // that card, not an admin panel over other members.
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

export default function Settings({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <PageHeader title="Paramètres" back={{ to: "/", label: "← Tableau de bord" }} />
      <div className="max-w-[560px]">
        <HouseholdSettingsCard settings={loaderData.settings} users={loaderData.users} />
        <PersonalPreferencesCard user={loaderData.user} />
      </div>
    </div>
  );
}
