import { Router } from "express";
import { db } from "@workspace/db";
import { postsTable, hashtagsTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, desc, inArray, ilike, or, sql } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../lib/auth";
import { enrichPosts } from "../lib/postHelpers";

const router = Router();

function formatUser(u: typeof usersTable.$inferSelect, requestingUserId?: string) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    bio: u.bio ?? null,
    avatarUrl: u.avatarUrl ?? null,
    bannerUrl: u.bannerUrl ?? null,
    location: u.location ?? null,
    website: u.website ?? null,
    language: u.language,
    createdAt: u.createdAt.toISOString(),
    followersCount: u.followersCount,
    followingCount: u.followingCount,
    postsCount: u.postsCount,
    isFollowing: null as boolean | null,
    isMe: requestingUserId ? u.id === requestingUserId : null,
  };
}

// GET /api/trending
router.get("/trending", optionalAuth, async (req, res) => {
  const hashtags = await db
    .select()
    .from(hashtagsTable)
    .orderBy(desc(hashtagsTable.count))
    .limit(10);

  const hotPosts = await db
    .select()
    .from(postsTable)
    .orderBy(desc(postsTable.likesCount))
    .limit(5);

  const enrichedPosts = await enrichPosts(hotPosts, req.userId);

  res.json({
    hashtags: hashtags.map((h) => ({ tag: h.tag, count: h.count })),
    posts: enrichedPosts,
  });
});

// GET /api/search?q=&type=
// Supports: plain keyword, #hashtag (post search by tag), @username (user search)
router.get("/search", optionalAuth, async (req, res) => {
  const rawQ = (req.query["q"] as string) || "";
  const type = (req.query["type"] as string) || "all";

  if (!rawQ.trim()) {
    res.json({ posts: [], users: [] });
    return;
  }

  // Detect special query types
  const isHashtag = rawQ.startsWith("#");
  const isMention = rawQ.startsWith("@");

  let posts: Awaited<ReturnType<typeof enrichPosts>> = [];
  let users: ReturnType<typeof formatUser>[] = [];

  if (isMention) {
    // @mention — search users by username
    const term = rawQ.slice(1); // strip @
    const rawUsers = await db
      .select()
      .from(usersTable)
      .where(or(ilike(usersTable.username, `%${term}%`), ilike(usersTable.displayName, `%${term}%`)))
      .limit(20);
    users = rawUsers.map((u) => formatUser(u, req.userId));
  } else if (isHashtag) {
    // #hashtag — search posts containing the tag
    const tag = rawQ.toLowerCase();
    const rawPosts = await db
      .select()
      .from(postsTable)
      .where(ilike(postsTable.content, `%${tag}%`))
      .orderBy(desc(postsTable.createdAt))
      .limit(30);
    posts = await enrichPosts(rawPosts, req.userId);
  } else {
    // Plain keyword — search both
    const pattern = `%${rawQ}%`;
    if (type === "all" || type === "posts") {
      const rawPosts = await db
        .select()
        .from(postsTable)
        .where(ilike(postsTable.content, pattern))
        .orderBy(desc(postsTable.createdAt))
        .limit(20);
      posts = await enrichPosts(rawPosts, req.userId);
    }
    if (type === "all" || type === "users") {
      const rawUsers = await db
        .select()
        .from(usersTable)
        .where(or(ilike(usersTable.username, pattern), ilike(usersTable.displayName, pattern)))
        .limit(20);
      users = rawUsers.map((u) => formatUser(u, req.userId));
    }
  }

  res.json({ posts, users });
});

// GET /api/notifications
router.get("/notifications", requireAuth, async (req, res) => {
  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, req.userId!))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);

  const actorIds = [...new Set(notifications.map((n) => n.actorId).filter(Boolean))] as string[];
  let actorMap = new Map<string, ReturnType<typeof formatUser>>();

  if (actorIds.length > 0) {
    const actors = await db.select().from(usersTable).where(inArray(usersTable.id, actorIds));
    actorMap = new Map(actors.map((a) => [a.id, formatUser(a)]));
  }

  // Load post previews for notifications that have postId
  const postIds = [...new Set(notifications.map((n) => n.postId).filter(Boolean))] as number[];
  const postMap = new Map<number, { id: number; content: string }>();
  if (postIds.length > 0) {
    const posts = await db
      .select({ id: postsTable.id, content: postsTable.content })
      .from(postsTable)
      .where(inArray(postsTable.id, postIds));
    for (const p of posts) postMap.set(p.id, p);
  }

  res.json(
    notifications.map((n) => ({
      id: n.id,
      type: n.type,
      actorId: n.actorId ?? null,
      actor: n.actorId ? (actorMap.get(n.actorId) ?? null) : null,
      postId: n.postId ?? null,
      post: n.postId ? (postMap.get(n.postId) ?? null) : null,
      createdAt: n.createdAt.toISOString(),
      isRead: n.isRead,
    }))
  );
});

// POST /api/notifications/read
router.post("/notifications/read", requireAuth, async (req, res) => {
  await db.execute(sql`UPDATE notifications SET is_read = true WHERE user_id = ${req.userId}`);
  res.json({ status: "ok" });
});

export default router;
