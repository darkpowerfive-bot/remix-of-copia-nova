import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export type NotificationPermission = "default" | "granted" | "denied";

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if notifications are supported
    if ("Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: "Não suportado",
        description: "Seu navegador não suporta notificações push",
        variant: "destructive",
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        toast({
          title: "Notificações ativadas",
          description: "Você receberá alertas de novos vídeos",
        });
        return true;
      } else if (result === "denied") {
        toast({
          title: "Notificações bloqueadas",
          description: "Você pode ativar nas configurações do navegador",
          variant: "destructive",
        });
        return false;
      }
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [isSupported, toast]);

  const showNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!isSupported || permission !== "granted") {
        console.log("Cannot show notification - not supported or not granted");
        return null;
      }

      try {
        const notification = new Notification(title, {
          icon: "/logo-official.svg",
          badge: "/logo-official.svg",
          ...options,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
          if (options?.data?.url) {
            window.open(options.data.url, "_blank");
          }
        };

        return notification;
      } catch (error) {
        console.error("Error showing notification:", error);
        return null;
      }
    },
    [isSupported, permission]
  );

  const showVideoNotification = useCallback(
    (videoTitle: string, channelName: string, videoUrl: string, thumbnailUrl?: string) => {
      return showNotification(`Novo vídeo: ${channelName}`, {
        body: videoTitle,
        icon: thumbnailUrl || "/logo-official.svg",
        tag: `video-${videoUrl}`, // Prevents duplicate notifications
        data: { url: videoUrl },
        requireInteraction: true, // Keep notification until user interacts
      });
    },
    [showNotification]
  );

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
    showVideoNotification,
  };
};
