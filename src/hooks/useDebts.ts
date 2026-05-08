import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  Debt,
  DebtCreate,
  DebtPayment,
  DebtPaymentCreate,
  DebtSummary,
  DebtUpdate,
} from "@/types/api";

const KEY = ["debts"] as const;

export function useDebts() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => (await api.get<Debt[]>("/debts")).data,
  });
}

export function useDebtSummary() {
  return useQuery({
    queryKey: ["debts", "summary"],
    queryFn: async () => (await api.get<DebtSummary>("/debts/summary")).data,
  });
}

export function useDebtPayments(debtId: string | null) {
  return useQuery({
    queryKey: ["debts", debtId, "payments"],
    enabled: !!debtId,
    queryFn: async () =>
      (await api.get<DebtPayment[]>(`/debts/${debtId}/payments`)).data,
  });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["debts"] });
}

export function useCreateDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: DebtCreate) =>
      (await api.post<Debt>("/debts", data)).data,
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DebtUpdate }) =>
      (await api.put<Debt>(`/debts/${id}`, data)).data,
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/debts/${id}`);
    },
    onSuccess: () => invalidateAll(qc),
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      debtId,
      data,
    }: {
      debtId: string;
      data: DebtPaymentCreate;
    }) =>
      (await api.post<DebtPayment>(`/debts/${debtId}/payments`, data)).data,
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeletePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      debtId,
      paymentId,
    }: {
      debtId: string;
      paymentId: string;
    }) => {
      await api.delete(`/debts/${debtId}/payments/${paymentId}`);
    },
    onSuccess: () => invalidateAll(qc),
  });
}
