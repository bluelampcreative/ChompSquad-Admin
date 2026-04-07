# CLAUDE.md — Project Conventions for ChompSquad-Admin

## What this is

Internal admin dashboard for ChompSquad. Lets admins manage the featured recipe feed and
review reports. Talks exclusively to the `ChompSquad-API` (FastAPI/Python) backend.

## Stack

- Next.js 15 (App Router), TypeScript, Tailwind CSS
- Drag-and-drop: `@dnd-kit/sortable`
- Package manager: pnpm
- Linting/formatting: ESLint + Prettier

## Running things

- **Install deps:** `pnpm install`
- **Dev server:** `pnpm dev`
- **Build:** `pnpm build`
- **Lint:** `pnpm lint`
- **Format:** `pnpm format`

## Environment

Single required env var:

```
NEXT_PUBLIC_API_URL=https://api.chompsquad.app
```

For local dev, create `.env.local` pointing at the local or staging API. Never commit `.env.local`.

## API

All requests go to `NEXT_PUBLIC_API_URL`. Admin endpoints require a Bearer JWT in the
`Authorization` header obtained from `POST /v1/auth/login`.

Key endpoints:

- `GET  /v1/admin/featured-recipes` — list pins (ordered by position)
- `POST /v1/admin/featured-recipes` — pin a recipe
- `PATCH /v1/admin/featured-recipes/{id}` — update position
- `DELETE /v1/admin/featured-recipes/{id}` — unpin
- `GET  /v1/admin/recipes?search=&tag=&page=&page_size=` — recipe picker search
- `GET  /v1/admin/reports?unreviewed_only=true` — reports list

## Auth

- Login page posts credentials to `POST /v1/auth/login`, stores the returned JWT in `localStorage`.
- `useAdmin` hook reads the token and redirects to `/login` if absent or expired.
- All API utility functions should attach the token as `Authorization: Bearer <token>`.
- No server-side session — this dashboard is fully client-rendered. Use `"use client"` on all
  interactive pages/components. SSR is not needed (no SEO concerns, everything is behind auth).

## Hosting

**Firebase App Hosting** (backed by Cloud Run) — stays in the GCP ecosystem alongside the API.

- Connected to this GitHub repo; pushes to `main` trigger production deployments.
- `NEXT_PUBLIC_API_URL` is set as an environment variable in Firebase App Hosting config (not in
  the repo).
- Custom domain configured via Firebase Hosting console.

## Git workflow

### Branching

- Feature branches follow `sl/<step>-<short-description>` where step matches the checklist
  (e.g., `sl/b2-auth`, `sl/b3-feed-manager`).
- Branch from `develop`. PRs target `develop`. `main` is production.

### Committing and pushing

- Claude may create commits but must never push to a remote.
- After committing, display the commit message and prompt the developer to push when ready.

## Conventions

- Prefer `fetch` with a thin wrapper over a heavy client library — the API surface is small.
- Co-locate page-level types with the page file; share only genuinely reused types.
- Keep API calls in dedicated `lib/api/` modules, not inline in components.
- `useAdmin` and other auth hooks live in `lib/hooks/`.
- Don't add `"use server"` unless a specific server action is needed — default to client components.
