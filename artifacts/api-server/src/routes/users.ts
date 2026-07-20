import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, postsTable, followsTable, notificationsTable } from "@workspace/db";
import { eq, desc, and, not, isNull, inArray, sql } from "drizzle-orm";
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
    birthday: u.birthday ?? null,
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

// PATCH /api/users/me
router.patch("/me", requireAuth, async (req, res) => {
  const { displayName, username, bio, avatarUrl, bannerUrl, location, birthday, website, language } = req.body as {
    displayName?: string;
    username?: string;
    bio?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    location?: string;
    birthday?: string;
    website?: string;
    language?: string;
  };

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (displayName !== undefined) updates.displayName = displayName;
  if (username !== undefined) updates.username = username;
  if (bio !== undefined) updates.bio = bio || null;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl || null;
  if (bannerUrl !== undefined) updates.bannerUrl = bannerUrl || null;
  if (location !== undefined) updates.location = location || null;
  if (birthday !== undefined) updates.birthday = birthday || null;
  if (website !== undefined) updates.website = website || null;
  if (language !== undefined) updates.language = language;

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, req.userId!))
    .returning();

  res.json(formatUser(updated, req.userId));
});

// GET /api/users/recommended
router.get("/recommended", requireAuth, async (req, res) => {
  const following = await db
    .select({ followingId: followsTable.followingId })
    .from(followsTable)
    .where(eq(followsTable.followerId, req.userId!));

  const followingIds = following.map((f) => f.followingId);

  let query = db
    .select()
    .from(usersTable)
    .where(not(eq(usersTable.id, req.userId!)));

  if (followingIds.length > 0) {
    query = db
      .select()
      .from(usersTable)
      .where(and(not(eq(usersTable.id, req.userId!)), not(inArray(usersTable.id, followingIds)))) as typeof query;
  }

  const users = await (query as any).orderBy(desc(usersTable.followersCount)).limit(5);
  res.json(users.map((u: typeof usersTable.$inferSelect) => formatUser(u, req.userId)));
});

// GET /api/users/by-username/:username — resolve @mention to profile
router.get("/by-username/:username", optionalAuth, async (req, res) => {
  const { username } = req.params;
  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username!))
    .limit(1);

  if (users.length === 0) { res.status(404).json({ error: "Not found" }); return; }

  const u = users[0];
  let isFollowing: boolean | null = null;
  if (req.userId && req.userId !== u.id) {
    const follow = await db.select().from(followsTable).where(
      and(eq(followsTable.followerId, req.userId), eq(followsTable.followingId, u.id))
    ).limit(1);
    isFollowing = follow.length > 0;
  }

  res.json({ ...formatUser(u, req.userId), isFollowing });
});

// GET /api/users/:userId
router.get("/:userId", optionalAuth, async (req, res) => {
  const { userId } = req.params;
  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId!)).limit(1);
  if (users.length === 0) { res.status(404).json({ error: "Not found" }); return; }

  const u = users[0];
  let isFollowing: boolean | null = null;
  if (req.userId && req.userId !== userId) {
    const follow = await db.select().from(followsTable).where(
      and(eq(followsTable.followerId, req.userId), eq(followsTable.followingId, userId!))
    ).limit(1);
    isFollowing = follow.length > 0;
  }

  res.json({ ...formatUser(u, req.userId), isFollowing });
});

// GET /api/users/:userId/posts
router.get("/:userId/posts", optionalAuth, async (req, res) => {
  const { userId } = req.params;
  const posts = await db
    .select()
    .from(postsTable)
    .where(and(eq(postsTable.userId, userId!), isNull(postsTable.replyToId)))
    .orderBy(desc(postsTable.createdAt))
    .limit(50);

  const enriched = await enrichPosts(posts, req.userId);
  res.json(enriched);
});

// GET /api/users/:userId/followers
router.get("/:userId/followers", optionalAuth, async (req, res) => {
  const { userId } = req.params;
  const rows = await db.select().from(followsTable).where(eq(followsTable.followingId, userId!)).limit(50);
  const followerIds = rows.map((r) => r.followerId);
  if (followerIds.length === 0) { res.json([]); return; }
  const users = await db.select().from(usersTable).where(inArray(usersTable.id, followerIds));
  res.json(users.map((u) => formatUser(u, req.userId)));
});

// GET /api/users/:userId/following
router.get("/:userId/following", optionalAuth, async (req, res) => {
  const { userId } = req.params;
  const rows = await db.select().from(followsTable).where(eq(followsTable.followerId, userId!)).limit(50);
  const followingIds = rows.map((r) => r.followingId);
  if (followingIds.length === 0) { res.json([]); return; }
  const users = await db.select().from(usersTable).where(inArray(usersTable.id, followingIds));
  res.json(users.map((u) => formatUser(u, req.userId)));
});

// POST /api/users/:userId/follow - toggle follow
router.post("/:userId/follow", requireAuth, async (req, res) => {
  const { userId } = req.params;
  if (userId === req.userId) { res.status(400).json({ error: "Cannot follow yourself" }); return; }

  const existing = await db.select().from(followsTable).where(
    and(eq(followsTable.followerId, req.userId!), eq(followsTable.followingId, userId!))
  ).limit(1);

  if (existing.length > 0) {
    await db.delete(followsTable).where(
      and(eq(followsTable.followerId, req.userId!), eq(followsTable.followingId, userId!))
    );
    await db.execute(sql`UPDATE users SET following_count = GREATEST(following_count - 1, 0) WHERE id = ${req.userId}`);
    await db.execute(sql`UPDATE users SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = ${userId}`);
    res.json({ following: false });
  } else {
    await db.insert(followsTable).values({ followerId: req.userId!, followingId: userId! });
    await db.execute(sql`UPDATE users SET following_count = following_count + 1 WHERE id = ${req.userId}`);
    await db.execute(sql`UPDATE users SET followers_count = followers_count + 1 WHERE id = ${userId}`);
    await db.insert(notificationsTable).values({
      userId: userId!, type: "follow", actorId: req.userId!,
    }).onConflictDoNothing();
    res.json({ following: true });
  }
});

export default router;
