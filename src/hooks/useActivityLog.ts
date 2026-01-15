import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useCallback } from "react";
import type { Json } from "@/integrations/supabase/types";

export type ActivityAction = 
  | 'video_analysis'
  | 'script_generated'
  | 'image_generated'
  | 'tts_generated'
  | 'scene_generated'
  | 'scenes_improved'
  | 'thumbnail_generated'
  | 'channel_analysis'
  | 'title_generated'
  | 'folder_created'
  | 'settings_updated'
  | 'search_performed';

interface LogActivityParams {
  action: ActivityAction;
  description?: string;
  metadata?: Json;
}

export function useActivityLog() {
  const { user } = useAuth();

  const logActivity = useCallback(async ({ action, description, metadata }: LogActivityParams) => {
    if (!user?.id) return;

    try {
      await supabase.from('activity_logs').insert([{
        user_id: user.id,
        action,
        description: description || null,
        metadata: metadata || null,
      }]);
    } catch (error) {
      console.error('[ActivityLog] Error logging activity:', error);
    }
  }, [user?.id]);

  return { logActivity };
}

// Standalone function for use outside of React components
export async function logActivityStandalone(
  userId: string,
  action: ActivityAction,
  description?: string,
  metadata?: Json
) {
  try {
    await supabase.from('activity_logs').insert([{
      user_id: userId,
      action,
      description: description || null,
      metadata: metadata || null,
    }]);
  } catch (error) {
    console.error('[ActivityLog] Error logging activity:', error);
  }
}
