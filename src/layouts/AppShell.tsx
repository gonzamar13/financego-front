import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  ArrowDownRight,
  ArrowUpRight,
  Tags,
  Settings,
  LogOut,
  Sun,
  Moon,
  Monitor,
  CreditCard,
  PiggyBank,
  Plus,
  TrendingDown,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";
import { initials } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useState } from "react";

const nav = [
  { to: "/", label: "Inicio", icon: LayoutDashboard, end: true },
  { to: "/transactions", label: "Movimientos", icon: ArrowLeftRight },
  { to: "/accounts", label: "Cuentas", icon: Wallet },
  { to: "/budgets", label: "Presupuestos", icon: PiggyBank },
  { to: "/debts", label: "Deudas", icon: CreditCard },
  { to: "/debts/payoff", label: "Plan de pago", icon: TrendingDown },
  { to: "/categories", label: "Categorías", icon: Tags },
  { to: "/settings", label: "Ajustes", icon: Settings },
];

// En mobile mostramos los 5 más usados; el resto vive en el menú del avatar.
const mobileNav = nav.filter((n) =>
  ["/", "/transactions", "/budgets", "/debts", "/accounts"].includes(n.to)
);

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next = () => setTheme(theme === "light" ? "dark" : theme === "dark" ? "system" : "light");
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  return (
    <button
      onClick={next}
      className="rounded-lg p-2 text-fg-muted hover:bg-bg-muted hover:text-fg transition-colors"
      aria-label="Cambiar tema"
      title={`Tema: ${theme}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  const isOnTransactions = location.pathname === "/transactions";

  return (
    <div className="min-h-full bg-bg flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-surface">
        <div className="px-5 py-5 border-b border-border">
          <Logo />
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                    : "text-fg-muted hover:bg-bg-muted hover:text-fg"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 rounded-lg p-2">
            <Avatar initials={initials(user?.first_name, user?.last_name)} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-fg truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-fg-subtle truncate">{user?.email}</p>
            </div>
            <ThemeToggle />
          </div>
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            leftIcon={<LogOut className="h-4 w-4" />}
            className="mt-2 justify-start"
            onClick={() => {
              logout();
              navigate("/auth/login");
            }}
          >
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar mobile */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-surface/95 backdrop-blur px-4 py-3">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-full"
              aria-label="Menú de usuario"
            >
              <Avatar
                initials={initials(user?.first_name, user?.last_name)}
                size="sm"
              />
            </button>
          </div>
        </header>

        {menuOpen && (
          <div className="lg:hidden border-b border-border bg-surface">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-fg-subtle truncate">{user?.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<LogOut className="h-4 w-4" />}
                  onClick={() => {
                    logout();
                    navigate("/auth/login");
                  }}
                >
                  Salir
                </Button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <NavLink
                  to="/debts/payoff"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm font-medium text-fg"
                >
                  <TrendingDown className="h-4 w-4" />
                  Plan de pago
                </NavLink>
                <NavLink
                  to="/categories"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm font-medium text-fg"
                >
                  <Tags className="h-4 w-4" />
                  Categorías
                </NavLink>
                <NavLink
                  to="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm font-medium text-fg"
                >
                  <Settings className="h-4 w-4" />
                  Ajustes
                </NavLink>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-x-hidden pb-24 lg:pb-0">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>

        {/* Speed Dial FAB — visible en todas las páginas menos /transactions */}
        {!isOnTransactions && (
          <>
            {fabOpen && (
              <div
                className="fixed inset-0 z-40 lg:hidden"
                onClick={() => setFabOpen(false)}
                aria-hidden="true"
              />
            )}
            <div className="fixed right-4 z-50 lg:hidden flex flex-col-reverse items-end gap-3" style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
              <button
                onClick={() => setFabOpen((v) => !v)}
                className={cn(
                  "h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300",
                  "bg-brand-600 text-white hover:bg-brand-700 active:scale-95"
                )}
                aria-label={fabOpen ? "Cerrar" : "Nuevo movimiento"}
              >
                <Plus
                  className={cn(
                    "h-6 w-6 transition-transform duration-300",
                    fabOpen && "rotate-45"
                  )}
                />
              </button>
              <div
                className={cn(
                  "flex items-center gap-3 transition-all duration-200",
                  fabOpen
                    ? "translate-y-0 opacity-100 pointer-events-auto"
                    : "translate-y-6 opacity-0 pointer-events-none"
                )}
                style={{ transitionDelay: fabOpen ? "30ms" : "0ms" }}
              >
                <span className="rounded-lg bg-surface border border-border px-2.5 py-1 text-xs font-medium text-fg shadow-sm">
                  Gasto
                </span>
                <button
                  onClick={() => { setFabOpen(false); navigate("/transactions?new=1&type=expense"); }}
                  className="h-12 w-12 rounded-full bg-danger text-white shadow-md flex items-center justify-center hover:bg-danger/90 active:scale-95 transition-transform"
                  aria-label="Nuevo gasto"
                >
                  <ArrowUpRight className="h-5 w-5" />
                </button>
              </div>
              <div
                className={cn(
                  "flex items-center gap-3 transition-all duration-200",
                  fabOpen
                    ? "translate-y-0 opacity-100 pointer-events-auto"
                    : "translate-y-6 opacity-0 pointer-events-none"
                )}
                style={{ transitionDelay: fabOpen ? "80ms" : "0ms" }}
              >
                <span className="rounded-lg bg-surface border border-border px-2.5 py-1 text-xs font-medium text-fg shadow-sm">
                  Ingreso
                </span>
                <button
                  onClick={() => { setFabOpen(false); navigate("/transactions?new=1&type=income"); }}
                  className="h-12 w-12 rounded-full bg-success text-white shadow-md flex items-center justify-center hover:bg-success/90 active:scale-95 transition-transform"
                  aria-label="Nuevo ingreso"
                >
                  <ArrowDownRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Bottom nav mobile */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur border-t border-border safe-bottom">
          <div className="grid grid-cols-5">
            {mobileNav.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                    isActive
                      ? "text-brand-600 dark:text-brand-400"
                      : "text-fg-subtle"
                  )
                }
              >
                <Icon className="h-5 w-5" />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
