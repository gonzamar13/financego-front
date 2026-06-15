import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  TrendingDown,
  Wallet,
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
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import { usePayoffPlan } from "@/hooks/useDebts";
import type { MonthSnapshot, PayoffRequest, PayoffResponse, StrategyType } from "@/types/api";
import { ProgressBar } from "@/components/ui/ProgressBar";

const STRATEGY_OPTIONS = [
  { value: "avalanche", label: "Avalancha — minimiza el interés total" },
  { value: "snowball", label: "Bola de nieve — salda deudas pequeñas primero" },
];

const STRATEGY_LABEL: Record<StrategyType, string> = {
  avalanche: "Avalancha",
  snowball: "Bola de nieve",
};

const BUDGET_KEY = "financego.payoff_budget";

export function PayoffPage() {
  const [budget, setBudget] = useState(() => localStorage.getItem(BUDGET_KEY) ?? "");
  const [strategy, setStrategy] = useState<StrategyType>("avalanche");
  const payoff = usePayoffPlan();
  const comparison = usePayoffPlan();
  const initialized = useRef(false);

  const result: PayoffResponse | undefined = payoff.data;
  const compResult: PayoffResponse | undefined = comparison.data;
  const altStrategy: StrategyType = strategy === "avalanche" ? "snowball" : "avalanche";
  const isPending = payoff.isPending || comparison.isPending;

  // Auto-trigger: inmediato en mount, debounce 500ms en cambios posteriores
  useEffect(() => {
    const alt: StrategyType = strategy === "avalanche" ? "snowball" : "avalanche";
    const req: PayoffRequest = {
      monthly_budget: budget ? Number(budget) : undefined,
      strategy,
    };
    const delay = initialized.current ? 500 : 0;
    initialized.current = true;

    const timer = setTimeout(() => {
      payoff.mutate(req, { onError: (e) => toast.error(getApiErrorMessage(e)) });
      comparison.mutate(
        { ...req, strategy: alt },
        { onError: (e) => toast.error(getApiErrorMessage(e)) }
      );
    }, delay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budget, strategy]);

  const handleBudgetChange = (raw: string) => {
    setBudget(raw);
    if (raw) localStorage.setItem(BUDGET_KEY, raw);
    else localStorage.removeItem(BUDGET_KEY);
  };

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

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg">Proyección de pago de deudas</h1>
          <p className="text-sm text-fg-muted mt-1">
            Simulá cuándo quedarás libre de deudas según tu presupuesto mensual.
          </p>
        </div>
        {isPending && (
          <div className="flex items-center gap-1.5 text-sm text-fg-muted shrink-0 mt-1">
            <Loader2 className="h-4 w-4 animate-spin" />
            Calculando…
          </div>
        )}
      </div>

      {/* Configuración — sin botón, reactivo */}
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
                onChange={handleBudgetChange}
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

          {/* Distribución mensual por deuda */}
          {result.months.length > 0 && (
            <MonthlyBreakdown months={result.months} monthlyBudget={result.monthly_budget} />
          )}

          {/* Comparación de estrategias */}
          {compResult && (
            <StrategyComparison
              current={result}
              currentStrategy={strategy}
              alt={compResult}
              altStrategy={altStrategy}
            />
          )}

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

// ─── Componentes auxiliares ───────────────────────────────────────────────────

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
          <Badge
            tone={
              tone === "warning"
                ? "warning"
                : tone === "success"
                ? "success"
                : tone === "danger"
                ? "danger"
                : "brand"
            }
          >
            {icon}
          </Badge>
        </div>
        <p className="mt-2 text-xl font-bold text-fg">{value}</p>
      </div>
    </Card>
  );
}

