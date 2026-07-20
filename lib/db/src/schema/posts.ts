import { pgTable, text, integer, timestamp, serial } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const postsTable = pgTable("posts", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  replyToId: integer("reply_to_id"),
  repostOfId: integer("repost_of_id"),
  imageUrl: text("image_url"),
  linkUrl: text("link_url"),
  linkTitle: text("link_title"),
  linkDescription: text("link_description"),
  viewsCount: integer("views_count").default(0).notNull(),
  likesCount: integer("likes_count").default(0).notNull(),
  repliesCount: integer("replies_count").default(0).notNull(),
  repostsCount: integer("reposts_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Post = typeof postsTable.$inferSelect;
export type InsertPost = typeof postsTable.$inferInsert;
