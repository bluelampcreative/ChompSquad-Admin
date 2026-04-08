const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not set");
}

export interface FeaturedRecipe {
  id: string;
  recipe_id: string;
  title: string;
  image_url?: string;
  position: number;
}

interface FeaturedRecipesPage {
  items: FeaturedRecipe[];
  total: number;
  page: number;
  page_size: number;
}

export async function getFeaturedRecipes(
  token: string,
): Promise<FeaturedRecipe[]> {
  const res = await fetch(`${API_URL}/v1/admin/featured-recipes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.detail ?? "Failed to load featured recipes");
  }
  const data: FeaturedRecipe[] | FeaturedRecipesPage = await res.json();
  return Array.isArray(data) ? data : data.items;
}

export async function pinRecipe(
  token: string,
  recipeId: string,
): Promise<FeaturedRecipe> {
  const res = await fetch(`${API_URL}/v1/admin/featured-recipes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ recipe_id: recipeId }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.detail ?? "Failed to pin recipe");
  }
  return res.json();
}

export async function updatePosition(
  token: string,
  id: string,
  position: number,
): Promise<FeaturedRecipe> {
  const res = await fetch(`${API_URL}/v1/admin/featured-recipes/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ position }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.detail ?? "Failed to update position");
  }
  return res.json();
}

export async function unpinRecipe(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/v1/admin/featured-recipes/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.detail ?? "Failed to unpin recipe");
  }
}
