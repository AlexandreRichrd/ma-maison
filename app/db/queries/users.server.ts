import { eq } from "drizzle-orm";

import { db } from "~/db/index.server";
import { users, type User } from "~/db/schema";

export async function getUserById(id: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}
