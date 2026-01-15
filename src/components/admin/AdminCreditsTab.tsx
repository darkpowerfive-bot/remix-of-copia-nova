import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Settings, Search, Plus, RefreshCw, Loader2, Download, History, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { getToolInfo } from "@/lib/creditToolsMap";

interface UserCredit {
  id: string;
  user_id: string;
  balance: number;
  updated_at: string | null;
  email?: string;
  full_name?: string;
  whatsapp?: string;
}

interface CreditTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string | null;
}

interface SearchResult {
  id: string;
  email: string | null;
  full_name: string | null;
  whatsapp: string | null;
}

interface StatsData {
  totalCreditsAdded: number;
  totalCreditsUsed: number;
  totalTransactions: number;
  topUsers: { email: string; credits: number }[];
  usageByTool: { tool: string; credits: number; count: number }[];
}

type TodayUsageRow = {
  userId: string;
  email: string;
  credits: number;
  count: number;
};

export function AdminCreditsTab() {
  const [initialBalance, setInitialBalance] = useState("50");
  const [costMultiplier, setCostMultiplier] = useState("2");
  const [searchBalance, setSearchBalance] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [addCreditsSearch, setAddCreditsSearch] = useState("");
  const [addCreditsResults, setAddCreditsResults] = useState<SearchResult[]>([]);
  const [selectedUserForCredits, setSelectedUserForCredits] = useState<SearchResult | null>(null);
  const [creditsAmount, setCreditsAmount] = useState("1000");
  const [creditsPreset, setCreditsPreset] = useState("custom");
  const [creditsReason, setCreditsReason] = useState("");
  const [minBalance, setMinBalance] = useState("0");
  const [usersWithCredits, setUsersWithCredits] = useState<UserCredit[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // first day of current month
    return format(d, "yyyy-MM-dd");
  });
  const [endDate, setEndDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedUserHistory, setSelectedUserHistory] = useState<UserCredit | null>(null);
  const [transactionHistory, setTransactionHistory] = useState<CreditTransaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const [todayUsage, setTodayUsage] = useState<TodayUsageRow[]>([]);
  const [loadingTodayUsage, setLoadingTodayUsage] = useState(false);

  useEffect(() => {
    fetchUsersWithCredits();
    loadGlobalSettings();
  }, []);

  // Dynamic search for balance check
  useEffect(() => {
    if (searchBalance.length >= 1) {
      searchUsers(searchBalance, setSearchResults);
    } else {
      setSearchResults([]);
    }
  }, [searchBalance]);

  // Dynamic search for add credits
  useEffect(() => {
    if (addCreditsSearch.length >= 1) {
      searchUsers(addCreditsSearch, setAddCreditsResults);
    } else {
      setAddCreditsResults([]);
      setSelectedUserForCredits(null);
    }
  }, [addCreditsSearch]);

  const searchUsers = async (term: string, setResults: (results: SearchResult[]) => void) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name, whatsapp")
      .or(`email.ilike.%${term}%,full_name.ilike.%${term}%,whatsapp.ilike.%${term}%`)
      .limit(5);

    setResults(data || []);
  };

  const loadGlobalSettings = async () => {
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "global_credits")
      .single();
    if (data?.value) {
      const settings = data.value as { initial_balance?: number; cost_multiplier?: number };
      setInitialBalance(String(settings.initial_balance || 50));
      setCostMultiplier(String(settings.cost_multiplier || 2));
    }
  };

  const saveGlobalSettings = async () => {
    const { error } = await supabase
      .from("admin_settings")
      .upsert({
        key: "global_credits",
        value: { initial_balance: Number(initialBalance), cost_multiplier: Number(costMultiplier) },
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });

    if (error) {
      console.error("Erro ao salvar global_credits:", error);
      toast.error("Erro ao salvar configurações");
    } else {
      toast.success("Configurações salvas!");
    }
  };

  const fetchUsersWithCredits = async () => {
    setLoading(true);
    try {
      const { data: credits } = await supabase
        .from("user_credits")
        .select("*")
        .gte("balance", Number(minBalance) || 0)
        .order("balance", { ascending: false })
        .limit(50);

      if (credits) {
        const userIds = credits.map((c) => c.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, full_name, whatsapp")
          .in("id", userIds);

        // Only include credits that have a valid profile (filter out orphaned records)
        const enriched: UserCredit[] = [];
        for (const credit of credits) {
          const profile = profiles?.find((p) => p.id === credit.user_id);
          if (profile) {
            enriched.push({
              ...credit,
              email: profile.email || "",
              full_name: profile.full_name || "",
              whatsapp: profile.whatsapp || "",
            });
          }
        }
        setUsersWithCredits(enriched);
      }
    } catch (error) {
      console.error("Error fetching credits:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetChange = (value: string) => {
    setCreditsPreset(value);
    if (value !== "custom") {
      setCreditsAmount(value);
    }
  };

  const handleAddCredits = async () => {
    if (!selectedUserForCredits && !addCreditsSearch.trim()) {
      toast.error("Selecione um usuário");
      return;
    }
    if (!creditsAmount || Number(creditsAmount) <= 0) {
      toast.error("Quantidade inválida");
      return;
    }

    let userId = selectedUserForCredits?.id;

    if (!userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .or(`email.eq.${addCreditsSearch.trim()},whatsapp.eq.${addCreditsSearch.trim()}`)
        .limit(1)
        .single();

      if (!profile) {
        toast.error("Usuário não encontrado");
        return;
      }
      userId = profile.id;
    }

    const { data: currentCredits } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", userId)
      .single();

    const newBalance = (currentCredits?.balance || 0) + Number(creditsAmount);

    const { error } = await supabase
      .from("user_credits")
      .upsert(
        {
          user_id: userId,
          balance: newBalance,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (error) {
      toast.error("Erro ao adicionar créditos");
    } else {
      await supabase.from("credit_transactions").insert({
        user_id: userId,
        amount: Number(creditsAmount),
        transaction_type: "add",
        description: creditsReason || "Créditos adicionados pelo admin",
      });

      toast.success(`${creditsAmount} créditos adicionados!`);
      setAddCreditsSearch("");
      setAddCreditsResults([]);
      setSelectedUserForCredits(null);
      setCreditsAmount("1000");
      setCreditsReason("");
      fetchUsersWithCredits();
    }
  };

  const handleViewBalance = async (user: SearchResult) => {
    const { data: credits } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    toast.info(`Saldo de ${user.email || user.full_name}: ${credits?.balance?.toFixed(2) || 0} créditos`);
    setSearchBalance("");
    setSearchResults([]);
  };

  const handleZeroBalance = async (user: UserCredit) => {
    const { error } = await supabase
      .from("user_credits")
      .update({ balance: 0, updated_at: new Date().toISOString() })
      .eq("user_id", user.user_id);

    if (error) {
      toast.error("Erro ao zerar saldo");
    } else {
      await supabase.from("credit_transactions").insert({
        user_id: user.user_id,
        amount: -user.balance,
        transaction_type: "deduct",
        description: "Saldo zerado pelo admin",
      });

      toast.success("Saldo zerado!");
      fetchUsersWithCredits();
    }
  };

  const handleViewHistory = async (user: UserCredit) => {
    setSelectedUserHistory(user);
    setLoadingHistory(true);
    setHistoryModalOpen(true);

    const { data } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", user.user_id)
      .order("created_at", { ascending: false })
      .limit(50);

    setTransactionHistory(data || []);
    setLoadingHistory(false);
  };

  const loadTodayCreditUsage = async () => {
    setLoadingTodayUsage(true);
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const startISO = start.toISOString();
      const endISO = new Date().toISOString();

      const { data: usage, error: usageError } = await supabase
        .from("credit_usage")
        .select("user_id, credits_used, created_at")
        .gte("created_at", startISO)
        .lte("created_at", endISO);

      if (usageError) throw usageError;

      const byUser = new Map<string, { credits: number; count: number }>();
      for (const row of usage || []) {
        const prev = byUser.get(row.user_id) || { credits: 0, count: 0 };
        byUser.set(row.user_id, {
          credits: prev.credits + (row.credits_used || 0),
          count: prev.count + 1,
        });
      }

      const userIds = [...byUser.keys()];
      if (userIds.length === 0) {
        setTodayUsage([]);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      const emailById = new Map((profiles || []).map((p) => [p.id, p.email || ""])) as Map<string, string>;

      const rows: TodayUsageRow[] = userIds
        .map((userId) => {
          const agg = byUser.get(userId)!;
          return {
            userId,
            email: emailById.get(userId) || userId.slice(0, 8) + "...",
            credits: agg.credits,
            count: agg.count,
          };
        })
        .sort((a, b) => b.credits - a.credits);

      setTodayUsage(rows);
    } catch (e) {
      console.error("Error loading today's credit usage:", e);
      toast.error("Erro ao carregar consumo de hoje");
    } finally {
      setLoadingTodayUsage(false);
    }
  };

  const loadCreditStats = async () => {
    if (!startDate || !endDate) {
      toast.error("Selecione as datas inicial e final");
      return;
    }

    setLoadingStats(true);
    try {
      const startISO = new Date(startDate).toISOString();
      const endISO = new Date(endDate + "T23:59:59").toISOString();

      // Get transactions for the period
      const { data: transactions } = await supabase
        .from("credit_transactions")
        .select("*")
        .gte("created_at", startISO)
        .lte("created_at", endISO);

      // Get credit usage for the period
      const { data: usage } = await supabase
        .from("credit_usage")
        .select("*")
        .gte("created_at", startISO)
        .lte("created_at", endISO);

      // Get all profiles for enrichment
      const allUserIds = [
        ...(transactions?.map(t => t.user_id) || []),
        ...(usage?.map(u => u.user_id) || []),
      ];
      const uniqueUserIds = [...new Set(allUserIds)];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", uniqueUserIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.email]) || []);

      // Calculate stats
      const totalCreditsAdded = transactions
        ?.filter(t => t.transaction_type === "add")
        .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      const totalCreditsUsed = usage?.reduce((sum, u) => sum + (u.credits_used || 0), 0) || 0;

      const totalTransactions = (transactions?.length || 0) + (usage?.length || 0);

      // Top users by usage
      const userUsage: Record<string, number> = {};
      usage?.forEach(u => {
        userUsage[u.user_id] = (userUsage[u.user_id] || 0) + (u.credits_used || 0);
      });
      const topUsers = Object.entries(userUsage)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([userId, credits]) => ({
          email: profileMap.get(userId) || userId.slice(0, 8) + "...",
          credits,
        }));

      // Usage by tool
      const toolUsage: Record<string, { credits: number; count: number }> = {};
      usage?.forEach(u => {
        const key = u.operation_type;
        if (!toolUsage[key]) {
          toolUsage[key] = { credits: 0, count: 0 };
        }
        toolUsage[key].credits += u.credits_used || 0;
        toolUsage[key].count += 1;
      });
      const usageByTool = Object.entries(toolUsage)
        .sort((a, b) => b[1].credits - a[1].credits)
        .slice(0, 10)
        .map(([tool, data]) => ({
          tool,
          credits: data.credits,
          count: data.count,
        }));

      setStatsData({
        totalCreditsAdded,
        totalCreditsUsed,
        totalTransactions,
        topUsers,
        usageByTool,
      });

      toast.success("Estatísticas carregadas!");
    } catch (error) {
      console.error("Error loading stats:", error);
      toast.error("Erro ao carregar estatísticas");
    } finally {
      setLoadingStats(false);
    }
  };

  const handleExportStats = () => {
    if (!statsData) {
      // Export users list if no stats loaded
      const csvContent = usersWithCredits.map(u => 
        `${u.email},${u.full_name},${u.whatsapp},${u.balance}`
      ).join("\n");
      
      const blob = new Blob([`Email,Nome,WhatsApp,Saldo\n${csvContent}`], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `creditos_usuarios_${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      toast.success("Lista de usuários exportada!");
      return;
    }

    // Export stats report
    let report = `Relatório de Créditos\n`;
    report += `Período: ${startDate} a ${endDate}\n\n`;
    report += `Resumo:\n`;
    report += `Créditos Adicionados: ${statsData.totalCreditsAdded.toFixed(2)}\n`;
    report += `Créditos Consumidos: ${statsData.totalCreditsUsed.toFixed(2)}\n`;
    report += `Total de Transações: ${statsData.totalTransactions}\n\n`;
    report += `Top Usuários por Consumo:\n`;
    statsData.topUsers.forEach((u, i) => {
      report += `${i + 1}. ${u.email}: ${u.credits.toFixed(2)} créditos\n`;
    });
    report += `\nUso por Ferramenta:\n`;
    statsData.usageByTool.forEach(t => {
      const toolInfo = getToolInfo(t.tool);
      report += `${toolInfo.name}: ${t.credits.toFixed(2)} créditos (${t.count} usos)\n`;
    });

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_creditos_${startDate}_${endDate}.txt`;
    a.click();
    toast.success("Relatório exportado!");
  };

  return (
    <div className="space-y-6">
      {/* Global Configs */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Configurações Globais</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Saldo inicial (créditos dados automaticamente a novos usuários)
            </label>
            <Input
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              className="bg-secondary border-border"
              type="number"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Multiplicador de Custo para Geração de Voz (TTS)
            </label>
            <Input
              value={costMultiplier}
              onChange={(e) => setCostMultiplier(e.target.value)}
              className="bg-secondary border-border"
              type="number"
              step="0.1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ex: 2.0 = dobra o custo, 0.5 = metade do custo
            </p>
          </div>
        </div>
        <Button onClick={saveGlobalSettings} className="w-full bg-primary">
          Salvar Configurações
        </Button>
      </Card>

      {/* Check Balance with Dynamic Search */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Consultar Saldo</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-2">Buscar por Email, Nome ou WhatsApp</p>
        <div className="relative">
          <Input
            placeholder="Digite para buscar..."
            value={searchBalance}
            onChange={(e) => setSearchBalance(e.target.value)}
            className="bg-secondary border-border"
          />
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-auto">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="px-4 py-2 hover:bg-secondary cursor-pointer flex justify-between items-center"
                  onClick={() => handleViewBalance(user)}
                >
                  <div>
                    <p className="text-sm text-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.full_name} • {user.whatsapp || "Sem WhatsApp"}</p>
                  </div>
                  <Button size="sm" variant="outline">Ver Saldo</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Add Credits with Dynamic Search */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Adicionar Créditos (Individual)</h3>
        </div>
        <div className="space-y-4">
          <div className="relative">
            <label className="text-sm text-muted-foreground mb-2 block">
              Buscar Usuário (Email, Nome ou WhatsApp)
            </label>
            <Input
              placeholder="Digite para buscar..."
              value={addCreditsSearch}
              onChange={(e) => {
                setAddCreditsSearch(e.target.value);
                setSelectedUserForCredits(null);
              }}
              className="bg-secondary border-border"
            />
            {addCreditsResults.length > 0 && !selectedUserForCredits && (
              <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-auto">
                {addCreditsResults.map((user) => (
                  <div
                    key={user.id}
                    className="px-4 py-2 hover:bg-secondary cursor-pointer"
                    onClick={() => {
                      setSelectedUserForCredits(user);
                      setAddCreditsSearch(user.email || user.full_name || "");
                      setAddCreditsResults([]);
                    }}
                  >
                    <p className="text-sm text-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.full_name} • {user.whatsapp || "Sem WhatsApp"}</p>
                  </div>
                ))}
              </div>
            )}
            {selectedUserForCredits && (
              <Badge className="mt-2 bg-primary/20 text-primary">
                Selecionado: {selectedUserForCredits.email}
              </Badge>
            )}
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Quantidade de Créditos ou Recorte
            </label>
            <Select value={creditsPreset} onValueChange={handlePresetChange}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Valor Personalizado" />
              </SelectTrigger>
              <SelectContent className="z-[200] bg-popover" position="popper" sideOffset={4}>
                <SelectItem value="custom">Valor Personalizado</SelectItem>
                <SelectItem value="100">100 créditos</SelectItem>
                <SelectItem value="500">500 créditos</SelectItem>
                <SelectItem value="1000">1000 créditos</SelectItem>
                <SelectItem value="5000">5000 créditos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Input
              placeholder="Ex: 1000"
              value={creditsAmount}
              onChange={(e) => setCreditsAmount(e.target.value)}
              className="bg-secondary border-border"
              type="number"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Descrição (opcional)</label>
            <Input
              placeholder="Ex: Bônus inicial"
              value={creditsReason}
              onChange={(e) => setCreditsReason(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <Button onClick={handleAddCredits} className="w-full bg-primary">
            Adicionar Créditos
          </Button>
        </div>
      </Card>

      {/* Users with Balance */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Usuários com Saldo Disponível</h3>
          </div>
          <Button size="sm" variant="outline" onClick={fetchUsersWithCredits}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Atualizar
          </Button>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <label className="text-sm text-muted-foreground">Saldo Mínimo</label>
          <Input
            value={minBalance}
            onChange={(e) => setMinBalance(e.target.value)}
            className="w-24 bg-secondary border-border"
            type="number"
          />
          <Button size="sm" onClick={fetchUsersWithCredits}>Filtrar</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>EMAIL</TableHead>
                  <TableHead>WHATSAPP</TableHead>
                  <TableHead>NOME</TableHead>
                  <TableHead>SALDO</TableHead>
                  <TableHead>ÚLTIMA ATUALIZAÇÃO</TableHead>
                  <TableHead>AÇÕES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersWithCredits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  usersWithCredits.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="text-primary">{user.email}</TableCell>
                      <TableCell className="text-muted-foreground">{user.whatsapp || "N/A"}</TableCell>
                      <TableCell className="text-muted-foreground">{user.full_name || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-primary border-primary">
                          {user.balance.toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.updated_at
                          ? format(new Date(user.updated_at), "dd/MM/yyyy HH:mm")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-destructive"
                            onClick={() => handleZeroBalance(user)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Zerar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => handleViewHistory(user)}
                          >
                            <History className="w-3 h-3 mr-1" />
                            Histórico
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Today's Usage */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Consumo de Créditos (Hoje)</h3>
          </div>
          <Button size="sm" variant="outline" onClick={loadTodayCreditUsage} disabled={loadingTodayUsage}>
            {loadingTodayUsage ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-1" />
            )}
            Atualizar
          </Button>
        </div>

        {todayUsage.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum consumo registrado hoje.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>USUÁRIO</TableHead>
                  <TableHead>CRÉDITOS</TableHead>
                  <TableHead>USOS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayUsage.slice(0, 50).map((row) => (
                  <TableRow key={row.userId}>
                    <TableCell className="text-primary">{row.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-destructive border-destructive">
                        -{row.credits.toFixed(2)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.count}x</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Stats and Reports */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Estatísticas e Relatórios de Créditos</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Data Inicial</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Data Final</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          <Button 
            className="flex-1 bg-success text-success-foreground hover:bg-success/90"
            onClick={loadCreditStats}
            disabled={loadingStats}
          >
            {loadingStats ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Carregar Estatísticas
          </Button>
          <Button 
            className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleExportStats}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>

        {/* Stats Results */}
        {statsData && (
          <div className="space-y-4 mt-4 pt-4 border-t border-border">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-success/10 border border-success/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Créditos Adicionados</p>
                <p className="text-2xl font-bold text-success">+{statsData.totalCreditsAdded.toFixed(2)}</p>
              </div>
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Créditos Consumidos</p>
                <p className="text-2xl font-bold text-destructive">-{statsData.totalCreditsUsed.toFixed(2)}</p>
              </div>
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Total de Transações</p>
                <p className="text-2xl font-bold text-primary">{statsData.totalTransactions}</p>
              </div>
            </div>

            {/* Top Users */}
            {statsData.topUsers.length > 0 && (
              <div>
                <h4 className="font-medium text-foreground mb-2">Top Usuários por Consumo</h4>
                <div className="space-y-2">
                  {statsData.topUsers.map((u, i) => (
                    <div key={i} className="flex justify-between items-center bg-secondary/50 rounded-lg px-3 py-2">
                      <span className="text-sm text-foreground">
                        <span className="text-muted-foreground mr-2">#{i + 1}</span>
                        {u.email}
                      </span>
                      <Badge variant="outline" className="text-destructive border-destructive">
                        -{u.credits.toFixed(2)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Usage by Tool */}
            {statsData.usageByTool.length > 0 && (
              <div>
                <h4 className="font-medium text-foreground mb-2">Uso por Ferramenta</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>FERRAMENTA</TableHead>
                        <TableHead>CRÉDITOS</TableHead>
                        <TableHead>USOS</TableHead>
                        <TableHead>MÉDIA</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statsData.usageByTool.map((t, i) => {
                        const toolInfo = getToolInfo(t.tool);
                        return (
                          <TableRow key={i}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{toolInfo.icon}</span>
                                <span className="text-sm text-foreground">{toolInfo.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-destructive border-destructive">
                                -{t.credits.toFixed(2)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{t.count}x</TableCell>
                            <TableCell className="text-muted-foreground">
                              {(t.credits / t.count).toFixed(2)}/uso
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {statsData.totalTransactions === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Nenhuma transação encontrada neste período
              </p>
            )}
          </div>
        )}
      </Card>

      {/* History Modal */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histórico de Créditos - {selectedUserHistory?.email}</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-auto">
            {loadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : transactionHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma transação encontrada</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DATA</TableHead>
                    <TableHead>FERRAMENTA</TableHead>
                    <TableHead>CRÉDITOS</TableHead>
                    <TableHead>DESCRIÇÃO</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionHistory.map((t) => {
                    const toolInfo = getToolInfo(t.transaction_type);
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="text-muted-foreground text-xs">
                          {t.created_at ? format(new Date(t.created_at), "dd/MM/yyyy HH:mm") : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{toolInfo.icon}</span>
                            <div>
                              <p className="text-sm font-medium text-foreground">{toolInfo.name}</p>
                              <p className="text-xs text-muted-foreground">{toolInfo.description}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`flex items-center gap-1 w-fit ${t.transaction_type === "add" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
                            {t.transaction_type === "add" ? (
                              <ArrowUp className="w-3 h-3" />
                            ) : (
                              <ArrowDown className="w-3 h-3" />
                            )}
                            {t.amount >= 0 ? "+" : ""}{t.amount.toFixed(2)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs max-w-[150px] truncate">
                          {t.description || "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryModalOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
