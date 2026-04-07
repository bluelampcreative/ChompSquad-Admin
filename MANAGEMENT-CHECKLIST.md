# Admin Dashboard — Management Checklist

Sub-roadmap for the ChompSquad admin dashboard (`ChompSquad-Admin`), covering the API
foundations needed in `ChompSquad-API` and the dashboard app in this repo.

---

## Hosting

**Platform:** Firebase App Hosting (backed by Cloud Run)
**Why:** GCP ecosystem consistency, zero additional vendor, free tier covers low-traffic internal tool.

- Firebase App Hosting project connected to this GitHub repo
- `NEXT_PUBLIC_API_URL` set as an environment variable in Firebase App Hosting config
- Custom domain configured via Firebase Hosting (pointing to production API domain)
- No additional auth layer needed — app-level JWT auth (B.2) is sufficient

---

## Phase A — API Foundations (`ChompSquad-API` repo)

- [x] A.1 `GET /v1/admin/featured-recipes` — list current pins with full recipe detail (title, hero image URL, position), ordered by position
- [x] A.2 `PATCH /v1/admin/featured-recipes/{id}` — update `position` on a single pin (enables drag-to-reorder saves)
- [x] A.3 `GET /v1/admin/recipes` — search all public recipes (`search`, `tag`, `page`, `page_size`); the single endpoint the dashboard uses to find recipes to pin

Additional endpoints implemented alongside Phase A (needed by Phase B):
- [x] `POST /v1/admin/featured-recipes` — pin a public recipe (B.4)
- [x] `DELETE /v1/admin/featured-recipes/{id}` — unpin a recipe (B.3)
- [x] `GET /v1/admin/reports` — list reports with `unreviewed_only` filter (B.5)

---

## Phase B — Dashboard App (this repo)

- [ ] B.1 Project setup — Next.js (App Router), Tailwind, `@dnd-kit/sortable`; single env var `NEXT_PUBLIC_API_URL`; deploy target Firebase App Hosting
- [ ] B.2 Auth — login page → `POST /v1/auth/login` → JWT in `localStorage`; `useAdmin` hook redirects to login if unauthenticated
- [ ] B.3 Feed Manager — drag-and-drop pinned recipe cards; drag saves new position via `PATCH`; unpin button calls `DELETE`
- [ ] B.4 Recipe picker — search drawer/modal hits `GET /v1/admin/recipes?search=…`; click result → `POST /v1/admin/featured-recipes` → card appears in pinned list
- [ ] B.5 Reports page — table view of `GET /v1/admin/reports?unreviewed_only=true`; shows recipe, reporter, reason, notes, timestamp
- [ ] B.6 Deploy — Firebase App Hosting project connected to this repo; `NEXT_PUBLIC_API_URL` pointed at production API; custom domain configured

---

## Out of scope (for now)

- Scheduled pins (pin from/to dates)
- Marking reports as reviewed
- User management
