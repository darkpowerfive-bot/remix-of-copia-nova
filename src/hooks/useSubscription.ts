import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface SubscriptionData {
  subscribed: boolean;
  plan: string | null;
  productId: string | null;
  priceId: string | null;
  subscriptionEnd: string | null;
}

// Cache: 10 minutos (assinatura muda raramente)
const SUBSCRIPTION_STALE_TIME = 10 * 60 * 1000;
const SUBSCRIPTION_GC_TIME = 30 * 60 * 1000;

export function useSubscription() {
  const { session } = useAuth();

  const { data: subscription = null, isLoading: loading, error } = useQuery({
    queryKey: ['subscription', session?.user?.id],
    queryFn: async (): Promise<SubscriptionData | null> => {
      if (!session?.access_token) return null;

      // First check if user is admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (roleData?.role === "admin") {
        return {
          subscribed: true,
          plan: "ADMIN",
          productId: null,
          priceId: null,
          subscriptionEnd: null,
        };
      }

      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      return {
        subscribed: data?.subscribed || false,
        plan: data?.plan || null,
        productId: data?.product_id || null,
        priceId: data?.price_id || null,
        subscriptionEnd: data?.subscription_end || null,
      };
    },
    enabled: !!session?.access_token,
    staleTime: SUBSCRIPTION_STALE_TIME,
    gcTime: SUBSCRIPTION_GC_TIME,
  });

  const getPlanDisplayName = (): string => {
    if (!subscription?.subscribed) return "Free";
    
    const planName = subscription.plan?.toLowerCase();
    if (planName?.includes("pro") || planName?.includes("profissional")) return "Pro";
    if (planName?.includes("expert")) return "Expert";
    if (planName?.includes("master")) return "Master";
    if (planName === "admin") return "Admin";
    
    return subscription.plan || "Pro";
  };

  return {
    subscription,
    loading,
    error: error instanceof Error ? error.message : null,
    isSubscribed: subscription?.subscribed || false,
    planName: getPlanDisplayName(),
  };
}
