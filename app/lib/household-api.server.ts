import { apiFetch } from "./api.server";
import { getAccessToken } from "./auth.server";

/**
 * Narrower than the API's PublicUser (which also carries email,
 * householdId, emailVerifiedAt, timestamps) — this app's UI only needs
 * these five fields, four of them the same shape the old Drizzle query
 * returned. receiveClimateAlerts backs the personal-preferences checkbox
 * on /settings (issue #12; originally issue #11's Household card).
 */
export type HouseholdMember = {
  id: string;
  name: string;
  avatarKey: string;
  receiveClimateAlerts: boolean;
};

type PublicUserDto = HouseholdMember & {
  email: string;
  householdId: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type HouseholdMeResponse = {
  users: PublicUserDto[];
  memberOrder: string[];
};

/** Users in households.member_order order — stable, so rotation/ordering never scrambles. */
export async function getOrderedUsers(request: Request): Promise<HouseholdMember[]> {
  const accessToken = await getAccessToken(request);
  const { users, memberOrder } = await apiFetch<HouseholdMeResponse>("/households/me", {
    accessToken,
  });
  const byId = new Map(users.map((user) => [user.id, user]));

  return memberOrder
    .map((id) => byId.get(id))
    .filter((user): user is PublicUserDto => user != null)
    .map(({ id, name, avatarKey, receiveClimateAlerts }) => ({
      id,
      name,
      avatarKey,
      receiveClimateAlerts,
    }));
}

export async function createInvite(request: Request, email: string): Promise<void> {
  const accessToken = await getAccessToken(request);
  await apiFetch("/invites", {
    method: "POST",
    accessToken,
    body: { email },
  });
}

export async function updateMemberNotificationPreference(
  request: Request,
  userId: string,
  receiveClimateAlerts: boolean,
): Promise<void> {
  const accessToken = await getAccessToken(request);
  await apiFetch(`/households/me/members/${userId}/notification-preferences`, {
    method: "PATCH",
    accessToken,
    body: { receiveClimateAlerts },
  });
}

// Must be exactly a permutation of the household's current members — the
// API rejects anything partial or malformed (invalid_member_order), see
// my-home-backend/CLAUDE.md's Households section.
export async function updateMemberOrder(
  request: Request,
  memberOrder: string[],
): Promise<void> {
  const accessToken = await getAccessToken(request);
  await apiFetch("/households/me/member-order", {
    method: "PATCH",
    accessToken,
    body: { memberOrder },
  });
}
