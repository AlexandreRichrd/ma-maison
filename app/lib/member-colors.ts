export const AVATAR_COLORS = ["bg-avatar-1", "bg-avatar-2"];

/** Same color a member's avatar uses elsewhere, looked up by position in the ordered member list. */
export function avatarColorFor(
  members: { id: string }[],
  memberId: string | null | undefined,
): string | undefined {
  if (!memberId) return undefined;
  const index = members.findIndex((member) => member.id === memberId);
  if (index === -1) return undefined;
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}
