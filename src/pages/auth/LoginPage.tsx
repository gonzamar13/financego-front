import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/providers/AuthProvider";
import { getApiErrorMessage } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await login(values.email, values.password);
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/";
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err, "No pudimos iniciar sesión"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-fg">Bienvenido de vuelta</h1>
        <p className="text-sm text-fg-muted mt-1">
          Ingresá para seguir gestionando tus finanzas.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          leftIcon={<Mail className="h-4 w-4" />}
          {...register("email")}
          error={errors.email?.message}
        />
        <Input
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          leftIcon={<Lock className="h-4 w-4" />}
          {...register("password")}
          error={errors.password?.message}
        />
        <Button type="submit" loading={submitting} fullWidth size="lg">
          Iniciar sesión
        </Button>
      </form>

      <p className="mt-6 text-sm text-fg-muted text-center">
        ¿No tenés cuenta?{" "}
        <Link to="/auth/register" className="font-medium text-brand-600 hover:underline">
          Registrate
        </Link>
      </p>
    </div>
  );
}
