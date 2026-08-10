import { useState } from "react";
import { data, useFetcher } from "react-router";

import { PageHeader } from "~/components/layout/PageHeader";
import { ReminderRow } from "~/components/reminders/ReminderRow";
import { Button, Checkbox, Input, Modal } from "~/components/ui";
import { createReminder, getReminders, toggleReminder } from "~/db/queries/reminders.server";
import { getOrderedMembers } from "~/db/queries/household.server";
import { getCurrentMemberId } from "~/lib/auth.server";
import { addReminderSchema, toggleReminderSchema } from "~/lib/validation";

import type { Route } from "./+types/reminders";

export function meta() {
  return [{ title: "Rappels · Hearth" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const [reminders, members, currentMemberId] = await Promise.all([
    getReminders(),
    getOrderedMembers(),
    getCurrentMemberId(request),
  ]);
  return { reminders, members, currentMemberId };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

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
    await createReminder({
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
  await toggleReminder(result.data.reminderId);
  return { ok: true };
}

export default function Reminders({ loaderData }: Route.ComponentProps) {
  const { members, currentMemberId } = loaderData;
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
          <ReminderRow key={reminder.id} reminder={reminder} members={members} />
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
            {members.map((member) => (
              <Checkbox
                key={member.id}
                id={`assignee-${member.id}`}
                name="assigneeIds"
                value={member.id}
                label={member.name}
                defaultChecked={member.id === currentMemberId || currentMemberId == null}
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
