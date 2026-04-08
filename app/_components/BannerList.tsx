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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  BannerResponse,
  listBanners,
  updateBanner,
  deleteBanner,
} from "@/lib/api/banners";
import { BannerForm } from "./BannerForm";

interface Props {
  token: string;
}

type FormMode = { type: "create" } | { type: "edit"; banner: BannerResponse } | null;

function getBannerStatus(banner: BannerResponse): "live" | "scheduled" | "expired" {
  const now = Date.now();
  const from = new Date(banner.active_from).getTime();
  const until = banner.active_until ? new Date(banner.active_until).getTime() : null;
  if (from > now) return "scheduled";
  if (until !== null && until <= now) return "expired";
  return "live";
}

const statusStyles = {
  live: "bg-green-100 text-green-700",
  scheduled: "bg-blue-100 text-blue-700",
  expired: "bg-gray-100 text-gray-500",
};

function formatDatetime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Feed slot positions driven by priority index
const FEED_SLOTS = ["Index 0 — top of feed", "Index 5", "Index 10", "Index 15"];

function SortableBannerRow({
  banner,
  slotLabel,
  onEdit,
  onDelete,
  deleting,
}: {
  banner: BannerResponse;
  slotLabel: string;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const status = getBannerStatus(banner);

  return (
    <div ref={setNodeRef} style={style}>
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-4 space-y-2">
        <div className="flex items-start gap-3">
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
            aria-label="Drag to reorder"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </button>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900 truncate">{banner.title}</p>
              <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${statusStyles[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
            <p className="text-xs text-gray-500 line-clamp-2">{banner.body}</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onEdit}
              className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              disabled={deleting}
              className="text-xs font-medium text-red-400 hover:text-red-600 disabled:opacity-50 transition-colors"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-400 pl-8">
          <span>{slotLabel}</span>
          <span>·</span>
          <span>From {formatDatetime(banner.active_from)}</span>
          {banner.active_until && (
            <>
              <span>·</span>
              <span>Until {formatDatetime(banner.active_until)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function BannerList({ token }: Props) {
  const [banners, setBanners] = useState<BannerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listBanners(token);
      setBanners(data.items);
    } catch {
      setError("Failed to load banners");
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

    const oldIndex = banners.findIndex((b) => b.id === active.id);
    const newIndex = banners.findIndex((b) => b.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(banners, oldIndex, newIndex);
    setBanners(reordered);
    setError(null);

    try {
      await Promise.all(
        reordered.map((banner, i) => updateBanner(token, banner.id, { priority: i })),
      );
    } catch {
      setError("Failed to save new order");
      load();
    }
  }

  async function handleDelete(banner: BannerResponse) {
    const confirmed = window.confirm(
      `Permanently delete "${banner.title}"?\n\nThis cannot be undone. To deactivate without deleting, edit the banner and set an Active until date in the past.`,
    );
    if (!confirmed) return;

    setError(null);
    setDeleting(banner.id);
    try {
      await deleteBanner(token, banner.id);
      const remaining = banners.filter((b) => b.id !== banner.id);
      setBanners(remaining);
      // Re-sequence priorities after deletion
      await Promise.all(
        remaining.map((b, i) => updateBanner(token, b.id, { priority: i })),
      );
    } catch {
      setError("Failed to delete banner");
      load();
    } finally {
      setDeleting(null);
    }
  }

  function handleFormSuccess() {
    setFormMode(null);
    load();
  }

  const liveBanners = banners.filter((b) => getBannerStatus(b) === "live");

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Live preview */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Currently live
        </h2>
        {!loading && (
          liveBanners.length > 0 ? (
            <div className="space-y-2">
              {liveBanners.map((b, i) => (
                <div
                  key={b.id}
                  className="bg-white border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3"
                >
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex-shrink-0">
                    Slot {i}
                  </span>
                  <p className="text-sm font-medium text-gray-900 truncate">{b.title}</p>
                  {b.active_until && (
                    <p className="text-xs text-gray-400 flex-shrink-0 ml-auto">
                      Expires {formatDatetime(b.active_until)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No banner is currently live.</p>
          )
        )}
      </section>

      {/* Banner list */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Banners</h1>
          {formMode === null && (
            <button
              onClick={() => setFormMode({ type: "create" })}
              className="text-sm font-medium px-3 py-1.5 rounded-md bg-gray-900 text-white hover:bg-gray-700 transition-colors"
            >
              New banner
            </button>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {formMode?.type === "create" && (
          <BannerForm
            token={token}
            onSuccess={handleFormSuccess}
            onCancel={() => setFormMode(null)}
          />
        )}

        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : banners.length === 0 && formMode === null ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-sm text-gray-400">No banners yet.</p>
            <button
              onClick={() => setFormMode({ type: "create" })}
              className="text-sm font-medium px-4 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-700 transition-colors"
            >
              Create your first banner
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={banners.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {banners.map((banner, i) =>
                  formMode?.type === "edit" && formMode.banner.id === banner.id ? (
                    <BannerForm
                      key={banner.id}
                      token={token}
                      banner={banner}
                      onSuccess={handleFormSuccess}
                      onCancel={() => setFormMode(null)}
                    />
                  ) : (
                    <SortableBannerRow
                      key={banner.id}
                      banner={banner}
                      slotLabel={FEED_SLOTS[i] ?? `Index ${i * 5}`}
                      onEdit={() => setFormMode({ type: "edit", banner })}
                      onDelete={() => handleDelete(banner)}
                      deleting={deleting === banner.id}
                    />
                  ),
                )}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {!loading && banners.length > 0 && (
          <p className="text-xs text-gray-400">
            Drag to reorder. Top banner appears first in the feed.
          </p>
        )}
      </section>
    </div>
  );
}
