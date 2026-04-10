"use client";

import { useState } from "react";
import {
  BannerResponse,
  BannerCreatePayload,
  createBanner,
  updateBanner,
} from "@/lib/api/banners";

interface Props {
  token: string;
  banner?: BannerResponse;
  defaultPriority?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

// Convert an ISO string to the value format expected by datetime-local inputs
function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function BannerForm({ token, banner, defaultPriority = 0, onSuccess, onCancel }: Props) {
  const isEdit = !!banner;

  const [title, setTitle] = useState(banner?.title ?? "");
  const [subtitle, setSubtitle] = useState(banner?.subtitle ?? "");
  const [ctaLabel, setCtaLabel] = useState(banner?.cta_label ?? "");
  const [ctaUrl, setCtaUrl] = useState(banner?.cta_url ?? "");
  const [startsAt, setStartsAt] = useState(
    banner?.starts_at ? toDatetimeLocal(banner.starts_at) : "",
  );
  const [endsAt, setEndsAt] = useState(
    banner?.ends_at ? toDatetimeLocal(banner.ends_at) : "",
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ctaMismatch =
    (ctaUrl.trim() !== "" && ctaLabel.trim() === "") ||
    (ctaLabel.trim() !== "" && ctaUrl.trim() === "");

  const endsBeforeStarts =
    endsAt !== "" &&
    startsAt !== "" &&
    new Date(endsAt) < new Date(startsAt);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (endsBeforeStarts) return;

    setError(null);
    setSubmitting(true);

    try {
      const startsAtDate = startsAt ? new Date(startsAt) : null;
      if (startsAtDate && isNaN(startsAtDate.getTime())) {
        throw new Error("Start date is invalid");
      }

      const displayOrder = banner ? banner.display_order : defaultPriority;
      const payload: BannerCreatePayload = {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        starts_at: startsAtDate ? startsAtDate.toISOString() : null,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        cta_label: ctaLabel.trim() || null,
        cta_url: ctaUrl.trim() || null,
        display_order: displayOrder,
        feed_slot: displayOrder * 5,
      };

      if (isEdit) {
        await updateBanner(token, banner.id, payload);
      } else {
        await createBanner(token, payload);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-6 py-5 space-y-4">
      <h2 className="text-base font-semibold text-gray-900">
        {isEdit ? "Edit banner" : "New banner"}
      </h2>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Title" required hint="Max 120 chars">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            required
            className={inputClass}
          />
        </Field>

        <Field label="Subtitle" hint="Max 280 chars — supporting text below the title">
          <textarea
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            maxLength={280}
            rows={3}
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="CTA label"
            hint={ctaMismatch ? "Required when CTA URL is set" : "Max 60 chars"}
            warn={ctaMismatch}
          >
            <input
              type="text"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              maxLength={60}
              className={inputClass}
            />
          </Field>

          <Field
            label="CTA URL"
            hint={ctaMismatch ? "Required when CTA label is set" : "chompsquad:// or https://"}
            warn={ctaMismatch}
          >
            <input
              type="text"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              maxLength={500}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Starts at">
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field
            label="Ends at"
            hint={endsBeforeStarts ? "Must be after Starts at" : "Leave blank for no expiry"}
            warn={endsBeforeStarts}
          >
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || endsBeforeStarts}
            className="text-sm font-medium px-4 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Create banner"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "w-full text-sm border border-gray-200 rounded-md px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent";

function Field({
  label,
  required,
  hint,
  warn,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  warn?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && (
        <p className={`text-xs ${warn ? "text-amber-600" : "text-gray-400"}`}>
          {hint}
        </p>
      )}
    </div>
  );
}
