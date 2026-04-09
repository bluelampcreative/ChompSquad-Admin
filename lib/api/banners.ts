const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set");
}

export interface BannerResponse {
  id: string;
  title: string;
  subtitle: string | null;
  label: string | null;
  theme: string | null;
  cta_label: string | null;
  cta_type: string | null;
  cta_url: string | null;
  tap_action: string | null;
  display_order: number;
  feed_slot: number | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export interface BannerCreatePayload {
  title: string;
  subtitle?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  display_order?: number;
  is_active?: boolean;
  label?: string | null;
  theme?: string | null;
  cta_label?: string | null;
  cta_type?: string | null;
  cta_url?: string | null;
  tap_action?: string | null;
  feed_slot?: number | null;
}

export type BannerUpdatePayload = Partial<BannerCreatePayload>;

export interface BannerListResponse {
  items: BannerResponse[];
  total: number;
}

export async function listBanners(
  token: string,
  activeOnly = false,
): Promise<BannerListResponse> {
  const url = new URL(`${API_URL}/v1/admin/banners`);
  if (activeOnly) url.searchParams.set("active_only", "true");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.detail ?? `Failed to load banners (${res.status})`);
  }
  return res.json();
}

export async function createBanner(
  token: string,
  data: BannerCreatePayload,
): Promise<BannerResponse> {
  const res = await fetch(`${API_URL}/v1/admin/banners`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.detail ?? "Failed to create banner");
  }
  return res.json();
}

export async function updateBanner(
  token: string,
  id: string,
  data: BannerUpdatePayload,
): Promise<BannerResponse> {
  const res = await fetch(`${API_URL}/v1/admin/banners/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.detail ?? "Failed to update banner");
  }
  return res.json();
}

export async function deleteBanner(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/v1/admin/banners/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.detail ?? "Failed to delete banner");
  }
}
