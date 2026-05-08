import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id ?? label?.replace(/\s+/g, "-").toLowerCase();
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-fg">
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
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "w-full appearance-none bg-transparent px-3 py-2.5 pr-9 text-sm text-fg outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 h-4 w-4 text-fg-subtle pointer-events-none" />
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
Select.displayName = "Select";
