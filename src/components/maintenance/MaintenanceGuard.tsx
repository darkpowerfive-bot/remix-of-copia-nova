import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToolMaintenance, TOOL_REGISTRY } from "@/hooks/useToolMaintenance";
import { MaintenanceModal } from "./MaintenanceModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, X, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Key for localStorage to check simulation mode
const SIMULATE_USER_KEY = 'admin_simulate_user_maintenance';

interface MaintenanceGuardProps {
  children: React.ReactNode;
}

export const MaintenanceGuard = ({ children }: MaintenanceGuardProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isUnderMaintenance, getMaintenanceInfo, isLoading } = useToolMaintenance();
  const [showModal, setShowModal] = useState(false);
  const [showAdminBanner, setShowAdminBanner] = useState(false);
  const [currentToolName, setCurrentToolName] = useState("");
  const [maintenanceMessage, setMaintenanceMessage] = useState<string | undefined>();
  const [estimatedEndTime, setEstimatedEndTime] = useState<string | undefined>();
  const [isAdmin, setIsAdmin] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [isSimulatingUser, setIsSimulatingUser] = useState(false);
  const [globalMaintenanceActive, setGlobalMaintenanceActive] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user?.id) {
        setIsAdmin(false);
        return;
      }
      
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      setIsAdmin(!!data);
    };
    
    checkAdmin();
  }, [user?.id]);

  // Check for global maintenance
  useEffect(() => {
    const checkGlobalMaintenance = async () => {
      // Skip check for maintenance page and auth-related routes
      const skipPaths = ['/maintenance', '/auth', '/landing', '/terms', '/privacy', '/reset-password'];
      if (skipPaths.some(p => location.pathname.startsWith(p))) {
        setGlobalMaintenanceActive(false);
        return;
      }

      const { data } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'global_maintenance')
        .maybeSingle();

      const value = data?.value as Record<string, unknown> | null;
      const isActive = Boolean(value?.is_active);
      setGlobalMaintenanceActive(isActive);

      // Redirect non-admin users to maintenance page
      if (isActive && !isAdmin && user) {
        navigate('/maintenance');
      }
    };

    checkGlobalMaintenance();
  }, [location.pathname, isAdmin, user, navigate]);

  // Reset banner dismissed state and check simulation mode when route changes
  useEffect(() => {
    setBannerDismissed(false);
    // Check localStorage for simulation mode
    const simulateMode = localStorage.getItem(SIMULATE_USER_KEY) === 'true';
    setIsSimulatingUser(simulateMode);
  }, [location.pathname]);

  // Listen for storage changes (when admin toggles simulation in another tab or same page)
  useEffect(() => {
    const handleStorageChange = () => {
      const simulateMode = localStorage.getItem(SIMULATE_USER_KEY) === 'true';
      setIsSimulatingUser(simulateMode);
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom event for same-tab updates
    window.addEventListener('simulateUserModeChanged', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('simulateUserModeChanged', handleStorageChange);
    };
  }, []);

  // Listen for maintenance end broadcast notifications
  useEffect(() => {
    const channel = supabase
      .channel('maintenance-broadcast')
      .on('broadcast', { event: 'maintenance_end' }, (payload) => {
        console.log('[MaintenanceGuard] Received maintenance end notification:', payload);
        
        toast.success(payload.payload?.message || '🎉 A manutenção foi concluída!', {
          duration: 8000,
          icon: <Rocket className="w-5 h-5 text-primary" />,
          action: {
            label: 'Recarregar',
            onClick: () => window.location.reload(),
          },
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    // Skip if still loading maintenance data
    if (isLoading) return;

    const currentPath = location.pathname;
    
    // Find the tool that matches the current path
    const matchingTool = TOOL_REGISTRY.find(tool => currentPath.startsWith(tool.path));
    
    if (matchingTool && isUnderMaintenance(matchingTool.path)) {
      const info = getMaintenanceInfo(matchingTool.path);
      setCurrentToolName(matchingTool.name);
      setMaintenanceMessage(info?.message);
      setEstimatedEndTime(info?.estimatedEndTime);
      
      // For logged in admins (not simulating), show banner
      if (user && isAdmin && !isSimulatingUser) {
        setShowAdminBanner(true);
        setShowModal(false);
      } else {
        // Show blocking modal for:
        // - Regular logged-in users
        // - Admins simulating user view
        // - Non-logged-in users (tool is protected anyway)
        setShowModal(true);
        setShowAdminBanner(false);
      }
    } else {
      setShowModal(false);
      setShowAdminBanner(false);
    }
  }, [location.pathname, isUnderMaintenance, getMaintenanceInfo, isLoading, isAdmin, user, isSimulatingUser]);

  return (
    <>
      {/* Admin maintenance banner */}
      {showAdminBanner && !bannerDismissed && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/90 text-amber-950 px-4 py-2 flex items-center justify-center gap-3">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm font-medium">
            <strong>{currentToolName}</strong> está em manutenção para usuários normais.
            {maintenanceMessage && ` (${maintenanceMessage})`}
            {" "}Você tem acesso como admin.
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-amber-600/20"
            onClick={() => setBannerDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* Add padding when banner is visible */}
      <div className={showAdminBanner && !bannerDismissed ? "pt-10" : ""}>
        {children}
      </div>
      
      <MaintenanceModal
        isOpen={showModal}
        toolName={currentToolName}
        message={maintenanceMessage}
        estimatedEndTime={estimatedEndTime}
      />
    </>
  );
};
