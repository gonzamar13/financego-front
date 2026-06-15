import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  PiggyBank,
  Plus,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatPercent } from "@/lib/format";
import { useFormatCurrency } from "@/hooks/useFormatCurrency";
import { getApiErrorMessage } from "@/lib/api";
import {
  useBudgetAlerts,
  useBudgets,
  useCreateBudget,
  useDeleteBudget,
  useUpdateBudget,
} from "@/hooks/useBudgets";
import { useCategories } from "@/hooks/useCategories";
import type { Budget, BudgetStatus } from "@/types/api";

const schema = z.object({
  category_id: z.string().min(1, "Seleccioná una categoría"),
  amount: z.coerce.number().positive("Debe ser mayor a 0"),
  alert_threshold: z.coerce.number().int().min(0).max(100),
});
type FormValues = z.infer<typeof schema>;

const statusBadge: Record<BudgetStatus, { tone: "success" | "warning" | "danger"; label: string }> = {
  ok: { tone: "success", label: "En orden" },
  warning: { tone: "warning", label: "Atención" },
  exceeded: { tone: "danger", label: "Superado" },
};

export function BudgetsPage() {
  const fmt = useFormatCurrency();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const { data: budgets, isLoading } = useBudgets({ year, month });
  const { data: alerts } = useBudgetAlerts();
  const { data: categories } = useCategories();
  const create = useCreateBudget();
  const update = useUpdateBudget();
  const remove = useDeleteBudget();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);

  const expenseCategories = useMemo(
    () => (categories ?? []).filter((c) => c.type === "expense"),
    [categories]
  );

  const summary = useMemo(() => {
    const list = budgets ?? [];
    const totalBudget = list.reduce((s, b) => s + Number(b.amount), 0);
    const totalSpent = list.reduce((s, b) => s + Number(b.spent), 0);
    return {
      totalBudget,
      totalSpent,
      remaining: Math.max(0, totalBudget - totalSpent),
      progress: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
    };
  }, [budgets]);

  const isCurrentPeriod =
    year === today.getFullYear() && month === today.getMonth() + 1;

  const onPrev = () => {
    let y = year;
    let m = month - 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    setYear(y);
    setMonth(m);
  };
  const onNext = () => {
    let y = year;
    let m = month + 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setYear(y);
    setMonth(m);
  };

  if (isLoading) return <PageSpinner />;

  const onCreate = () => {
    setEditing(null);
    setOpen(true);
  };
  const onEdit = (b: Budget) => {
    setEditing(b);
    setOpen(true);
  };
  const onDelete = async (b: Budget) => {
    if (!confirm(`¿Eliminar el presupuesto de ${b.category_name}?`)) return;
    try {
      await remove.mutateAsync(b.id);
      toast.success("Presupuesto eliminado");
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const periodLabel = format(new Date(year, month - 1, 1), "MMMM yyyy", { locale: es });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fg">Presupuestos</h1>
          <p className="text-sm text-fg-muted mt-1">
            Definí límites mensuales y recibí alertas de sobreconsumo.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={onCreate}>
          Nuevo presupuesto
        </Button>
      </div>

      {/* Alertas activas (mes actual) */}
      {isCurrentPeriod && alerts && alerts.length > 0 && (
        <Card className="border-warning/50 bg-warning-soft/40 dark:bg-warning/5">
          <CardBody className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <p className="text-sm font-semibold text-fg">
                {alerts.length === 1 ? "1 alerta activa" : `${alerts.length} alertas activas`}
              </p>
            </div>
            <ul className="space-y-1 text-sm text-fg-muted">
              {alerts.map((a) => (
                <li key={a.budget_id} className="flex items-start gap-2">
                  <span
                    className={
                      a.status === "exceeded"
                        ? "mt-0.5 h-1.5 w-1.5 rounded-full bg-danger"
                        : "mt-0.5 h-1.5 w-1.5 rounded-full bg-warning"
                    }
                  />
                  {a.message}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {/* Period switcher + summary */}
      <Card>
        <CardBody className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={onPrev} aria-label="Mes anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[140px] text-center">
              <p className="text-sm font-semibold text-fg capitalize">{periodLabel}</p>
              {isCurrentPeriod && <p className="text-xs text-brand-600">Mes actual</p>}
            </div>
            <Button variant="outline" size="icon" onClick={onNext} aria-label="Mes siguiente">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 grid grid-cols-3 gap-3 text-center sm:text-left">
            <div>
              <p className="text-xs text-fg-subtle uppercase">Presupuesto</p>
              <p className="font-semibold text-fg">{fmt(summary.totalBudget)}</p>
            </div>
            <div>
              <p className="text-xs text-fg-subtle uppercase">Gastado</p>
              <p className="font-semibold text-fg">{fmt(summary.totalSpent)}</p>
            </div>
            <div>
              <p className="text-xs text-fg-subtle uppercase">Restante</p>
              <p className="font-semibold text-fg">{fmt(summary.remaining)}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* List */}
      {!budgets || budgets.length === 0 ? (
        <Card>
          <EmptyState
            icon={<PiggyBank className="h-6 w-6" />}
            title="Sin presupuestos para este mes"
            description="Definí cuánto querés gastar por categoría y la app te avisará cuando te acerques al límite."
            action={
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={onCreate}>
                Crear presupuesto
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => (
            <BudgetCard
              key={b.id}
              budget={b}
              onEdit={() => onEdit(b)}
              onDelete={() => onDelete(b)}
            />
          ))}
        </div>
      )}

      <BudgetFormModal
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
        defaultYear={year}
        defaultMonth={month}
        categories={expenseCategories}
        loading={create.isPending || update.isPending}
        onSubmit={async (values) => {
          try {
            if (editing) {
              await update.mutateAsync({
                id: editing.id,
                data: {
                  amount: Number(values.amount),
                  alert_threshold: Number(values.alert_threshold),
                },
              });
              toast.success("Presupuesto actualizado");
            } else {
              await create.mutateAsync({
                category_id: values.category_id,
                year,
                month,
                amount: Number(values.amount),
                alert_threshold: Number(values.alert_threshold),
              });
              toast.success("Presupuesto creado");
            }
            setOpen(false);
          } catch (e) {
            toast.error(getApiErrorMessage(e));
          }
        }}
      />
    </div>
  );
}

function BudgetCard({
  budget,
  onEdit,
  onDelete,
}: {
  budget: Budget;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const fmt = useFormatCurrency();
  const status = statusBadge[budget.status];
  const tone = budget.status === "exceeded" ? "danger" : budget.status === "warning" ? "warning" : "brand";

  return (
    <Card>
      <CardHeader
        title={budget.category_name}
        subtitle={`Umbral de alerta: ${budget.alert_threshold}%`}
        action={
          <Badge tone={status.tone}>
            {budget.status === "ok" ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <AlertTriangle className="h-3 w-3" />
            )}
            {status.label}
          </Badge>
        }
      />
      <CardBody>
        <div className="flex items-baseline justify-between">
          <span className="text-xs uppercase tracking-wide text-fg-subtle">Gastado</span>
          <span className="text-xl font-bold text-fg">{fmt(budget.spent)}</span>
        </div>
        <p className="mt-1 text-xs text-fg-subtle">
          de {fmt(budget.amount)}
        </p>
        <ProgressBar value={budget.progress_percent} tone={tone} className="mt-3" />
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-fg-muted">{formatPercent(budget.progress_percent)}</span>
          <span
            className={
              Number(budget.remaining) < 0 ? "font-medium text-danger" : "font-medium text-fg-muted"
            }
          >
            {Number(budget.remaining) < 0 ? (
              <>
                <TrendingUp className="inline h-3 w-3" /> Excedido en{" "}
                {fmt(Math.abs(Number(budget.remaining)))}
              </>
            ) : (
              <>Quedan {fmt(budget.remaining)}</>
            )}
          </span>
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<Pencil className="h-3.5 w-3.5" />} onClick={onEdit}>
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={onDelete}
            className="text-danger hover:bg-danger-soft"
          >
            Eliminar
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function BudgetFormModal({
  open,
  onClose,
  editing,
  defaultYear,
  defaultMonth,
  categories,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  editing: Budget | null;
  defaultYear: number;
  defaultMonth: number;
  categories: Array<{ id: string; name: string }>;
  onSubmit: (v: FormValues) => Promise<void>;
  loading: boolean;
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: editing
      ? {
          category_id: editing.category_id,
          amount: Number(editing.amount),
          alert_threshold: editing.alert_threshold,
        }
      : {
          category_id: categories[0]?.id ?? "",
          amount: 0,
          alert_threshold: 80,
        },
  });

  const periodLabel = format(new Date(defaultYear, defaultMonth - 1, 1), "MMMM yyyy", {
    locale: es,
  });

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={editing ? "Editar presupuesto" : "Nuevo presupuesto"}
      description={editing ? undefined : `Para ${periodLabel}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={loading}>
            {editing ? "Guardar" : "Crear"}
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <Select
          label="Categoría"
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          {...register("category_id")}
          error={errors.category_id?.message}
          disabled={!!editing}
        />
        {categories.length === 0 && (
          <p className="text-xs text-warning">
            Necesitás al menos una categoría de gasto. Creá una en la sección "Categorías".
          </p>
        )}
        <Controller
          name="amount"
          control={control}
          render={({ field, fieldState }) => (
            <CurrencyInput
              label="Monto del presupuesto"
              placeholder="Ej: 500000"
              value={field.value}
              onChange={(raw) => field.onChange(raw === "" ? 0 : Number(raw))}
              onBlur={field.onBlur}
              ref={field.ref}
              error={fieldState.error?.message}
            />
          )}
        />
        <Input
          label="Umbral de alerta (%)"
          type="number"
          min={0}
          max={100}
          hint="Te avisaremos cuando el gasto alcance este porcentaje del presupuesto."
          {...register("alert_threshold")}
          error={errors.alert_threshold?.message}
        />
      </form>
    </Modal>
  );
}
