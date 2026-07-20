import { Router } from "express";
import { db } from "@workspace/db";
import {
  postsTable, likesTable, usersTable, notificationsTable,
  hashtagsTable, repostsTable, followsTable,
} from "@workspace/db";
import { eq, desc, lt, and, sql, isNull, inArray, not } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../lib/auth";
import { enrichPosts, extractHashtags } from "../lib/postHelpers";

const router = Router();

// GET /api/posts - public timeline or filtered feed
// feed=forYou (default) — all posts except own
// feed=following — only followed users' posts, excluding own
router.get("/", optionalAuth, async (req, res) => {
  const limit = Math.min(Number(req.query["limit"]) || 20, 50);
  const cursor = req.query["cursor"] as string | undefined;
  const feed = (req.query["feed"] as string) || "forYou";

  // Base: top-level posts only (no replies)
  let conditions: any[] = [isNull(postsTable.replyToId)];

  if (cursor) {
    conditions.push(lt(postsTable.id, parseInt(cursor)));
  }

  // Exclude own posts when authenticated
  if (req.userId) {
    conditions.push(not(eq(postsTable.userId, req.userId)));
  }

  if (feed === "following" && req.userId) {
    const follows = await db
      .select({ followingId: followsTable.followingId })
      .from(followsTable)
      .where(eq(followsTable.followerId, req.userId));

    const followingIds = follows.map((f) => f.followingId);
    if (followingIds.length === 0) {
      res.json({ posts: [], hasMore: false, nextCursor: null });
      return;
    }
    conditions.push(inArray(postsTable.userId, followingIds));
  }

  const where = conditions.length === 1 ? conditions[0] : and(...conditions);

  const posts = await db
    .select()
    .from(postsTable)
    .where(where)
    .orderBy(desc(postsTable.createdAt))
    .limit(limit + 1);

  const hasMore = posts.length > limit;
  const sliced = hasMore ? posts.slice(0, limit) : posts;
  const enriched = await enrichPosts(sliced, req.userId);

  res.json({ posts: enriched, hasMore, nextCursor: hasMore ? String(sliced[sliced.length - 1].id) : null });
});

// POST /api/posts - create post
router.post("/", requireAuth, async (req, res) => {
  const { content, imageUrl, linkUrl, linkTitle, linkDescription } = req.body as {
    content: string;
    imageUrl?: string;
    linkUrl?: string;
    linkTitle?: string;
    linkDescription?: string;
  };

  if (!content || content.trim().length === 0 || content.length > 280) {
    res.status(400).json({ error: "Content must be 1-280 chars" });
    return;
  }

  // Daily image limit check
  if (imageUrl) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    const today = new Date().toISOString().slice(0, 10);
    if (user?.imagePostDate === today) {
      res.status(429).json({ error: "daily_image_limit", message: "You can only post one image per day" });
      return;
    }
    await db.execute(sql`UPDATE users SET image_post_date = ${today} WHERE id = ${req.userId}`);
  }

  const [post] = await db
    .insert(postsTable)
    .values({
      content: content.trim(),
      userId: req.userId!,
      imageUrl: imageUrl ?? null,
      linkUrl: linkUrl ?? null,
      linkTitle: linkTitle ?? null,
      linkDescription: linkDescription ?? null,
    })
    .returning();

  await db.execute(sql`UPDATE users SET posts_count = posts_count + 1 WHERE id = ${req.userId}`);

  const tags = extractHashtags(content);
  for (const tag of tags) {
    await db.execute(
      sql`INSERT INTO hashtags (tag, count, last_updated) VALUES (${tag}, 1, NOW())
          ON CONFLICT (tag) DO UPDATE SET count = hashtags.count + 1, last_updated = NOW()`
    );
  }

  const [enriched] = await enrichPosts([post], req.userId);
  res.status(201).json(enriched);
});

// GET /api/posts/:id
router.get("/:id", optionalAuth, async (req, res) => {
  const id = parseInt(req.params["id"] ?? "");
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const posts = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (posts.length === 0) { res.status(404).json({ error: "Not found" }); return; }

  const [enriched] = await enrichPosts(posts, req.userId);
  res.json(enriched);
});

// DELETE /api/posts/:id
router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"] ?? "");
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const posts = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (posts.length === 0) { res.status(404).json({ error: "Not found" }); return; }
  if (posts[0].userId !== req.userId) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.delete(postsTable).where(eq(postsTable.id, id));
  await db.execute(sql`UPDATE users SET posts_count = GREATEST(posts_count - 1, 0) WHERE id = ${req.userId}`);
  res.json({ ok: true });
});

