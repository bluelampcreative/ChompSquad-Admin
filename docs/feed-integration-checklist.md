# Feed Integration Checklist — Banner Management

Tracks implementation of the banner management UI against the API documented in
`feed-integration.md`.

---

## API layer

- [ ] **`lib/api/banners.ts`** — create API module with typed functions:
  - [ ] `listBanners(activeOnly?: boolean): Promise<BannerListResponse>` — `GET /v1/admin/banners`
  - [ ] `createBanner(data: BannerCreatePayload): Promise<BannerResponse>` — `POST /v1/admin/banners`
  - [ ] `updateBanner(id: string, data: BannerUpdatePayload): Promise<BannerResponse>` — `PATCH /v1/admin/banners/{id}`
  - [ ] `deleteBanner(id: string): Promise<void>` — `DELETE /v1/admin/banners/{id}`

### Types to define (co-located in `lib/api/banners.ts`)

- [ ] `BannerResponse` — shape of every banner returned by the API (see §2 of the guide for all fields)
- [ ] `BannerCreatePayload` — required: `title`, `body`, `active_from`; optional: `image_url`, `cta_label`, `cta_url`, `priority`, `active_until`
- [ ] `BannerUpdatePayload` — all fields from `BannerCreatePayload` but all optional (partial PATCH)
- [ ] `BannerListResponse` — `{ items: BannerResponse[]; total: number }`

---

## Navigation

- [ ] Add **"Banners"** link to `app/_components/Nav.tsx` pointing to `/banners`

---

## Banners page

- [ ] **`app/banners/page.tsx`** — top-level page (client component, guarded by `useAdmin`)
  - [ ] Fetches all banners on mount (`listBanners()`)
  - [ ] Shows a "Preview live" section using `listBanners(true)` — highlights the currently active banner (first item, if any)
  - [ ] Renders `<BannerList>` with delete and edit callbacks
  - [ ] Renders **"New banner"** button that opens `<BannerForm>` in create mode

---

## Components

- [ ] **`app/_components/BannerList.tsx`**
  - [ ] Renders a table/list of all banners ordered by priority desc, then `active_from` desc (API already returns this order)
  - [ ] Each row shows: title, priority, `active_from`, `active_until` (or "No expiry"), and a live/scheduled/expired status badge
  - [ ] Each row has **Edit** and **Delete** action buttons
  - [ ] Delete triggers `deleteBanner(id)` with a confirmation prompt; refreshes the list on success

- [ ] **`app/_components/BannerForm.tsx`** — used for both create and edit
  - [ ] Accepts optional `banner?: BannerResponse` prop; when provided, pre-fills all fields (edit mode)
  - [ ] Fields:
    - [ ] `title` (text, required, max 120 chars)
    - [ ] `body` (textarea, required, max 280 chars)
    - [ ] `image_url` (text, optional, max 1000 chars)
    - [ ] `cta_label` (text, optional, max 60 chars) — show hint: "Required if cta_url is set"
    - [ ] `cta_url` (text, optional, max 500 chars) — show hint: use `chompsquad://` or `https://`
    - [ ] `priority` (number input, default 0, min 0)
    - [ ] `active_from` (datetime-local, required)
    - [ ] `active_until` (datetime-local, optional) — validate ≥ `active_from` client-side
  - [ ] On submit: calls `createBanner()` or `updateBanner()` accordingly; calls `onSuccess` callback on completion
  - [ ] Displays field-level validation errors inline
  - [ ] Disables submit button while request is in-flight

---

## Behaviour & edge cases

- [ ] If `cta_url` is set but `cta_label` is empty (or vice versa), show a warning (not a hard error — the API allows it, but the iOS client hides the button)
- [ ] `active_until` must be ≥ `active_from` — enforce client-side before the PATCH validation fires
- [ ] Hard delete is permanent — confirmation dialog should make this clear and suggest using a past `active_until` instead to deactivate without losing the record
- [ ] Empty banner list state: show a "No banners yet" empty state with a CTA to create one
- [ ] Empty active-preview state: show a note that no banner is currently live

---

## Manual QA

- [ ] Create a banner with all fields filled, verify it appears in the list
- [ ] Create a banner with only required fields, verify defaults (`priority=0`, no expiry)
- [ ] Edit a banner and verify changes persist
- [ ] Set `active_until` to a past time, verify the banner shows as expired in the status badge
- [ ] Set two banners active at the same time; confirm the preview section shows only the higher-priority one
- [ ] Delete a banner and verify it is removed from the list
- [ ] Confirm the "Banners" nav link is visible and routes correctly
