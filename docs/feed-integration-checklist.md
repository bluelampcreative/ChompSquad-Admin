# Feed Integration Checklist — Banner Management

Tracks implementation of the banner management UI against the API documented in
`feed-integration.md`.

---

## API layer

- [x] **`lib/api/banners.ts`** — create API module with typed functions:
  - [x] `listBanners(activeOnly?: boolean): Promise<BannerListResponse>` — `GET /v1/admin/banners`
  - [x] `createBanner(data: BannerCreatePayload): Promise<BannerResponse>` — `POST /v1/admin/banners`
  - [x] `updateBanner(id: string, data: BannerUpdatePayload): Promise<BannerResponse>` — `PATCH /v1/admin/banners/{id}`
  - [x] `deleteBanner(id: string): Promise<void>` — `DELETE /v1/admin/banners/{id}`

### Types to define (co-located in `lib/api/banners.ts`)

- [x] `BannerResponse` — shape of every banner returned by the API (see §2 of the guide for all fields)
- [x] `BannerCreatePayload` — required: `title`, `body`, `active_from`; optional: `image_url`, `cta_label`, `cta_url`, `priority`, `active_until`
- [x] `BannerUpdatePayload` — all fields from `BannerCreatePayload` but all optional (partial PATCH)
- [x] `BannerListResponse` — `{ items: BannerResponse[]; total: number }`

---

## Navigation

- [x] Add **"Banners"** link to `app/_components/Nav.tsx` pointing to `/banners`

---

## Banners page

- [x] **`app/banners/page.tsx`** — top-level page (client component, guarded by `useAdmin`)
  - [x] Fetches all banners on mount (`listBanners()`)
  - [x] Shows a "Preview live" section using `listBanners(true)` — highlights the currently active banner (first item, if any)
  - [x] Renders `<BannerList>` with delete and edit callbacks
  - [x] Renders **"New banner"** button that opens `<BannerForm>` in create mode

---

## Components

- [x] **`app/_components/BannerList.tsx`**
  - [x] Renders a table/list of all banners ordered by priority desc, then `active_from` desc (API already returns this order)
  - [x] Each row shows: title, priority, `active_from`, `active_until` (or "No expiry"), and a live/scheduled/expired status badge
  - [x] Each row has **Edit** and **Delete** action buttons
  - [x] Delete triggers `deleteBanner(id)` with a confirmation prompt; refreshes the list on success

- [x] **`app/_components/BannerForm.tsx`** — used for both create and edit
  - [x] Accepts optional `banner?: BannerResponse` prop; when provided, pre-fills all fields (edit mode)
  - [x] Fields:
    - [x] `title` (text, required, max 120 chars)
    - [x] `body` (textarea, required, max 280 chars)
    - [x] `image_url` (text, optional, max 1000 chars)
    - [x] `cta_label` (text, optional, max 60 chars) — show hint: "Required if cta_url is set"
    - [x] `cta_url` (text, optional, max 500 chars) — show hint: use `chompsquad://` or `https://`
    - [x] `priority` (number input, default 0, min 0)
    - [x] `active_from` (datetime-local, required)
    - [x] `active_until` (datetime-local, optional) — validate ≥ `active_from` client-side
  - [x] On submit: calls `createBanner()` or `updateBanner()` accordingly; calls `onSuccess` callback on completion
  - [x] Displays field-level validation errors inline
  - [x] Disables submit button while request is in-flight

---

## Behaviour & edge cases

- [x] If `cta_url` is set but `cta_label` is empty (or vice versa), show a warning (not a hard error — the API allows it, but the iOS client hides the button)
- [x] `active_until` must be ≥ `active_from` — enforce client-side before the PATCH validation fires
- [x] Hard delete is permanent — confirmation dialog should make this clear and suggest using a past `active_until` instead to deactivate without losing the record
- [x] Empty banner list state: show a "No banners yet" empty state with a CTA to create one
- [x] Empty active-preview state: show a note that no banner is currently live

---

## Manual QA

- [ ] Create a banner with all fields filled, verify it appears in the list
- [ ] Create a banner with only required fields, verify defaults (`priority=0`, no expiry)
- [ ] Edit a banner and verify changes persist
- [ ] Set `active_until` to a past time, verify the banner shows as expired in the status badge
- [ ] Set two banners active at the same time; confirm the preview section shows only the higher-priority one
- [ ] Delete a banner and verify it is removed from the list
- [ ] Confirm the "Banners" nav link is visible and routes correctly
