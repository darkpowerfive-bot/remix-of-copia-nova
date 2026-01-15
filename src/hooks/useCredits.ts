import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface CreditTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

interface CreditUsage {
  id: string;
  operation_type: string;
  credits_used: number;
  model_used: string | null;
  created_at: string;
}

// Cache: 2 minutos (créditos mudam com uso)
const CREDITS_STALE_TIME = 2 * 60 * 1000;
const CREDITS_GC_TIME = 10 * 60 * 1000;

export const useCredits = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: balance = 0, isLoading: loading } = useQuery({
    queryKey: ['user-credits', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      
      const { data, error } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        await supabase
          .from('user_credits')
          .insert({ user_id: user.id, balance: 50 });
        return 50;
      }
      
      // Garantir que saldo nunca seja negativo
      return Math.max(0, Math.ceil(data.balance));
    },
    enabled: !!user,
    staleTime: CREDITS_STALE_TIME,
    gcTime: CREDITS_GC_TIME,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['credit-transactions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: CREDITS_STALE_TIME,
    gcTime: CREDITS_GC_TIME,
  });

  const { data: usage = [] } = useQuery({
    queryKey: ['credit-usage', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('credit_usage')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: CREDITS_STALE_TIME,
    gcTime: CREDITS_GC_TIME,
  });

  const refreshBalance = () => {
    queryClient.invalidateQueries({ queryKey: ['user-credits', user?.id] });
  };

  const fetchTransactions = () => {
    queryClient.invalidateQueries({ queryKey: ['credit-transactions', user?.id] });
  };

  const fetchUsage = () => {
    queryClient.invalidateQueries({ queryKey: ['credit-usage', user?.id] });
  };

  return {
    balance,
    loading,
    transactions,
    usage,
    refreshBalance,
    fetchTransactions,
    fetchUsage,
  };
};
