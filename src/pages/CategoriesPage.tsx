import { useState } from "react";
import { Plus, Tag, Tags, ArrowDownRight, ArrowUpRight } from "lucide-react";
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
import { useCategories, useCreateCategory } from "@/hooks/useCategories";
import { getApiErrorMessage } from "@/lib/api";

const schema = z.object({
  name: z.string().min(1, "Requerido").max(60),
  type: z.enum(["income", "expense"]),
});
type FormValues = z.infer<typeof schema>;

export function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const create = useCreateCategory();
  const [open, setOpen] = useState(false);

  if (isLoading) return <PageSpinner />;

  const incomes = (categories ?? []).filter((c) => c.type === "income");
  const expenses = (categories ?? []).filter((c) => c.type === "expense");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fg">Categorías</h1>
          <p className="text-sm text-fg-muted mt-1">
            Organizá tus movimientos por tipo de gasto o ingreso.
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
          Nueva categoría
        </Button>
      </div>

      {!categories || categories.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Tags className="h-6 w-6" />}
            title="Sin categorías todavía"
            description='Creá categorías como "Comida", "Transporte" o "Sueldo" para clasificar tus movimientos.'
            action={
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>
                Crear primera categoría
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <ArrowDownRight className="h-4 w-4 text-success" />
                  Ingresos
                </div>
              }
              subtitle={`${incomes.length} categoría(s)`}
            />
            <CardBody className="p-3">
              {incomes.length === 0 ? (
                <p className="px-3 py-6 text-sm text-fg-subtle text-center">
                  Sin categorías de ingreso.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {incomes.map((c) => (
                    <Badge key={c.id} tone="success" className="px-3 py-1.5">
                      <Tag className="h-3 w-3" />
                      {c.name}
                    </Badge>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title={
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-danger" />
                  Gastos
                </div>
              }
              subtitle={`${expenses.length} categoría(s)`}
            />
            <CardBody className="p-3">
              {expenses.length === 0 ? (
                <p className="px-3 py-6 text-sm text-fg-subtle text-center">
                  Sin categorías de gasto.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {expenses.map((c) => (
                    <Badge key={c.id} tone="danger" className="px-3 py-1.5">
                      <Tag className="h-3 w-3" />
                      {c.name}
                    </Badge>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      <CategoryFormModal
        open={open}
        onClose={() => setOpen(false)}
        loading={create.isPending}
        onSubmit={async (values) => {
          try {
            await create.mutateAsync(values);
            toast.success("Categoría creada");
            setOpen(false);
          } catch (e) {
            toast.error(getApiErrorMessage(e));
          }
        }}
      />
    </div>
  );
}

function CategoryFormModal({
  open,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (v: FormValues) => Promise<void>;
  loading: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", type: "expense" },
  });
  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Nueva categoría"
      description="Clasificá tus ingresos y gastos."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={loading}>
            Crear
          </Button>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Nombre"
          placeholder="Ej: Comida"
          {...register("name")}
          error={errors.name?.message}
        />
        <Select
          label="Tipo"
          options={[
            { value: "expense", label: "Gasto" },
            { value: "income", label: "Ingreso" },
          ]}
          {...register("type")}
        />
      </form>
    </Modal>
  );
}
