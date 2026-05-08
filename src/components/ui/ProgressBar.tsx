import { cn } from "@/lib/cn";

type Tone = "brand" | "success" | "warning" | "danger";

const toneClasses: Record<Tone, string> = {
  brand: "bg-brand-500",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export function ProgressBar({
  value,
  tone = "brand",
  className,
}: {
  value: number;
  tone?: Tone;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-bg-muted",
        className
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all", toneClasses[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
