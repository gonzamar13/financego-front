import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  Plus,
  PiggyBank,
  Wallet,
  ArrowLeftRight,
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { format, parseISO, startOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";
import { Avatar } from "@/components/ui/Avatar";
import { formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/cn";
import {
  useAccountBalances,
  useTransactionSummary,
  useTransactions,
} from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { useAuth } from "@/providers/AuthProvider";
import { useDebtSummary } from "@/hooks/useDebts";
import { useBudgetAlerts, useBudgets } from "@/hooks/useBudgets";
import { ProgressBar } from "@/components/ui/ProgressBar";

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const now = new Date();
  const { data: summary, isLoading: l1 } = useTransactionSummary();
  const { data: balances } = useAccountBalances();
  const { data: transactions } = useTransactions();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const { data: debtSummary } = useDebtSummary();
  const { data: budgetAlerts } = useBudgetAlerts();
  const { data: budgets } = useBudgets({ year: now.getFullYear(), month: now.getMonth() + 1 });

  const monthlyData = useMemo(() => {
    if (!transactions) return [];
    const months: Record<string, { month: string; income: number; expense: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = startOfMonth(subMonths(new Date(), i));
      const key = format(d, "yyyy-MM");
      months[key] = { month: format(d, "MMM", { locale: es }), income: 0, expense: 0 };
    }
    for (const t of transactions) {
      const key = format(parseISO(t.transaction_date), "yyyy-MM");
      if (!months[key]) continue;
      const amt = Number(t.amount);
      if (t.type === "income") months[key].income += amt;
      else months[key].expense += amt;
    }
    return Object.values(months);
  }, [transactions]);

  const recent = useMemo(() => {
    return [...(transactions ?? [])]
      .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
      .slice(0, 6);
  }, [transactions]);

  if (l1) return <PageSpinner />;

  const accountById = new Map((accounts ?? []).map((a) => [a.id, a]));
  const catById = new Map((categories ?? []).map((c) => [c.id, c]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-sm text-fg-muted">
            Hola, {user?.first_name} 👋
          </p>
          <h1 className="text-2xl font-bold text-fg">Resumen</h1>
        </div>
        <Link to="/transactions?new=1" className="hidden lg:block">
          <Button leftIcon={<Plus className="h-4 w-4" />}>Nuevo movimiento</Button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Balance"
          value={formatCurrency(summary?.balance ?? 0)}
          tone="brand"
          hint="Ingresos − gastos"
        />
        <StatCard
          label="Ingresos"
          value={formatCurrency(summary?.total_income ?? 0)}
          tone="success"
          icon={<ArrowDownRight className="h-4 w-4" />}
        />
        <StatCard
          label="Gastos"
          value={formatCurrency(summary?.total_expense ?? 0)}
          tone="danger"
          icon={<ArrowUpRight className="h-4 w-4" />}
        />
        <StatCard
          label="Deuda total"
          value={formatCurrency(debtSummary?.total_remaining ?? 0)}
          tone={Number(debtSummary?.total_remaining ?? 0) > 0 ? "danger" : "brand"}
          hint={
            debtSummary?.overdue_debts
              ? `${debtSummary.overdue_debts} vencida(s)`
              : `${debtSummary?.active_debts ?? 0} activa(s)`
          }
          icon={<CreditCard className="h-4 w-4" />}
        />
      </div>

      {/* Alertas de presupuestos */}
      {budgetAlerts && budgetAlerts.length > 0 && (
        <Card className="border-warning/50 bg-warning-soft/40 dark:bg-warning/5">
          <CardBody>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-warning/15 text-warning p-2">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-fg">
                    {budgetAlerts.length === 1
                      ? "Tenés una alerta de presupuesto"
                      : `Tenés ${budgetAlerts.length} alertas de presupuesto`}
                  </p>
                  <Link to="/budgets">
                    <Button variant="ghost" size="sm">
                      Ver presupuestos
                    </Button>
                  </Link>
                </div>
                <ul className="mt-2 space-y-2">
                  {budgetAlerts.slice(0, 3).map((a) => (
                    <li key={a.budget_id}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-fg">{a.category_name}</span>
                        <span
                          className={
                            a.status === "exceeded" ? "text-danger" : "text-warning"
                          }
                        >
                          {formatPercent(a.progress_percent)} ·{" "}
                          {formatCurrency(a.spent)} / {formatCurrency(a.amount)}
                        </span>
                      </div>
                      <ProgressBar
                        value={a.progress_percent}
                        tone={a.status === "exceeded" ? "danger" : "warning"}
                        className="mt-1"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Flujo mensual" subtitle="Ingresos vs gastos (últimos 6 meses)" />
          <CardBody>
            {monthlyData.length === 0 || monthlyData.every((m) => !m.income && !m.expense) ? (
              <div className="h-64 flex items-center justify-center text-sm text-fg-subtle">
                Aún no hay datos suficientes.
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={monthlyData} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                    <XAxis dataKey="month" stroke="rgb(var(--fg-subtle))" fontSize={12} />
                    <YAxis stroke="rgb(var(--fg-subtle))" fontSize={12} tickFormatter={(v) => formatCurrency(v, { compact: true })} />
                    <Tooltip
                      contentStyle={{
                        background: "rgb(var(--surface))",
                        border: "1px solid rgb(var(--border))",
                        borderRadius: 12,
                        color: "rgb(var(--fg))",
                      }}
                      formatter={(v: number) => formatCurrency(v)}
                    />
                    <Bar dataKey="income" name="Ingresos" fill="#16a34a" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="expense" name="Gastos" fill="#dc2626" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="flex flex-col">
          <CardHeader
            title="Presupuesto del mes"
            subtitle={format(now, "MMMM yyyy", { locale: es })}
            action={
              <Link to="/budgets">
                <Button variant="ghost" size="sm">Ver todos</Button>
              </Link>
            }
          />
          {!budgets || budgets.length === 0 ? (
            <CardBody className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={<PiggyBank className="h-6 w-6" />}
                title="Sin presupuestos"
                description="Creá presupuestos por categoría para ver tu progreso aquí."
                action={
                  <Link to="/budgets">
                    <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                      Crear presupuesto
                    </Button>
                  </Link>
                }
              />
            </CardBody>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-border max-h-72 lg:max-h-64">
              {budgets.map((b) => (
                <button
                  key={b.id}
                  onClick={() =>
                    navigate(`/transactions?new=1&type=expense&category_id=${b.category_id}`)
                  }
                  className="w-full text-left px-5 py-3 flex flex-col gap-1.5 hover:bg-bg-subtle active:bg-bg-muted transition-colors group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-fg truncate">
                      {b.category_name}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {b.status !== "ok" && (
                        <Badge tone={b.status === "exceeded" ? "danger" : "warning"}>
                          {b.status === "exceeded" ? "Excedido" : "Alerta"}
                        </Badge>
                      )}
                      <ChevronRight className="h-3.5 w-3.5 text-fg-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <ProgressBar
                    value={b.progress_percent}
                    tone={
                      b.status === "exceeded" ? "danger"
                      : b.status === "warning" ? "warning"
                      : "success"
                    }
                  />
                  <div className="flex justify-between text-xs text-fg-subtle">
                    <span>{formatCurrency(b.spent)} gastado</span>
                    <span className={cn(
                      "font-medium",
                      b.status === "exceeded" ? "text-danger"
                      : b.status === "warning" ? "text-warning"
                      : "text-fg-muted"
                    )}>
                      {formatPercent(b.progress_percent)} de {formatCurrency(b.amount)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Accounts + recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader
            title="Cuentas"
            subtitle="Balance por cuenta"
            action={
              <Link to="/accounts">
                <Button variant="ghost" size="sm">
                  Ver todas
                </Button>
              </Link>
            }
          />
          <CardBody className="p-0">
            {!balances || balances.length === 0 ? (
              <EmptyState
                icon={<Wallet className="h-6 w-6" />}
                title="Sin cuentas todavía"
                description="Creá tu primera cuenta para empezar a registrar movimientos."
                action={
                  <Link to="/accounts">
                    <Button leftIcon={<Plus className="h-4 w-4" />}>Crear cuenta</Button>
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-border">
                {balances.map((b) => (
                  <li key={b.account_id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar initials={b.account_name.slice(0, 2).toUpperCase()} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-fg truncate">{b.account_name}</p>
                      <p className="text-xs text-fg-subtle">
                        +{formatCurrency(b.total_income)} · −{formatCurrency(b.total_expense)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-fg">
                      {formatCurrency(b.balance)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Movimientos recientes"
            subtitle="Tus últimas 6 transacciones"
            action={
              <Link to="/transactions">
                <Button variant="ghost" size="sm">
                  Ver todas
                </Button>
              </Link>
            }
          />
          <CardBody className="p-0">
            {recent.length === 0 ? (
              <EmptyState
                icon={<ArrowLeftRight className="h-6 w-6" />}
                title="Sin movimientos"
                description="Registrá tu primer ingreso o gasto."
              />
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((t) => {
                  const acc = accountById.get(t.account_id);
                  const cat = t.category_id ? catById.get(t.category_id) : null;
                  const isIncome = t.type === "income";
                  return (
                    <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                      <div
                        className={
                          isIncome
                            ? "rounded-full bg-success-soft text-success p-2 dark:bg-success/15"
                            : "rounded-full bg-danger-soft text-danger p-2 dark:bg-danger/15"
                        }
                      >
                        {isIncome ? (
                          <ArrowDownRight className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-fg truncate">
                          {t.description || (cat?.name ?? "Movimiento")}
                        </p>
                        <p className="text-xs text-fg-subtle truncate">
                          {acc?.account_name ?? "—"} ·{" "}
                          {format(parseISO(t.transaction_date), "d MMM", { locale: es })}
                        </p>
                      </div>
                      <span
                        className={
                          isIncome
                            ? "text-sm font-semibold text-success"
                            : "text-sm font-semibold text-danger"
                        }
                      >
                        {isIncome ? "+" : "−"}
                        {formatCurrency(t.amount)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone = "brand",
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "brand" | "success" | "danger";
  icon?: React.ReactNode;
}) {
  const toneClasses = {
    brand: "from-brand-50 to-transparent dark:from-brand-500/10",
    success: "from-success-soft to-transparent dark:from-success/10",
    danger: "from-danger-soft to-transparent dark:from-danger/10",
  } as const;
  return (
    <Card className={`overflow-hidden bg-gradient-to-b ${toneClasses[tone]}`}>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-fg-muted">{label}</p>
          {icon && (
            <Badge tone={tone === "brand" ? "brand" : tone}>
              {icon}
            </Badge>
          )}
        </div>
        <p className="mt-2 text-2xl font-bold text-fg">{value}</p>
        {hint && <p className="mt-1 text-xs text-fg-subtle">{hint}</p>}
      </div>
    </Card>
  );
}
