import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface VersionInfo {
  version: string;
  buildTime: string;
}

// Store the initial version when the app loads
let initialVersion: VersionInfo | null = null;

export function useVersionCheck(checkInterval: number = 300000) { // 5 minutos (antes 60s)
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newVersion, setNewVersion] = useState<VersionInfo | null>(null);

  const fetchVersion = useCallback(async (): Promise<VersionInfo | null> => {
    try {
      // Add timestamp to bypass cache
      const response = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch version:", error);
      return null;
    }
  }, []);

  const checkForUpdate = useCallback(async () => {
    const currentVersion = await fetchVersion();
    
    if (!currentVersion) return;

    // Store initial version on first check
    if (!initialVersion) {
      initialVersion = currentVersion;
      return;
    }

    // Compare versions
    if (
      currentVersion.buildTime !== initialVersion.buildTime ||
      currentVersion.version !== initialVersion.version
    ) {
      setUpdateAvailable(true);
      setNewVersion(currentVersion);
      
      // Show toast notification
      toast.info("Nova versão disponível!", {
        description: "Clique para atualizar a aplicação",
        duration: Infinity,
        action: {
          label: "Atualizar Agora",
          onClick: () => handleUpdate(),
        },
        id: "version-update",
      });
    }
  }, [fetchVersion]);

  const handleUpdate = useCallback(() => {
    // Clear all caches
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }
    
    // Clear session storage flag
    sessionStorage.removeItem('chunk_reload_attempted');
    
    // Force reload with cache bypass
    window.location.reload();
  }, []);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
    toast.dismiss("version-update");
  }, []);

  useEffect(() => {
    // Initial check
    checkForUpdate();

    // Set up interval for periodic checks
    const intervalId = setInterval(checkForUpdate, checkInterval);

    // Also check when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForUpdate, checkInterval]);

  return {
    updateAvailable,
    newVersion,
    handleUpdate,
    dismissUpdate,
    checkForUpdate,
  };
}