function MonthlyBreakdown({
  months,
  monthlyBudget,
}: {
  months: MonthSnapshot[];
  monthlyBudget: string;
}) {
  const [selectedMonth, setSelectedMonth] = useState(0); // índice 0 = mes 1
  const month = months[selectedMonth];
  const totalBudget = Number(monthlyBudget);
  const totalPaid = month.payments.reduce((s, p) => s + Number(p.paid), 0);
  const remanente = totalBudget - totalPaid;

  const canPrev = selectedMonth > 0;
  const canNext = selectedMonth < months.length - 1;

  return (
    <Card>
      <CardHeader
        title="Distribución del presupuesto por mes"
        subtitle="Cuánto va a cada deuda según el plan de pago simulado."
      />
      <CardBody>
        {/* Selector de mes */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setSelectedMonth((m) => m - 1)}
            disabled={!canPrev}
            className="rounded-lg p-1.5 text-fg-muted hover:bg-bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-fg">
              Mes {month.month} — {format(parseISO(month.date), "MMMM yyyy", { locale: es })}
            </p>
            <p className="text-xs text-fg-muted">{selectedMonth + 1} de {months.length}</p>
          </div>
          <button
            onClick={() => setSelectedMonth((m) => m + 1)}
            disabled={!canNext}
            className="rounded-lg p-1.5 text-fg-muted hover:bg-bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Desglose por deuda */}
        <div className="flex flex-col gap-4">
          {month.payments.map((p) => {
            const pct = totalBudget > 0 ? (Number(p.paid) / totalBudget) * 100 : 0;
            const isPaidOff = Number(p.remaining) === 0 && Number(p.paid) > 0;
            return (
              <div key={p.debt_id}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-fg truncate">{p.name}</span>
                    {isPaidOff && (
                      <span className="shrink-0 text-xs font-medium text-success bg-success-soft px-1.5 py-0.5 rounded-full">
                        ¡Saldada!
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-fg shrink-0 ml-3">
                    {formatCurrency(p.paid)}
                  </span>
                </div>
                <ProgressBar value={pct} tone={isPaidOff ? "success" : "brand"} />
                <div className="flex justify-between text-xs text-fg-muted mt-1">
                  <span>{pct.toFixed(0)}% del presupuesto</span>
                  <span>Saldo restante: {formatCurrency(p.remaining)}</span>
                </div>
              </div>
            );
          })}

          {/* Totales */}
          <div className="border-t border-border pt-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-fg-muted">Total destinado a deudas</span>
              <span className="font-semibold text-fg">{formatCurrency(totalPaid)}</span>
            </div>
            {remanente > 0 && (
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1.5 text-fg-muted">
                  <Wallet className="h-3.5 w-3.5" />
                  Remanente libre
                </span>
                <span className="font-semibold text-success">{formatCurrency(remanente)}</span>
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function StrategyComparison({
  current,
  currentStrategy,
  alt,
  altStrategy,
}: {
  current: PayoffResponse;
  currentStrategy: StrategyType;
  alt: PayoffResponse;
  altStrategy: StrategyType;
}) {
  const currentInterest = Number(current.total_interest);
  const altInterest = Number(alt.total_interest);
  const saving = Math.abs(altInterest - currentInterest);
  const currentIsBetter = currentInterest <= altInterest;
  const betterStrategy = currentIsBetter ? currentStrategy : altStrategy;
  const monthDiff = Math.abs(current.total_months - alt.total_months);

  const rows = [
    { s: currentStrategy, res: current, isCurrent: true },
    { s: altStrategy, res: alt, isCurrent: false },
  ];

  return (
    <Card>
      <CardHeader
        title="Comparación de estrategias"
        subtitle="Mismo presupuesto, dos enfoques — elegí el que más te conviene."
      />
      <CardBody>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {rows.map(({ s, res, isCurrent }) => (
            <div
              key={s}
              className={cn(
                "rounded-xl border p-4",
                isCurrent
                  ? "border-brand-300 bg-brand-50/50 dark:border-brand-500/30 dark:bg-brand-500/5"
                  : "border-border bg-bg-subtle"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-fg">{STRATEGY_LABEL[s]}</span>
                {isCurrent && <Badge tone="brand">Activa</Badge>}
              </div>
              <p className="text-xl font-bold text-fg">{formatCurrency(res.total_interest)}</p>
              <p className="text-xs text-fg-muted mb-1">en intereses</p>
              <p className="text-sm text-fg-muted">
                {res.debt_free_date
                  ? format(parseISO(res.debt_free_date), "MMMM yyyy", { locale: es })
                  : "—"}
                {" · "}
                {res.feasible ? `${res.total_months} meses` : "+600 meses"}
              </p>
            </div>
          ))}
        </div>

        {saving > 0 && (
          <div className="rounded-lg bg-success-soft/60 dark:bg-success/10 px-4 py-2.5 flex items-start gap-2 text-sm">
            <ArrowLeftRight className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <p className="text-fg-muted">
              <span className="font-semibold text-fg">{STRATEGY_LABEL[betterStrategy]}</span>{" "}
              te ahorra{" "}
              <span className="font-semibold text-fg">{formatCurrency(saving)}</span>{" "}
              en intereses
              {monthDiff > 0 && (
                <>
                  {" "}y termina{" "}
                  <span className="font-semibold text-fg">
                    {monthDiff} {monthDiff === 1 ? "mes" : "meses"}
                  </span>{" "}
                  antes
                </>
              )}
              .
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
