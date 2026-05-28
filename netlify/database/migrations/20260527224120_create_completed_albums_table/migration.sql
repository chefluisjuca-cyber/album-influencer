CREATE TABLE "completed_albums" (
	"user_id" text PRIMARY KEY,
	"completed_at" timestamp DEFAULT now()
);
