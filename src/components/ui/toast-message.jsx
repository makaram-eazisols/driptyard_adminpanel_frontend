"use client";

import { cn } from "@/lib/utils";

const COLORS = {
  success: {
    indicator: "bg-[#2ECC71]",
  },
  error: {
    indicator: "bg-[#E74C3C]",
  },
};

export function ToastMessage({ type = "success", title, description }) {
  const palette = COLORS[type] ?? COLORS.success;

  return (
    <div className={cn("toast-card", `toast-card--${type}`)}>
      <span className={cn("toast-card__indicator", palette.indicator)} />
      <div className="flex flex-col">
        {title && <p className="toast-card__title">{title}</p>}
        {description && <p className="toast-card__description">{description}</p>}
      </div>
    </div>
  );
}


