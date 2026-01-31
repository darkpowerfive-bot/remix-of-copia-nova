import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Shield,
  Users,
  Coins,
  Key,
  Megaphone,
  CreditCard,
  FileCheck,
  HardDrive,
  Bell,
  Settings,
  RefreshCw,
  Loader2,
  Search,
  Edit,
  Lock,
  Trash2,
  UserMinus,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Youtube,
  Layout,
  Wrench,
  Globe,
  UserPlus,
  BarChart3,
  FileText,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { AdminCreditsTab } from "@/components/admin/AdminCreditsTab";
import { AdminAPIsTab } from "@/components/admin/AdminAPIsTab";
import { AdminPermissionsTab } from "@/components/admin/AdminPermissionsTab";
import { AdminPixelTab } from "@/components/admin/AdminPixelTab";
import { AdminPaymentsTab } from "@/components/admin/AdminPaymentsTab";
import { AdminSubscriptionsTab } from "@/components/admin/AdminSubscriptionsTab";
import { AdminStorageTab } from "@/components/admin/AdminStorageTab";
import { AdminNotificationsTab } from "@/components/admin/AdminNotificationsTab";
import { AdminLandingTab } from "@/components/admin/AdminLandingTab";
import { AdminMaintenanceTab } from "@/components/admin/AdminMaintenanceTab";
import { AdminGlobalMaintenanceTab } from "@/components/admin/AdminGlobalMaintenanceTab";
import { AdminMigrationTab } from "@/components/admin/AdminMigrationTab";
import { AdminMonitoringTab } from "@/components/admin/AdminMonitoringTab";
import { AdminBlogTab } from "@/components/admin/AdminBlogTab";
import { AdminUserPermissionsTab } from "@/components/admin/AdminUserPermissionsTab";
import { AdminWhatsAppTemplatesTab } from "@/components/admin/AdminWhatsAppTemplatesTab";
import { AdminExportDataTab } from "@/components/admin/AdminExportDataTab";
import { AdminGlobalDashboardTab } from "@/components/admin/AdminGlobalDashboardTab";
import { PieChart } from "lucide-react";
import { MessageCircle, Database } from "lucide-react";
interface AdminStats {
  totalUsers: number;
  pendingActivation: number;
  onlineNow: number;
  logins24h: number;
}

interface UserData {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string | null;
  credits: number | null;
  storage_used: number | null;
  whatsapp: string | null;
  status: string | null;
  user_credits_balance?: number | null;
  auth_provider?: string | null;
}

interface UserWithRole extends UserData {
  role: string;
}

interface PlanOption {
  plan_name: string;
  role_value: string;
  monthly_credits: number;
  is_annual: boolean;
}

