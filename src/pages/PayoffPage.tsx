import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  TrendingDown,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { getApiErrorMessage } from "@/lib/api";
import { usePayoffPlan } from "@/hooks/useDebts";
import type { PayoffResponse, StrategyType } from "@/types/api";

const STRATEGY_OPTIONS = [
  { value: "avalanche", label: "Avalancha — minimiza el interés total" },
  { value: "snowball", label: "Bola de nieve — salda deudas pequeñas primero" },
];

export function PayoffPage() {
  const [budget, setBudget] = useState("");
  const [strategy, setStrategy] = useState<StrategyType>("avalanche");
  const payoff = usePayoffPlan();
  const result: PayoffResponse | undefined = payoff.data;

  const chartData = useMemo(() => {
    if (!result) return [];
    const { months } = result;
    const step = months.length > 72 ? 6 : months.length > 24 ? 3 : 1;
    return months
      .filter((_, i) => i % step === 0 || i === months.length - 1)
      .map((m) => ({
        label: format(parseISO(m.date), "MMM yy", { locale: es }),
        saldo: Number(m.total_remaining),
      }));
  }, [result]);

  const handleSubmit = async () => {
    try {
      await payoff.mutateAsync({
        monthly_budget: budget ? Number(budget) : undefined,
        strategy,
      });
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-fg">Proyección de pago de deudas</h1>
        <p className="text-sm text-fg-muted mt-1">
          Simulá cuándo quedarás libre de deudas según tu presupuesto mensual.
        </p>
      </div>

      {/* Formulario */}
      <Card>
        <CardHeader
          title="Configurar simulación"
          subtitle="El presupuesto es opcional — si lo dejás vacío se calcula con tus ingresos y gastos del mes."
        />
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <CurrencyInput
                label="Presupuesto mensual (opcional)"
                value={budget}
                onChange={(raw) => setBudget(raw)}
                placeholder="Ej: 500000"
                hint={
                  result
                    ? `Saldo disponible calculado: ${formatCurrency(result.suggested_budget)}`
                    : "Dejar vacío para calcular automáticamente"
                }
              />
            </div>
            <div className="flex-1">
              <Select
                label="Estrategia de pago"
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as StrategyType)}
                options={STRATEGY_OPTIONS}
              />
            </div>
          </div>
          <Button
            className="mt-4"
            loading={payoff.isPending}
            onClick={handleSubmit}
          >
            Calcular plan
          </Button>
        </CardBody>
      </Card>

      {/* Resultados */}
      {result && (
        <>
          {/* Banner de inviabilidad */}
          {!result.feasible && (
            <Card className="border-danger/50 bg-danger-soft/40 dark:bg-danger/5">
              <CardBody>
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-danger/15 text-danger p-2">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-fg">Plan inviable</p>
                    <p className="text-sm text-fg-muted mt-0.5">
                      Con este presupuesto los intereses crecen más rápido de lo que podés pagar.
                      Intentá aumentar el monto mensual.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              label="Estado"
              value={result.feasible ? "Viable" : "Inviable"}
              tone={result.feasible ? "success" : "danger"}
              icon={
                result.feasible ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )
              }
            />
            <SummaryCard
              label="Libre de deudas"
              value={
                result.debt_free_date
                  ? format(parseISO(result.debt_free_date), "MMM yyyy", { locale: es })
                  : "—"
              }
              tone="brand"
              icon={<CalendarCheck className="h-4 w-4" />}
            />
            <SummaryCard
              label="Interés total"
              value={formatCurrency(result.total_interest)}
              tone="warning"
              icon={<TrendingDown className="h-4 w-4" />}
            />
            <SummaryCard
              label="Meses"
              value={result.feasible ? String(result.total_months) : "+600"}
              tone="brand"
              icon={<Clock className="h-4 w-4" />}
            />
          </div>

          {/* Gráfico de evolución */}
          <Card>
            <CardHeader
              title="Evolución del saldo total"
              subtitle={`Presupuesto mensual usado: ${formatCurrency(result.monthly_budget)}`}
            />
            <CardBody>
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={chartData} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                    <XAxis dataKey="label" stroke="rgb(var(--fg-subtle))" fontSize={12} />
                    <YAxis
                      stroke="rgb(var(--fg-subtle))"
                      fontSize={12}
                      tickFormatter={(v) => formatCurrency(v, { compact: true })}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgb(var(--surface))",
                        border: "1px solid rgb(var(--border))",
                        borderRadius: 12,
                        color: "rgb(var(--fg))",
                      }}
                      formatter={(v: number) => [formatCurrency(v), "Saldo restante"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="saldo"
                      stroke="#dc2626"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          {/* Detalle por deuda */}
          <Card>
            <CardHeader
              title="Detalle por deuda"
              subtitle="Fecha de cancelación e interés proyectado por cada deuda."
            />
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-5 py-3 text-left font-medium text-fg-muted">Deuda</th>
                      <th className="px-5 py-3 text-left font-medium text-fg-muted">Se cancela</th>
                      <th className="px-5 py-3 text-right font-medium text-fg-muted">Interés total</th>
                      <th className="px-5 py-3 text-right font-medium text-fg-muted">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {result.debts.map((d) => (
                      <tr key={d.debt_id}>
                        <td className="px-5 py-3 font-medium text-fg">{d.name}</td>
                        <td className="px-5 py-3 text-fg-muted">
                          {d.paid_off_date
                            ? format(parseISO(d.paid_off_date), "MMM yyyy", { locale: es })
                            : "—"}
                        </td>
                        <td className="px-5 py-3 text-right text-fg">
                          {formatCurrency(d.total_interest)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {d.paid_off_month ? (
                            <Badge tone="success">
                              <CheckCircle2 className="h-3 w-3" />
                              Mes {d.paid_off_month}
                            </Badge>
                          ) : (
                            <Badge tone="danger">Sin cancelar</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: "brand" | "success" | "danger" | "warning";
  icon: React.ReactNode;
}) {
  const toneClasses = {
    brand: "from-brand-50 to-transparent dark:from-brand-500/10",
    success: "from-success-soft to-transparent dark:from-success/10",
    danger: "from-danger-soft to-transparent dark:from-danger/10",
    warning: "from-warning-soft to-transparent dark:from-warning/10",
  } as const;
  return (
    <Card className={`overflow-hidden bg-gradient-to-b ${toneClasses[tone]}`}>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-fg-muted">{label}</p>
          <Badge tone={tone === "warning" ? "warning" : tone === "success" ? "success" : tone === "danger" ? "danger" : "brand"}>
            {icon}
          </Badge>
        </div>
        <p className="mt-2 text-xl font-bold text-fg">{value}</p>
      </div>
    </Card>
  );
}
