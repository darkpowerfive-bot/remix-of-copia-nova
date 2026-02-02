import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useProfileData } from "./useProfileData";

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
  
  // Use optimized combined query for balance
  const { credits: balance, loading, refetch: refreshBalance } = useProfileData();

  // Transactions and usage are only fetched when explicitly needed (lazy)
  const { data: transactions = [], refetch: fetchTransactionsInternal } = useQuery({
    queryKey: ['credit-transactions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('id, amount, transaction_type, description, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []) as CreditTransaction[];
    },
    enabled: false, // Lazy - only fetch when requested
    staleTime: CREDITS_STALE_TIME,
    gcTime: CREDITS_GC_TIME,
  });

  const { data: usage = [], refetch: fetchUsageInternal } = useQuery({
    queryKey: ['credit-usage', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('credit_usage')
        .select('id, operation_type, credits_used, model_used, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []) as CreditUsage[];
    },
    enabled: false, // Lazy - only fetch when requested
    staleTime: CREDITS_STALE_TIME,
    gcTime: CREDITS_GC_TIME,
  });

  const fetchTransactions = () => {
    fetchTransactionsInternal();
  };

  const fetchUsage = () => {
    fetchUsageInternal();
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
