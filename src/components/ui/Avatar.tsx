import { cn } from "@/lib/cn";

export function Avatar({
  initials,
  size = "md",
  className,
}: {
  initials: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  } as const;
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold dark:bg-brand-500/20 dark:text-brand-400",
        sizes[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
