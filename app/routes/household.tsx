import { useState } from "react";
import { data, useFetcher } from "react-router";

import { ChoresSection } from "~/components/household/ChoresSection";
import { PageHeader } from "~/components/layout/PageHeader";
import { Button, Card, Input, Modal } from "~/components/ui";
import { ApiRequestError, mapApiErrors } from "~/lib/api.server";
import { requireUser } from "~/lib/auth.server";
import { createChore, deleteChore, getChoreConfigs, updateChore } from "~/lib/chores-api.server";
import { createInvite, getOrderedUsers } from "~/lib/household-api.server";
import { AVATAR_COLORS } from "~/lib/user-colors";
import {
  addChoreSchema,
  deleteChoreSchema,
  editChoreSchema,
  inviteSchema,
} from "~/lib/validation";

import type { Route } from "./+types/household";

export function meta() {
  return [{ title: "Foyer · Hearth" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  const [users, chores] = await Promise.all([
    getOrderedUsers(request),
    getChoreConfigs(request),
  ]);
  return { users, chores };
}

export async function action({ request }: Route.ActionArgs) {
  await requireUser(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "addChore") {
      const result = addChoreSchema.safeParse(Object.fromEntries(formData));
      if (!result.success) {
        return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
      }
      await createChore(request, result.data);
      return { ok: true };
    }

    if (intent === "editChore") {
      const result = editChoreSchema.safeParse(Object.fromEntries(formData));
      if (!result.success) {
        return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
      }
      await updateChore(request, result.data.choreId, result.data);
      return { ok: true };
    }

    if (intent === "deleteChore") {
      const result = deleteChoreSchema.safeParse(Object.fromEntries(formData));
      if (!result.success) {
        return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
      }
      await deleteChore(request, result.data.choreId);
      return { ok: true };
    }

    const result = inviteSchema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
    }
    // The API creates the invite unconditionally — an "email already has
    // an account" check happens at registration time instead (see
    // my-home-backend/CLAUDE.md), not here.
    await createInvite(request, result.data.email.toLowerCase());
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiRequestError) {
      return data({ errors: mapApiErrors(error.errors) }, { status: error.status });
    }
    throw error;
  }
}

export default function Household({ loaderData }: Route.ComponentProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const fetcher = useFetcher<typeof action>();
  const errors = fetcher.data && "errors" in fetcher.data ? fetcher.data.errors : undefined;
  const emailErrors = errors && "email" in errors ? errors.email : undefined;

  return (
    <div>
      <PageHeader
        title="Foyer"
        action={<Button onClick={() => setModalOpen(true)}>+ Inviter un membre</Button>}
      />
      <div className="flex max-w-[560px] flex-col gap-2.5">
        {loaderData.users.map((user, index) => (
          <Card key={user.id} className="flex items-center gap-3.5 p-4.5">
            <div
              className={`flex size-[38px] shrink-0 items-center justify-center rounded-full text-[15px] font-semibold text-accent-foreground ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
            >
              {user.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-semibold">{user.name}</div>
              <div className="text-sm font-medium text-muted">{user.role}</div>
            </div>
            {/* Static placeholder — intentionally not wired, per CLAUDE.md. */}
            <Button variant="secondary" disabled>
              Modifier
            </Button>
          </Card>
        ))}
      </div>

      <Modal
        open={modalOpen}
        title="Inviter un membre"
        onClose={() => setModalOpen(false)}
        fetcher={fetcher}
        submitLabel="Envoyer l'invitation"
      >
        <input type="hidden" name="intent" value="invite" />
        <Input label="Email" name="email" type="email" autoComplete="email" autoFocus required />
        {emailErrors && (
          <p className="text-sm font-medium text-accent" role="alert">
            {emailErrors[0]}
          </p>
        )}
      </Modal>

      <ChoresSection chores={loaderData.chores} users={loaderData.users} />
    </div>
  );
}
