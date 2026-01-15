import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  credits: number;
  storage_used: number;
  storage_limit: number;
  whatsapp: string | null;
}

interface UserRole {
  role: "admin" | "pro" | "free";
}

// Cache: 5 minutos (perfil muda pouco)
const PROFILE_STALE_TIME = 5 * 60 * 1000;
const PROFILE_GC_TIME = 30 * 60 * 1000;

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile = null, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user,
    staleTime: PROFILE_STALE_TIME,
    gcTime: PROFILE_GC_TIME,
  });

  const { data: role = null, isLoading: roleLoading } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserRole | null;
    },
    enabled: !!user,
    staleTime: PROFILE_STALE_TIME,
    gcTime: PROFILE_GC_TIME,
  });

  const updateCredits = async (newCredits: number) => {
    if (!user) return;
    
    const { error } = await supabase
      .from("profiles")
      .update({ credits: newCredits })
      .eq("id", user.id);
      
    if (!error) {
      queryClient.setQueryData(['profile', user.id], (old: Profile | null) => 
        old ? { ...old, credits: newCredits } : null
      );
    }
  };

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['user-role', user?.id] });
  };

  return { 
    profile, 
    role, 
    loading: profileLoading || roleLoading, 
    updateCredits, 
    refetch 
  };
}
