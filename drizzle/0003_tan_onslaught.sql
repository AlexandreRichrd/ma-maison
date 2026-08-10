ALTER TABLE "members" RENAME TO "users";--> statement-breakpoint
ALTER TABLE "chore_completions" RENAME COLUMN "member_id" TO "user_id";--> statement-breakpoint
ALTER TABLE "chore_completions" DROP CONSTRAINT "chore_completions_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "members_household_id_households_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "chore_completions" ADD CONSTRAINT "chore_completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");