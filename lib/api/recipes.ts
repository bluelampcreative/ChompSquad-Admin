const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set");
}

export interface Recipe {
  id: string;
  title: string;
  image_url?: string;
}

export interface RecipesPage {
  items: Recipe[];
  total: number;
  page: number;
  page_size: number;
}

export async function searchRecipes(
  token: string,
  params: { search?: string; tag?: string; page?: number; page_size?: number },
  signal?: AbortSignal,
): Promise<RecipesPage> {
  const url = new URL(`${API_URL}/v1/admin/recipes`);
  if (params.search) url.searchParams.set("search", params.search);
  if (params.tag) url.searchParams.set("tag", params.tag);
  if (params.page != null) url.searchParams.set("page", String(params.page));
  if (params.page_size != null)
    url.searchParams.set("page_size", String(params.page_size));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.detail ?? "Failed to search recipes");
  }
  return res.json();
}
