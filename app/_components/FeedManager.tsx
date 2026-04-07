"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  FeaturedRecipe,
  getFeaturedRecipes,
  pinRecipe,
  unpinRecipe,
  updatePosition,
} from "@/lib/api/featured-recipes";
import { Recipe } from "@/lib/api/recipes";
import { SortablePinRow } from "./SortablePinRow";
import { RecipePicker } from "./RecipePicker";

interface Props {
  token: string;
}

export function FeedManager({ token }: Props) {
  const [pins, setPins] = useState<FeaturedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFeaturedRecipes(token);
      setPins(data);
    } catch {
      setError("Failed to load featured recipes");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setError(null);
    const oldIndex = pins.findIndex((p) => p.id === active.id);
    const newIndex = pins.findIndex((p) => p.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      setError("Failed to reorder featured recipes");
      load();
      return;
    }

    const reordered = arrayMove(pins, oldIndex, newIndex);
    setPins(reordered);

    try {
      await updatePosition(token, String(active.id), newIndex + 1);
    } catch {
      setError("Failed to save new position");
      load();
    }
  }

  async function handleUnpin(id: string) {
    setError(null);
    setPins((prev) => prev.filter((p) => p.id !== id));
    try {
      await unpinRecipe(token, id);
    } catch {
      setError("Failed to unpin recipe");
      load();
    }
  }

  async function handlePin(recipe: Recipe) {
    setError(null);
    try {
      const pinned = await pinRecipe(token, recipe.id);
      setPins((prev) => [...prev, pinned]);
    } catch {
      setError("Failed to pin recipe");
    }
  }

  const pinnedIds = new Set(pins.map((p) => p.recipe_id));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Feed Manager</h1>
        {pins.length > 0 && (
          <span className="text-sm text-gray-400">{pins.length} pinned</span>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : pins.length === 0 ? (
        <p className="text-sm text-gray-400">
          No featured recipes yet. Add one below.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={pins.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {pins.map((pin, i) => (
                <SortablePinRow
                  key={pin.id}
                  pin={pin}
                  index={i}
                  onUnpin={handleUnpin}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <RecipePicker token={token} pinnedIds={pinnedIds} onPin={handlePin} />
    </div>
  );
}
