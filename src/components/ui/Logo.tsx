import { cn } from "@/lib/cn";

export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-bold">
        F
      </div>
      {withText && (
        <span className="text-base font-semibold tracking-tight text-fg">
          FinanceGO
        </span>
      )}
    </div>
  );
}
