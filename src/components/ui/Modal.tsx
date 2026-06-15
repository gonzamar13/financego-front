import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  /** "bottom" = bottom-sheet on mobile (default). "top" = slide-down desde arriba, centrado. */
  position?: "bottom" | "top";
}

const sizes = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  position = "bottom",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex justify-center animate-fade-in",
        position === "top"
          ? "items-start pt-8 px-4"
          : "items-end sm:items-center p-0 sm:p-4"
      )}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full bg-surface shadow-pop border border-border",
          "max-h-[92vh] flex flex-col",
          position === "top"
            ? "rounded-2xl animate-slide-down"
            : "rounded-t-2xl sm:rounded-2xl animate-slide-up",
          sizes[size]
        )}
        role="dialog"
        aria-modal="true"
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 p-5 border-b border-border">
            <div className="min-w-0">
              {title && <h2 className="text-lg font-semibold text-fg">{title}</h2>}
              {description && (
                <p className="text-sm text-fg-muted mt-1">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-md p-1 text-fg-subtle hover:bg-bg-muted hover:text-fg transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 p-5 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
