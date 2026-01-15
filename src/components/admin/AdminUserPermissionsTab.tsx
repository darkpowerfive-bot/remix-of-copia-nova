import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, User, Shield, Loader2, X, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Lista de todas as ferramentas disponíveis
const AVAILABLE_PERMISSIONS = [
  { key: "analisador_videos", label: "Analisador de Vídeos", description: "Analisa vídeos do YouTube" },
  { key: "gerador_cenas", label: "Gerador de Cenas", description: "Gera cenas para vídeos" },
  { key: "gerador_roteiro_viral", label: "Gerador de Roteiro Viral", description: "Cria roteiros otimizados" },
  { key: "agentes_virais", label: "Agentes Virais", description: "Agentes de IA personalizados" },
  { key: "gerador_voz", label: "Gerador de Voz", description: "Converte texto em áudio" },
  { key: "prompts_imagens", label: "Prompts de Imagens", description: "Biblioteca de prompts" },
  { key: "biblioteca_viral", label: "Biblioteca Viral", description: "Biblioteca de títulos" },
  { key: "explorar_nicho", label: "Explorar Nicho", description: "Pesquisa de nichos" },
  { key: "canais_monitorados", label: "Canais Monitorados", description: "Monitoramento de canais" },
  { key: "analytics_youtube", label: "Analytics YouTube", description: "Análises detalhadas" },
  { key: "buscar_canais", label: "Buscar Canais", description: "Pesquisa de canais" },
  { key: "analisador_canal", label: "Analisador de Canal", description: "Análise de canais" },
  { key: "conversor_srt", label: "Conversor SRT", description: "Conversão de legendas" },
  { key: "analytics", label: "Analytics", description: "Dashboard de analytics" },
  { key: "pastas", label: "Pastas", description: "Organização em pastas" },
  { key: "usar_api_propria", label: "Usar API Própria", description: "Configurar API própria" },
  { key: "baixar_xml", label: "Baixar XML", description: "Download de arquivos XML" },
  { key: "imagefx_cookies", label: "ImageFX Cookies", description: "Configurar cookies ImageFX" },
];

interface UserWithPermissions {
  id: string;
  email: string;
  full_name: string | null;
  status: string | null;
  individual_permissions: {
    id: string;
    permission_key: string;
    expires_at: string | null;
    notes: string | null;
    granted_at: string;
  }[];
}

interface IndividualPermission {
  id: string;
  user_id: string;
  permission_key: string;
  expires_at: string | null;
  notes: string | null;
  granted_at: string;
}

