import { data, redirect } from "react-router";

import { ChoreColumn } from "~/components/cleaning/ChoreColumn";
import { DayNavigator } from "~/components/cleaning/DayNavigator";
import { WeeklyBlock } from "~/components/cleaning/WeeklyBlock";
import { ApiRequestError, mapApiErrors } from "~/lib/api.server";
import { requireUser } from "~/lib/auth.server";
import {
  getDayChores,
  getWeekChores,
  toggleChoreCompletion,
  toggleSubtaskCompletion,
} from "~/lib/cleaning-api.server";
import { withCurrentUserFirst } from "~/lib/cleaning-order";
import { formatDayLabel, getCurrentIsoDate, isoWeekOfDate, isValidIsoDate } from "~/lib/day";
import { avatarColorFor } from "~/lib/user-colors";
import { toggleChoreSchema, toggleChoreSubtaskSchema } from "~/lib/validation";

import type { Route } from "./+types/cleaning";

export function meta() {
  return [{ title: "Ménage · Hearth" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const currentUser = await requireUser(request);
  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");

  if (!dateParam || !isValidIsoDate(dateParam)) {
    throw redirect(`/cleaning?date=${getCurrentIsoDate()}`);
  }

  const isoWeek = isoWeekOfDate(dateParam);
  const [dayChores, weekChores] = await Promise.all([
    getDayChores(request, dateParam),
    getWeekChores(request, isoWeek),
  ]);

  return {
    isoDate: dateParam,
    isoWeek,
    dayChores,
    weekChores,
    currentUserId: currentUser.id,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "toggleChoreSubtask") {
      const result = toggleChoreSubtaskSchema.safeParse(Object.fromEntries(formData));
      if (!result.success) {
        return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
      }
      await toggleSubtaskCompletion(
        request,
        result.data.choreId,
        result.data.subtaskId,
        result.data.occurrenceDate,
      );
      return { ok: true };
    }

    const result = toggleChoreSchema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }
    await toggleChoreCompletion(request, result.data.choreId, result.data.occurrenceDate);
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return data({ errors: mapApiErrors(error.errors) }, { status: error.status });
    }
    throw error;
  }
}

export default function Cleaning({ loaderData }: Route.ComponentProps) {
  const { isoDate, isoWeek, dayChores, weekChores, currentUserId } = loaderData;
  // households.member_order — the stable anchor colors are resolved
  // against, so they never flip depending on who's signed in, even
  // though the columns themselves are reordered below.
  const stableOrderUserIds = dayChores.map((entry) => entry.user.id);
  const orderedDayChores = withCurrentUserFirst(dayChores, currentUserId);

  return (
    <div>
      <h1 className="mb-4 font-serif text-2xl font-bold">Ménage</h1>

      <WeeklyBlock isoWeek={isoWeek} weekChores={weekChores} currentUserId={currentUserId} />

      <DayNavigator isoDate={isoDate} label={formatDayLabel(isoDate)} />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {orderedDayChores.map((userChores) => (
          <ChoreColumn
            key={userChores.user.id}
            userChores={userChores}
            emptyStateText="Aucune corvée ce jour-là."
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
