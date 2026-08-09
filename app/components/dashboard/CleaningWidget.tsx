import { Link } from "react-router";

import { Card } from "~/components/ui";
import type { MemberWeekChores } from "~/db/queries/cleaning.server";

const AVATAR_COLORS = ["bg-avatar-1", "bg-avatar-2"];

export function CleaningWidget({ weekChores }: { weekChores: MemberWeekChores[] }) {
  return (
    <Card>
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold">Ménage — par personne</h2>
        <Link to="/cleaning" className="text-sm font-semibold">
          Tout voir →
        </Link>
      </div>
      <div className="flex flex-col gap-2.5">
        {weekChores.map(({ member, chores }, index) => (
          <div key={member.id}>
            <div className="mb-1.5 flex items-center gap-2">
              <div
                className={`flex size-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-accent-foreground ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
              >
                {member.name.charAt(0)}
              </div>
              <span className="text-sm font-semibold">{member.name}</span>
            </div>
            {chores.map((chore) => (
              <div key={chore.id} className="py-1.5 pr-2.5 pl-[30px] text-sm font-medium">
                {chore.name}
              </div>
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}
