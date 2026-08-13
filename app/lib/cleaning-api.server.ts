import { apiFetch } from "./api.server";
import { getAccessToken } from "./auth.server";

export type HouseholdMemberDto = {
  id: string;
  name: string;
  avatarKey: string;
  role: string;
};

type ChoreFrequency = "weekly" | "biweekly";

type ChoreDto = {
  id: string;
  name: string;
  frequency: ChoreFrequency;
  done: boolean;
};

type UserWeekChoresResponse = {
  user: HouseholdMemberDto;
  chores: ChoreDto[];
};

export type ChoreView = {
  id: string;
  name: string;
  tag: "Chaque semaine" | "Toutes les 2 semaines";
  done: boolean;
};

export type UserWeekChores = {
  user: HouseholdMemberDto;
  chores: ChoreView[];
};

// The API returns a machine-readable frequency, not display copy (see
// my-home-backend/CLAUDE.md's API surface section) — this app owns the
// French label, same convention as api.server.ts's ERROR_MESSAGES.
const FREQUENCY_LABEL: Record<ChoreFrequency, ChoreView["tag"]> = {
  weekly: "Chaque semaine",
  biweekly: "Toutes les 2 semaines",
};

/** Always in stable households.member_order order — see cleaning-order.ts for
 * "signed-in user first" display reordering, which happens in the caller. */
export async function getWeekChores(
  request: Request,
  isoWeek: string,
): Promise<UserWeekChores[]> {
  const accessToken = await getAccessToken(request);
  const entries = await apiFetch<UserWeekChoresResponse[]>(
    `/cleaning?week=${encodeURIComponent(isoWeek)}`,
    { accessToken },
  );
  return entries.map((entry) => ({
    user: entry.user,
    chores: entry.chores.map((chore) => ({
      id: chore.id,
      name: chore.name,
      tag: FREQUENCY_LABEL[chore.frequency],
      done: chore.done,
    })),
  }));
}

export async function toggleChoreCompletion(
  request: Request,
  choreId: string,
  isoWeek: string,
): Promise<void> {
  const accessToken = await getAccessToken(request);
  await apiFetch(`/cleaning/chores/${choreId}/toggle`, {
    method: "PATCH",
    accessToken,
    body: { isoWeek },
  });
}
