import { Form } from "react-router";

import type { Member } from "~/db/schema";
import { AVATAR_COLORS } from "~/lib/member-colors";

export function HouseholdFooter({ members }: { members: Member[] }) {
  return (
    <div className="mt-auto flex flex-col gap-2.5">
      <div className="px-2 text-xs font-semibold tracking-wide text-muted uppercase">
        Foyer
      </div>
      {members.map((member, index) => (
        <div key={member.id} className="flex items-center gap-2.5 px-2 py-1.5">
          <div
            className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-accent-foreground ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
          >
            {member.name.charAt(0)}
          </div>
          <div className="text-sm font-medium">{member.name}</div>
        </div>
      ))}
      <Form method="post" action="/logout" className="px-2 pt-1">
        <button type="submit" className="text-xs font-semibold text-muted hover:text-foreground">
          Déconnexion
        </button>
      </Form>
    </div>
  );
}
