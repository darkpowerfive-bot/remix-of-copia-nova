import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface ApiSettings {
  openai_api_key: string;
  claude_api_key: string;
  gemini_api_key: string;
  elevenlabs_api_key: string;
  youtube_api_key: string;
  imagefx_cookies: string;
  openai_validated: boolean;
  claude_validated: boolean;
  gemini_validated: boolean;
  elevenlabs_validated: boolean;
  youtube_validated: boolean;
  imagefx_validated: boolean;
  use_platform_credits: boolean;
}

const defaultSettings: ApiSettings = {
  openai_api_key: '',
  claude_api_key: '',
  gemini_api_key: '',
  elevenlabs_api_key: '',
  youtube_api_key: '',
  imagefx_cookies: '',
  openai_validated: false,
  claude_validated: false,
  gemini_validated: false,
  elevenlabs_validated: false,
  youtube_validated: false,
  imagefx_validated: false,
  use_platform_credits: true,
};

export function useApiSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ApiSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_api_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          openai_api_key: data.openai_api_key || '',
          claude_api_key: data.claude_api_key || '',
          gemini_api_key: data.gemini_api_key || '',
          elevenlabs_api_key: data.elevenlabs_api_key || '',
          youtube_api_key: data.youtube_api_key || '',
          imagefx_cookies: (data as any).imagefx_cookies || '',
          openai_validated: data.openai_validated || false,
          claude_validated: data.claude_validated || false,
          gemini_validated: data.gemini_validated || false,
          elevenlabs_validated: data.elevenlabs_validated || false,
          youtube_validated: data.youtube_validated || false,
          imagefx_validated: (data as any).imagefx_validated || false,
          use_platform_credits: (data as any).use_platform_credits ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching API settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateApiKey = async (provider: string, apiKey: string): Promise<boolean> => {
    if (!apiKey.trim()) {
      toast.error('Insira uma chave de API válida');
      return false;
    }

    setValidating(provider);

    try {
      const { data, error } = await supabase.functions.invoke('validate-api-key', {
        body: { provider, apiKey }
      });

      if (error) throw error;

      if (data.valid) {
        toast.success(`Chave ${provider.toUpperCase()} validada com sucesso!`);
        return true;
      } else {
        toast.error(`Chave ${provider.toUpperCase()} inválida`);
        return false;
      }
    } catch (error) {
      console.error('Error validating API key:', error);
      toast.error('Erro ao validar chave');
      return false;
    } finally {
      setValidating(null);
    }
  };

  const saveSettings = async (newSettings: Partial<ApiSettings>) => {
    if (!user) return;

    try {
      const { data: existing } = await supabase
        .from('user_api_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const updateData = {
        ...newSettings,
        user_id: user.id,
      };

      if (existing) {
        const { error } = await supabase
          .from('user_api_settings')
          .update(updateData)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_api_settings')
          .insert(updateData);

        if (error) throw error;
      }

      setSettings(prev => ({ ...prev, ...newSettings }));
      toast.success('Configurações salvas!');
    } catch (error) {
      console.error('Error saving API settings:', error);
      toast.error('Erro ao salvar configurações');
    }
  };

  const getApiKey = (provider: string): string => {
    switch (provider) {
      case 'openai': return settings.openai_api_key;
      case 'claude': return settings.claude_api_key;
      case 'gemini': return settings.gemini_api_key;
      case 'elevenlabs': return settings.elevenlabs_api_key;
      case 'youtube': return settings.youtube_api_key;
      case 'imagefx': return settings.imagefx_cookies;
      default: return '';
    }
  };

  const isValidated = (provider: string): boolean => {
    switch (provider) {
      case 'openai': return settings.openai_validated;
      case 'claude': return settings.claude_validated;
      case 'gemini': return settings.gemini_validated;
      case 'elevenlabs': return settings.elevenlabs_validated;
      case 'youtube': return settings.youtube_validated;
      case 'imagefx': return settings.imagefx_validated;
      default: return false;
    }
  };

  // Get number of ImageFX cookies configured (for parallel generation)
  const getImageFXCookieCount = (): number => {
    if (!settings.imagefx_cookies || !settings.imagefx_validated) return 0;
    return settings.imagefx_cookies.split('|||').filter(c => c.trim()).length;
  };

  return {
    settings,
    loading,
    validating,
    validateApiKey,
    saveSettings,
    getApiKey,
    isValidated,
    getImageFXCookieCount,
    refetch: fetchSettings,
  };
}