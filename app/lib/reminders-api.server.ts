import { apiFetch } from "./api.server";
import { getAccessToken } from "./auth.server";

type ReminderDto = {
  id: string;
  title: string;
  dueAt: string;
  doneAt: string | null;
  assigneeIds: string[];
  createdAt: string;
  updatedAt: string;
};

// Mirrors the API's JSON response shape, not the Drizzle-inferred
// ~/db/schema type — dates cross the wire as ISO strings, not Date
// instances, so this app converts them once here rather than reusing the
// Drizzle type and silently mistyping them.
export type Reminder = {
  id: string;
  title: string;
  dueAt: Date;
  doneAt: Date | null;
  assigneeIds: string[];
  createdAt: Date;
  updatedAt: Date;
};

function toReminder(dto: ReminderDto): Reminder {
  return {
    id: dto.id,
    title: dto.title,
    dueAt: new Date(dto.dueAt),
    doneAt: dto.doneAt ? new Date(dto.doneAt) : null,
    assigneeIds: dto.assigneeIds,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  };
}

export async function getReminders(request: Request): Promise<Reminder[]> {
  const accessToken = await getAccessToken(request);
  const dtos = await apiFetch<ReminderDto[]>("/reminders", { accessToken });
  return dtos.map(toReminder);
}

/** Undone reminders due by end of today, for the dashboard widget. */
export async function getDueTodayReminders(request: Request): Promise<Reminder[]> {
  const accessToken = await getAccessToken(request);
  const dtos = await apiFetch<ReminderDto[]>("/reminders/due-today", { accessToken });
  return dtos.map(toReminder);
}

export async function createReminder(
  request: Request,
  params: { title: string; dueAt: Date; assigneeIds: string[] },
): Promise<void> {
  const accessToken = await getAccessToken(request);
  await apiFetch("/reminders", {
    method: "POST",
    accessToken,
    body: {
      title: params.title,
      dueAt: params.dueAt.toISOString(),
      assigneeIds: params.assigneeIds,
    },
  });
}

/** doneAt is nullable, not a boolean — undo sets it back to null. */
export async function toggleReminder(request: Request, reminderId: string): Promise<void> {
  const accessToken = await getAccessToken(request);
  await apiFetch(`/reminders/${reminderId}/toggle`, {
    method: "PATCH",
    accessToken,
  });
}
