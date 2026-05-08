import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Budget, BudgetAlert, BudgetCreate, BudgetUpdate } from "@/types/api";

export function useBudgets(params?: { year?: number; month?: number }) {
  return useQuery({
    queryKey: ["budgets", params ?? {}],
    queryFn: async () =>
      (
        await api.get<Budget[]>("/budgets", {
          params,
        })
      ).data,
  });
}

export function useBudgetAlerts() {
  return useQuery({
    queryKey: ["budgets", "alerts"],
    queryFn: async () => (await api.get<BudgetAlert[]>("/budgets/alerts")).data,
  });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["budgets"] });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: BudgetCreate) =>
      (await api.post<Budget>("/budgets", data)).data,
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BudgetUpdate }) =>
      (await api.put<Budget>(`/budgets/${id}`, data)).data,
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/budgets/${id}`);
    },
    onSuccess: () => invalidateAll(qc),
  });
}
