import { db } from "@workspace/db";
import { usersTable, likesTable, repostsTable, postsTable } from "@workspace/db";
import { inArray, and, eq } from "drizzle-orm";
import type { Post } from "@workspace/db";

export function extractHashtags(content: string): string[] {
  const matches = content.match(/#([a-zA-Z0-9_\u3041-\u9fff]+)/g) ?? [];
  return [...new Set(matches.map((m) => m.toLowerCase()))];
}

function buildUserObject(user: typeof usersTable.$inferSelect | undefined, userId: string) {
  if (!user) {
    return {
      id: userId,
      username: "unknown",
      displayName: "Unknown",
      bio: null,
      avatarUrl: null,
      bannerUrl: null,
      location: null,
      website: null,
      language: "ja",
      createdAt: new Date().toISOString(),
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      isFollowing: null,
      isMe: null,
    };
  }
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio ?? null,
    avatarUrl: user.avatarUrl ?? null,
    bannerUrl: user.bannerUrl ?? null,
    location: user.location ?? null,
    website: user.website ?? null,
    language: user.language,
    createdAt: user.createdAt.toISOString(),
    followersCount: user.followersCount,
    followingCount: user.followingCount,
    postsCount: user.postsCount,
    isFollowing: null,
    isMe: null,
  };
}

export async function enrichPosts(
  posts: Post[],
  requestingUserId?: string
) {
  if (posts.length === 0) return [];

  // Collect all user IDs (post authors + original post authors for reposts)
  const directUserIds = [...new Set(posts.map((p) => p.userId))];
  const repostOfIds = posts.map((p) => p.repostOfId).filter(Boolean) as number[];

  // Load original posts if any reposts
  let originalPostMap = new Map<number, Post>();
  if (repostOfIds.length > 0) {
    const originals = await db.select().from(postsTable).where(inArray(postsTable.id, repostOfIds));
    for (const op of originals) {
      originalPostMap.set(op.id, op);
    }
  }

  const originalUserIds = [...originalPostMap.values()].map((p) => p.userId);
  const allUserIds = [...new Set([...directUserIds, ...originalUserIds])];

  const users = await db.select().from(usersTable).where(inArray(usersTable.id, allUserIds));
  const userMap = new Map(users.map((u) => [u.id, u]));

  let likedPostIds = new Set<number>();
  let repostedPostIds = new Set<number>();

  if (requestingUserId) {
    const allPostIds = [
      ...posts.map((p) => p.id),
      ...repostOfIds,
    ];
    const [likes, reposts] = await Promise.all([
      db.select().from(likesTable).where(
        and(eq(likesTable.userId, requestingUserId), inArray(likesTable.postId, allPostIds))
      ),
      db.select().from(repostsTable).where(
        and(eq(repostsTable.userId, requestingUserId), inArray(repostsTable.postId, allPostIds))
      ),
    ]);
    likedPostIds = new Set(likes.map((l) => l.postId));
    repostedPostIds = new Set(reposts.map((r) => r.postId));
  }

  function buildPost(post: Post, includeRepostOf = true) {
    const user = userMap.get(post.userId);
    const repostOf = includeRepostOf && post.repostOfId
      ? buildPost(originalPostMap.get(post.repostOfId)!, false)
      : null;

    return {
      id: post.id,
      content: post.content,
      userId: post.userId,
      replyToId: post.replyToId ?? null,
      repostOfId: post.repostOfId ?? null,
      repostOf: repostOf ?? null,
      imageUrl: post.imageUrl ?? null,
      linkUrl: post.linkUrl ?? null,
      linkTitle: post.linkTitle ?? null,
      linkDescription: post.linkDescription ?? null,
      viewsCount: post.viewsCount,
      likesCount: post.likesCount,
      repliesCount: post.repliesCount,
      repostsCount: post.repostsCount,
      createdAt: post.createdAt.toISOString(),
      hashtags: extractHashtags(post.content),
      isLiked: requestingUserId ? likedPostIds.has(post.id) : null,
      isReposted: requestingUserId ? repostedPostIds.has(post.repostOfId ?? post.id) : null,
      replyToPost: null,
      user: buildUserObject(user, post.userId),
    };
  }

  return posts.map((post) => buildPost(post));
}
