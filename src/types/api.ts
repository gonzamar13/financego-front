export type DocumentType = "CI" | "DNI" | "PASSPORT" | "RUC";

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  document_type: DocumentType;
  document_number: string;
  username: string;
  email: string;
}

export interface RegisterRequest {
  username: string;
  first_name: string;
  last_name: string;
  document_type: DocumentType;
  document_number: string;
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export type AccountType = "bank" | "financial" | "cooperative" | "cash";

export interface Account {
  id: string;
  user_id: string;
  account_name: string;
  type: AccountType;
  financial_institution: string | null;
  account_number: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AccountCreate {
  account_name: string;
  type: AccountType;
  financial_institution?: string | null;
  account_number?: string | null;
}

export type AccountUpdate = Partial<AccountCreate> & { is_active?: boolean };

export type CategoryKind = "income" | "expense";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: CategoryKind;
}

export interface CategoryCreate {
  name: string;
  type: CategoryKind;
}

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  account_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: string;
  description: string | null;
  transaction_date: string;
  created_at: string;
}

export interface TransactionCreate {
  account_id: string;
  category_id?: string | null;
  type: TransactionType;
  amount: number;
  description?: string | null;
  transaction_date?: string | null;
}

export type TransactionUpdate = Partial<TransactionCreate>;

export interface TransactionSummary {
  total_income: string;
  total_expense: string;
  balance: string;
}

export interface AccountBalanceItem {
  account_id: string;
  account_name: string;
  total_income: string;
  total_expense: string;
  balance: string;
}

export interface CategorySummaryItem {
  category_id: string;
  category_name: string;
  type: string;
  total: string;
}

// --- Módulo 2: Deudas y Presupuestos ---

export type DebtType = "loan" | "credit_card";

export interface Debt {
  id: string;
  user_id: string;
  name: string;
  type: DebtType;
  lender: string | null;
  principal_amount: string;
  interest_rate: string | null;
  total_installments: number | null;
  installment_amount: string | null;
  start_date: string;
  due_day: number | null;
  is_active: boolean;
  created_at: string;
  total_paid: string;
  remaining_balance: string;
  installments_paid: number;
  next_due_date: string | null;
  progress_percent: number;
}

export interface DebtCreate {
  name: string;
  type: DebtType;
  lender?: string | null;
  principal_amount: number;
  interest_rate?: number | null;
  total_installments?: number | null;
  installment_amount?: number | null;
  start_date: string;
  due_day?: number | null;
}

export type DebtUpdate = Partial<DebtCreate> & { is_active?: boolean };

export interface DebtPayment {
  id: string;
  debt_id: string;
  user_id: string;
  amount: string;
  payment_date: string;
  installment_number: number | null;
  notes: string | null;
  created_at: string;
}

export interface DebtPaymentCreate {
  amount: number;
  payment_date?: string | null;
  installment_number?: number | null;
  notes?: string | null;
}

export interface DebtSummary {
  total_principal: string;
  total_paid: string;
  total_remaining: string;
  active_debts: number;
  overdue_debts: number;
}

export type BudgetStatus = "ok" | "warning" | "exceeded";

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  category_name: string;
  year: number;
  month: number;
  amount: string;
  alert_threshold: number;
  created_at: string;
  spent: string;
  remaining: string;
  progress_percent: number;
  status: BudgetStatus;
}

export interface BudgetCreate {
  category_id: string;
  year: number;
  month: number;
  amount: number;
  alert_threshold?: number;
}

export interface BudgetUpdate {
  amount?: number;
  alert_threshold?: number;
}

export interface BudgetAlert {
  budget_id: string;
  category_id: string;
  category_name: string;
  year: number;
  month: number;
  amount: string;
  spent: string;
  progress_percent: number;
  status: "warning" | "exceeded";
  message: string;
}

// --- Módulo 2 frontend: Proyección de pago de deudas ---

export type StrategyType = "snowball" | "avalanche";

export interface PayoffRequest {
  monthly_budget?: number | null;
  strategy?: StrategyType;
}

export interface MonthPaymentDetail {
  debt_id: string;
  name: string;
  paid: string;
  remaining: string;
}

export interface MonthSnapshot {
  month: number;
  date: string;
  total_remaining: string;
  payments: MonthPaymentDetail[];
}

export interface DebtPayoffDetail {
  debt_id: string;
  name: string;
  paid_off_month: number | null;
  paid_off_date: string | null;
  total_interest: string;
}

export interface PayoffResponse {
  feasible: boolean;
  suggested_budget: string;
  monthly_budget: string;
  months: MonthSnapshot[];
  debts: DebtPayoffDetail[];
  debt_free_date: string | null;
  total_interest: string;
  total_months: number;
}
