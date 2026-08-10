import { PageHeader } from "~/components/layout/PageHeader";
import { Button, Card } from "~/components/ui";
import { getOrderedUsers } from "~/db/queries/household.server";
import { AVATAR_COLORS } from "~/lib/user-colors";

import type { Route } from "./+types/household";

export function meta() {
  return [{ title: "Foyer · Hearth" }];
}

export async function loader() {
  const users = await getOrderedUsers();
  return { users };
}

export default function Household({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <PageHeader
        title="Foyer"
        // Static placeholder — intentionally not wired, per CLAUDE.md.
        action={<Button disabled>+ Inviter un membre</Button>}
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
    </div>
  );
}
