import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface ProfileData {
  profile: {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    credits: number;
    storage_used: number;
    storage_limit: number;
    whatsapp: string | null;
  } | null;
  role: "admin" | "pro" | "free";
  credits: number;
}

// Unified cache for all user data - fetch ONCE
const PROFILE_STALE_TIME = 5 * 60 * 1000; // 5 min
const PROFILE_GC_TIME = 30 * 60 * 1000; // 30 min

/**
 * Combined hook that fetches profile, role, and credits in a SINGLE query
 * Reduces 4 separate DB calls to 1
 */
export function useProfileData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['user-profile-data', user?.id],
    queryFn: async (): Promise<ProfileData | null> => {
      if (!user) return null;

      // Parallel fetch of all user data in ONE network round-trip
      const [profileResult, roleResult, creditsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, email, full_name, avatar_url, credits, storage_used, storage_limit, whatsapp")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("user_credits")
          .select("balance")
          .eq("user_id", user.id)
          .maybeSingle()
      ]);

      if (profileResult.error) throw profileResult.error;

      // Handle missing credits (create if not exists)
      let creditsBalance = 0;
      if (creditsResult.data) {
        creditsBalance = Math.max(0, Math.ceil(creditsResult.data.balance));
      } else if (!creditsResult.error) {
        // Create initial credits record
        await supabase
          .from("user_credits")
          .insert({ user_id: user.id, balance: 50 });
        creditsBalance = 50;
      }

      return {
        profile: profileResult.data,
        role: (roleResult.data?.role as "admin" | "pro" | "free") || "free",
        credits: creditsBalance,
      };
    },
    enabled: !!user,
    staleTime: PROFILE_STALE_TIME,
    gcTime: PROFILE_GC_TIME,
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['user-profile-data', user?.id] });
  };

  const updateCreditsLocally = (newCredits: number) => {
    queryClient.setQueryData(['user-profile-data', user?.id], (old: ProfileData | null) =>
      old ? { ...old, credits: newCredits } : null
    );
  };

  return {
    profile: data?.profile ?? null,
    role: data?.role ?? "free",
    credits: data?.credits ?? 0,
    loading: isLoading,
    error,
    refetch,
    updateCreditsLocally,
  };
}
