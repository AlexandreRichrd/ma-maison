import { format } from "date-fns";
import { useState } from "react";
import { data, redirect, useFetcher } from "react-router";

import { PageHeader } from "~/components/layout/PageHeader";
import { CalendarGrid } from "~/components/reminders/CalendarGrid";
import { CalendarNavigator } from "~/components/reminders/CalendarNavigator";
import { ReminderRow } from "~/components/reminders/ReminderRow";
import { ViewToggle } from "~/components/reminders/ViewToggle";
import { Button, Checkbox, Input, Modal } from "~/components/ui";
import { ApiRequestError, mapApiErrors } from "~/lib/api.server";
import { requireUser } from "~/lib/auth.server";
import { formatIsoDate } from "~/lib/day";
import { getOrderedUsers } from "~/lib/household-api.server";
import type { Reminder } from "~/lib/reminders-api.server";
import { createReminder, getReminders, toggleReminder } from "~/lib/reminders-api.server";
import { addReminderSchema, toggleReminderSchema } from "~/lib/validation";
import { getCurrentIsoWeek, isoWeekDays, isValidIsoWeek, monthGridWeeks } from "~/lib/week";

import type { Route } from "./+types/reminders";

// Calendar replaces the flat list as the default (per the issue: week view
// by default), but the list stays one tap away via ViewToggle — it answers
// "what's coming up" chronologically, which a day-by-day calendar doesn't
// obviously replace. Both `view` and `week` live in the URL, never
// component state, so reload/share reproduces the same displayed period —
// same rule Cleaning's `?week=` already follows.
const VIEWS = ["list", "week", "month"] as const;
type View = (typeof VIEWS)[number];

function isValidView(value: string | null): value is View {
  return VIEWS.includes(value as View);
}

export function meta() {
  return [{ title: "Rappels · Hearth" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const currentUser = await requireUser(request);
  const url = new URL(request.url);
  const viewParam = url.searchParams.get("view");
  const weekParam = url.searchParams.get("week");

  const view: View = isValidView(viewParam) ? viewParam : "week";
  const week = weekParam && isValidIsoWeek(weekParam) ? weekParam : getCurrentIsoWeek();

  if (viewParam !== view || weekParam !== week) {
    throw redirect(`/reminders?view=${view}&week=${week}`);
  }

  const users = await getOrderedUsers(request);

  if (view === "list") {
    const reminders = await getReminders(request);
    return { view, week, weeks: [] as string[], reminders, users, currentUserId: currentUser.id };
  }

  // Month needs at most ~6 weeks of data, week at most 7 days — fetching a
  // bounded range instead of every reminder ever created (see
  // my-home-backend's GET /reminders?from=&to=) since there's no
  // delete-on-complete, so the unfiltered list only grows over time.
  const weeks = view === "month" ? monthGridWeeks(week) : [week];
  const days = weeks.flatMap((w) => isoWeekDays(w));
  const reminders = await getReminders(request, {
    from: formatIsoDate(days[0]),
    to: formatIsoDate(days[days.length - 1]),
  });

  return { view, week, weeks, reminders, users, currentUserId: currentUser.id };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "addReminder") {
      const result = addReminderSchema.safeParse({
        intent,
        title: formData.get("title"),
        dueAt: formData.get("dueAt"),
        assigneeIds: formData.getAll("assigneeIds"),
      });
      if (!result.success) {
        return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
      }
      await createReminder(request, {
        title: result.data.title,
        dueAt: new Date(result.data.dueAt),
        assigneeIds: result.data.assigneeIds,
      });
      return { ok: true };
    }

    const result = toggleReminderSchema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }
    await toggleReminder(request, result.data.reminderId);
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return data({ errors: mapApiErrors(error.errors) }, { status: error.status });
    }
    throw error;
  }
}

export default function Reminders({ loaderData }: Route.ComponentProps) {
  const { view, week, weeks, reminders, users, currentUserId } = loaderData;
  const [modalOpen, setModalOpen] = useState(false);
  const [prefillDueAt, setPrefillDueAt] = useState<string | undefined>(undefined);
  const fetcher = useFetcher<typeof action>();
  const errors = fetcher.data && "errors" in fetcher.data ? fetcher.data.errors : undefined;
  const titleErrors = errors && "title" in errors ? errors.title : undefined;
  const dueAtErrors = errors && "dueAt" in errors ? errors.dueAt : undefined;
  const assigneeErrors = errors && "assigneeIds" in errors ? errors.assigneeIds : undefined;

  function openAddModal(date?: Date) {
    setPrefillDueAt(date ? `${format(date, "yyyy-MM-dd")}T09:00` : undefined);
    setModalOpen(true);
  }

  const remindersByDay = new Map<string, Reminder[]>();
  for (const reminder of reminders) {
    const key = formatIsoDate(reminder.dueAt);
    const bucket = remindersByDay.get(key);
    if (bucket) bucket.push(reminder);
    else remindersByDay.set(key, [reminder]);
  }

  return (
    <div>
      <PageHeader
        title="Rappels"
        action={<Button onClick={() => openAddModal()}>+ Ajouter un rappel</Button>}
      />

      <div className="mb-4">
        <ViewToggle view={view} week={week} />
      </div>

      {view === "list" ? (
        <div className="flex max-w-[640px] flex-col gap-2.5">
          {reminders.length === 0 && <p className="text-sm text-muted">Aucun rappel.</p>}
          {reminders.map((reminder) => (
            <ReminderRow key={reminder.id} reminder={reminder} users={users} />
          ))}
        </div>
      ) : (
        <>
          <CalendarNavigator view={view} week={week} />
          <CalendarGrid
            weeks={weeks}
            monthAnchor={view === "month" ? week : undefined}
            remindersByDay={remindersByDay}
            users={users}
            onAddClick={openAddModal}
          />
        </>
      )}

      <Modal
        open={modalOpen}
        title="Ajouter un rappel"
        onClose={() => setModalOpen(false)}
        fetcher={fetcher}
        submitLabel="Ajouter"
      >
        <input type="hidden" name="intent" value="addReminder" />
        <Input label="Titre" name="title" required autoFocus />
        {titleErrors && (
          <p className="text-sm font-medium text-accent" role="alert">
            {titleErrors[0]}
          </p>
        )}
        <Input
          label="Date et heure"
          name="dueAt"
          type="datetime-local"
          required
          defaultValue={prefillDueAt}
        />
        {dueAtErrors && (
          <p className="text-sm font-medium text-accent" role="alert">
            {dueAtErrors[0]}
          </p>
        )}
        <div>
          <div className="mb-1 text-sm font-semibold text-muted">Pour qui ?</div>
          <div className="flex flex-col">
            {users.map((user) => (
              <Checkbox
                key={user.id}
                id={`assignee-${user.id}`}
                name="assigneeIds"
                value={user.id}
                label={user.name}
                defaultChecked={user.id === currentUserId}
              />
            ))}
          </div>
          {assigneeErrors && (
            <p className="text-sm font-medium text-accent" role="alert">
              {assigneeErrors[0]}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
