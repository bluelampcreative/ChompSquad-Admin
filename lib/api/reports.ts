const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set");
}

export interface Report {
  id: string;
  recipe_id: string;
  recipe_title: string;
  reason: string;
  notes?: string;
  reporter_id: string;
  created_at: string;
  reviewed: boolean;
}

export async function getReports(
  token: string,
  unreviewedOnly: boolean,
): Promise<Report[]> {
  const url = new URL(`${API_URL}/v1/admin/reports`);
  if (unreviewedOnly) url.searchParams.set("unreviewed_only", "true");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.detail ?? "Failed to load reports");
  }
  return res.json();
}

export async function markReportReviewed(
  token: string,
  id: string,
): Promise<Report> {
  const res = await fetch(`${API_URL}/v1/admin/reports/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reviewed: true }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.detail ?? "Failed to mark report as reviewed");
  }
  return res.json();
}
