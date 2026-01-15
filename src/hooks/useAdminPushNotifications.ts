import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export function useAdminPushNotifications() {
  const { role } = useProfile();
  const notificationPermission = useRef<NotificationPermission>("default");

  // Request notification permission
  const requestPermission = async () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    const permission = await Notification.requestPermission();
    notificationPermission.current = permission;
    return permission === "granted";
  };

  // Show browser notification
  const showNotification = (title: string, options?: NotificationOptions) => {
    if (notificationPermission.current === "granted") {
      const notification = new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    }
  };

  useEffect(() => {
    // Only run for admins
    if (role?.role !== "admin") return;

    // Request permission on mount
    requestPermission();

    // Subscribe to realtime changes on profiles table
    const channel = supabase
      .channel("admin-new-users")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          console.log("[Admin Notification] New user registered:", payload);
          
          const newUser = payload.new as {
            email?: string;
            full_name?: string;
            whatsapp?: string;
            status?: string;
          };

          // Only notify for pending users
          if (newUser.status === "pending") {
            const userName = newUser.full_name || newUser.email?.split("@")[0] || "Novo usuário";
            
            showNotification("🆕 Novo Cadastro Pendente", {
              body: `${userName} está aguardando aprovação`,
              tag: `new-user-${Date.now()}`,
              requireInteraction: true,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log("[Admin Notification] Subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [role]);

  return {
    requestPermission,
    showNotification,
    isSupported: "Notification" in window,
  };
}