export function AdminUserPermissionsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [savingUser, setSavingUser] = useState<string | null>(null);

  const searchUsers = async () => {
    if (!searchTerm.trim()) {
      toast.error("Digite um email ou nome para buscar");
      return;
    }

    setLoading(true);
    try {
      // Buscar usuários
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, status")
        .or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
        .limit(20);

      if (profilesError) throw profilesError;

      if (!profilesData || profilesData.length === 0) {
        setUsers([]);
        toast.info("Nenhum usuário encontrado");
        return;
      }

      // Buscar permissões individuais de cada usuário
      const userIds = profilesData.map(u => u.id);
      const { data: permissionsData } = await supabase
        .from("user_individual_permissions")
        .select("*")
        .in("user_id", userIds);

      // Agrupar permissões por usuário
      const usersWithPermissions: UserWithPermissions[] = profilesData.map(user => ({
        ...user,
        individual_permissions: ((permissionsData as IndividualPermission[]) || [])
          .filter(p => p.user_id === user.id)
          .map(p => ({
            id: p.id,
            permission_key: p.permission_key,
            expires_at: p.expires_at,
            notes: p.notes,
            granted_at: p.granted_at,
          })),
      }));

      setUsers(usersWithPermissions);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      toast.error("Erro ao buscar usuários");
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = async (userId: string, permissionKey: string, currentlyHas: boolean) => {
    setSavingUser(userId);
    try {
      if (currentlyHas) {
        // Remover permissão
        const { error } = await supabase
          .from("user_individual_permissions")
          .delete()
          .eq("user_id", userId)
          .eq("permission_key", permissionKey);

        if (error) throw error;
        toast.success(`Permissão "${permissionKey}" removida`);
      } else {
        // Adicionar permissão
        const { error } = await supabase
          .from("user_individual_permissions")
          .insert({
            user_id: userId,
            permission_key: permissionKey,
          });

        if (error) throw error;
        toast.success(`Permissão "${permissionKey}" adicionada`);
      }

      // Atualizar lista local
      setUsers(prev => prev.map(user => {
        if (user.id !== userId) return user;
        
        if (currentlyHas) {
          return {
            ...user,
            individual_permissions: user.individual_permissions.filter(p => p.permission_key !== permissionKey),
          };
        } else {
          return {
            ...user,
            individual_permissions: [
              ...user.individual_permissions,
              {
                id: crypto.randomUUID(),
                permission_key: permissionKey,
                expires_at: null,
                notes: null,
                granted_at: new Date().toISOString(),
              },
            ],
          };
        }
      }));
    } catch (error) {
      console.error("Erro ao alterar permissão:", error);
      toast.error("Erro ao alterar permissão");
    } finally {
      setSavingUser(null);
    }
  };

  const setExpiration = async (userId: string, permissionKey: string, expiresAt: string | null) => {
    try {
      const { error } = await supabase
        .from("user_individual_permissions")
        .update({ expires_at: expiresAt })
        .eq("user_id", userId)
        .eq("permission_key", permissionKey);

      if (error) throw error;

      // Atualizar lista local
      setUsers(prev => prev.map(user => {
        if (user.id !== userId) return user;
        return {
          ...user,
          individual_permissions: user.individual_permissions.map(p => 
            p.permission_key === permissionKey ? { ...p, expires_at: expiresAt } : p
          ),
        };
      }));

      toast.success("Data de expiração atualizada");
    } catch (error) {
      console.error("Erro ao definir expiração:", error);
      toast.error("Erro ao definir expiração");
    }
  };

  const grantAllPermissions = async (userId: string) => {
    setSavingUser(userId);
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const existingKeys = user.individual_permissions.map(p => p.permission_key);
      const missingPermissions = AVAILABLE_PERMISSIONS
        .filter(p => !existingKeys.includes(p.key))
        .map(p => ({
          user_id: userId,
          permission_key: p.key,
        }));

      if (missingPermissions.length === 0) {
        toast.info("Usuário já possui todas as permissões");
        return;
      }

      const { error } = await supabase
        .from("user_individual_permissions")
        .insert(missingPermissions);

      if (error) throw error;

      toast.success(`${missingPermissions.length} permissões adicionadas`);
      
      // Atualizar lista
      searchUsers();
    } catch (error) {
      console.error("Erro ao conceder permissões:", error);
      toast.error("Erro ao conceder permissões");
    } finally {
      setSavingUser(null);
    }
  };

  const revokeAllPermissions = async (userId: string) => {
    setSavingUser(userId);
    try {
      const { error } = await supabase
        .from("user_individual_permissions")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("Todas as permissões revogadas");
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, individual_permissions: [] } : user
      ));
    } catch (error) {
      console.error("Erro ao revogar permissões:", error);
      toast.error("Erro ao revogar permissões");
    } finally {
      setSavingUser(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permissões Individuais por Usuário
          </CardTitle>
          <CardDescription>
            Libere ferramentas específicas para usuários, independente do plano deles.
            As permissões individuais são somadas às permissões do plano.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                className="pl-10"
              />
            </div>
            <Button onClick={searchUsers} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {users.length > 0 && (
        <div className="space-y-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-base">{user.full_name || "Sem nome"}</CardTitle>
                      <CardDescription>{user.email}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={user.status === "approved" ? "default" : "secondary"}>
                      {user.status || "pending"}
                    </Badge>
                    <Badge variant="outline">
                      {user.individual_permissions.length} permissões extras
                    </Badge>
                    {expandedUser === user.id ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {expandedUser === user.id && (
                <CardContent className="border-t">
                  <div className="flex gap-2 mb-4 pt-4">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => grantAllPermissions(user.id)}
                      disabled={savingUser === user.id}
                    >
                      Liberar Todas
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => revokeAllPermissions(user.id)}
                      disabled={savingUser === user.id}
                    >
                      Revogar Todas
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {AVAILABLE_PERMISSIONS.map((perm) => {
                      const userPerm = user.individual_permissions.find(p => p.permission_key === perm.key);
                      const hasPermission = !!userPerm;
                      const isExpired = userPerm?.expires_at && new Date(userPerm.expires_at) < new Date();

                      return (
                        <div 
                          key={perm.key} 
                          className={`p-3 rounded-lg border ${
                            hasPermission 
                              ? isExpired 
                                ? "border-destructive/50 bg-destructive/5" 
                                : "border-primary/50 bg-primary/5" 
                              : "border-border"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <Label htmlFor={`${user.id}-${perm.key}`} className="font-medium text-sm">
                              {perm.label}
                            </Label>
                            <Switch
                              id={`${user.id}-${perm.key}`}
                              checked={hasPermission}
                              onCheckedChange={() => togglePermission(user.id, perm.key, hasPermission)}
                              disabled={savingUser === user.id}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{perm.description}</p>
                          
                          {hasPermission && (
                            <div className="flex items-center gap-2 mt-2">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <Input
                                type="date"
                                className="h-7 text-xs"
                                value={userPerm?.expires_at ? format(new Date(userPerm.expires_at), "yyyy-MM-dd") : ""}
                                onChange={(e) => setExpiration(
                                  user.id, 
                                  perm.key, 
                                  e.target.value ? new Date(e.target.value).toISOString() : null
                                )}
                                placeholder="Sem expiração"
                              />
                              {userPerm?.expires_at && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => setExpiration(user.id, perm.key, null)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          )}
                          
                          {isExpired && (
                            <Badge variant="destructive" className="mt-2 text-xs">
                              Expirado
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}