import { apiFetch } from "./api.server";
import { getAccessToken } from "./auth.server";

export type AssignmentMode = "ROTATING" | "PINNED";

export type ChoreConfig = {
  id: string;
  name: string;
  frequencyWeeks: number;
  assignmentMode: AssignmentMode;
  anchorIsoWeek: string;
  anchorUserId: string;
};

export type ChoreConfigInput = {
  name: string;
  // Arrives as a string from form data — converted to a real JSON number
  // here, since the API's @IsInt() needs one.
  frequencyWeeks: string;
  assignmentMode: AssignmentMode;
  anchorIsoWeek: string;
  anchorUserId: string;
};

function toRequestBody(input: ChoreConfigInput) {
  return {
    name: input.name,
    frequencyWeeks: Number(input.frequencyWeeks),
    assignmentMode: input.assignmentMode,
    anchorIsoWeek: input.anchorIsoWeek,
    anchorUserId: input.anchorUserId,
  };
}

export async function getChoreConfigs(request: Request): Promise<ChoreConfig[]> {
  const accessToken = await getAccessToken(request);
  return apiFetch<ChoreConfig[]>("/cleaning/chores", { accessToken });
}

export async function createChore(request: Request, input: ChoreConfigInput): Promise<void> {
  const accessToken = await getAccessToken(request);
  await apiFetch("/cleaning/chores", {
    method: "POST",
    accessToken,
    body: toRequestBody(input),
  });
}

export async function updateChore(
  request: Request,
  choreId: string,
  input: ChoreConfigInput,
): Promise<void> {
  const accessToken = await getAccessToken(request);
  await apiFetch(`/cleaning/chores/${choreId}`, {
    method: "PATCH",
    accessToken,
    body: toRequestBody(input),
  });
}

export async function deleteChore(request: Request, choreId: string): Promise<void> {
  const accessToken = await getAccessToken(request);
  await apiFetch(`/cleaning/chores/${choreId}`, {
    method: "DELETE",
    accessToken,
  });
}
