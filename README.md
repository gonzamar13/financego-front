# FinanceGO — Web

Frontend de FinanceGO. **React + TypeScript + Tailwind CSS + Vite**.

Estilo: claro/amigable tipo Monarch · Copilot. Mobile-first responsive con dark mode.

## Stack

- **Vite + React 18 + TypeScript**
- **Tailwind CSS** (tokens en CSS variables → light/dark)
- **react-router-dom** v6
- **@tanstack/react-query** (server state)
- **react-hook-form + zod** (forms + validación)
- **axios** (HTTP)
- **recharts** (gráficos del dashboard)
- **lucide-react** (íconos)
- **sonner** (toasts)
- **date-fns** (fechas)

## Requisitos

- Node.js 18+ y npm. Si no lo tenés, descargalo de https://nodejs.org

## Setup

```bash
npm install
cp .env.example .env   # ajustá VITE_API_URL si tu backend no está en localhost:8000
npm run dev
```

La app abre en `http://localhost:5173` y se conecta al backend FastAPI.

## Configuración

Variables en `.env`:

| Var | Default | Descripción |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:8000` | URL base del backend FinanceGO |

## Estructura

```
src/
├── components/
│   ├── ui/              # Sistema de diseño (Button, Input, Card, Modal, ...)
│   └── ProtectedRoute.tsx
├── hooks/               # useAccounts, useCategories, useTransactions
├── layouts/
│   ├── AppShell.tsx     # Sidebar desktop + bottom nav mobile + topbar
│   └── AuthLayout.tsx   # Split-screen login/register
├── lib/                 # api (axios), cn, format, queryClient
├── pages/
│   ├── auth/            # LoginPage, RegisterPage
│   ├── DashboardPage.tsx
│   ├── AccountsPage.tsx
│   ├── CategoriesPage.tsx
│   ├── TransactionsPage.tsx
│   ├── DebtsPage.tsx        # Módulo 2: deudas + pagos
│   ├── BudgetsPage.tsx      # Módulo 2: presupuestos + alertas
│   └── SettingsPage.tsx
├── providers/           # ThemeProvider (light/dark/system), AuthProvider
├── types/api.ts         # Contratos del backend
├── styles/globals.css   # Tokens, base styles
├── App.tsx              # Router + providers
└── main.tsx
```

## Sistema de diseño

Tokens en `src/styles/globals.css` mapeados a Tailwind via `tailwind.config.js`:

- `bg`, `bg-subtle`, `bg-muted` — fondos
- `surface`, `surface-hover` — cards / superficies elevadas
- `border`, `border-strong` — bordes
- `fg`, `fg-muted`, `fg-subtle` — texto
- `brand` (50-900) — verde corporativo
- `success`, `danger`, `warning`, `info` — semánticos

Cambian automáticamente con la clase `.dark` en `<html>` (gestionado por `ThemeProvider`).

## Contratos backend usados

| Endpoint | Hook |
| --- | --- |
| `POST /auth/login` (form-urlencoded) | `useAuth().login` |
| `POST /auth/register` | `useAuth().register` |
| `GET /auth/me` | `useAuth()` |
| `GET/POST/PUT/DELETE /accounts` | `useAccounts*` |
| `GET/POST /categories/` | `useCategories*` |
| `GET/POST/PUT/DELETE /transactions/` | `useTransactions*` |
| `GET /transactions/summary` | `useTransactionSummary` |
| `GET /transactions/account-balances` | `useAccountBalances` |
| `GET /transactions/category-summary` | `useCategorySummary` |
| `GET/POST/PUT/DELETE /debts` | `useDebts*` |
| `GET /debts/summary` | `useDebtSummary` |
| `GET/POST/DELETE /debts/{id}/payments` | `useDebtPayments`, `useCreatePayment`, `useDeletePayment` |
| `GET/POST/PUT/DELETE /budgets` | `useBudgets*` |
| `GET /budgets/alerts` | `useBudgetAlerts` |

El JWT se guarda en `localStorage` bajo `financego.token`. Un interceptor de axios lo agrega como `Authorization: Bearer <token>` y desloguea en 401.

## Deploy

Build estático:

```bash
npm run build   # genera dist/
npm run preview # sirve dist/ localmente
```

Servir `dist/` desde Nginx, Cloudflare Pages, Vercel, Netlify, o el contenedor que prefieras. CORS del backend ya admite `https://app.financego.cloud` y `https://dash.financego.cloud`.
