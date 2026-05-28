import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const completedAlbums = pgTable("completed_albums", {
  userId: text("user_id").primaryKey(),
  completedAt: timestamp("completed_at").defaultNow(),
});
