import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ImageFXUsage {
  currentCount: number;
  monthLimit: number | null;
  remaining: number | null;
  isLoading: boolean;
  isLimitReached: boolean;
  refresh: () => Promise<void>;
  incrementUsage: (count?: number) => Promise<boolean>;
}

export const useImageFXUsage = (): ImageFXUsage => {
  const { user } = useAuth();
  const [currentCount, setCurrentCount] = useState(0);
  const [monthLimit, setMonthLimit] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_imagefx_usage', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error fetching ImageFX usage:', error);
        return;
      }

      if (data && data.length > 0) {
        const result = data[0];
        setCurrentCount(result.current_count || 0);
        setMonthLimit(result.month_limit);
        setRemaining(result.remaining);
      }
    } catch (err) {
      console.error('Error in fetchUsage:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const incrementUsage = useCallback(async (count: number = 1): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase.rpc('increment_imagefx_usage', {
        p_user_id: user.id,
        p_count: count
      });

      if (error) {
        console.error('Error incrementing ImageFX usage:', error);
        return false;
      }

      if (data && data.length > 0) {
        const result = data[0];
        setCurrentCount(result.new_count || 0);
        setMonthLimit(result.month_limit);
        
        if (result.month_limit) {
          setRemaining(Math.max(0, result.month_limit - result.new_count));
        }
        
        return !result.is_limit_reached;
      }

      return true;
    } catch (err) {
      console.error('Error in incrementUsage:', err);
      return false;
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const isLimitReached = monthLimit !== null && currentCount >= monthLimit;

  return {
    currentCount,
    monthLimit,
    remaining,
    isLoading,
    isLimitReached,
    refresh: fetchUsage,
    incrementUsage
  };
};
