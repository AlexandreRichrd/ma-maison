import { useState } from "react";
import { data, useFetcher } from "react-router";

import { PageHeader } from "~/components/layout/PageHeader";
import { ReminderRow } from "~/components/reminders/ReminderRow";
import { Button, Input, Modal } from "~/components/ui";
import { createReminder, getReminders, toggleReminder } from "~/db/queries/reminders.server";
import { addReminderSchema, toggleReminderSchema } from "~/lib/validation";

import type { Route } from "./+types/reminders";

export function meta() {
  return [{ title: "Rappels · Hearth" }];
}

export async function loader() {
  const reminders = await getReminders();
  return { reminders };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "addReminder") {
    const result = addReminderSchema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }
    await createReminder({
      title: result.data.title,
      dueAt: new Date(result.data.dueAt),
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
  const [modalOpen, setModalOpen] = useState(false);
  const fetcher = useFetcher<typeof action>();
  const errors = fetcher.data && "errors" in fetcher.data ? fetcher.data.errors : undefined;
  const titleErrors = errors && "title" in errors ? errors.title : undefined;
  const dueAtErrors = errors && "dueAt" in errors ? errors.dueAt : undefined;

  return (
    <div>
      <PageHeader
        title="Rappels"
        action={<Button onClick={() => setModalOpen(true)}>+ Ajouter un rappel</Button>}
      />
      <div className="flex max-w-[640px] flex-col gap-2.5">
        {loaderData.reminders.map((reminder) => (
          <ReminderRow key={reminder.id} reminder={reminder} />
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
      </Modal>
    </div>
  );
}
