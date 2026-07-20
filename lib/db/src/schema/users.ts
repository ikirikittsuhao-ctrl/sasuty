import { pgTable, text, integer, timestamp, date } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(), // Supabase user ID
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  bannerUrl: text("banner_url"),
  location: text("location"),
  birthday: date("birthday"),
  website: text("website"),
  language: text("language").default("ja").notNull(),
  imagePostDate: date("image_post_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  followersCount: integer("followers_count").default(0).notNull(),
  followingCount: integer("following_count").default(0).notNull(),
  postsCount: integer("posts_count").default(0).notNull(),
});

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
