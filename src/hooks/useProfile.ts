import { useProfileData } from "./useProfileData";

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

/**
 * Wrapper hook for backward compatibility
 * Uses the optimized useProfileData under the hood
 */
export function useProfile() {
  const { profile, role, loading, refetch, updateCreditsLocally } = useProfileData();

  const updateCredits = async (newCredits: number) => {
    // Optimistic update
    updateCreditsLocally(newCredits);
  };

  return { 
    profile: profile as Profile | null, 
    role: role ? { role } as UserRole : null, 
    loading, 
    updateCredits, 
    refetch 
  };
}
