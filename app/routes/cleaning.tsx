import { data, redirect } from "react-router";

import { ChoreColumn } from "~/components/cleaning/ChoreColumn";
import { WeekNavigator } from "~/components/cleaning/WeekNavigator";
import { getWeekChores, toggleChoreCompletion } from "~/db/queries/cleaning.server";
import { toggleChoreSchema } from "~/lib/validation";
import { formatWeekLabel, getCurrentIsoWeek, isValidIsoWeek } from "~/lib/week";

import type { Route } from "./+types/cleaning";

export function meta() {
  return [{ title: "Ménage · Hearth" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const weekParam = url.searchParams.get("week");

  if (!weekParam || !isValidIsoWeek(weekParam)) {
    throw redirect(`/cleaning?week=${getCurrentIsoWeek()}`);
  }

  const weekChores = await getWeekChores(weekParam);
  return { isoWeek: weekParam, weekChores };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const result = toggleChoreSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
  }
  await toggleChoreCompletion(result.data.choreId, result.data.isoWeek);
  return { ok: true };
}

export default function Cleaning({ loaderData }: Route.ComponentProps) {
  const { isoWeek, weekChores } = loaderData;

  return (
    <div>
      <h1 className="mb-1.5 font-serif text-2xl font-bold">Ménage</h1>
      <WeekNavigator isoWeek={isoWeek} label={formatWeekLabel(isoWeek)} />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {weekChores.map((memberChores, index) => (
          <ChoreColumn
            key={memberChores.member.id}
            memberChores={memberChores}
            isoWeek={isoWeek}
            index={index}
          />
        ))}
      </div>
      <p className="mt-5 text-sm font-medium text-muted">
        Cuisine/poubelles et salle de bain/surfaces/sols changent chaque semaine. Draps et couloir
        changent toutes les 2 semaines.
      </p>
    </div>
  );
}
