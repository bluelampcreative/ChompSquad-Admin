"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FeaturedRecipe } from "@/lib/api/featured-recipes";

interface Props {
  pin: FeaturedRecipe;
  index: number;
  onUnpin: (id: string) => void;
}

export function SortablePinRow({ pin, index, onUnpin }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: pin.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none"
        aria-label="Drag to reorder"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8h16M4 16h16"
          />
        </svg>
      </button>

      <span className="w-6 text-sm text-gray-400 text-center select-none">
        {index + 1}
      </span>

      {pin.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={pin.image_url}
          alt=""
          className="w-10 h-10 rounded object-cover flex-shrink-0"
        />
      )}

      <span className="flex-1 text-sm font-medium text-gray-900 truncate">
        {pin.title}
      </span>

      <button
        onClick={() => onUnpin(pin.id)}
        className="text-gray-400 hover:text-red-500 transition-colors"
        aria-label={`Unpin ${pin.title}`}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
