import { usePrivacy } from "@/providers/PrivacyProvider";
import { formatCurrency } from "@/lib/format";

const MASK = "••••••";

export function useFormatCurrency() {
  const { showAmounts } = usePrivacy();
  return (
    value: Parameters<typeof formatCurrency>[0],
    opts?: Parameters<typeof formatCurrency>[1]
  ): string => (showAmounts ? formatCurrency(value, opts) : MASK);
}
