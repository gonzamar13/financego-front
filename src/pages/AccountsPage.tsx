import { useState } from "react";
import {
  Plus,
  Wallet,
  Building2,
  Coins,
  Pencil,
  Trash2,
  Banknote,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/api";
import {
  useAccounts,
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
} from "@/hooks/useAccounts";
import { useAccountBalances } from "@/hooks/useTransactions";
import type { Account, AccountType } from "@/types/api";

const typeLabels: Record<AccountType, string> = {
  bank: "Banco",
  financial: "Financiera",
  cooperative: "Cooperativa",
  cash: "Efectivo",
};

const typeIcons: Record<AccountType, React.ComponentType<{ className?: string }>> = {
  bank: Building2,
  financial: Banknote,
  cooperative: Wallet,
  cash: Coins,
};

const typeOptions = (Object.keys(typeLabels) as AccountType[]).map((v) => ({
  value: v,
  label: typeLabels[v],
}));

const schema = z
  .object({
    account_name: z.string().min(1, "Requerido").max(100),
    type: z.enum(["bank", "financial", "cooperative", "cash"]),
    financial_institution: z.string().max(100).optional().or(z.literal("")),
    account_number: z.string().max(50).optional().or(z.literal("")),
  })
  .refine(
    (v) =>
      v.type === "cash" ||
      (!!v.financial_institution && !!v.account_number),
    {
      message: "Institución y número son obligatorios",
      path: ["financial_institution"],
    }
  );

type FormValues = z.infer<typeof schema>;

export function AccountsPage() {
  const { data: accounts, isLoading } = useAccounts();
  const { data: balances } = useAccountBalances();
  const create = useCreateAccount();
  const update = useUpdateAccount();
  const remove = useDeleteAccount();

  const [editing, setEditing] = useState<Account | null>(null);
  const [open, setOpen] = useState(false);

  const balanceById = new Map((balances ?? []).map((b) => [b.account_id, b]));

  const onCreate = () => {
    setEditing(null);
    setOpen(true);
  };
  const onEdit = (acc: Account) => {
    setEditing(acc);
    setOpen(true);
  };
  const onDelete = async (acc: Account) => {
    if (!confirm(`¿Desactivar la cuenta "${acc.account_name}"?`)) return;
    try {
      await remove.mutateAsync(acc.id);
      toast.success("Cuenta desactivada");
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fg">Cuentas</h1>
          <p className="text-sm text-fg-muted mt-1">
            Gestioná dónde tenés tu dinero.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={onCreate}>
          Nueva cuenta
        </Button>
      </div>

      {!accounts || accounts.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Wallet className="h-6 w-6" />}
            title="Aún no creaste cuentas"
            description="Las cuentas representan dónde tenés tu dinero: banco, financiera, efectivo, etc."
            action={
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={onCreate}>
                Crear primera cuenta
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const Icon = typeIcons[acc.type];
            const bal = balanceById.get(acc.id);
            return (
              <Card key={acc.id} className="hover:shadow-pop transition-shadow">
                <CardHeader
                  title={
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-brand-600" />
                      {acc.account_name}
                    </div>
                  }
                  subtitle={acc.financial_institution ?? "—"}
                  action={<Badge tone="brand">{typeLabels[acc.type]}</Badge>}
                />
                <CardBody>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs uppercase tracking-wide text-fg-subtle">
                      Balance
                    </span>
                    <span className="text-xl font-bold text-fg">
                      {formatCurrency(bal?.balance ?? 0)}
                    </span>
                  </div>
                  {acc.account_number && (
                    <p className="mt-2 text-xs text-fg-subtle font-mono">
                      N° {acc.account_number}
                    </p>
                  )}
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Pencil className="h-3.5 w-3.5" />}
                      onClick={() => onEdit(acc)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                      onClick={() => onDelete(acc)}
                      className="text-danger hover:bg-danger-soft"
                    >
                      Eliminar
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <AccountFormModal
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
        onSubmit={async (values) => {
          try {
            if (editing) {
              await update.mutateAsync({
                id: editing.id,
                data: {
                  account_name: values.account_name,
                  type: values.type,
                  financial_institution: values.financial_institution || null,
                  account_number: values.account_number || null,
                },
              });
              toast.success("Cuenta actualizada");
            } else {
              await create.mutateAsync({
                account_name: values.account_name,
                type: values.type,
                financial_institution: values.financial_institution || null,
                account_number: values.account_number || null,
              });
              toast.success("Cuenta creada");
            }
            setOpen(false);
          } catch (e) {
            toast.error(getApiErrorMessage(e));
          }
        }}
        loading={create.isPending || update.isPending}
      />
    </div>
  );
}

function AccountFormModal({
  open,
  onClose,
  editing,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  editing: Account | null;
  onSubmit: (values: FormValues) => Promise<void>;
  loading: boolean;
}) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: editing
      ? {
          account_name: editing.account_name,
          type: editing.type,
          financial_institution: editing.financial_institution ?? "",
          account_number: editing.account_number ?? "",
        }
      : { account_name: "", type: "bank", financial_institution: "", account_number: "" },
  });

  const type = watch("type");

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={editing ? "Editar cuenta" : "Nueva cuenta"}
      description="Definí dónde está tu dinero."
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
        <Input
          label="Nombre"
          placeholder="Ej: Cuenta sueldo"
          {...register("account_name")}
          error={errors.account_name?.message}
        />
        <Select label="Tipo" options={typeOptions} {...register("type")} />
        {type !== "cash" && (
          <>
            <Input
              label="Institución"
              placeholder="Ej: Banco Itaú"
              {...register("financial_institution")}
              error={errors.financial_institution?.message}
            />
            <Input
              label="Número de cuenta"
              placeholder="0000-0000"
              {...register("account_number")}
              error={errors.account_number?.message}
            />
          </>
        )}
      </form>
    </Modal>
  );
}