const AdminPanel = () => {
  const { role } = useProfile();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    pendingActivation: 0,
    onlineNow: 0,
    logins24h: 0,
  });
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [usersPerPage, setUsersPerPage] = useState(10);
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    whatsapp: "",
    status: "active",
    role: "free",
    selectedPlanName: "", // Track which specific plan was selected
  });
  const [savingUser, setSavingUser] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<PlanOption[]>([]);

  useEffect(() => {
    fetchAdminData();
    fetchAvailablePlans();
  }, []);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch user profiles with whatsapp and status
      const { data: profiles, count } = await supabase
        .from("profiles")
        .select("id, email, full_name, created_at, credits, storage_used, whatsapp, status, auth_provider", { count: "exact" });

      // Fetch user roles
      const { data: userRoles } = await supabase.from("user_roles").select("*");

      // Fetch user credits
      const { data: userCredits } = await supabase.from("user_credits").select("user_id, balance");

      // Map roles and credits to users
      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
        const userRole = userRoles?.find((r) => r.user_id === profile.id);
        const userCredit = userCredits?.find((c) => c.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || "free",
          user_credits_balance: userCredit?.balance ?? null,
        };
      });

      setUsers(usersWithRoles);

      // Calculate pending users
      const pendingCount = usersWithRoles.filter(u => u.status === "pending").length;

      setStats({
        totalUsers: count || 0,
        pendingActivation: pendingCount,
        onlineNow: 1,
        logins24h: 5,
      });
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePlans = async () => {
    try {
      const { data, error } = await supabase
        .from("plan_permissions")
        .select("plan_name, monthly_credits, is_annual")
        .eq("is_annual", false)
        .order("monthly_credits", { ascending: true });

      if (error) throw error;

      // Map plan names to role values
      const planRoleMap: Record<string, string> = {
        "FREE": "free",
        "START CREATOR": "pro",
        "TURBO MAKER": "pro",
        "MASTER PRO": "pro",
      };

      const plans: PlanOption[] = [
        { plan_name: "Admin", role_value: "admin", monthly_credits: 999999, is_annual: false },
        ...(data || []).map(p => ({
          plan_name: p.plan_name,
          role_value: planRoleMap[p.plan_name] || "free",
          monthly_credits: p.monthly_credits || 0,
          is_annual: p.is_annual || false,
        })),
      ];

      setAvailablePlans(plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
    }
  };

  // Dynamic search - filter users as user types
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.full_name?.toLowerCase().includes(searchLower) ||
        user.whatsapp?.toLowerCase().includes(searchLower);
      
      // Filter by role or status (pending)
      let matchesFilter = true;
      if (filterRole === "pending") {
        matchesFilter = user.status === "pending";
      } else if (filterRole !== "all") {
        matchesFilter = user.role === filterRole;
      }
      
      return matchesSearch && matchesFilter;
    });
  }, [users, searchTerm, filterRole]);

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handleApproveAllPending = async () => {
    const pendingUsers = users.filter(u => u.status === "pending");
    if (pendingUsers.length === 0) {
      toast.info("Não há usuários pendentes");
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: "active" })
        .in("id", pendingUsers.map(u => u.id));

      if (error) throw error;
      
      // Enviar email de aprovação para cada usuário (com WhatsApp se disponível)
      for (const user of pendingUsers) {
        try {
          await supabase.functions.invoke("send-approved-email", {
            body: { 
              email: user.email, 
              fullName: user.full_name,
              whatsapp: user.whatsapp 
            },
          });
        } catch (e) {
          console.error(`Erro ao enviar notificações para ${user.email}:`, e);
        }
      }
      
      toast.success(`${pendingUsers.length} usuários aprovados e notificados!`);
      fetchAdminData();
    } catch (error) {
      toast.error("Erro ao aprovar usuários");
    }
  };

  const handleApproveUser = async (user: UserWithRole) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: "active" })
        .eq("id", user.id);

      if (error) throw error;
      
      // Enviar email de aprovação (com WhatsApp se disponível)
      try {
        await supabase.functions.invoke("send-approved-email", {
          body: { 
            email: user.email, 
            fullName: user.full_name,
            whatsapp: user.whatsapp 
          },
        });
      } catch (e) {
        console.error(`Erro ao enviar notificações para ${user.email}:`, e);
      }
      
      toast.success(`Usuário ${user.email} aprovado e notificado!`);
      fetchAdminData();
    } catch (error) {
      toast.error("Erro ao aprovar usuário");
    }
  };

  const handleEditUser = (user: UserWithRole) => {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name || "",
      email: user.email || "",
      whatsapp: user.whatsapp || "",
      status: user.status || "active",
      role: user.role,
      selectedPlanName: "",
    });
    setEditModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    setSavingUser(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: editForm.full_name,
          whatsapp: editForm.whatsapp,
          status: editForm.status,
        })
        .eq("id", selectedUser.id);

      if (profileError) throw profileError;

      // Check if role/plan changed
      const roleChanged = editForm.role !== selectedUser.role;
      
      if (roleChanged) {
        // Update role
        const { error: roleError } = await supabase
          .from("user_roles")
          .update({ role: editForm.role as "admin" | "pro" | "free" })
          .eq("user_id", selectedUser.id);

        if (roleError) throw roleError;

        // If upgrading to a paid plan (pro), add credits and send email
        if (editForm.role === "pro" && selectedUser.role !== "pro") {
          // Find the selected plan to get credits
          const selectedPlan = availablePlans.find(p => p.plan_name === editForm.selectedPlanName);
          const creditsToAdd = selectedPlan?.monthly_credits || 800; // Default to START CREATOR credits
          const planName = selectedPlan?.plan_name || "Pro";
          
          // Add credits to user
          const { data: currentCredits } = await supabase
            .from("user_credits")
            .select("balance")
            .eq("user_id", selectedUser.id)
            .single();

          const newBalance = (currentCredits?.balance || 0) + creditsToAdd;

          await supabase
            .from("user_credits")
            .upsert(
              { user_id: selectedUser.id, balance: newBalance },
              { onConflict: "user_id" }
            );

          // Log credit transaction
          await supabase.from("credit_transactions").insert({
            user_id: selectedUser.id,
            amount: creditsToAdd,
            transaction_type: "add",
            description: `Plano ${planName} ativado manualmente pelo admin`,
          });

          // Send plan confirmation email
          try {
            await supabase.functions.invoke("send-template-test", {
              body: {
                to: selectedUser.email,
                templateType: "plan_start",
                variables: {
                  name: selectedUser.full_name || selectedUser.email?.split("@")[0],
                  plan_name: planName,
                  credits: creditsToAdd,
                },
              },
            });
            toast.success(`Plano ${planName} ativado! ${creditsToAdd} créditos adicionados e email enviado.`);
          } catch (emailError) {
            console.error("Error sending email:", emailError);
            toast.success(`Plano ${planName} ativado! ${creditsToAdd} créditos adicionados. (Email não enviado)`);
          }
        } else {
          toast.success("Usuário atualizado com sucesso!");
        }
      } else {
        toast.success("Usuário atualizado com sucesso!");
      }

      setEditModalOpen(false);
      fetchAdminData();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Erro ao atualizar usuário");
    } finally {
      setSavingUser(false);
    }
  };

  const handleChangePassword = (userId: string) => {
    toast.info("Funcionalidade de reset de senha será enviada por email");
  };

  const handleLockUser = (user: UserWithRole) => {
    setSelectedUser(user);
    setLockDialogOpen(true);
  };

  const confirmLockUser = async () => {
    if (!selectedUser) return;

    try {
      const newStatus = selectedUser.status === "blocked" ? "active" : "blocked";
      const { error } = await supabase
        .from("profiles")
        .update({ status: newStatus })
        .eq("id", selectedUser.id);

      if (error) {
        console.error("Error updating user status:", error);
        throw error;
      }
      
      toast.success(newStatus === "blocked" ? "Usuário bloqueado!" : "Usuário desbloqueado!");
      setLockDialogOpen(false);
      fetchAdminData();
    } catch (error: any) {
      console.error("Error updating user status:", error);
      toast.error(`Erro ao atualizar status: ${error?.message || 'Erro desconhecido'}`);
    }
  };

  const handleDisableUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: "inactive" })
        .eq("id", userId);

      if (error) {
        console.error("Error disabling user:", error);
        throw error;
      }
      
      toast.success("Usuário desativado!");
      fetchAdminData();
    } catch (error: any) {
      console.error("Error disabling user:", error);
      toast.error(`Erro ao desativar usuário: ${error?.message || 'Erro desconhecido'}`);
    }
  };

  const handleDeleteUser = (user: UserWithRole) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const userId = selectedUser.id;
      
      // Use Edge Function to delete user completely (including auth.users)
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { userId },
      });

      if (error) {
        console.error("Error calling delete-user function:", error);
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }
      
      toast.success("Usuário e todos os dados relacionados excluídos permanentemente!");
      setDeleteDialogOpen(false);
      fetchAdminData();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(`Erro ao excluir usuário: ${error?.message || 'Erro desconhecido'}`);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === paginatedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(paginatedUsers.map(u => u.id));
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-purple-500/20 text-purple-400 border-purple-500/50",
      pro: "bg-primary/20 text-primary border-primary/50",
      free: "bg-muted text-muted-foreground border-border",
    };
    return colors[role] || colors.free;
  };

  const getStatusBadge = (status: string | null) => {
    const statusVal = status || "active";
    if (statusVal === "active") return "bg-success/20 text-success border-success/50";
    if (statusVal === "pending") return "bg-primary/20 text-primary border-primary/50";
    if (statusVal === "blocked") return "bg-destructive/20 text-destructive border-destructive/50";
    return "bg-muted text-muted-foreground border-border";
  };

  const getStatusLabel = (status: string | null) => {
    const labels: Record<string, string> = {
      active: "Ativo",
      pending: "Pendente",
      blocked: "Bloqueado",
      inactive: "Inativo",
    };
    return labels[status || "active"] || status || "Ativo";
  };

  if (role?.role !== "admin") {
    return (
      <MainLayout>
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center max-w-md">
            <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar o painel administrativo.
            </p>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <SEOHead
        title="Painel Administrativo"
        description="Gerencie usuários, créditos e configurações da plataforma."
        noindex={true}
      />
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">Painel Administrativo</h1>
              <p className="text-muted-foreground">
                Gerir utilizadores, créditos e APIs da aplicação.
              </p>
            </div>
            <Button variant="outline" onClick={fetchAdminData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="global-dashboard" className="space-y-6">
            <TabsList className="bg-secondary/50 p-1 h-auto flex-wrap">
              <TabsTrigger value="global-dashboard" className="flex items-center gap-2">
                <PieChart className="w-4 h-4" />
                Dashboard Global
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Utilizadores
              </TabsTrigger>
              <TabsTrigger value="credits" className="flex items-center gap-2">
                <Coins className="w-4 h-4" />
                Créditos
              </TabsTrigger>
              <TabsTrigger value="apis" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                APIs
              </TabsTrigger>
              <TabsTrigger value="pixel" className="flex items-center gap-2">
                <Megaphone className="w-4 h-4" />
                Pixel/Ads
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Pagamentos
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                Assinaturas
              </TabsTrigger>
              <TabsTrigger value="storage" className="flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                Armazenamento
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notificações
              </TabsTrigger>
              <TabsTrigger value="permissions" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Permissões de Planos
              </TabsTrigger>
              <TabsTrigger value="user-permissions" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Permissões Individuais
              </TabsTrigger>
              <TabsTrigger value="landing" className="flex items-center gap-2">
                <Layout className="w-4 h-4" />
                Landing Page
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Manutenção Ferramentas
              </TabsTrigger>
              <TabsTrigger value="global-maintenance" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Manutenção Global
              </TabsTrigger>
              <TabsTrigger value="migration" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Migração de Clientes
              </TabsTrigger>
              <TabsTrigger value="monitoring" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Monitoramento
              </TabsTrigger>
              <TabsTrigger value="blog" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Blog
              </TabsTrigger>
              <TabsTrigger value="whatsapp-templates" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </TabsTrigger>
              <TabsTrigger value="export-data" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Exportar Dados
              </TabsTrigger>
            </TabsList>

            {/* Global Dashboard Tab */}
            <TabsContent value="global-dashboard">
              <AdminGlobalDashboardTab />
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-5">
                  <p className="text-sm text-muted-foreground mb-2">Total de Utilizadores</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalUsers}</p>
                </Card>
                <Card className="p-5">
                  <p className="text-sm text-muted-foreground mb-2">Ativação Pendente</p>
                  <p className="text-3xl font-bold text-primary">{stats.pendingActivation}</p>
                </Card>
                <Card className="p-5">
                  <p className="text-sm text-muted-foreground mb-2">Online Agora (15min)</p>
                  <p className="text-3xl font-bold text-success">{stats.onlineNow}</p>
                </Card>
                <Card className="p-5">
                  <p className="text-sm text-muted-foreground mb-2">Logins (24h)</p>
                  <p className="text-3xl font-bold text-foreground">{stats.logins24h}</p>
                </Card>
              </div>

              {/* Approve All Button */}
              <Button
                onClick={handleApproveAllPending}
                className="w-full bg-success text-success-foreground hover:bg-success/90"
                disabled={stats.pendingActivation === 0}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Aprovar Todos os Utilizadores Pendentes ({stats.pendingActivation})
              </Button>

              {/* User Management */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Gerenciamento de Utilizadores
                </h3>

                {/* Filters - Dynamic Search */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por email, whatsapp ou nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-secondary border-border"
                      />
                    </div>
                    {searchTerm && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {filteredUsers.length} resultado(s) encontrado(s)
                      </p>
                    )}
                  </div>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-40 bg-secondary border-border">
                      <SelectValue placeholder="Filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={String(usersPerPage)} onValueChange={(v) => setUsersPerPage(Number(v))}>
                    <SelectTrigger className="w-32 bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 por página</SelectItem>
                      <SelectItem value="25">25 por página</SelectItem>
                      <SelectItem value="50">50 por página</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Users Table */}
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border text-left">
                            <th className="pb-3 pr-4">
                              <Checkbox 
                                checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                                onCheckedChange={toggleSelectAll}
                              />
                            </th>
                            <th className="pb-3 pr-4 text-sm font-medium text-muted-foreground">
                              EMAIL
                            </th>
                            <th className="pb-3 pr-4 text-sm font-medium text-muted-foreground">
                              WHATSAPP
                            </th>
                            <th className="pb-3 pr-4 text-sm font-medium text-muted-foreground">
                              NOME
                            </th>
                            <th className="pb-3 pr-4 text-sm font-medium text-muted-foreground">
                              PLANO
                            </th>
                            <th className="pb-3 pr-4 text-sm font-medium text-muted-foreground">
                              CRÉDITOS
                            </th>
                            <th className="pb-3 pr-4 text-sm font-medium text-muted-foreground">
                              STATUS
                            </th>
                            <th className="pb-3 text-sm font-medium text-muted-foreground">AÇÕES</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedUsers.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-muted-foreground">
                                {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
                              </td>
                            </tr>
                          ) : (
                            paginatedUsers.map((user) => (
                              <tr key={user.id} className="border-b border-border/50">
                                <td className="py-4 pr-4">
                                  <Checkbox
                                    checked={selectedUsers.includes(user.id)}
                                    onCheckedChange={() => toggleUserSelection(user.id)}
                                  />
                                </td>
                                <td className="py-4 pr-4 text-sm text-foreground">
                                  <div className="flex items-center gap-2">
                                    <span>{user.email}</span>
                                    {user.auth_provider === "google" && (
                                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] px-1.5 py-0">
                                        Google
                                      </Badge>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 pr-4 text-sm">
                                  {user.whatsapp ? (
                                    <a 
                                      href={`https://wa.me/${user.whatsapp.replace(/\D/g, '')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline"
                                    >
                                      {user.whatsapp}
                                    </a>
                                  ) : (
                                    <span className="text-muted-foreground">N/A</span>
                                  )}
                                </td>
                                <td className="py-4 pr-4 text-sm text-muted-foreground">
                                  {user.full_name || "N/A"}
                                </td>
                                <td className="py-4 pr-4">
                                  <Badge className={getRoleBadge(user.role)}>
                                    {user.role.toUpperCase()}
                                  </Badge>
                                </td>
                                <td className="py-4 pr-4 text-sm font-medium text-foreground">
                                  <span className={user.user_credits_balance === 0 ? "text-destructive" : "text-primary"}>
                                    {user.user_credits_balance !== null ? user.user_credits_balance.toLocaleString('pt-BR') : "—"}
                                  </span>
                                </td>
                                <td className="py-4 pr-4">
                                  <Badge className={getStatusBadge(user.status)}>
                                    {getStatusLabel(user.status)}
                                  </Badge>
                                </td>
                                <td className="py-4">
                                  <div className="flex items-center gap-1">
                                    {user.status === "pending" && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                                        onClick={() => handleApproveUser(user)}
                                        title="Aprovar"
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                                      onClick={() => handleEditUser(user)}
                                      title="Editar"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                                      onClick={() => handleChangePassword(user.id)}
                                      title="Alterar Senha"
                                    >
                                      <Key className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                                      onClick={() => handleLockUser(user)}
                                      title={user.status === "blocked" ? "Desbloquear" : "Bloquear"}
                                    >
                                      <Lock className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                                      onClick={() => handleDisableUser(user.id)}
                                      title="Desativar"
                                    >
                                      <UserMinus className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                      onClick={() => handleDeleteUser(user)}
                                      title="Excluir"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-end gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Anterior
                        </Button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let page = i + 1;
                          if (totalPages > 5 && currentPage > 3) {
                            page = Math.min(currentPage - 2 + i, totalPages - 4 + i);
                          }
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className={currentPage === page ? "bg-primary" : ""}
                            >
                              {page}
                            </Button>
                          );
                        })}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Próximo
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </Card>
            </TabsContent>

            {/* Credits Tab */}
            <TabsContent value="credits">
              <AdminCreditsTab />
            </TabsContent>

            <TabsContent value="apis">
              <AdminAPIsTab />
            </TabsContent>

            <TabsContent value="pixel">
              <AdminPixelTab />
            </TabsContent>

            <TabsContent value="payments">
              <AdminPaymentsTab />
            </TabsContent>

            <TabsContent value="subscriptions">
              <AdminSubscriptionsTab />
            </TabsContent>

            <TabsContent value="storage">
              <AdminStorageTab />
            </TabsContent>

            <TabsContent value="notifications">
              <AdminNotificationsTab />
            </TabsContent>

            <TabsContent value="permissions">
              <AdminPermissionsTab />
            </TabsContent>

            <TabsContent value="user-permissions">
              <AdminUserPermissionsTab />
            </TabsContent>

            <TabsContent value="landing">
              <AdminLandingTab />
            </TabsContent>

            <TabsContent value="maintenance">
              <AdminMaintenanceTab />
            </TabsContent>

            <TabsContent value="global-maintenance">
              <AdminGlobalMaintenanceTab />
            </TabsContent>

            <TabsContent value="migration">
              <AdminMigrationTab />
            </TabsContent>

            <TabsContent value="monitoring">
              <AdminMonitoringTab />
            </TabsContent>

            <TabsContent value="blog">
              <AdminBlogTab />
            </TabsContent>

            <TabsContent value="whatsapp-templates">
              <AdminWhatsAppTemplatesTab />
            </TabsContent>

            <TabsContent value="export-data">
              <AdminExportDataTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit User Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Nome Completo</label>
              <Input
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Email</label>
              <Input
                value={editForm.email}
                disabled
                className="bg-secondary border-border opacity-50"
              />
              <p className="text-xs text-muted-foreground mt-1">Email não pode ser alterado</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">WhatsApp</label>
              <Input
                value={editForm.whatsapp}
                onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                className="bg-secondary border-border"
                placeholder="Ex: 5511999999999"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Status</label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="blocked">Bloqueado</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Plano / Role</label>
              <Select 
                value={editForm.selectedPlanName || editForm.role} 
                onValueChange={(planName) => {
                  const plan = availablePlans.find(p => p.plan_name === planName);
                  setEditForm({ 
                    ...editForm, 
                    role: plan?.role_value || "free",
                    selectedPlanName: planName,
                  });
                }}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlans.length > 0 ? (
                    availablePlans.map((plan) => (
                      <SelectItem key={plan.plan_name} value={plan.plan_name}>
                        <div className="flex items-center gap-2">
                          <span>{plan.plan_name}</span>
                          {plan.plan_name !== "Admin" && plan.plan_name !== "FREE" && (
                            <span className="text-xs text-muted-foreground">
                              (+{plan.monthly_credits.toLocaleString()} créditos)
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              {editForm.selectedPlanName && editForm.role === "pro" && (
                <p className="text-xs text-success mt-1">
                  ✓ Ao salvar, {availablePlans.find(p => p.plan_name === editForm.selectedPlanName)?.monthly_credits.toLocaleString() || 0} créditos serão adicionados e email de confirmação enviado.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser} disabled={savingUser}>
              {savingUser ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lock User Dialog */}
      <AlertDialog open={lockDialogOpen} onOpenChange={setLockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedUser?.status === "blocked" ? "Desbloquear Usuário" : "Bloquear Usuário"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.status === "blocked"
                ? `Deseja desbloquear o usuário ${selectedUser?.email}?`
                : `Deseja bloquear o usuário ${selectedUser?.email}? Ele não poderá acessar a plataforma.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLockUser}>
              {selectedUser?.status === "blocked" ? "Desbloquear" : "Bloquear"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário {selectedUser?.email}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default AdminPanel;
