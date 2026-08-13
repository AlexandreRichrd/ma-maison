import { useState } from "react";
import { data, useFetcher } from "react-router";

import { PageHeader } from "~/components/layout/PageHeader";
import { ReminderRow } from "~/components/reminders/ReminderRow";
import { Button, Checkbox, Input, Modal } from "~/components/ui";
import { getOrderedUsers } from "~/db/queries/household.server";
import { ApiRequestError, mapApiErrors } from "~/lib/api.server";
import { requireUser } from "~/lib/auth.server";
import { createReminder, getReminders, toggleReminder } from "~/lib/reminders-api.server";
import { addReminderSchema, toggleReminderSchema } from "~/lib/validation";

import type { Route } from "./+types/reminders";

export function meta() {
  return [{ title: "Rappels · Hearth" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const currentUser = await requireUser(request);
  const [reminders, users] = await Promise.all([
    getReminders(request),
    getOrderedUsers(),
  ]);
  return { reminders, users, currentUserId: currentUser.id };
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
  const { users, currentUserId } = loaderData;
  const [modalOpen, setModalOpen] = useState(false);
  const fetcher = useFetcher<typeof action>();
  const errors = fetcher.data && "errors" in fetcher.data ? fetcher.data.errors : undefined;
  const titleErrors = errors && "title" in errors ? errors.title : undefined;
  const dueAtErrors = errors && "dueAt" in errors ? errors.dueAt : undefined;
  const assigneeErrors = errors && "assigneeIds" in errors ? errors.assigneeIds : undefined;

  return (
    <div>
      <PageHeader
        title="Rappels"
        action={<Button onClick={() => setModalOpen(true)}>+ Ajouter un rappel</Button>}
      />
      <div className="flex max-w-[640px] flex-col gap-2.5">
        {loaderData.reminders.map((reminder) => (
          <ReminderRow key={reminder.id} reminder={reminder} users={users} />
        ))}
      </div>

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
        <Input label="Date et heure" name="dueAt" type="datetime-local" required />
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
