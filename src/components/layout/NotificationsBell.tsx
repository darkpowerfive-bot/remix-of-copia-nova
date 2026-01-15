import { useState, useEffect, useRef } from "react";
import { Bell, X, ExternalLink, Check, BellRing, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VideoNotification {
  id: string;
  channel_id: string;
  video_id: string;
  video_url: string;
  video_title: string;
  thumbnail_url: string;
  published_at: string;
  is_read: boolean;
  created_at: string;
  monitored_channels?: {
    channel_name: string;
  };
}

export const NotificationsBell = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { permission, isSupported, requestPermission, showVideoNotification } = usePushNotifications();
  const previousNotificationsRef = useRef<string[]>([]);

  // Fetch notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["video-notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("video_notifications")
        .select(`
          *,
          monitored_channels (
            channel_name
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as VideoNotification[];
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Listen for new notifications in realtime
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("video-notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "video_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log("New notification received:", payload);
          
          // Fetch the full notification with channel name
          const { data: fullNotification } = await supabase
            .from("video_notifications")
            .select(`
              *,
              monitored_channels (
                channel_name
              )
            `)
            .eq("id", payload.new.id)
            .single();

          if (fullNotification && permission === "granted") {
            showVideoNotification(
              fullNotification.video_title || "Novo vídeo",
              fullNotification.monitored_channels?.channel_name || "Canal",
              fullNotification.video_url,
              fullNotification.thumbnail_url
            );
          }

          // Refresh notifications list
          queryClient.invalidateQueries({ queryKey: ["video-notifications"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, permission, showVideoNotification, queryClient]);

  // Show push notification for new notifications (when not using realtime)
  useEffect(() => {
    if (!notifications || permission !== "granted") return;

    const currentIds = notifications.map((n) => n.id);
    const previousIds = previousNotificationsRef.current;

    // Find new notifications
    const newNotifications = notifications.filter(
      (n) => !previousIds.includes(n.id) && !n.is_read
    );

    // Show push notification for each new notification
    if (previousIds.length > 0) {
      newNotifications.forEach((notification) => {
        showVideoNotification(
          notification.video_title || "Novo vídeo",
          notification.monitored_channels?.channel_name || "Canal",
          notification.video_url,
          notification.thumbnail_url
        );
      });
    }

    previousNotificationsRef.current = currentIds;
  }, [notifications, permission, showVideoNotification]);

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("video_notifications")
        .update({ is_read: true })
        .eq("id", notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-notifications"] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from("video_notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-notifications"] });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("video_notifications")
        .delete()
        .eq("id", notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-notifications"] });
    },
  });

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  const handleNotificationClick = (notification: VideoNotification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    window.open(notification.video_url, "_blank");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="font-semibold text-foreground">Notificações</h3>
          <div className="flex items-center gap-1">
            {/* Push notification toggle */}
            {isSupported && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        if (permission !== "granted") {
                          requestPermission();
                        }
                      }}
                    >
                      {permission === "granted" ? (
                        <BellRing className="h-4 w-4 text-primary" />
                      ) : (
                        <BellOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {permission === "granted"
                      ? "Notificações push ativadas"
                      : permission === "denied"
                      ? "Notificações bloqueadas pelo navegador"
                      : "Ativar notificações push"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <Check className="w-3 h-3 mr-1" />
                Marcar lidas
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center h-20">
              <span className="text-muted-foreground text-sm">Carregando...</span>
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-secondary/50 cursor-pointer transition-colors ${
                    !notification.is_read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    {notification.thumbnail_url && (
                      <img
                        src={notification.thumbnail_url}
                        alt={notification.video_title || "Thumbnail"}
                        className="w-16 h-10 object-cover rounded"
                        onClick={() => handleNotificationClick(notification)}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium text-foreground truncate hover:underline"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        {notification.video_title || "Novo vídeo"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {notification.monitored_channels?.channel_name || "Canal"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.published_at &&
                          formatDistanceToNow(new Date(notification.published_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNotificationClick(notification);
                        }}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotificationMutation.mutate(notification.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {!notification.is_read && (
                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center px-4">
              <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground text-sm">
                Nenhuma notificação
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                Ative as notificações nos canais monitorados
              </p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
