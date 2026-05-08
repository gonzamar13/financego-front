import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "success" | "danger" | "warning" | "info" | "brand";

const tones: Record<Tone, string> = {
  neutral: "bg-bg-muted text-fg-muted",
  success: "bg-success-soft text-success dark:bg-success/15 dark:text-success",
  danger: "bg-danger-soft text-danger dark:bg-danger/15 dark:text-danger",
  warning: "bg-warning-soft text-warning dark:bg-warning/15 dark:text-warning",
  info: "bg-info-soft text-info dark:bg-info/15 dark:text-info",
  brand: "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
