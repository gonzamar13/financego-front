import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  ChevronDown,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useForm, Controller, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import {
  useCreateTransaction,
  useDeleteTransaction,
  useTransactions,
  useUpdateTransaction,
} from "@/hooks/useTransactions";
import type { Transaction, TransactionType } from "@/types/api";

const schema = z.object({
  account_id: z.string().min(1, "Seleccioná una cuenta"),
  category_id: z.string().optional().or(z.literal("")),
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive("Debe ser mayor a 0"),
  description: z.string().max(255).optional().or(z.literal("")),
  transaction_date: z.string().optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

export function TransactionsPage() {
  const { data: transactions, isLoading } = useTransactions();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const remove = useDeleteTransaction();

  const [searchParams, setSearchParams] = useSearchParams();
  const [quickOpen, setQuickOpen] = useState(false);
  const [fullOpen, setFullOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");

  useEffect(() => {
    if (searchParams.get("new")) {
      setEditing(null);
      setQuickOpen(true);
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const accountById = useMemo(
    () => new Map((accounts ?? []).map((a) => [a.id, a])),
    [accounts]
  );
  const catById = useMemo(
    () => new Map((categories ?? []).map((c) => [c.id, c])),
    [categories]
  );

  // Categorías más usadas por tipo (últimas 50 transacciones)
  const recentCatIds = useMemo(() => {
    if (!transactions) return { expense: [] as string[], income: [] as string[] };
    const counts: Record<"expense" | "income", Map<string, number>> = {
      expense: new Map(),
      income: new Map(),
    };
    [...transactions]
      .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
      .slice(0, 50)
      .forEach((t) => {
        if (!t.category_id) return;
        const map = counts[t.type as "expense" | "income"];
        map.set(t.category_id, (map.get(t.category_id) ?? 0) + 1);
      });
    const top = (map: Map<string, number>) =>
      [...map.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([id]) => id);
    return { expense: top(counts.expense), income: top(counts.income) };
  }, [transactions]);

  const filtered = useMemo(() => {
    if (!transactions) return [];
    let arr = [...transactions];
    if (typeFilter !== "all") arr = arr.filter((t) => t.type === typeFilter);
    if (accountFilter !== "all")
      arr = arr.filter((t) => t.account_id === accountFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(
        (t) =>
          (t.description ?? "").toLowerCase().includes(q) ||
          (catById.get(t.category_id ?? "")?.name ?? "").toLowerCase().includes(q) ||
          (accountById.get(t.account_id)?.account_name ?? "").toLowerCase().includes(q)
      );
    }
    arr.sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));
    return arr;
  }, [transactions, typeFilter, accountFilter, search, catById, accountById]);

  if (isLoading) return <PageSpinner />;

  const onEdit = (t: Transaction) => {
    setEditing(t);
    setFullOpen(true);
  };
  const onDelete = async (t: Transaction) => {
    if (!confirm("¿Eliminar este movimiento?")) return;
    try {
      await remove.mutateAsync(t.id);
      toast.success("Movimiento eliminado");
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const handleCreate = async (values: FormValues) => {
    try {
      const payload = {
        account_id: values.account_id,
        category_id: values.category_id || null,
        type: values.type,
        amount: values.amount,
        description: values.description || null,
        transaction_date: values.transaction_date
          ? new Date(values.transaction_date).toISOString()
          : null,
      };
      await create.mutateAsync(payload);
      toast.success("Movimiento registrado");
      setQuickOpen(false);
      setFullOpen(false);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const handleUpdate = async (values: FormValues) => {
    if (!editing) return;
    try {
      const payload = {
        account_id: values.account_id,
        category_id: values.category_id || null,
        type: values.type,
        amount: values.amount,
        description: values.description || null,
        transaction_date: values.transaction_date
          ? new Date(values.transaction_date).toISOString()
          : null,
      };
      await update.mutateAsync({ id: editing.id, data: payload });
      toast.success("Movimiento actualizado");
      setFullOpen(false);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fg">Movimientos</h1>
          <p className="text-sm text-fg-muted mt-1">
            Todos tus ingresos y gastos en un solo lugar.
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => { setEditing(null); setQuickOpen(true); }}
        >
          Nuevo
        </Button>
      </div>

      <Card>
        <CardBody className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Buscar por descripción, cuenta, categoría..."
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            options={[
              { value: "all", label: "Todos los tipos" },
              { value: "income", label: "Ingresos" },
              { value: "expense", label: "Gastos" },
            ]}
          />
          <Select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            options={[
              { value: "all", label: "Todas las cuentas" },
              ...(accounts ?? []).map((a) => ({
                value: a.id,
                label: a.account_name,
              })),
            ]}
          />
        </CardBody>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<ArrowLeftRight className="h-6 w-6" />}
            title="Sin movimientos"
            description={
              transactions?.length
                ? "Ningún movimiento coincide con los filtros."
                : "Registrá tu primer ingreso o gasto."
            }
            action={
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => { setEditing(null); setQuickOpen(true); }}
              >
                Nuevo movimiento
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((t) => {
              const acc = accountById.get(t.account_id);
              const cat = t.category_id ? catById.get(t.category_id) : null;
              const isIncome = t.type === "income";
              return (
                <li
                  key={t.id}
                  className="flex items-center gap-3 px-5 py-4 hover:bg-bg-subtle transition-colors"
                >
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-fg truncate">
                        {t.description || (cat?.name ?? "Movimiento")}
                      </p>
                      {cat && (
                        <Badge tone={isIncome ? "success" : "danger"}>{cat.name}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-fg-subtle">
                      {acc?.account_name ?? "—"} ·{" "}
                      {format(parseISO(t.transaction_date), "d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                  <span
                    className={
                      isIncome
                        ? "text-sm font-semibold text-success whitespace-nowrap"
                        : "text-sm font-semibold text-danger whitespace-nowrap"
                    }
                  >
                    {isIncome ? "+" : "−"}
                    {formatCurrency(t.amount)}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEdit(t)}
                      className="rounded-md p-1.5 text-fg-subtle hover:bg-bg-muted hover:text-fg"
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(t)}
                      className="rounded-md p-1.5 text-fg-subtle hover:bg-danger-soft hover:text-danger"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Modal rápido para nuevas transacciones */}
      <QuickAddModal
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        onSwitchToFull={() => { setQuickOpen(false); setFullOpen(true); }}
        accounts={accounts ?? []}
        categories={categories ?? []}
        recentCatIds={recentCatIds}
        loading={create.isPending}
        onSubmit={handleCreate}
      />

      {/* Modal completo para edición */}
      <TxFormModal
        open={fullOpen}
        onClose={() => { setFullOpen(false); setEditing(null); }}
        editing={editing}
        accounts={accounts ?? []}
        categories={categories ?? []}
        loading={create.isPending || update.isPending}
        onSubmit={editing ? handleUpdate : handleCreate}
      />
    </div>
  );
}

// ─── Quick Add Modal ──────────────────────────────────────────────────────────

function QuickAddModal({
  open,
  onClose,
  onSwitchToFull,
  accounts,
  categories,
  recentCatIds,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onSwitchToFull: () => void;
  accounts: Array<{ id: string; account_name: string }>;
  categories: Array<{ id: string; name: string; type: string }>;
  recentCatIds: { expense: string[]; income: string[] };
  onSubmit: (v: FormValues) => Promise<void>;
  loading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      account_id: accounts[0]?.id ?? "",
      category_id: "",
      type: "expense",
      amount: 0,
      description: "",
      transaction_date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  // Resetear al abrir (siempre fecha de hoy)
  useEffect(() => {
    if (open) {
      reset({
        account_id: accounts[0]?.id ?? "",
        category_id: "",
        type: "expense",
        amount: 0,
        description: "",
        transaction_date: format(new Date(), "yyyy-MM-dd"),
      });
      setExpanded(false);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const type = watch("type");
  const categoryId = watch("category_id");

  // Categorías para chips: las más usadas del tipo actual, en orden de uso
  const chipCats = useMemo(() => {
    const ids = recentCatIds[type as "expense" | "income"] ?? [];
    if (ids.length > 0) {
      return ids
        .map((id) => categories.find((c) => c.id === id && c.type === type))
        .filter(Boolean) as Array<{ id: string; name: string; type: string }>;
    }
    // Fallback: todas las categorías del tipo si no hay historial
    return categories.filter((c) => c.type === type).slice(0, 8);
  }, [recentCatIds, type, categories]);

  const handleClose = () => {
    reset();
    setExpanded(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nuevo movimiento"
      size="sm"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <button
            type="button"
            onClick={onSwitchToFull}
            className="text-xs text-fg-muted hover:text-fg underline-offset-2 hover:underline transition-colors"
          >
            Modo completo
          </button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit(onSubmit)} loading={loading}>
              Registrar
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Toggle tipo */}
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-bg-muted p-1">
          <TypePill register={register} value="expense" current={type} label="Gasto" />
          <TypePill register={register} value="income" current={type} label="Ingreso" />
        </div>

        {/* Monto — autofocus */}
        <Controller
          name="amount"
          control={control}
          render={({ field, fieldState }) => (
            <CurrencyInput
              label="Monto"
              placeholder="0"
              autoFocus
              value={field.value}
              onChange={(raw) => field.onChange(raw === "" ? 0 : Number(raw))}
              onBlur={field.onBlur}
              ref={field.ref}
              error={fieldState.error?.message}
            />
          )}
        />

        {/* Categorías — chips de acceso rápido */}
        {chipCats.length > 0 && (
          <div>
            <p className="text-xs font-medium text-fg-muted mb-2">Categoría</p>
            <div className="flex flex-wrap gap-2">
              {chipCats.map((c) => {
                const active = categoryId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      setValue("category_id", active ? "" : c.id, {
                        shouldValidate: true,
                      })
                    }
                    className={cn(
                      "text-sm px-3 py-1.5 rounded-full border font-medium transition-colors",
                      active
                        ? type === "expense"
                          ? "bg-danger text-white border-danger"
                          : "bg-success text-white border-success"
                        : "bg-bg-subtle border-border text-fg hover:border-brand-400"
                    )}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Cuenta */}
        <Select
          label="Cuenta"
          options={accounts.map((a) => ({ value: a.id, label: a.account_name }))}
          {...register("account_id")}
          error={errors.account_id?.message}
        />

        {/* Más opciones */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 hover:underline underline-offset-2 transition-colors self-start"
        >
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")}
          />
          {expanded ? "Menos opciones" : "Más opciones"}
        </button>

        {expanded && (
          <div className="flex flex-col gap-4 border-t border-border pt-4">
            <Input
              label="Descripción"
              placeholder="Ej: Compra del super"
              {...register("description")}
            />
            <Input label="Fecha" type="date" {...register("transaction_date")} />
            {/* Selector completo de categorías (alternativa a chips) */}
            <Select
              label="Categoría (todas)"
              options={[
                { value: "", label: "Sin categoría" },
                ...categories
                  .filter((c) => c.type === type)
                  .map((c) => ({ value: c.id, label: c.name })),
              ]}
              {...register("category_id")}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Full Form Modal (edición) ────────────────────────────────────────────────

function TxFormModal({
  open,
  onClose,
  editing,
  accounts,
  categories,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  editing: Transaction | null;
  accounts: Array<{ id: string; account_name: string }>;
  categories: Array<{ id: string; name: string; type: string }>;
  onSubmit: (v: FormValues) => Promise<void>;
  loading: boolean;
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: editing
      ? {
          account_id: editing.account_id,
          category_id: editing.category_id ?? "",
          type: editing.type,
          amount: Number(editing.amount),
          description: editing.description ?? "",
          transaction_date: editing.transaction_date.slice(0, 10),
        }
      : {
          account_id: accounts[0]?.id ?? "",
          category_id: "",
          type: "expense",
          amount: 0,
          description: "",
          transaction_date: format(new Date(), "yyyy-MM-dd"),
        },
  });

  const type = watch("type");
  const filteredCats = categories.filter((c) => c.type === type);

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={editing ? "Editar movimiento" : "Nuevo movimiento"}
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
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-bg-muted p-1">
          <TypePill register={register} value="expense" current={type} label="Gasto" />
          <TypePill register={register} value="income" current={type} label="Ingreso" />
        </div>
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
        <Select
          label="Cuenta"
          options={accounts.map((a) => ({ value: a.id, label: a.account_name }))}
          {...register("account_id")}
          error={errors.account_id?.message}
        />
        <Select
          label="Categoría"
          placeholder="Sin categoría"
          options={[
            { value: "", label: "Sin categoría" },
            ...filteredCats.map((c) => ({ value: c.id, label: c.name })),
          ]}
          {...register("category_id")}
        />
        <Input
          label="Descripción"
          placeholder="Ej: Compra del super"
          {...register("description")}
        />
        <Input label="Fecha" type="date" {...register("transaction_date")} />
      </form>
    </Modal>
  );
}

// ─── TypePill ────────────────────────────────────────────────────────────────

function TypePill({
  register,
  value,
  current,
  label,
}: {
  register: UseFormRegister<FormValues>;
  value: "income" | "expense";
  current: string;
  label: string;
}) {
  const active = current === value;
  const tone =
    value === "income"
      ? active
        ? "bg-success text-white"
        : "text-success"
      : active
        ? "bg-danger text-white"
        : "text-danger";
  return (
    <label
      className={`cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-center transition-colors ${tone}`}
    >
      <input type="radio" value={value} {...register("type")} className="sr-only" />
      {label}
    </label>
  );
}
