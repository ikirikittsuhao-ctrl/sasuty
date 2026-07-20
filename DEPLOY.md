# Deploying Sasuty

Sasuty runs as a **single Node.js process** in production: the Express API server also serves the built React frontend as static files. No separate frontend hosting is needed.

## Environment variables required

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `SESSION_SECRET` | Random secret for sessions |
| `PORT` | Port to listen on (set automatically by Railway/Render) |

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are also needed **at build time** (they are compiled into the frontend bundle by Vite).

## Railway

1. Connect your GitHub repo in the Railway dashboard.
2. Railway reads `railway.json` automatically.
3. Add all environment variables listed above.
4. Deploy — Railway runs the build + start commands from `railway.json`.

## Render

1. Create a new **Web Service** in Render, connect your repo.
2. Render reads `render.yaml` and pre-fills the build/start commands.
3. Set all environment variables marked `sync: false` in the Render dashboard.
4. Deploy.

## Docker / Generic VPS

```bash
# Build (pass Supabase keys so Vite can embed them in the bundle)
docker build \
  --build-arg SUPABASE_URL=https://xxxx.supabase.co \
  --build-arg SUPABASE_ANON_KEY=eyJ... \
  -t sasuty .

# Run
docker run -p 8080:8080 \
  -e DATABASE_URL=postgres://... \
  -e SUPABASE_URL=https://xxxx.supabase.co \
  -e SUPABASE_ANON_KEY=eyJ... \
  -e SUPABASE_SERVICE_ROLE_KEY=eyJ... \
  -e SESSION_SECRET=supersecret \
  sasuty
```

## Database migrations

Run after first deploy (or schema changes):

```bash
# From repo root
pnpm --filter @workspace/db run push
```

This applies Drizzle schema changes to your production PostgreSQL database.
