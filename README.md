# ChompSquad Admin

Internal admin dashboard for [ChompSquad](https://chompsquad.app). Lets admins manage promotional banners injected into the recipe feed and review user-submitted content reports.

## What it does

**Banner management** — Create, edit, reorder, and delete banners that appear at configurable positions in the mobile app's recipe feed. Banners support scheduling (start/end dates), themes, CTA labels, and tap actions. Position is controlled by drag-and-drop; the display order maps directly to feed slot indices (slot 0 = index 0, slot 1 = index 5, etc.).

**Reports queue** — View user-submitted reports against recipes, filtered to unreviewed items by default. Admins mark reports reviewed once actioned.

## Architecture

### Overview

```
Browser (admin.chompsquad.app)
    └── ChompSquad-Admin (Next.js, Firebase App Hosting)
            └── ChompSquad-API (FastAPI/Python, Cloud Run)
                    └── Database
```

The dashboard is a **fully client-rendered** Next.js app. There is no SSR, no server actions, and no BFF layer — every page is a `"use client"` component that talks directly to the ChompSquad-API via `fetch`. This was a deliberate choice: the dashboard is internal, behind auth, with no SEO concerns, so the complexity of server rendering adds no value.

### Auth

Login POSTs credentials to `POST /v1/auth/login` and stores the returned JWT in `localStorage`. The `useAdmin` hook (`lib/hooks/useAdmin.ts`) reads the token on mount, validates the `exp` claim by decoding the JWT payload client-side, and redirects to `/login` if the token is absent or expired. All API calls attach the token as `Authorization: Bearer <token>`.

There is no server-side session and no cookie — the dashboard is not accessible to public users, so the simpler localStorage approach is appropriate.

### API layer

All API calls live in `lib/api/` modules — never inline in components. Each module exports typed request/response interfaces alongside the fetch wrappers. The pattern is intentionally thin: a bare `fetch` call with typed inputs and outputs, error messages extracted from the API's `detail` field.

```
lib/
  api/
    auth.ts      — login
    banners.ts   — CRUD + list for banners
    reports.ts   — list + mark reviewed
  hooks/
    useAdmin.ts  — JWT validation, auth redirect, token accessors
```

### Drag-and-drop ordering

Banner reordering uses `@dnd-kit/sortable`. On drag end, the list is re-sequenced optimistically in local state, then all affected banners are PATCHed in parallel. If any PATCH fails the list is reloaded from the API to restore consistency.

The `display_order` (0-based rank) is stored separately from `feed_slot` (the actual index into the mobile feed). The mapping is `feed_slot = display_order * 5`, giving fixed injection points at indices 0, 5, 10, and 15.

### Hosting

Deployed to **Firebase App Hosting** (backed by Cloud Run), keeping the admin in the same GCP project as the API. Pushes to `main` trigger production deployments via GitHub Actions. `NEXT_PUBLIC_API_URL` is set in the Firebase App Hosting environment config, not committed to the repo.

Cloud Run is configured at `apphosting.yaml`: 1 vCPU, 512 MiB, scales to 0 when idle, max 2 instances.

## Stack

| Concern              | Choice                            |
|----------------------|-----------------------------------|
| Framework            | Next.js 15 (App Router)           |
| Language             | TypeScript                        |
| Styling              | Tailwind CSS v4                   |
| Drag-and-drop        | @dnd-kit/sortable                 |
| Package manager      | pnpm                              |
| Linting / formatting | ESLint + Prettier                 |
| Hosting              | Firebase App Hosting (Cloud Run)  |

## Local development

```bash
# 1. Install deps
pnpm install

# 2. Point at a local or staging API
cp .env.local.example .env.local
# edit NEXT_PUBLIC_API_URL

# 3. Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The root route redirects to `/banners`.

Other commands:

```bash
pnpm build   # production build
pnpm lint    # ESLint
pnpm format  # Prettier (writes in-place)
```

## Environment

| Variable               | Description                                                         |
|------------------------|---------------------------------------------------------------------|
| `NEXT_PUBLIC_API_URL`  | Base URL of the ChompSquad-API, e.g. `https://api.chompsquad.app`  |

Never commit `.env.local`.

## Key API endpoints

| Method    | Path                       | Purpose                                  |
|-----------|----------------------------|------------------------------------------|
| `POST`    | `/v1/auth/login`           | Obtain JWT                               |
| `GET`     | `/v1/admin/banners`        | List banners                             |
| `POST`    | `/v1/admin/banners`        | Create banner                            |
| `PATCH`   | `/v1/admin/banners/{id}`   | Update banner (position, fields)         |
| `DELETE`  | `/v1/admin/banners/{id}`   | Delete banner                            |
| `GET`     | `/v1/admin/reports`        | List reports (`?unreviewed_only=true`)   |
| `PATCH`   | `/v1/admin/reports/{id}`   | Mark report reviewed                     |

## Project structure

```
app/
  _components/
    BannerForm.tsx    — create/edit form (inline, replaces the row)
    BannerList.tsx    — drag-and-drop list + live preview section
    Nav.tsx           — top nav bar
    ReportsList.tsx   — reports queue with mark-reviewed action
  banners/page.tsx    — /banners route
  reports/page.tsx    — /reports route
  login/page.tsx      — /login route
  layout.tsx          — root layout (font, Nav)
  page.tsx            — redirects / → /banners
lib/
  api/                — typed fetch wrappers per resource
  hooks/              — useAdmin (auth gate + token helpers)
```

## Git workflow

- Feature branches: `sl/<step>-<short-description>` (e.g. `sl/b3-feed-manager`)
- Branch from and PR to `develop`. `main` is production.
- Claude may commit but will not push — push when ready.
