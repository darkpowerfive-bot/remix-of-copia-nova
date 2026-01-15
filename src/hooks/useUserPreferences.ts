import { useEffect, useState, useCallback, useRef } from 'react';
import { useTheme } from 'next-themes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserPreferences {
  theme: string;
  sidebar_order: string[] | null;
  directive_update_hours: number;
  pomodoro_enabled: boolean;
}

export function useUserPreferences() {
  const { user } = useAuth();
  const { theme, setTheme: setNextTheme, resolvedTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const isInitialized = useRef(false);
  const isSaving = useRef(false);

  // Load preferences from database ONCE on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.id || isInitialized.current) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('theme, sidebar_order, directive_update_hours')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        // Check localStorage for pomodoro visibility
        const pomodoroLocalStorage = localStorage.getItem('pomodoro_visible');
        const pomodoroEnabled = pomodoroLocalStorage !== 'false';

        if (data) {
          setPreferences({
            theme: data.theme || 'dark',
            sidebar_order: data.sidebar_order,
            directive_update_hours: data.directive_update_hours ?? 24,
            pomodoro_enabled: pomodoroEnabled
          });
          
          // Apply saved theme from DB only on first load
          if (data.theme && !isInitialized.current) {
            setNextTheme(data.theme);
          }
        } else {
          setPreferences({
            theme: 'dark',
            sidebar_order: null,
            directive_update_hours: 24,
            pomodoro_enabled: pomodoroEnabled
          });
        }
        
        isInitialized.current = true;
      } catch (err) {
        console.error('Error loading preferences:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [user?.id, setNextTheme]);

  // Generic save function for any preference
  const savePreference = useCallback(async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    if (isSaving.current) return;
    isSaving.current = true;

    // Update local state immediately
    setPreferences(prev => prev 
      ? { ...prev, [key]: value } 
      : { theme: 'dark', sidebar_order: null, directive_update_hours: 24, pomodoro_enabled: true, [key]: value }
    );

    // For pomodoro, save to localStorage and dispatch event
    if (key === 'pomodoro_enabled') {
      localStorage.setItem('pomodoro_visible', String(value));
      window.dispatchEvent(new Event('pomodoro-visibility-changed'));
    }

    // Save to database if user is logged in (except pomodoro which uses localStorage)
    if (user?.id && key !== 'pomodoro_enabled') {
      try {
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            [key]: value,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });
      } catch (err) {
        console.error(`Error saving ${key}:`, err);
      }
    }

    setTimeout(() => {
      isSaving.current = false;
    }, 100);
  }, [user?.id]);

  // Save theme
  const saveTheme = useCallback(async (newTheme: string) => {
    setNextTheme(newTheme);
    await savePreference('theme', newTheme);
  }, [setNextTheme, savePreference]);

  // Save sidebar order
  const saveSidebarOrder = useCallback(async (order: string[]) => {
    await savePreference('sidebar_order', order);
  }, [savePreference]);

  // Save directive update frequency
  const saveDirectiveUpdateHours = useCallback(async (hours: number) => {
    await savePreference('directive_update_hours', hours);
  }, [savePreference]);

  // Save pomodoro enabled state
  const savePomodoroEnabled = useCallback(async (enabled: boolean) => {
    await savePreference('pomodoro_enabled', enabled);
  }, [savePreference]);

  return {
    theme: resolvedTheme || theme || 'dark',
    setTheme: saveTheme,
    preferences,
    isLoading,
    // Sidebar order
    sidebarOrder: preferences?.sidebar_order ?? null,
    saveSidebarOrder,
    // Directive update hours
    directiveUpdateHours: preferences?.directive_update_hours ?? 24,
    saveDirectiveUpdateHours,
    // Pomodoro
    pomodoroEnabled: preferences?.pomodoro_enabled ?? true,
    savePomodoroEnabled
  };
}
