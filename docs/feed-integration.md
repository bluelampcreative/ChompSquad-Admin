# Feed Integration Guide — ChompSquad Admin CMS

This guide covers the banner management API used by the ChompSquad-Admin dashboard.

---

## 1. Banner management endpoints

All banner endpoints require an admin-scoped JWT (`is_admin=true`).

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/v1/admin/banners` | Create a new banner |
| `GET` | `/v1/admin/banners` | List all banners |
| `PATCH` | `/v1/admin/banners/{id}` | Partially update a banner |
| `DELETE` | `/v1/admin/banners/{id}` | Hard delete a banner |

---

## 2. Field reference

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `title` | string | Yes | max 120 chars | Headline shown on the banner card |
| `body` | string | Yes | max 280 chars | Supporting text below the title |
| `image_url` | string \| null | No | max 1000 chars | URL of the banner image (hosted externally or on GCS) |
| `cta_label` | string \| null | No | max 60 chars | Button label, e.g. "Learn more" |
| `cta_url` | string \| null | No | max 500 chars | Button destination — deep link or HTTPS URL (see §4) |
| `priority` | integer | No | ≥ 0, default 0 | Higher value = shown first when multiple banners are active |
| `active_from` | datetime (tz-aware) | Yes | ISO 8601 with offset | When the banner becomes visible |
| `active_until` | datetime (tz-aware) \| null | No | must be ≥ `active_from` if set | When the banner expires; null = no expiry |

---

## 3. Create a banner

```
POST /v1/admin/banners
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "title": "🎉 Squad Posts are here!",
  "body": "Share your favourite recipes directly in your squad feed.",
  "image_url": "https://storage.googleapis.com/chompsquad-images/banners/squad-posts.jpg",
  "cta_label": "Try it now",
  "cta_url": "chompsquad://squads",
  "priority": 5,
  "active_from": "2026-04-10T09:00:00+00:00",
  "active_until": "2026-04-17T09:00:00+00:00"
}
```

Response `201`:

```json
{
  "id": "uuid",
  "created_by_user_id": "uuid",
  "title": "🎉 Squad Posts are here!",
  "body": "Share your favourite recipes directly in your squad feed.",
  "image_url": "https://...",
  "cta_label": "Try it now",
  "cta_url": "chompsquad://squads",
  "priority": 5,
  "active_from": "2026-04-10T09:00:00Z",
  "active_until": "2026-04-17T09:00:00Z",
  "created_at": "2026-04-08T14:00:00Z"
}
```

---

## 4. CTA URL format

### Deep links (`chompsquad://`)

Use the `chompsquad://` scheme to route users to a screen inside the app. The iOS client reads the host and path to determine the destination.

| Deep link | Destination |
|-----------|-------------|
| `chompsquad://squads` | Squads list screen |
| `chompsquad://feed?section=trending` | Trending feed section |
| `chompsquad://recipe/{id}` | Recipe detail screen |
| `chompsquad://posts/new` | Post creation sheet |

Only use paths that have been confirmed with the iOS team. Unrecognised paths are silently ignored by the client.

### External URLs (`https://`)

Use `https://` for links to web content (blog posts, help articles, external promotions). The client opens these in an in-app browser.

**Rules:**
- Always use `https://` — `http://` links will be rejected by App Transport Security.
- Do not use `chompsquad://` and `https://` in the same `cta_url` — pick one.
- If `cta_url` is set, `cta_label` should also be set (the client hides the button if either is null).

---

## 5. Priority and scheduling

### How scheduling works

A banner is **active** (visible in the feed) when **all** of the following are true at the moment of the API call:

1. `active_from` ≤ current time
2. `active_until` is null **or** `active_until` > current time

Banners outside this window are stored but not served to clients.

### How priority works

When multiple banners are simultaneously active, the feed returns only the **one with the highest `priority` value**. Ties are broken by `active_from` descending (most recently started wins).

| priority | Meaning |
|----------|---------|
| 0 (default) | Standard — shown only when no higher-priority banner is active |
| 1–4 | Elevated — overrides standard banners |
| 5+ | High — use sparingly for important announcements |

**Example:**

| Banner | priority | active_from | active_until | Shown? |
|--------|----------|-------------|--------------|--------|
| "Spring Sale" | 0 | Apr 1 | Apr 30 | No — outranked |
| "New Feature" | 5 | Apr 8 | Apr 15 | **Yes** — highest priority |

After "New Feature" expires on Apr 15, "Spring Sale" becomes visible again automatically.

### Scheduling tips

- Schedule banners in advance using `active_from` — the server activates them at the right time without any manual intervention.
- Use `active_until` to auto-expire time-limited promotions.
- Avoid setting `priority` > 0 for evergreen banners; reserve high priorities for campaigns with a fixed end date.

---

## 6. List banners

```
GET /v1/admin/banners
Authorization: Bearer <admin-token>
```

Optional query parameter:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `active_only` | boolean | false | When true, return only banners that are currently live |

Response:

```json
{
  "items": [ /* BannerResponse[] ordered by priority desc, then active_from desc */ ],
  "total": 3
}
```

### Preview live banners

Use `active_only=true` to preview exactly what would be served to the feed right now:

```
GET /v1/admin/banners?active_only=true
```

The first item in the result (highest priority, most recent `active_from`) is the banner currently being injected into the feed. If the list is empty, no banner is shown.

---

## 7. Update a banner

Send only the fields you want to change:

```
PATCH /v1/admin/banners/{id}
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "title": "Updated headline",
  "priority": 10
}
```

Response `200` with the full updated banner. Unspecified fields are unchanged.

**Validation:** If both `active_from` and `active_until` are included in the same PATCH, `active_until` must be ≥ `active_from`.

---

## 8. Delete a banner

```
DELETE /v1/admin/banners/{id}
Authorization: Bearer <admin-token>
```

Response `204 No Content`. This is a **hard delete** — the banner is permanently removed. Deactivate a banner by setting `active_until` to a past timestamp instead if you want to keep the record.
