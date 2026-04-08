"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BannerResponse,
  listBanners,
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

const statusLabels = {
  live: "Live",
  scheduled: "Scheduled",
  expired: "Expired",
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

export function BannerList({ token }: Props) {
  const [banners, setBanners] = useState<BannerResponse[]>([]);
  const [liveBanner, setLiveBanner] = useState<BannerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [all, active] = await Promise.all([
        listBanners(token),
        listBanners(token, true),
      ]);
      setBanners(all.items);
      setLiveBanner(active.items[0] ?? null);
    } catch {
      setError("Failed to load banners");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(banner: BannerResponse) {
    const confirmed = window.confirm(
      `Permanently delete "${banner.title}"?\n\nThis cannot be undone. To deactivate without deleting, edit the banner and set an Active until date in the past.`,
    );
    if (!confirmed) return;

    setError(null);
    setDeleting(banner.id);
    try {
      await deleteBanner(token, banner.id);
      setBanners((prev) => prev.filter((b) => b.id !== banner.id));
      if (liveBanner?.id === banner.id) setLiveBanner(null);
    } catch {
      setError("Failed to delete banner");
    } finally {
      setDeleting(null);
    }
  }

  function handleFormSuccess() {
    setFormMode(null);
    load();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Live preview */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Currently live
        </h2>
        {loading ? null : liveBanner ? (
          <div className="bg-white border border-green-200 rounded-xl px-4 py-4 space-y-1">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-gray-900">{liveBanner.title}</p>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                Live
              </span>
            </div>
            <p className="text-xs text-gray-500">{liveBanner.body}</p>
            {liveBanner.active_until && (
              <p className="text-xs text-gray-400">
                Expires {formatDatetime(liveBanner.active_until)}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No banner is currently live.</p>
        )}
      </section>

      {/* All banners */}
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
          <div className="space-y-3">
            {banners.map((banner) => {
              const status = getBannerStatus(banner);
              return (
                <div key={banner.id}>
                  {formMode?.type === "edit" && formMode.banner.id === banner.id ? (
                    <BannerForm
                      token={token}
                      banner={banner}
                      onSuccess={handleFormSuccess}
                      onCancel={() => setFormMode(null)}
                    />
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-xl px-4 py-4 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {banner.title}
                            </p>
                            <span
                              className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${statusStyles[status]}`}
                            >
                              {statusLabels[status]}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2">{banner.body}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() =>
                              setFormMode({ type: "edit", banner })
                            }
                            className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(banner)}
                            disabled={deleting === banner.id}
                            className="text-xs font-medium text-red-400 hover:text-red-600 disabled:opacity-50 transition-colors"
                          >
                            {deleting === banner.id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>Priority {banner.priority}</span>
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
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
