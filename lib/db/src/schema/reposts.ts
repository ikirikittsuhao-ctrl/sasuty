import { pgTable, text, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { postsTable } from "./posts";

export const repostsTable = pgTable(
  "reposts",
  {
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    postId: integer("post_id").notNull().references(() => postsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.postId] })]
);

export type Repost = typeof repostsTable.$inferSelect;
