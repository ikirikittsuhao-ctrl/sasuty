---
name: Deployment setup
description: How Sasuty is configured for single-process production deployment
---

In production, Express (artifacts/api-server) serves both the API and the built Vite frontend static files.

**Why:** Simplifies deployment to Railway/Render/Docker — single service, no CDN needed.

**How to apply:**
- `app.ts` checks `NODE_ENV === 'production'` and serves `../../sasuty/dist/public` as static, with SPA fallback to `index.html`.
- Build order: `sasuty` (Vite) first → output to `artifacts/sasuty/dist/public/` → then `api-server` (esbuild).
- `vite.config.ts` no longer throws if PORT/BASE_PATH are unset (defaults to 5173 / '/') so production builds work without those vars.
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` must be available at Vite **build time** (Vite compiles them into the bundle via `define`).

**Deployment files added:**
- `Dockerfile` — multi-stage build (deps → frontend → backend → runner)
- `render.yaml` — Render Web Service config (PORT 10000)
- `railway.json` — Railway NIXPACKS config with healthcheck at /api/healthz
- `.dockerignore` — excludes node_modules, dist, mockup-sandbox
- `DEPLOY.md` — human-readable deployment guide
