# Feed Management Guide — Admin

This guide explains how the ChompSquad feed works and how to manage banners through the admin panel.

---

## How the feed works

The feed is a single unified, paginated list. There are no tabs. Each user sees a blend of:

- **Squad content** — public recipes and posts from members of squads they belong to (3 out of every 4 slots).
- **Discovery content** — public recipes from the wider community (1 out of every 4 slots).

Content is ordered by recency within each pool. The feed is personalised — two users with different squad connections will see different content.

---

## Banners

Banners are the primary editorial tool for surfacing announcements, feature launches, and promotions in the feed. They are injected at the top of the first page only and are never shown on subsequent pages.

### Where banners appear

Multiple active banners are injected at evenly spaced positions on page 1:

| Banner priority | Feed position |
|-----------------|---------------|
| 0 | Index 0 (very first item in the feed) |
| 1 | Index 5 (after 4 regular items) |
| 2 | Index 10 |
| 3 | Index 15 |

**Priority is a display-order number, not a rank score.** Lower priority value = appears earlier. Two banners with the same priority number will appear in an undefined order — avoid duplicates.

### Banner fields

| Field | Required | Notes |
|-------|----------|-------|
| `title` | Yes | Max 120 characters. Short and punchy. |
| `body` | Yes | Max 280 characters. Supporting detail. |
| `image_url` | No | Full URL to a hosted image. Displayed as hero/background on the card. |
| `cta_label` | No | Button label, e.g. "Learn more". Must be set together with `cta_url`. |
| `cta_url` | No | Destination URL. Use `chompsquad://` scheme for in-app deep links; `https://` for external pages. |
| `priority` | Yes | Integer ≥ 0. Controls display order (0 = first). |
| `active_from` | Yes | ISO 8601 datetime. Banner becomes visible at this time. |
| `active_until` | No | ISO 8601 datetime. Banner stops showing after this time. Leave null for indefinite. |

### Creating a banner

```
POST /v1/admin/banners
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "title": "New Feature: Squad Posts",
  "body": "Share your favourite recipes directly in your squad feed.",
  "image_url": "https://cdn.example.com/banners/squad-posts.jpg",
  "cta_label": "Try it now",
  "cta_url": "chompsquad://squads",
  "priority": 0,
  "active_from": "2026-04-08T00:00:00Z",
  "active_until": "2026-04-22T00:00:00Z"
}
```

Response `201` with the created banner including its `id`.

### Deactivating a banner

Set `active_until` to a past datetime, or delete the banner record. There is no explicit "deactivate" toggle — the active window (`active_from` / `active_until`) controls visibility.

### CTA deep-link targets

| URL | In-app destination |
|-----|--------------------|
| `chompsquad://squads` | Squads tab |
| `chompsquad://posts/{uuid}` | Specific post detail screen |
| `https://...` | Opens in the system browser |

---

## Banner strategy tips

- **One banner at a time** is usually enough. More than three banners on a single page risks the lower ones being below the fold before pagination begins.
- **Keep priority 0 for the most important banner.** If you only have one active banner it should be priority 0 so it appears at the very top.
- **Use `active_until`** for time-limited promotions so you don't need to remember to take them down manually.
- **Test the CTA URL** before setting the banner live — a broken deep link is a dead end for users.

---

## What was removed

- **Pinned recipes** — editorial pinning of recipes to the top of the feed has been removed. Use a banner with `cta_url` pointing to a recipe or collection instead.
- **Section tabs** — the `recent`, `trending`, and `squads` feed sections no longer exist. The single unified feed replaces them.
