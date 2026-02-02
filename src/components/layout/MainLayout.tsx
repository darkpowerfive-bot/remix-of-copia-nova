import { useState, useEffect, useRef, memo, lazy, Suspense } from "react";
import { Sidebar } from "./Sidebar";
import { MobileSidebar } from "./MobileSidebar";
import { NotificationsBell } from "./NotificationsBell";
import { StorageIndicator } from "./StorageIndicator";
import { CreditsDisplay } from "./CreditsDisplay";
import { UpdateNotification } from "./UpdateNotification";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { useProfileData } from "@/hooks/useProfileData";
import { useAdminPushNotifications } from "@/hooks/useAdminPushNotifications";
import { RequireWhatsAppModal } from "@/components/auth/RequireWhatsAppModal";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

// Lazy load FloatingPomodoro - it's not critical for initial render
const FloatingPomodoro = lazy(() => import("./FloatingPomodoro").then(m => ({ default: m.FloatingPomodoro })));

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();
  const { profile, loading: profileLoading, refetch } = useProfileData();
  const [headerVisible, setHeaderVisible] = useState(true);
  const [headerHovered, setHeaderHovered] = useState(false);
  const [whatsAppCompleted, setWhatsAppCompleted] = useState(false);
  const lastScrollY = useRef(0);
  const mainRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  // Enable push notifications for admins
  useAdminPushNotifications();

  useEffect(() => {
    const mainElement = mainRef.current;
    if (!mainElement) return;

    const handleScroll = () => {
      const currentScrollY = mainElement.scrollTop;
      
      // Show header when scrolling up or at top
      if (currentScrollY < lastScrollY.current || currentScrollY < 50) {
        setHeaderVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        // Hide header when scrolling down
        setHeaderVisible(false);
      }
      
      lastScrollY.current = currentScrollY;
    };

    mainElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainElement.removeEventListener('scroll', handleScroll);
  }, []);

  const handleWhatsAppComplete = async () => {
    await refetch();
    setWhatsAppCompleted(true);
  };

  const showHeader = headerVisible || headerHovered;
  const showWhatsAppModal = user && !profileLoading && profile && !profile.whatsapp && !whatsAppCompleted;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Update Notification */}
      <UpdateNotification />
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Mobile Sidebar */}
      <MobileSidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {user && (
          <>
            {/* Invisible hover zone at top - desktop only */}
            {!isMobile && (
              <div 
                className="fixed top-0 right-0 h-4 w-96 z-40"
                onMouseEnter={() => setHeaderHovered(true)}
                onMouseLeave={() => setHeaderHovered(false)}
              />
            )}
            <div 
              className={cn(
                "fixed top-0 z-50 flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 bg-gradient-to-l from-background via-background/95 to-transparent transition-all duration-300",
                // Mobile: always visible, positioned after menu button
                isMobile 
                  ? "right-0 translate-y-0 opacity-100" 
                  : cn(
                      "right-0",
                      showHeader ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
                    )
              )}
              onMouseEnter={() => !isMobile && setHeaderHovered(true)}
              onMouseLeave={() => !isMobile && setHeaderHovered(false)}
            >
              {!isMobile && <CreditsDisplay collapsed={false} showRefresh={false} />}
              <StorageIndicator />
              <ThemeToggle />
              <NotificationsBell />
            </div>
          </>
        )}
        {/* Spacer for fixed header */}
        {user && <div className="h-14 md:h-16 flex-shrink-0" />}
        <div ref={mainRef} className="flex-1 overflow-auto px-3 md:px-0">
          {children}
        </div>
      </main>

      {/* Floating Pomodoro - visible on all pages, lazy loaded */}
      {user && (
        <Suspense fallback={null}>
          <FloatingPomodoro />
        </Suspense>
      )}

      {/* WhatsApp Required Modal */}
      {showWhatsAppModal && (
        <RequireWhatsAppModal
          open={true}
          userId={user.id}
          onComplete={handleWhatsAppComplete}
        />
      )}
    </div>
  );
}
