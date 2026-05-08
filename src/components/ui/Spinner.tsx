import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-brand-500", className)} />;
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Spinner className="h-7 w-7" />
    </div>
  );
}
