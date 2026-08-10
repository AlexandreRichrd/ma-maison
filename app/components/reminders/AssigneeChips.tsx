import type { Member } from "~/db/schema";
import { avatarColorFor } from "~/lib/member-colors";

export function AssigneeChips({
  assigneeIds,
  members,
}: {
  assigneeIds: string[];
  members: Member[];
}) {
  return (
    <>
      {assigneeIds.map((memberId) => {
        const assignee = members.find((member) => member.id === memberId);
        if (!assignee) return null;
        return (
          <span
            key={memberId}
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold text-accent-foreground ${avatarColorFor(members, memberId)}`}
          >
            {assignee.name}
          </span>
        );
      })}
    </>
  );
}
