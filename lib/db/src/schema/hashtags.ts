import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const hashtagsTable = pgTable("hashtags", {
  tag: text("tag").primaryKey(),
  count: integer("count").default(1).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export type Hashtag = typeof hashtagsTable.$inferSelect;
