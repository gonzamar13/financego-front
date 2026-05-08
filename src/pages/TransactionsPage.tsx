import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/api";
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
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");

  useEffect(() => {
    if (searchParams.get("new")) {
      setEditing(null);
      setOpen(true);
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

  const onCreate = () => {
    setEditing(null);
    setOpen(true);
  };
  const onEdit = (t: Transaction) => {
    setEditing(t);
    setOpen(true);
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fg">Movimientos</h1>
          <p className="text-sm text-fg-muted mt-1">
            Todos tus ingresos y gastos en un solo lugar.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={onCreate}>
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
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={onCreate}>
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

      <TxFormModal
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
        accounts={accounts ?? []}
        categories={categories ?? []}
        loading={create.isPending || update.isPending}
        onSubmit={async (values) => {
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
            if (editing) {
              await update.mutateAsync({ id: editing.id, data: payload });
              toast.success("Movimiento actualizado");
            } else {
              await create.mutateAsync(payload);
              toast.success("Movimiento registrado");
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
        <Input
          label="Monto"
          type="number"
          step="0.01"
          placeholder="0.00"
          {...register("amount")}
          error={errors.amount?.message}
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

function TypePill({
  register,
  value,
  current,
  label,
}: {
  register: ReturnType<typeof useForm<FormValues>>["register"];
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
