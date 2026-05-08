import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id ?? label?.replace(/\s+/g, "-").toLowerCase();
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-fg">
            {label}
          </label>
        )}
        <div
          className={cn(
            "relative flex items-center rounded-lg border bg-surface transition-colors",
            "focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20",
            error
              ? "border-danger focus-within:border-danger focus-within:ring-danger/20"
              : "border-border hover:border-border-strong"
          )}
        >
          {leftIcon && (
            <span className="pl-3 text-fg-subtle pointer-events-none">{leftIcon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full bg-transparent px-3 py-2.5 text-sm text-fg placeholder:text-fg-subtle outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              leftIcon && "pl-2",
              rightIcon && "pr-2",
              className
            )}
            {...props}
          />
          {rightIcon && <span className="pr-3 text-fg-subtle">{rightIcon}</span>}
        </div>
        {error ? (
          <p className="text-xs text-danger">{error}</p>
        ) : hint ? (
          <p className="text-xs text-fg-subtle">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";
