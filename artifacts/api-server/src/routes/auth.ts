import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// POST /api/auth/sync - create or update user in local DB after Supabase login
router.post("/sync", async (req, res) => {
  const { id, email, username, displayName, avatarUrl } = req.body as {
    id: string;
    email: string;
    username?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
  };

  if (!id || !email) {
    res.status(400).json({ error: "id and email required" });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);

  if (existing.length > 0) {
    // Update existing user
    const [updated] = await db
      .update(usersTable)
      .set({
        displayName: displayName ?? existing[0].displayName,
        avatarUrl: avatarUrl ?? existing[0].avatarUrl,
      })
      .where(eq(usersTable.id, id))
      .returning();

    res.json({
      id: updated.id,
      username: updated.username,
      displayName: updated.displayName,
      bio: updated.bio ?? null,
      avatarUrl: updated.avatarUrl ?? null,
      bannerUrl: updated.bannerUrl ?? null,
      createdAt: updated.createdAt.toISOString(),
      followersCount: updated.followersCount,
      followingCount: updated.followingCount,
      postsCount: updated.postsCount,
      isFollowing: null,
      isMe: true,
    });
    return;
  }

  // Generate username from email or provided username
  const base = username ?? email.split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase();
  let finalUsername = base;

  // Ensure uniqueness
  const exists = await db.select().from(usersTable).where(eq(usersTable.username, finalUsername)).limit(1);
  if (exists.length > 0) {
    finalUsername = `${base}${Date.now().toString().slice(-4)}`;
  }

  const [created] = await db
    .insert(usersTable)
    .values({
      id,
      username: finalUsername,
      displayName: displayName ?? finalUsername,
      avatarUrl: avatarUrl ?? null,
    })
    .returning();

  res.json({
    id: created.id,
    username: created.username,
    displayName: created.displayName,
    bio: created.bio ?? null,
    avatarUrl: created.avatarUrl ?? null,
    bannerUrl: created.bannerUrl ?? null,
    createdAt: created.createdAt.toISOString(),
    followersCount: created.followersCount,
    followingCount: created.followingCount,
    postsCount: created.postsCount,
    isFollowing: null,
    isMe: true,
  });
});

export default router;
