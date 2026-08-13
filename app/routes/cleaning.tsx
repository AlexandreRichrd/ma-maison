import { data, redirect } from "react-router";

import { ChoreColumn } from "~/components/cleaning/ChoreColumn";
import { WeekNavigator } from "~/components/cleaning/WeekNavigator";
import { ApiRequestError, mapApiErrors } from "~/lib/api.server";
import { requireUser } from "~/lib/auth.server";
import { getWeekChores, toggleChoreCompletion } from "~/lib/cleaning-api.server";
import { withCurrentUserFirst } from "~/lib/cleaning-order";
import { avatarColorFor } from "~/lib/user-colors";
import { toggleChoreSchema } from "~/lib/validation";
import { formatWeekLabel, getCurrentIsoWeek, isValidIsoWeek } from "~/lib/week";

import type { Route } from "./+types/cleaning";

export function meta() {
  return [{ title: "Ménage · Hearth" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const currentUser = await requireUser(request);
  const url = new URL(request.url);
  const weekParam = url.searchParams.get("week");

  if (!weekParam || !isValidIsoWeek(weekParam)) {
    throw redirect(`/cleaning?week=${getCurrentIsoWeek()}`);
  }

  const weekChores = await getWeekChores(request, weekParam);
  return { isoWeek: weekParam, weekChores, currentUserId: currentUser.id };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const result = toggleChoreSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    await toggleChoreCompletion(request, result.data.choreId, result.data.isoWeek);
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return data({ errors: mapApiErrors(error.errors) }, { status: error.status });
    }
    throw error;
  }
}

export default function Cleaning({ loaderData }: Route.ComponentProps) {
  const { isoWeek, weekChores, currentUserId } = loaderData;
  // households.member_order — the stable anchor colors are resolved
  // against, so they never flip depending on who's signed in, even
  // though the columns themselves are reordered below.
  const stableOrderUserIds = weekChores.map((entry) => entry.user.id);
  const orderedWeekChores = withCurrentUserFirst(weekChores, currentUserId);

  return (
    <div>
      <h1 className="mb-1.5 font-serif text-2xl font-bold">Ménage</h1>
      <WeekNavigator isoWeek={isoWeek} label={formatWeekLabel(isoWeek)} />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {orderedWeekChores.map((userChores) => (
          <ChoreColumn
            key={userChores.user.id}
            userChores={userChores}
            isoWeek={isoWeek}
            avatarColorClassName={avatarColorFor(
              stableOrderUserIds.map((id) => ({ id })),
              userChores.user.id,
            )}
          />
        ))}
      </div>
    </div>
  );
}
