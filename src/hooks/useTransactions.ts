import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  AccountBalanceItem,
  CategorySummaryItem,
  Transaction,
  TransactionCreate,
  TransactionSummary,
  TransactionUpdate,
} from "@/types/api";

const KEY = ["transactions"] as const;

export function useTransactions() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<Transaction[]>("/transactions/");
      return data;
    },
  });
}

export function useTransactionSummary() {
  return useQuery({
    queryKey: ["transactions", "summary"],
    queryFn: async () => {
      const { data } = await api.get<TransactionSummary>("/transactions/summary");
      return data;
    },
  });
}

export function useAccountBalances() {
  return useQuery({
    queryKey: ["transactions", "account-balances"],
    queryFn: async () => {
      const { data } = await api.get<AccountBalanceItem[]>(
        "/transactions/account-balances"
      );
      return data;
    },
  });
}

export function useCategorySummary() {
  return useQuery({
    queryKey: ["transactions", "category-summary"],
    queryFn: async () => {
      const { data } = await api.get<CategorySummaryItem[]>(
        "/transactions/category-summary"
      );
      return data;
    },
  });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["transactions"] });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TransactionCreate) => {
      const { data } = await api.post<Transaction>("/transactions/", payload);
      return data;
    },
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TransactionUpdate }) => {
      const { data: res } = await api.put<Transaction>(`/transactions/${id}`, data);
      return res;
    },
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/transactions/${id}`);
    },
    onSuccess: () => invalidateAll(qc),
  });
}
