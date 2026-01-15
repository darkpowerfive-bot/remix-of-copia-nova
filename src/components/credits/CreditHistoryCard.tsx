import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Coins, Clock, ChevronDown, ChevronUp, TrendingDown, TrendingUp, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { getToolInfo, getModelName, getToolCost, CREDIT_COSTS } from "@/lib/creditToolsMap";
import { cn } from "@/lib/utils";

interface CreditUsageItem {
  id: string;
  operation_type: string;
  credits_used: number;
  model_used: string | null;
  created_at: string;
}

interface CreditTransactionItem {
  id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

type HistoryItem = {
  id: string;
  type: 'usage' | 'transaction';
  operation: string;
  amount: number;
  modelUsed: string | null;
  description: string | null;
  created_at: string;
  toolInfo: { name: string; icon: string; description: string };
};

interface UsageStats {
  totalSpent: number;
  totalAdded: number;
  mostUsedTool: string;
  operationCounts: Record<string, number>;
  creditsPerTool: Record<string, number>;
}

export function CreditHistoryCard() {
  const { user } = useAuth();
  const { balance, refreshBalance } = useCredits();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [stats, setStats] = useState<UsageStats>({
    totalSpent: 0,
    totalAdded: 0,
    mostUsedTool: '',
    operationCounts: {},
    creditsPerTool: {},
  });

  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [usageResult, transactionsResult] = await Promise.all([
        supabase
          .from('credit_usage')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('credit_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100)
      ]);

      const usageItems: HistoryItem[] = (usageResult.data || []).map((item: CreditUsageItem) => ({
        id: item.id,
        type: 'usage' as const,
        operation: item.operation_type,
        amount: -item.credits_used,
        modelUsed: item.model_used,
        description: null,
        created_at: item.created_at,
        toolInfo: getToolInfo(item.operation_type),
      }));

      const transactionItems: HistoryItem[] = (transactionsResult.data || []).map((item: CreditTransactionItem) => ({
        id: item.id,
        type: 'transaction' as const,
        operation: item.transaction_type,
        amount: item.transaction_type === 'add' || item.transaction_type === 'refund' || item.transaction_type === 'purchase' || item.transaction_type === 'bonus' || item.transaction_type === 'subscription' 
          ? item.amount 
          : -item.amount,
        modelUsed: null,
        description: item.description,
        created_at: item.created_at,
        toolInfo: getToolInfo(item.transaction_type),
      }));

      const combined = [...usageItems, ...transactionItems].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setHistoryItems(combined);

      // Calculate stats
      const operationCounts: Record<string, number> = {};
      const creditsPerTool: Record<string, number> = {};
      let totalSpent = 0;
      let totalAdded = 0;

      usageItems.forEach((item) => {
        const creditsUsed = Math.abs(item.amount);
        totalSpent += creditsUsed;
        const toolName = item.toolInfo.name;
        operationCounts[toolName] = (operationCounts[toolName] || 0) + 1;
        creditsPerTool[toolName] = (creditsPerTool[toolName] || 0) + creditsUsed;
      });

      transactionItems.forEach((item) => {
        if (item.amount > 0) {
          totalAdded += item.amount;
        }
      });

      const mostUsedTool = Object.entries(creditsPerTool)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

      setStats({
        totalSpent,
        totalAdded,
        mostUsedTool,
        operationCounts,
        creditsPerTool,
      });
    } catch (error) {
      console.error('Error fetching credit history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const displayedItems = showAll ? historyItems : historyItems.slice(0, 10);

  const getTransactionBadge = (item: HistoryItem) => {
    // Reembolso
    if (item.operation === 'refund') {
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">Reembolso</Badge>;
    }
    
    // Créditos adicionados (compra, bônus, assinatura, renovação)
    if (item.type === 'transaction' && item.amount > 0) {
      const labels: Record<string, string> = {
        'add': 'Bônus',
        'purchase': 'Compra',
        'subscription': 'Assinatura',
        'bonus': 'Bônus',
      };
      const label = labels[item.operation] || 'Crédito';
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">{label}</Badge>;
    }
    
    // Débitos (uso de ferramentas)
    return <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs">Uso</Badge>;
  };

  const extractModelFromDescription = (item: HistoryItem): string | null => {
    if (item.modelUsed) return item.modelUsed;
    if (item.description) {
      const match = item.description.match(/- ([A-Za-z0-9\s.-]+)$/);
      if (match) return match[1].trim();
    }
    return null;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Histórico de Créditos</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-primary border-primary/50">
            Saldo: {balance.toLocaleString()} créditos
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              refreshBalance();
              fetchHistory();
            }}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3 rounded-lg bg-secondary/50 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-destructive" />
            <span className="text-xs text-muted-foreground">Total Gasto</span>
          </div>
          <p className="text-lg font-bold text-destructive">{stats.totalSpent.toFixed(1)}</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/50 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-xs text-muted-foreground">Total Adicionado</span>
          </div>
          <p className="text-lg font-bold text-success">{stats.totalAdded.toFixed(1)}</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/50 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Coins className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Saldo Atual</span>
          </div>
          <p className={cn("text-lg font-bold", balance < 20 ? "text-destructive" : "text-primary")}>
            {balance.toLocaleString()}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/50 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">⭐</span>
            <span className="text-xs text-muted-foreground">Mais Usada</span>
          </div>
          <p className="text-sm font-medium text-foreground truncate">{stats.mostUsedTool}</p>
        </div>
      </div>

      {/* Credits Used Per Tool */}
      {Object.keys(stats.creditsPerTool).length > 0 && (
        <div className="mb-6 p-4 rounded-lg bg-secondary/30 border border-border">
          <h4 className="text-sm font-medium text-foreground mb-3">Créditos Gastos por Ferramenta</h4>
          <TooltipProvider>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(stats.creditsPerTool)
                .sort(([, a], [, b]) => b - a)
                .map(([toolName, credits]) => {
                  const uses = stats.operationCounts[toolName] || 0;
                  // Find operation type by tool name
                  const operationType = Object.entries(CREDIT_COSTS).find(
                    ([key]) => getToolInfo(key).name === toolName
                  )?.[0] || '';
                  const costPerUse = getToolCost(operationType);
                  
                  return (
                    <Tooltip key={toolName}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-between text-xs p-2 rounded bg-background/50 cursor-help hover:bg-background/80 transition-colors">
                          <span className="text-muted-foreground truncate mr-2">{toolName}</span>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs text-destructive border-destructive/30">
                              -{credits.toFixed(0)}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground/70">({uses}x)</span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="text-sm">
                          <p className="font-medium">{toolName}</p>
                          <p className="text-muted-foreground">
                            Custo por uso: <span className="text-primary font-medium">{costPerUse} crédito{costPerUse !== 1 ? 's' : ''}</span>
                          </p>
                          <p className="text-muted-foreground">
                            Total gasto: <span className="text-destructive font-medium">{credits.toFixed(0)} créditos</span> ({uses}x)
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
            </div>
          </TooltipProvider>
        </div>
      )}

      {/* History List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : historyItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Coins className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum histórico de créditos encontrado</p>
        </div>
      ) : (
        <>
          <TooltipProvider>
            <ScrollArea className={cn(showAll ? "h-[400px]" : "")}>
              <div className="space-y-3">
                {displayedItems.map((item) => {
                  const modelName = extractModelFromDescription(item);
                  const formattedModel = modelName ? getModelName(modelName) : null;
                  const isDebit = item.amount < 0;
                  const costPerUse = item.type === 'usage' ? getToolCost(item.operation) : 0;
                  
                  return (
                    <Tooltip key={`${item.type}-${item.id}`}>
                      <TooltipTrigger asChild>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50 cursor-help hover:bg-secondary/70 transition-colors">
                          <div className="p-2 rounded-lg bg-primary/10 text-xl">
                            {item.toolInfo.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-medium text-sm text-foreground">
                                {item.toolInfo.name}
                                {formattedModel && <span className="text-muted-foreground font-normal"> – {formattedModel}</span>}
                              </span>
                              <span className={cn(
                                "font-bold text-sm",
                                isDebit ? "text-destructive" : "text-success"
                              )}>
                                {isDebit ? '' : '+'}{item.amount.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {getTransactionBadge(item)}
                              {formattedModel && (
                                <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                                  {formattedModel}
                                </Badge>
                              )}
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {format(new Date(item.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                              </div>
                            </div>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs">
                        <div className="text-sm">
                          <p className="font-medium">{item.toolInfo.name}</p>
                          <p className="text-muted-foreground text-xs">{item.toolInfo.description}</p>
                          {item.type === 'usage' && costPerUse > 0 && (
                            <p className="mt-1 text-primary">
                              Custo padrão: {costPerUse} crédito{costPerUse !== 1 ? 's' : ''} por uso
                            </p>
                          )}
                          {item.type === 'transaction' && item.amount > 0 && (
                            <p className="mt-1 text-success">
                              Créditos adicionados à sua conta
                            </p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </ScrollArea>
          </TooltipProvider>

          {historyItems.length > 10 && (
            <Button
              variant="ghost"
              className="w-full mt-4 text-muted-foreground hover:text-foreground"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Ver menos
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Ver todos ({historyItems.length} registros)
                </>
              )}
            </Button>
          )}
        </>
      )}
    </Card>
  );
}
