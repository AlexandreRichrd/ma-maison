import { apiFetch } from "./api.server";
import { getAccessToken } from "./auth.server";

export type HouseholdMemberDto = {
  id: string;
  name: string;
  avatarKey: string;
};

type FrequencyUnit = "DAY" | "WEEK";

type SubtaskDto = {
  id: string;
  label: string;
  done: boolean;
};

type ChoreDto = {
  id: string;
  name: string;
  frequencyUnit: FrequencyUnit;
  frequencyValue: number;
  occurrenceDate: string;
  done: boolean;
  subtasks: SubtaskDto[];
};

type UserChoresResponse = {
  user: HouseholdMemberDto;
  chores: ChoreDto[];
};

export type SubtaskView = {
  id: string;
  label: string;
  done: boolean;
};

export type ChoreView = {
  id: string;
  name: string;
  tag: string;
  occurrenceDate: string;
  done: boolean;
  subtasks: SubtaskView[];
};

export type UserChores = {
  user: HouseholdMemberDto;
  chores: ChoreView[];
};

// The API returns machine-readable frequencyUnit/frequencyValue, not
// display copy (see my-home-backend/CLAUDE.md's API surface section) —
// this app owns the French label.
function frequencyLabel(unit: FrequencyUnit, value: number): string {
  if (unit === "DAY") {
    return value === 1 ? "Chaque jour" : `Tous les ${value} jours`;
  }
  return value === 1 ? "Chaque semaine" : `Toutes les ${value} semaines`;
}

function toChoreView(chore: ChoreDto): ChoreView {
  return {
    id: chore.id,
    name: chore.name,
    tag: frequencyLabel(chore.frequencyUnit, chore.frequencyValue),
    occurrenceDate: chore.occurrenceDate,
    done: chore.done,
    subtasks: chore.subtasks.map((subtask) => ({
      id: subtask.id,
      label: subtask.label,
      done: subtask.done,
    })),
  };
}

function toUserChores(entries: UserChoresResponse[]): UserChores[] {
  return entries.map((entry) => ({
    user: entry.user,
    chores: entry.chores.map(toChoreView),
  }));
}

/** WEEK-unit chores only, grouped by person — the persistent weekly
 * block. Always in stable households.member_order order — see
 * cleaning-order.ts for "signed-in user first" display reordering, which
 * happens in the caller. */
export async function getWeekChores(
  request: Request,
  isoWeek: string,
): Promise<UserChores[]> {
  const accessToken = await getAccessToken(request);
  const entries = await apiFetch<UserChoresResponse[]>(
    `/cleaning/week?week=${encodeURIComponent(isoWeek)}`,
    { accessToken },
  );
  return toUserChores(entries);
}

/** DAY-unit chores only, grouped by person, for a single day — the day
 * navigator's content. */
export async function getDayChores(
  request: Request,
  isoDate: string,
): Promise<UserChores[]> {
  const accessToken = await getAccessToken(request);
  const entries = await apiFetch<UserChoresResponse[]>(
    `/cleaning/day?date=${encodeURIComponent(isoDate)}`,
    { accessToken },
  );
  return toUserChores(entries);
}

export async function toggleChoreCompletion(
  request: Request,
  choreId: string,
  occurrenceDate: string,
): Promise<void> {
  const accessToken = await getAccessToken(request);
  await apiFetch(`/cleaning/chores/${choreId}/toggle`, {
    method: "PATCH",
    accessToken,
    body: { occurrenceDate },
  });
}

export async function toggleSubtaskCompletion(
  request: Request,
  choreId: string,
  subtaskId: string,
  occurrenceDate: string,
): Promise<void> {
  const accessToken = await getAccessToken(request);
  await apiFetch(`/cleaning/chores/${choreId}/subtasks/${subtaskId}/toggle`, {
    method: "PATCH",
    accessToken,
    body: { occurrenceDate },
  });
}
