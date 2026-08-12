import { useState } from "react";
import { data, useFetcher } from "react-router";

import { PageHeader } from "~/components/layout/PageHeader";
import { Button, Card, Input, Modal } from "~/components/ui";
import { createInvite } from "~/db/queries/invites.server";
import { getOrderedUsers } from "~/db/queries/household.server";
import { getUserByEmail } from "~/db/queries/users.server";
import { requireUser } from "~/lib/auth.server";
import { sendInviteEmail } from "~/lib/mail.server";
import { AVATAR_COLORS } from "~/lib/user-colors";
import { inviteSchema } from "~/lib/validation";

import type { Route } from "./+types/household";

export function meta() {
  return [{ title: "Foyer · Hearth" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const currentUser = await requireUser(request);
  const users = await getOrderedUsers();
  return { users, householdId: currentUser.householdId };
}

export async function action({ request }: Route.ActionArgs) {
  const currentUser = await requireUser(request);
  const formData = await request.formData();
  const result = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
  }

  const normalizedEmail = result.data.email.toLowerCase();
  const existing = await getUserByEmail(normalizedEmail);
  if (existing) {
    return data(
      { errors: { email: ["Cette adresse a déjà un compte"] } },
      { status: 400 },
    );
  }

  const invite = await createInvite({
    householdId: currentUser.householdId,
    invitedByUserId: currentUser.id,
    email: normalizedEmail,
  });
  await sendInviteEmail(normalizedEmail, invite.token);

  return { ok: true };
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
    </div>
  );
}
