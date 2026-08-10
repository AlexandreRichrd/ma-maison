ALTER TABLE "reminders" DROP CONSTRAINT "reminders_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "reminders" ADD COLUMN "assignee_ids" uuid[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "reminders" DROP COLUMN "member_id";