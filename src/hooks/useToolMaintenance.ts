import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ToolMaintenanceStatus {
  enabled: boolean;
  message?: string;
  estimatedEndTime?: string;
  updatedAt?: string;
  endedAt?: string;
}

export interface ToolMaintenanceData {
  tools: Record<string, ToolMaintenanceStatus>;
}

interface UseToolMaintenanceReturn {
  isUnderMaintenance: (toolPath: string) => boolean;
  getMaintenanceInfo: (toolPath: string) => ToolMaintenanceStatus | null;
  maintenanceData: ToolMaintenanceData | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

// List of all tools with their paths and display names
export const TOOL_REGISTRY = [
  { path: '/analyzer', name: 'Analisador de Vídeo', icon: '🎬' },
  { path: '/history', name: 'Histórico de Análises', icon: '📊' },
  { path: '/channel-analyzer', name: 'Analisador de Canal', icon: '📺' },
  { path: '/channels', name: 'Canais Monitorados', icon: '👁️' },
  { path: '/search-channels', name: 'Buscar Canais', icon: '🔍' },
  { path: '/explore', name: 'Explorar Nicho', icon: '🎯' },
  { path: '/analytics', name: 'Analytics do YouTube', icon: '📈' },
  { path: '/viral-script', name: 'Gerador de Roteiro Viral', icon: '✍️' },
  { path: '/agents', name: 'Agentes Virais', icon: '🤖' },
  { path: '/library', name: 'Biblioteca Viral', icon: '📚' },
  { path: '/scenes', name: 'Prompts para Cenas', icon: '🎨' },
  { path: '/prompts', name: 'Prompts e Imagens', icon: '🖼️' },
  { path: '/voice', name: 'Gerador de Voz', icon: '🎙️' },
  { path: '/srt', name: 'Conversor SRT', icon: '📝' },
  { path: '/youtube', name: 'Integração YouTube', icon: '🔗' },
  { path: '/folders', name: 'Pastas', icon: '📁' },
  { path: '/settings', name: 'Configurações', icon: '⚙️' },
  { path: '/plans', name: 'Planos e Créditos', icon: '💎' },
];

export const useToolMaintenance = (): UseToolMaintenanceReturn => {
  const [maintenanceData, setMaintenanceData] = useState<ToolMaintenanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMaintenanceData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'tool_maintenance')
        .maybeSingle();

      if (error) {
        console.error('Error fetching maintenance data:', error);
        return;
      }

      if (data?.value) {
        const typedData = data.value as unknown as ToolMaintenanceData;
        setMaintenanceData(typedData);
        previousDataRef.current = typedData;
      } else {
        setMaintenanceData({ tools: {} });
        previousDataRef.current = { tools: {} };
      }
    } catch (err) {
      console.error('Error in fetchMaintenanceData:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Keep track of previous maintenance states to detect when tools come back online
  const previousDataRef = useRef<ToolMaintenanceData | null>(null);

  // Show browser push notification
  const showPushNotification = useCallback((title: string, body: string, toolPath: string) => {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `maintenance-end-${toolPath}`,
        requireInteraction: false
      });

      notification.onclick = () => {
        window.focus();
        window.location.href = toolPath;
        notification.close();
      };

      // Auto close after 8 seconds
      setTimeout(() => notification.close(), 8000);
    }
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    fetchMaintenanceData();

    // Subscribe to realtime changes on admin_settings
    const channel = supabase
      .channel('maintenance-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admin_settings',
          filter: 'key=eq.tool_maintenance'
        },
        (payload) => {
          console.log('[Maintenance] Settings updated:', payload);
          const newValue = payload.new.value as unknown as ToolMaintenanceData;
          
          // Check if any tool came back online
          if (previousDataRef.current?.tools && newValue?.tools) {
            Object.entries(newValue.tools).forEach(([path, status]) => {
              const prevStatus = previousDataRef.current?.tools[path];
              // Tool was under maintenance and is now online
              if (prevStatus?.enabled === true && status.enabled === false) {
                const toolName = TOOL_REGISTRY.find(t => t.path === path)?.name || path;
                const toolIcon = TOOL_REGISTRY.find(t => t.path === path)?.icon || '🔧';
                
                // Show toast notification (for users on the tab)
                toast.success(`🎉 ${toolName} está disponível!`, {
                  description: 'A manutenção foi concluída.',
                  duration: 6000
                });
                
                // Show browser push notification (works even when tab is not focused)
                showPushNotification(
                  `${toolIcon} ${toolName} Online!`,
                  'A manutenção foi concluída. Clique para acessar.',
                  path
                );
              }
            });
          }

          setMaintenanceData(newValue);
          previousDataRef.current = newValue;
        }
      )
      .subscribe((status) => {
        console.log('[Maintenance] Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMaintenanceData]);

  const isUnderMaintenance = useCallback((toolPath: string): boolean => {
    if (!maintenanceData?.tools) return false;
    const toolStatus = maintenanceData.tools[toolPath];
    return toolStatus?.enabled === true;
  }, [maintenanceData]);

  const getMaintenanceInfo = useCallback((toolPath: string): ToolMaintenanceStatus | null => {
    if (!maintenanceData?.tools) return null;
    return maintenanceData.tools[toolPath] || null;
  }, [maintenanceData]);

  return {
    isUnderMaintenance,
    getMaintenanceInfo,
    maintenanceData,
    isLoading,
    refresh: fetchMaintenanceData
  };
};
