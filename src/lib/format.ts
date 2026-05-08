export function formatCurrency(
  value: number | string,
  opts: { currency?: string; locale?: string; compact?: boolean } = {}
) {
  const { currency = "PYG", locale = "es-PY", compact = false } = opts;
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return "—";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatNumber(value: number, locale = "es-PY") {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatPercent(value: number, locale = "es-PY") {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

export function initials(first?: string, last?: string) {
  const a = (first ?? "").trim()[0] ?? "";
  const b = (last ?? "").trim()[0] ?? "";
  return (a + b).toUpperCase() || "U";
}
