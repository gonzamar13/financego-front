import { forwardRef, useState, type FocusEvent } from "react";
import { Input } from "./Input";

export interface CurrencyInputProps {
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  value?: number | string | null;
  onChange?: (rawDigits: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

function toRaw(val: number | string | null | undefined): string {
  if (val === null || val === undefined) return "";
  const n = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(n) || n === 0) return "";
  return String(Math.round(n));
}

function toFormatted(raw: string): string {
  if (!raw) return "";
  const n = Number(raw);
  return isNaN(n) ? "" : new Intl.NumberFormat("es-PY", { maximumFractionDigits: 0 }).format(n);
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, onBlur, label, hint, error, placeholder = "0", disabled, autoFocus, className }, ref) => {
    const [focused, setFocused] = useState(false);

    const raw = toRaw(value);
    const displayValue = focused ? raw : toFormatted(raw);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, "");
      onChange?.(digits);
    };

    const handleBlur = (_e: FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      onBlur?.();
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        label={label}
        hint={hint}
        error={error}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        disabled={disabled}
        autoFocus={autoFocus}
        className={className}
      />
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";
