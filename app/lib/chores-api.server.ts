import { apiFetch } from "./api.server";
import { getAccessToken } from "./auth.server";

export type AssignmentMode = "ROTATING" | "PINNED";
export type FrequencyUnit = "DAY" | "WEEK";

export type ChoreSubtaskConfig = {
  id: string;
  label: string;
  position: number;
};

export type ChoreConfig = {
  id: string;
  name: string;
  frequencyUnit: FrequencyUnit;
  frequencyValue: number;
  assignmentMode: AssignmentMode;
  anchorDate: string;
  anchorUserId: string;
  subtasks: ChoreSubtaskConfig[];
};

export type ChoreConfigInput = {
  name: string;
  frequencyUnit: FrequencyUnit;
  // Arrives as a string from form data — converted to a real JSON number
  // here, since the API's @IsInt() needs one.
  frequencyValue: string;
  assignmentMode: AssignmentMode;
  anchorDate: string;
  anchorUserId: string;
};

function toRequestBody(input: ChoreConfigInput) {
  return {
    name: input.name,
    frequencyUnit: input.frequencyUnit,
    frequencyValue: Number(input.frequencyValue),
    assignmentMode: input.assignmentMode,
    anchorDate: input.anchorDate,
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

export async function createChoreSubtask(
  request: Request,
  choreId: string,
  label: string,
): Promise<void> {
  const accessToken = await getAccessToken(request);
  await apiFetch(`/cleaning/chores/${choreId}/subtasks`, {
    method: "POST",
    accessToken,
    body: { label },
  });
}

export async function updateChoreSubtask(
  request: Request,
  choreId: string,
  subtaskId: string,
  label: string,
): Promise<void> {
  const accessToken = await getAccessToken(request);
  await apiFetch(`/cleaning/chores/${choreId}/subtasks/${subtaskId}`, {
    method: "PATCH",
    accessToken,
    body: { label },
  });
}

export async function deleteChoreSubtask(
  request: Request,
  choreId: string,
  subtaskId: string,
): Promise<void> {
  const accessToken = await getAccessToken(request);
  await apiFetch(`/cleaning/chores/${choreId}/subtasks/${subtaskId}`, {
    method: "DELETE",
    accessToken,
  });
}

export async function reorderChoreSubtasks(
  request: Request,
  choreId: string,
  subtaskIds: string[],
): Promise<void> {
  const accessToken = await getAccessToken(request);
  await apiFetch(`/cleaning/chores/${choreId}/subtasks/reorder`, {
    method: "PATCH",
    accessToken,
    body: { subtaskIds },
  });
}
