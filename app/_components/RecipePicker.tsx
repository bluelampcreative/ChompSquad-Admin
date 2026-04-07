"use client";

import { useState, useEffect, useRef } from "react";
import { searchRecipes, Recipe } from "@/lib/api/recipes";

interface Props {
  token: string;
  pinnedIds: Set<string>;
  onPin: (recipe: Recipe) => void;
}

export function RecipePicker({ token, pinnedIds, onPin }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await searchRecipes(token, {
          search: query.trim(),
          page_size: 10,
        });
        setResults(data.items);
      } catch {
        setError("Search failed");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, token]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Add Recipe</h2>

      <input
        type="search"
        placeholder="Search recipes…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
      />

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

      {loading && (
        <p className="mt-2 text-sm text-gray-400">Searching…</p>
      )}

      {!loading && results.length > 0 && (
        <ul className="mt-2 divide-y divide-gray-100">
          {results.map((recipe) => {
            const pinned = pinnedIds.has(recipe.id);
            return (
              <li key={recipe.id} className="flex items-center gap-3 py-2">
                {recipe.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={recipe.image_url}
                    alt=""
                    className="w-8 h-8 rounded object-cover flex-shrink-0"
                  />
                )}
                <span className="flex-1 text-sm text-gray-800 truncate">
                  {recipe.title}
                </span>
                <button
                  onClick={() => !pinned && onPin(recipe)}
                  disabled={pinned}
                  className="text-xs font-medium px-2 py-1 rounded-md transition-colors disabled:opacity-40 disabled:cursor-default bg-gray-900 text-white hover:bg-gray-700 disabled:hover:bg-gray-900"
                >
                  {pinned ? "Pinned" : "Pin"}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!loading && query.trim() && results.length === 0 && !error && (
        <p className="mt-2 text-sm text-gray-400">No results</p>
      )}
    </div>
  );
}
