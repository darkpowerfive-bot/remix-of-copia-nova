import { useState, useEffect } from "react";
import { useCredits } from "@/hooks/useCredits";
import { Coins, Loader2, RefreshCw, History, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getToolInfo, getModelName } from "@/lib/creditToolsMap";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CreditsDisplayProps {
  collapsed?: boolean;
  showRefresh?: boolean;
  className?: string;
}

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

export function CreditsDisplay({ collapsed = false, showRefresh = true, className }: CreditsDisplayProps) {
  const { balance, loading, refreshBalance } = useCredits();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshBalance();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshBalance]);

  const fetchHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);

    try {
      // Fetch both usage and transactions
      const [usageResult, transactionsResult] = await Promise.all([
        supabase
          .from('credit_usage')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('credit_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)
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
        amount: item.transaction_type === 'add' || item.transaction_type === 'refund' ? item.amount : -item.amount,
        modelUsed: null,
        description: item.description,
        created_at: item.created_at,
        toolInfo: getToolInfo(item.transaction_type),
      }));

      // Combine and sort by date
      const combined = [...usageItems, ...transactionItems].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setHistoryItems(combined.slice(0, 100));
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleOpenHistory = () => {
    setHistoryOpen(true);
    fetchHistory();
  };

  // Extract model name from description if not in modelUsed
  const extractModelFromDescription = (item: HistoryItem): string | null => {
    if (item.modelUsed) return item.modelUsed;
    if (item.description) {
      // Try to extract model name from description like "Análise de Títulos - GPT-4o"
      const match = item.description.match(/- ([A-Za-z0-9\s.-]+)$/);
      if (match) return match[1].trim();
    }
    return null;
  };

  if (collapsed) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className="relative">
          <Coins className="w-5 h-5 text-primary" />
          {loading && (
            <Loader2 className="w-3 h-3 text-primary absolute -top-1 -right-1 animate-spin" />
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn("flex items-center gap-2", className)}>
        {/* Compact header display with tooltip */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border cursor-pointer hover:bg-secondary/70 transition-colors">
              <Coins className="w-4 h-4 text-primary flex-shrink-0" />
              {loading ? (
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              ) : (
                <span className={cn(
                  "font-bold text-sm",
                  balance < 20 ? "text-destructive" : "text-primary"
                )}>{Math.max(0, balance).toLocaleString()}</span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1 text-xs">
              <p className="font-semibold">Seus Créditos</p>
              <p className="text-muted-foreground">
                Créditos são usados para análises, geração de roteiros, thumbnails e mais.
              </p>
              {balance < 50 && (
                <p className="text-primary font-medium">⚠️ Créditos baixos! Considere recarregar.</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
        
        <Button 
          variant="outline" 
          size="sm" 
          className={cn(
            "h-8 px-3 text-xs border-primary/50 text-primary hover:bg-primary/10",
            balance < 50 && "animate-pulse bg-primary/20 border-primary"
          )}
          onClick={() => navigate("/plans")}
        >
          Comprar
        </Button>
        
        <button
          onClick={handleOpenHistory}
          className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-primary transition-colors"
          title="Ver Histórico de Créditos"
        >
          <History className="w-4 h-4" />
        </button>
      </div>

      {/* History Modal */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl">
              Histórico de Créditos
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 px-6 pb-6">
            {loadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : historyItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum histórico encontrado
              </p>
            ) : (
              <div className="space-y-3">
                {historyItems.map((item) => {
                  const modelName = extractModelFromDescription(item);
                  const formattedModel = modelName ? getModelName(modelName) : null;
                  const isDebit = item.amount < 0;
                  const isRefund = item.operation === 'refund';
                  
                  return (
                    <div 
                      key={`${item.type}-${item.id}`}
                      className="p-4 rounded-lg border border-border bg-secondary/30"
                    >
                      {/* Amount and Type */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn(
                          "font-bold text-lg",
                          isDebit ? "text-destructive" : "text-success"
                        )}>
                          {isDebit ? '' : '+'}{item.amount.toFixed(2)} créditos
                        </span>
                        <Badge 
                          className={cn(
                            "text-xs",
                            isRefund 
                              ? "bg-blue-500/20 text-blue-400" 
                              : isDebit 
                                ? "bg-destructive/20 text-destructive" 
                                : "bg-success/20 text-success"
                          )}
                        >
                          {isRefund ? 'Reembolso' : isDebit ? 'Débito' : 'Crédito'}
                        </Badge>
                      </div>
                      
                      {/* Tool name and model */}
                      <p className="text-foreground font-medium mb-2">
                        {item.toolInfo.name}
                        {formattedModel && ` – ${formattedModel}`}
                      </p>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge className="bg-emerald-600/20 text-emerald-400 text-xs">
                          {item.toolInfo.name}
                        </Badge>
                        {formattedModel && (
                          <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                            {formattedModel}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Date */}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {format(new Date(item.created_at), "dd/MM/yyyy, HH:mm")}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
