import { PageHeader } from "~/components/layout/PageHeader";
import { Button, Card } from "~/components/ui";
import { getOrderedMembers } from "~/db/queries/household.server";
import { AVATAR_COLORS } from "~/lib/member-colors";

import type { Route } from "./+types/household";

export function meta() {
  return [{ title: "Foyer · Hearth" }];
}

export async function loader() {
  const members = await getOrderedMembers();
  return { members };
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
        {loaderData.members.map((member, index) => (
          <Card key={member.id} className="flex items-center gap-3.5 p-4.5">
            <div
              className={`flex size-[38px] shrink-0 items-center justify-center rounded-full text-[15px] font-semibold text-accent-foreground ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
            >
              {member.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-semibold">{member.name}</div>
              <div className="text-sm font-medium text-muted">{member.role}</div>
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
