import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/providers/AuthProvider";
import { getApiErrorMessage } from "@/lib/api";
import type { DocumentType } from "@/types/api";

const schema = z.object({
  first_name: z.string().min(1, "Requerido"),
  last_name: z.string().min(1, "Requerido"),
  username: z.string().min(3, "Mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  document_type: z.enum(["CI", "DNI", "PASSPORT", "RUC"]),
  document_number: z.string().min(3, "Requerido"),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});
type FormValues = z.infer<typeof schema>;

const docOptions = [
  { value: "CI", label: "Cédula de Identidad" },
  { value: "DNI", label: "DNI" },
  { value: "PASSPORT", label: "Pasaporte" },
  { value: "RUC", label: "RUC" },
];

export function RegisterPage() {
  const { register: doRegister, login } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { document_type: "CI" as DocumentType },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await doRegister(values);
      toast.success("Cuenta creada, ingresando...");
      await login(values.email, values.password);
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "No pudimos crear la cuenta"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-fg">Creá tu cuenta</h1>
        <p className="text-sm text-fg-muted mt-1">
          Empezá a tomar control de tus finanzas hoy.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nombre" placeholder="Juan" {...register("first_name")} error={errors.first_name?.message} />
          <Input label="Apellido" placeholder="Pérez" {...register("last_name")} error={errors.last_name?.message} />
        </div>
        <Input label="Usuario" placeholder="juanp" {...register("username")} error={errors.username?.message} />
        <Input label="Email" type="email" placeholder="tu@email.com" {...register("email")} error={errors.email?.message} />
        <div className="grid grid-cols-[1fr_1.4fr] gap-3">
          <Select label="Tipo doc." options={docOptions} {...register("document_type")} error={errors.document_type?.message} />
          <Input label="Número" placeholder="0000000" {...register("document_number")} error={errors.document_number?.message} />
        </div>
        <Input label="Contraseña" type="password" placeholder="••••••••" {...register("password")} error={errors.password?.message} />
        <Button type="submit" loading={submitting} fullWidth size="lg">
          Crear cuenta
        </Button>
      </form>

      <p className="mt-6 text-sm text-fg-muted text-center">
        ¿Ya tenés cuenta?{" "}
        <Link to="/auth/login" className="font-medium text-brand-600 hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </div>
  );
}
