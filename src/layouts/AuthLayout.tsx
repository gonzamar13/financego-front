import { Outlet } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { TrendingUp, ShieldCheck, PiggyBank } from "lucide-react";

export function AuthLayout() {
  return (
    <div className="min-h-full grid lg:grid-cols-2 bg-bg">
      <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Logo className="mb-8" />
          <Outlet />
        </div>
      </div>
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-brand-500 to-brand-700 p-12 text-white">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 -left-24 h-80 w-80 rounded-full bg-black/20 blur-3xl" />
        <div className="relative flex flex-col justify-between w-full">
          <div>
            <h1 className="text-3xl xl:text-4xl font-bold leading-tight max-w-md">
              Tu dinero, claro y simple.
            </h1>
            <p className="mt-3 text-white/80 max-w-md">
              FinanceGO te ayuda a entender en qué se va tu plata, planificar
              metas y tomar mejores decisiones — todo en un solo lugar.
            </p>
          </div>
          <div className="grid gap-4">
            <Feature icon={<TrendingUp className="h-5 w-5" />} title="Visualiza tu flujo" desc="Ingresos, gastos y balance al instante." />
            <Feature icon={<PiggyBank className="h-5 w-5" />} title="Múltiples cuentas" desc="Banco, billetera, efectivo. Todo unificado." />
            <Feature icon={<ShieldCheck className="h-5 w-5" />} title="Privado y seguro" desc="Tus datos encriptados, solo tuyos." />
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 p-4">
      <div className="mt-0.5 rounded-lg bg-white/20 p-2">{icon}</div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-white/80">{desc}</p>
      </div>
    </div>
  );
}
