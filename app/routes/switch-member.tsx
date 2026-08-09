import { data, redirect } from "react-router";

import { requireSession, setCurrentMemberId } from "~/lib/auth.server";
import { switchMemberSchema } from "~/lib/validation";

import type { Route } from "./+types/switch-member";

export async function action({ request }: Route.ActionArgs) {
  await requireSession(request);
  const formData = await request.formData();
  const result = switchMemberSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) {
    throw data("Requête invalide", { status: 400 });
  }
  const cookie = await setCurrentMemberId(request, result.data.memberId);
  return redirect("/", { headers: { "Set-Cookie": cookie } });
}

export async function loader() {
  throw redirect("/");
}