// GET /api/posts/:id/replies
router.get("/:id/replies", optionalAuth, async (req, res) => {
  const id = parseInt(req.params["id"] ?? "");
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const replies = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.replyToId, id))
    .orderBy(desc(postsTable.createdAt))
    .limit(50);

  const enriched = await enrichPosts(replies, req.userId);
  res.json(enriched);
});

// POST /api/posts/:id/replies
router.post("/:id/replies", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"] ?? "");
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { content } = req.body as { content: string };
  if (!content || content.trim().length === 0 || content.length > 280) {
    res.status(400).json({ error: "Content must be 1-280 chars" });
    return;
  }

  const parent = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (parent.length === 0) { res.status(404).json({ error: "Not found" }); return; }

  const [reply] = await db
    .insert(postsTable)
    .values({ content: content.trim(), userId: req.userId!, replyToId: id })
    .returning();

  await db.execute(sql`UPDATE posts SET replies_count = replies_count + 1 WHERE id = ${id}`);

  if (parent[0].userId !== req.userId) {
    await db.insert(notificationsTable).values({
      userId: parent[0].userId, type: "reply", actorId: req.userId!, postId: id,
    }).onConflictDoNothing();
  }

  const [enriched] = await enrichPosts([reply], req.userId);
  res.status(201).json(enriched);
});

// POST /api/posts/:id/like - toggle like
router.post("/:id/like", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"] ?? "");
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const existing = await db.select().from(likesTable).where(
    and(eq(likesTable.userId, req.userId!), eq(likesTable.postId, id))
  ).limit(1);

  if (existing.length > 0) {
    await db.delete(likesTable).where(and(eq(likesTable.userId, req.userId!), eq(likesTable.postId, id)));
    await db.execute(sql`UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = ${id}`);
    const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
    res.json({ liked: false, likesCount: post?.likesCount ?? 0 });
  } else {
    await db.insert(likesTable).values({ userId: req.userId!, postId: id });
    await db.execute(sql`UPDATE posts SET likes_count = likes_count + 1 WHERE id = ${id}`);
    const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
    if (post && post.userId !== req.userId) {
      await db.insert(notificationsTable).values({
        userId: post.userId, type: "like", actorId: req.userId!, postId: id,
      }).onConflictDoNothing();
    }
    res.json({ liked: true, likesCount: post?.likesCount ?? 1 });
  }
});

// POST /api/posts/:id/repost - toggle repost
// Creates/deletes a post row with repostOfId so it appears in feeds
router.post("/:id/repost", requireAuth, async (req, res) => {
  const id = parseInt(req.params["id"] ?? "");
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [original] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
  if (!original) { res.status(404).json({ error: "Not found" }); return; }

  const existing = await db
    .select().from(repostsTable)
    .where(and(eq(repostsTable.userId, req.userId!), eq(repostsTable.postId, id)))
    .limit(1);

  if (existing.length > 0) {
    // Un-repost: remove from repostsTable and delete the repost post row
    await db.delete(repostsTable).where(and(eq(repostsTable.userId, req.userId!), eq(repostsTable.postId, id)));
    await db.delete(postsTable).where(and(eq(postsTable.userId, req.userId!), eq(postsTable.repostOfId, id)));
    await db.execute(sql`UPDATE posts SET reposts_count = GREATEST(reposts_count - 1, 0) WHERE id = ${id}`);
    const [updated] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
    res.json({ reposted: false, repostsCount: updated?.repostsCount ?? 0 });
  } else {
    // Repost: insert into repostsTable + create a repost post row
    await db.insert(repostsTable).values({ userId: req.userId!, postId: id });
    await db.insert(postsTable).values({
      userId: req.userId!,
      content: original.content,   // copy content for text-search convenience
      repostOfId: id,
    });
    await db.execute(sql`UPDATE posts SET reposts_count = reposts_count + 1 WHERE id = ${id}`);
    if (original.userId !== req.userId) {
      await db.insert(notificationsTable).values({
        userId: original.userId, type: "repost", actorId: req.userId!, postId: id,
      }).onConflictDoNothing();
    }
    const [updated] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
    res.json({ reposted: true, repostsCount: updated?.repostsCount ?? 1 });
  }
});

// POST /api/posts/:id/view - increment view count
router.post("/:id/view", optionalAuth, async (req, res) => {
  const id = parseInt(req.params["id"] ?? "");
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.execute(sql`UPDATE posts SET views_count = views_count + 1 WHERE id = ${id}`);
  res.json({ ok: true });
});

export default router;
