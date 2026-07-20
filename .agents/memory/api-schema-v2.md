---
name: API schema v2
description: DB schema additions made in the v2 feature expansion
---

**Users table additions:** location (text), birthday (date), website (text), language (text default 'ja'), imagePostDate (date — date of last image post for daily limit).

**Posts table additions:** imageUrl (text), viewsCount (integer default 0), linkUrl (text), linkTitle (text), linkDescription (text), repostOfId (integer).

**New table:** reposts (userId + postId composite PK) — tracks who reposted what. Separate from the `repostOfId` field on posts.

**API changes:**
- `POST /api/posts/:id/repost` — toggle repost, updates repostsCount, creates notification
- `POST /api/posts/:id/view` — increments viewsCount
- `GET /api/users/recommended` — users not followed by current user, ordered by followersCount
- `POST /api/posts` body no longer accepts `replyToId` (use `POST /api/posts/:id/replies` instead)
- Replies do NOT increment postsCount on users table

**Frontend rule:** ComposePost inline uses `useCreateReply` when replyToId is set. ComposeModal only creates top-level posts (no replyToId). PostCard reply button toggles an inline reply box using `useCreateReply`.
