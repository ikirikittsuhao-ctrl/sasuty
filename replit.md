# Sasuty

X(Twitter)ライクなSNSアプリ。Supabase認証 + Replit PostgreSQL + React/Vite + Express で構築。

## Run & Operate

- `pnpm --filter @workspace/sasuty run dev` — フロントエンド (port 24434, preview path /)
- `pnpm --filter @workspace/api-server run dev` — APIサーバー (port 8080, preview path /api)
- `pnpm run typecheck` — 全パッケージのTypeチェック
- `pnpm --filter @workspace/api-spec run codegen` — OpenAPI→フック/Zodスキーマ再生成
- `pnpm --filter @workspace/db run push` — DBスキーマをプッシュ (開発のみ)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- フロントエンド: React 18 + Vite + Tailwind CSS v4 + wouter + TanStack Query
- バックエンド: Express 5
- 認証: Supabase Auth (anon key on frontend, service role key on backend)
- DB: Replit PostgreSQL + Drizzle ORM
- バリデーション: Zod + drizzle-zod
- APIコード生成: Orval (from OpenAPI spec)

## Where things live

- `artifacts/sasuty/` — Reactフロントエンド
  - `src/pages/` — ページコンポーネント (Home, Profile, Search, Trending, Notifications, Settings, SinglePost)
  - `src/components/` — 共有コンポーネント (AppShell, PostCard, ComposePost, SasutyLogo)
  - `src/contexts/AuthContext.tsx` — Supabase認証コンテキスト
  - `src/lib/supabase.ts` — Supabaseクライアント
  - `src/index.css` — X-likeダークテーマ
- `artifacts/api-server/src/routes/` — APIルート
  - `auth.ts` — ユーザー同期 (Supabase → ローカルDB)
  - `posts.ts` — 投稿CRUD、いいね、返信
  - `users.ts` — プロフィール、フォロー/アンフォロー
  - `feed.ts` — フィード、トレンド、検索、通知
- `artifacts/api-server/src/lib/auth.ts` — Supabase JWT検証ミドルウェア
- `lib/db/src/schema/` — Drizzleスキーマ (users, posts, likes, follows, notifications, hashtags)
- `lib/api-spec/openapi.yaml` — OpenAPI仕様 (source of truth)

## Architecture decisions

- **認証**: Supabase Authでフロントエンド認証。バックエンドはSupabase service role keyでJWT検証。
- **データベース**: Replit組み込みPostgreSQL (Drizzle ORM)。Supabaseはauth専用。
- **フロントエンド→バックエンド**: Orval生成のReact Queryフック経由。custom-fetchがBearerトークンを自動付与。
- **セキュリティ**: requireAuth/optionalAuthミドルウェアで全保護エンドポイントをガード。

## Required secrets

- `SUPABASE_URL` — SupabaseプロジェクトURL
- `SUPABASE_ANON_KEY` — Supabase公開キー (フロントエンドに VITE_ プレフィックスでも注入)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase管理キー (バックエンドのみ)
- `DATABASE_URL` — Replit PostgreSQL (自動管理)

## User preferences

- SNSアプリ名: Sasuty
- X(Twitter)ライクなデザイン
- ロゴ: SVGの「S」文字マーク
- セキュリティ対策万全

## Gotchas

- Vite defineでSUPABASE_URL/ANON_KEYをVITE_プレフィックスとしてフロントエンドに注入 (vite.config.ts)
- setAuthTokenGetter()はモジュールレベルで一度だけ呼び出す (AuthContext.tsx)
- OpenAPIスキーマのbodyは entity-shaped名 (e.g. PostInput) にすること (TS2308コリジョン回避)
