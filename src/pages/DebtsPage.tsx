import { useState } from "react";
import {
  CreditCard,
  HandCoins,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Receipt,
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
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
import { formatCurrency, formatPercent } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/api";
import {
  useCreateDebt,
  useCreatePayment,
  useDebtPayments,
  useDebtSummary,
  useDebts,
  useDeleteDebt,
  useDeletePayment,
  useUpdateDebt,
} from "@/hooks/useDebts";
import type { Debt, DebtType } from "@/types/api";

const debtTypeLabels: Record<DebtType, string> = {
  loan: "Préstamo",
  credit_card: "Tarjeta de crédito",
};

const debtSchema = z.object({
  name: z.string().min(1, "Requerido").max(120),
  type: z.enum(["loan", "credit_card"]),
  lender: z.string().max(120).optional().or(z.literal("")),
  principal_amount: z.coerce.number().positive("Debe ser mayor a 0"),
  interest_rate: z.coerce.number().min(0).max(999).optional().or(z.literal("" as unknown as number)),
  total_installments: z.coerce.number().int().min(1).max(600).optional().or(z.literal("" as unknown as number)),
  installment_amount: z.coerce.number().positive().optional().or(z.literal("" as unknown as number)),
  start_date: z.string().min(1, "Requerido"),
  due_day: z.coerce.number().int().min(1).max(31).optional().or(z.literal("" as unknown as number)),
});
type DebtForm = z.infer<typeof debtSchema>;

const paymentSchema = z.object({
  amount: z.coerce.number().positive("Debe ser mayor a 0"),
  payment_date: z.string().optional().or(z.literal("")),
  installment_number: z.coerce.number().int().positive().optional().or(z.literal("" as unknown as number)),
  notes: z.string().max(255).optional().or(z.literal("")),
});
type PaymentForm = z.infer<typeof paymentSchema>;

export function DebtsPage() {
  const { data: debts, isLoading } = useDebts();
  const { data: summary } = useDebtSummary();
  const create = useCreateDebt();
  const update = useUpdateDebt();
  const remove = useDeleteDebt();

  const [editing, setEditing] = useState<Debt | null>(null);
  const [open, setOpen] = useState(false);
  const [paymentDebt, setPaymentDebt] = useState<Debt | null>(null);

  if (isLoading) return <PageSpinner />;

  const onCreate = () => {
    setEditing(null);
    setOpen(true);
  };
  const onEdit = (d: Debt) => {
    setEditing(d);
    setOpen(true);
  };
  const onDelete = async (d: Debt) => {
    if (!confirm(`¿Eliminar "${d.name}" y todos sus pagos?`)) return;
    try {
      await remove.mutateAsync(d.id);
      toast.success("Deuda eliminada");
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fg">Deudas</h1>
          <p className="text-sm text-fg-muted mt-1">
            Préstamos, tarjetas y obligaciones financieras.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={onCreate}>
          Nueva deuda
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Deuda total"
          value={formatCurrency(summary?.total_remaining ?? 0)}
          tone="danger"
        />
        <SummaryCard
          label="Capital original"
          value={formatCurrency(summary?.total_principal ?? 0)}
          tone="brand"
        />
        <SummaryCard
          label="Pagado"
          value={formatCurrency(summary?.total_paid ?? 0)}
          tone="success"
        />
        <SummaryCard
          label="Vencidas"
          value={String(summary?.overdue_debts ?? 0)}
          tone={summary?.overdue_debts ? "warning" : "neutral"}
        />
      </div>

      {!debts || debts.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CreditCard className="h-6 w-6" />}
            title="Sin deudas registradas"
            description="Registrá tus préstamos y tarjetas de crédito para hacer seguimiento de cuotas y saldos."
            action={
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={onCreate}>
                Registrar primera deuda
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {debts.map((d) => (
            <DebtCard
              key={d.id}
              debt={d}
              onEdit={() => onEdit(d)}
              onDelete={() => onDelete(d)}
              onPay={() => setPaymentDebt(d)}
            />
          ))}
        </div>
      )}

      <DebtFormModal
        open={open}
        editing={editing}
        loading={create.isPending || update.isPending}
        onClose={() => setOpen(false)}
        onSubmit={async (values) => {
          const payload = {
            name: values.name,
            type: values.type,
            lender: values.lender || null,
            principal_amount: Number(values.principal_amount),
            interest_rate: values.interest_rate ? Number(values.interest_rate) : null,
            total_installments: values.total_installments
              ? Number(values.total_installments)
              : null,
            installment_amount: values.installment_amount
              ? Number(values.installment_amount)
              : null,
            start_date: values.start_date,
            due_day: values.due_day ? Number(values.due_day) : null,
          };
          try {
            if (editing) {
              await update.mutateAsync({ id: editing.id, data: payload });
              toast.success("Deuda actualizada");
            } else {
              await create.mutateAsync(payload);
              toast.success("Deuda registrada");
            }
            setOpen(false);
          } catch (e) {
            toast.error(getApiErrorMessage(e));
          }
        }}
      />

      <PaymentModal
        debt={paymentDebt}
        onClose={() => setPaymentDebt(null)}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "brand",
}: {
  label: string;
  value: string;
  tone?: "brand" | "success" | "danger" | "warning" | "neutral";
}) {
  const bg = {
    brand: "bg-brand-50 dark:bg-brand-500/10",
    success: "bg-success-soft dark:bg-success/10",
    danger: "bg-danger-soft dark:bg-danger/10",
    warning: "bg-warning-soft dark:bg-warning/10",
    neutral: "bg-bg-muted",
  } as const;
  return (
    <Card className={`${bg[tone]} border-0`}>
      <div className="p-4">
        <p className="text-xs text-fg-muted">{label}</p>
        <p className="mt-1 text-xl font-bold text-fg">{value}</p>
      </div>
    </Card>
  );
}

function DebtCard({
  debt,
  onEdit,
  onDelete,
  onPay,
}: {
  debt: Debt;
  onEdit: () => void;
  onDelete: () => void;
  onPay: () => void;
}) {
  const Icon = debt.type === "credit_card" ? CreditCard : HandCoins;
  const remaining = Number(debt.remaining_balance);
  const isPaid = remaining <= 0;
  const isOverdue =
    debt.next_due_date && new Date(debt.next_due_date) < new Date() && !isPaid;

  let progressTone: "brand" | "success" | "warning" = "brand";
  if (isPaid) progressTone = "success";
  else if (isOverdue) progressTone = "warning";

  return (
    <Card className="hover:shadow-pop transition-shadow">
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-brand-600" />
            {debt.name}
          </div>
        }
        subtitle={debt.lender ?? debtTypeLabels[debt.type]}
        action={
          <div className="flex items-center gap-2">
            {isPaid ? (
              <Badge tone="success">
                <CheckCircle2 className="h-3 w-3" />
                Saldada
              </Badge>
            ) : isOverdue ? (
              <Badge tone="warning">
                <AlertTriangle className="h-3 w-3" />
                Vencida
              </Badge>
            ) : (
              <Badge tone="brand">{debtTypeLabels[debt.type]}</Badge>
            )}
          </div>
        }
      />
      <CardBody>
        <div className="flex items-baseline justify-between">
          <span className="text-xs uppercase tracking-wide text-fg-subtle">
            Saldo pendiente
          </span>
          <span className={isPaid ? "text-xl font-bold text-success" : "text-xl font-bold text-fg"}>
            {formatCurrency(debt.remaining_balance)}
          </span>
        </div>
        <p className="mt-1 text-xs text-fg-subtle">
          de {formatCurrency(debt.principal_amount)} · pagado{" "}
          {formatCurrency(debt.total_paid)}
        </p>
        <ProgressBar value={debt.progress_percent} tone={progressTone} className="mt-3" />
        <div className="mt-3 flex items-center justify-between text-xs text-fg-muted">
          <span>{formatPercent(debt.progress_percent)} pagado</span>
          {debt.total_installments && (
            <span>
              {debt.installments_paid}/{debt.total_installments} cuotas
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          {debt.next_due_date && (
            <Field
              icon={<Calendar className="h-3 w-3" />}
              label="Próx. vencimiento"
              value={format(parseISO(debt.next_due_date), "d MMM yyyy", { locale: es })}
            />
          )}
          {debt.installment_amount && (
            <Field
              icon={<Receipt className="h-3 w-3" />}
              label="Cuota"
              value={formatCurrency(debt.installment_amount)}
            />
          )}
          {debt.interest_rate != null && Number(debt.interest_rate) > 0 && (
            <Field label="Interés" value={`${debt.interest_rate}%`} />
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={onPay}
            disabled={isPaid}
          >
            Registrar pago
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Pencil className="h-3.5 w-3.5" />}
            onClick={onEdit}
          >
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

function Field({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-bg-subtle p-2">
      <p className="flex items-center gap-1 text-fg-subtle uppercase tracking-wide">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 font-medium text-fg">{value}</p>
    </div>
  );
}

function DebtFormModal({
  open,
  onClose,
  editing,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  editing: Debt | null;
  onSubmit: (v: DebtForm) => Promise<void>;
  loading: boolean;
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<DebtForm>({
    resolver: zodResolver(debtSchema),
    values: editing
      ? ({
          name: editing.name,
          type: editing.type,
          lender: editing.lender ?? "",
          principal_amount: Number(editing.principal_amount),
          interest_rate: editing.interest_rate ? Number(editing.interest_rate) : ("" as unknown as number),
          total_installments: editing.total_installments ?? ("" as unknown as number),
          installment_amount: editing.installment_amount ? Number(editing.installment_amount) : ("" as unknown as number),
          start_date: editing.start_date,
          due_day: editing.due_day ?? ("" as unknown as number),
        } as DebtForm)
      : ({
          name: "",
          type: "loan",
          lender: "",
          principal_amount: 0,
          interest_rate: "" as unknown as number,
          total_installments: "" as unknown as number,
          installment_amount: "" as unknown as number,
          start_date: format(new Date(), "yyyy-MM-dd"),
          due_day: "" as unknown as number,
        } as DebtForm),
  });

  const type = watch("type");

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={editing ? "Editar deuda" : "Nueva deuda"}
      description="Cargá los datos del préstamo o tarjeta."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={loading}>
            {editing ? "Guardar" : "Registrar"}
          </Button>
        </>
      }
    >
      <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Nombre"
          placeholder="Ej: Préstamo personal"
          {...register("name")}
          error={errors.name?.message}
          className="sm:col-span-2"
        />
        <Select
          label="Tipo"
          options={[
            { value: "loan", label: "Préstamo" },
            { value: "credit_card", label: "Tarjeta de crédito" },
          ]}
          {...register("type")}
        />
        <Input
          label="Acreedor"
          placeholder="Ej: Banco Itaú"
          {...register("lender")}
        />
        <Controller
          name="principal_amount"
          control={control}
          render={({ field, fieldState }) => (
            <CurrencyInput
              label={type === "credit_card" ? "Límite / saldo" : "Capital"}
              placeholder="Ej: 5000000"
              value={field.value}
              onChange={(raw) => field.onChange(raw === "" ? 0 : Number(raw))}
              onBlur={field.onBlur}
              ref={field.ref}
              error={fieldState.error?.message}
            />
          )}
        />
        <Input
          label="Tasa de interés (%)"
          type="number"
          step="0.001"
          placeholder="Opcional"
          {...register("interest_rate")}
        />
        {type === "loan" && (
          <>
            <Input
              label="Cant. de cuotas"
              type="number"
              placeholder="Opcional"
              {...register("total_installments")}
            />
            <Controller
              name="installment_amount"
              control={control}
              render={({ field, fieldState }) => (
                <CurrencyInput
                  label="Monto de cuota"
                  placeholder="Opcional"
                  value={field.value as number | undefined}
                  onChange={(raw) => field.onChange(raw === "" ? ("" as unknown as number) : Number(raw))}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  error={fieldState.error?.message}
                />
              )}
            />
          </>
        )}
        <Input
          label="Fecha de inicio"
          type="date"
          {...register("start_date")}
          error={errors.start_date?.message}
        />
        <Input
          label="Día de pago (1-31)"
          type="number"
          min={1}
          max={31}
          placeholder="Opcional"
          {...register("due_day")}
        />
      </form>
    </Modal>
  );
}

function PaymentModal({ debt, onClose }: { debt: Debt | null; onClose: () => void }) {
  const { data: payments } = useDebtPayments(debt?.id ?? null);
  const create = useCreatePayment();
  const remove = useDeletePayment();

  const {
    register,
    control,
    handleSubmit,
    reset,
  } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      payment_date: format(new Date(), "yyyy-MM-dd"),
      installment_number: "" as unknown as number,
      notes: "",
    },
  });

  const onSubmit = async (values: PaymentForm) => {
    if (!debt) return;
    try {
      await create.mutateAsync({
        debtId: debt.id,
        data: {
          amount: Number(values.amount),
          payment_date: values.payment_date
            ? new Date(values.payment_date).toISOString()
            : null,
          installment_number: values.installment_number
            ? Number(values.installment_number)
            : null,
          notes: values.notes || null,
        },
      });
      toast.success("Pago registrado");
      reset({
        amount: 0,
        payment_date: format(new Date(), "yyyy-MM-dd"),
        installment_number: "" as unknown as number,
        notes: "",
      });
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const onDeletePayment = async (paymentId: string) => {
    if (!debt) return;
    if (!confirm("¿Eliminar este pago?")) return;
    try {
      await remove.mutateAsync({ debtId: debt.id, paymentId });
      toast.success("Pago eliminado");
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  return (
    <Modal
      open={!!debt}
      onClose={() => {
        reset();
        onClose();
      }}
      title={debt ? `Pagos · ${debt.name}` : ""}
      description={
        debt
          ? `Saldo pendiente: ${formatCurrency(debt.remaining_balance)}`
          : ""
      }
      size="lg"
    >
      <form className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={handleSubmit(onSubmit)}>
        <Controller
          name="amount"
          control={control}
          render={({ field, fieldState }) => (
            <CurrencyInput
              label="Monto"
              placeholder="Ej: 150000"
              value={field.value}
              onChange={(raw) => field.onChange(raw === "" ? 0 : Number(raw))}
              onBlur={field.onBlur}
              ref={field.ref}
              error={fieldState.error?.message}
            />
          )}
        />
        <Input label="Fecha" type="date" {...register("payment_date")} />
        <Input
          label="N° cuota"
          type="number"
          placeholder="Opcional"
          {...register("installment_number")}
        />
        <Input
          label="Notas"
          placeholder="Opcional"
          {...register("notes")}
        />
        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" loading={create.isPending} leftIcon={<Plus className="h-4 w-4" />}>
            Registrar pago
          </Button>
        </div>
      </form>

      <div className="mt-6">
        <h4 className="text-sm font-semibold text-fg mb-2">Historial de pagos</h4>
        {!payments || payments.length === 0 ? (
          <p className="text-sm text-fg-subtle py-4 text-center">
            Aún no hay pagos registrados.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3 bg-surface">
                <div className="rounded-full bg-success-soft text-success p-2 dark:bg-success/15">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-fg">
                    {formatCurrency(p.amount)}
                    {p.installment_number ? ` · cuota ${p.installment_number}` : ""}
                  </p>
                  <p className="text-xs text-fg-subtle">
                    {format(parseISO(p.payment_date), "d MMM yyyy", { locale: es })}
                    {p.notes ? ` — ${p.notes}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => onDeletePayment(p.id)}
                  className="rounded-md p-1.5 text-fg-subtle hover:bg-danger-soft hover:text-danger"
                  aria-label="Eliminar pago"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
