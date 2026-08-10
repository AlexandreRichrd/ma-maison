export const AVATAR_COLORS = ["bg-avatar-1", "bg-avatar-2"];

/** Same color a user's avatar uses elsewhere, looked up by position in the ordered user list. */
export function avatarColorFor(
  users: { id: string }[],
  userId: string | null | undefined,
): string | undefined {
  if (!userId) return undefined;
  const index = users.findIndex((user) => user.id === userId);
  if (index === -1) return undefined;
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}
