import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Plan limits for viral detection
const PLAN_LIMITS = {
  free: 1,
  pro: 5, // Start Creator
  turbo: 10, // Turbo Maker
  master: null, // Master Pro - unlimited
  admin: null, // Admin - unlimited
} as const;

interface UsageData {
  currentCount: number;
  dailyLimit: number | null;
  remaining: number | null;
  canUse: boolean;
}

export function useViralDetectionUsage() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's role to determine plan
  const { data: userRole, isLoading: isLoadingRole } = useQuery({
    queryKey: ["user-role-viral", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      if (error) {
        console.error("Error fetching user role:", error);
        return "free";
      }
      return data?.role as string;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch user's subscription to determine specific plan tier
  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ["user-subscription-viral", user?.id],
    queryFn: async () => {
      if (!user || !session?.access_token) return null;
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (error) {
        console.error("Error fetching subscription:", error);
        return null;
      }
      return data;
    },
    enabled: !!user && !!session?.access_token && userRole === "pro",
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Determine limit based on role and subscription
  const getDailyLimit = (): number | null => {
    // Still loading - return null to indicate loading state
    if (isLoadingRole) return null;
    
    if (!userRole || userRole === "free") return PLAN_LIMITS.free;
    
    if (userRole === "admin") return PLAN_LIMITS.admin;
    
    if (userRole === "pro") {
      // If subscription is still loading, use default pro limit
      if (isLoadingSubscription && !subscription) return PLAN_LIMITS.pro;
      
      // Check specific plan tier from subscription
      const planName = (subscription?.plan || subscription?.plan_name || "").toLowerCase();
      
      if (planName.includes("master")) return PLAN_LIMITS.master;
      if (planName.includes("turbo")) return PLAN_LIMITS.turbo;
      if (planName.includes("start") || planName.includes("creator")) return PLAN_LIMITS.pro;
      
      // Default pro to turbo limits if no specific plan found
      return PLAN_LIMITS.turbo;
    }
    
    return PLAN_LIMITS.free;
  };

  const dailyLimit = getDailyLimit();

  // Fetch current usage for today
  const { data: usage, isLoading: isLoadingUsage } = useQuery({
    queryKey: ["viral-detection-usage", user?.id, dailyLimit],
    queryFn: async (): Promise<UsageData> => {
      if (!user) {
        return { currentCount: 0, dailyLimit: 1, remaining: 1, canUse: true };
      }

      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from("viral_detection_usage")
        .select("usage_count")
        .eq("user_id", user.id)
        .eq("usage_date", today)
        .maybeSingle();
      
      if (error) throw error;
      
      const currentCount = data?.usage_count || 0;
      const limit = dailyLimit;
      const remaining = limit !== null ? Math.max(0, limit - currentCount) : null;
      const canUse = limit === null || currentCount < limit;
      
      return { currentCount, dailyLimit: limit, remaining, canUse };
    },
    enabled: !!user && !isLoadingRole,
  });

  // Increment usage mutation
  const incrementUsage = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      const today = new Date().toISOString().split('T')[0];
      const limit = dailyLimit;
      
      // Check if already at limit (skip for unlimited)
      if (limit !== null && usage && usage.currentCount >= limit) {
        throw new Error(`Você atingiu o limite de ${limit} verificação(ões) por dia`);
      }

      // Upsert usage record
      const { data: existingUsage } = await supabase
        .from("viral_detection_usage")
        .select("id, usage_count")
        .eq("user_id", user.id)
        .eq("usage_date", today)
        .maybeSingle();

      if (existingUsage) {
        const { error } = await supabase
          .from("viral_detection_usage")
          .update({ 
            usage_count: existingUsage.usage_count + 1,
            last_used_at: new Date().toISOString()
          })
          .eq("id", existingUsage.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("viral_detection_usage")
          .insert({
            user_id: user.id,
            usage_date: today,
            usage_count: 1,
            last_used_at: new Date().toISOString()
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viral-detection-usage"] });
    },
  });

  const isLoading = isLoadingRole || isLoadingUsage;
  const isPaidPlan = userRole === "pro" || userRole === "admin";

  return {
    usage: usage || { currentCount: 0, dailyLimit: dailyLimit ?? 1, remaining: dailyLimit !== null ? dailyLimit : null, canUse: true },
    isLoading,
    incrementUsage,
    getDailyLimit,
    userRole,
    isPaidPlan,
  };
}
