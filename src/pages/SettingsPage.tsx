import { Sun, Moon, Monitor, User as UserIcon, Mail, Shield, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { initials } from "@/lib/format";
import { cn } from "@/lib/cn";

export function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const themeOptions = [
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Oscuro", icon: Moon },
    { value: "system", label: "Sistema", icon: Monitor },
  ] as const;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-fg">Ajustes</h1>
        <p className="text-sm text-fg-muted mt-1">
          Personalizá tu cuenta y la app.
        </p>
      </div>

      <Card>
        <CardHeader title="Perfil" subtitle="Información de tu cuenta" />
        <CardBody>
          <div className="flex items-center gap-4">
            <Avatar
              size="lg"
              initials={initials(user?.first_name, user?.last_name)}
            />
            <div className="min-w-0">
              <p className="font-semibold text-fg">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-sm text-fg-muted">@{user?.username}</p>
            </div>
          </div>
          <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field icon={<Mail className="h-4 w-4" />} label="Email" value={user?.email} />
            <Field icon={<UserIcon className="h-4 w-4" />} label="Usuario" value={user?.username} />
            <Field
              icon={<Shield className="h-4 w-4" />}
              label="Documento"
              value={`${user?.document_type} · ${user?.document_number}`}
            />
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Apariencia" subtitle="Elegí cómo se ve la app" />
        <CardBody>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map(({ value, label, icon: Icon }) => {
              const active = theme === value;
              return (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors",
                    active
                      ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                      : "border-border bg-surface hover:bg-bg-subtle text-fg"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                  {active && <Badge tone="brand">Activo</Badge>}
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Sesión" />
        <CardBody>
          <Button
            variant="outline"
            leftIcon={<LogOut className="h-4 w-4" />}
            onClick={() => {
              logout();
              navigate("/auth/login");
            }}
          >
            Cerrar sesión
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-bg-subtle p-3">
      <dt className="flex items-center gap-2 text-xs uppercase tracking-wide text-fg-subtle">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-fg break-all">{value ?? "—"}</dd>
    </div>
  );
}
