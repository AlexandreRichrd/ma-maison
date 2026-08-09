import { redirect } from "react-router";

import { destroySession } from "~/lib/auth.server";

import type { Route } from "./+types/logout";

export async function action({ request }: Route.ActionArgs) {
  return destroySession(request);
}

export async function loader() {
  throw redirect("/");
}
