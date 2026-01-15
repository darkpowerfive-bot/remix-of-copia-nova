import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Trash2, Clock, FileText, Search, RefreshCw, Copy, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Script {
  id: string;
  title: string;
  content: string;
  duration: number;
  language: string;
  model_used: string | null;
  credits_used: number;
  created_at: string | null;
}

interface ScriptHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadScript: (script: Script) => void;
}

export function ScriptHistoryModal({ open, onOpenChange, onLoadScript }: ScriptHistoryModalProps) {
  const { user } = useAuth();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchScripts = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('generated_scripts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setScripts(data || []);
    } catch (error) {
      console.error('Error fetching scripts:', error);
      toast.error("Erro ao carregar histórico");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchScripts();
    }
  }, [open, user]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('generated_scripts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setScripts(prev => prev.filter(s => s.id !== id));
      toast.success("Roteiro excluído");
    } catch (error) {
      console.error('Error deleting script:', error);
      toast.error("Erro ao excluir roteiro");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Roteiro copiado!");
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const filteredScripts = scripts.filter(script =>
    script.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    script.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const getLanguageFlag = (lang: string) => {
    const flags: Record<string, string> = {
      'pt-BR': '🇧🇷',
      'pt-PT': '🇵🇹',
      'es': '🇪🇸',
      'en': '🇺🇸',
      'fr': '🇫🇷',
      'de': '🇩🇪',
      'it': '🇮🇹'
    };
    return flags[lang] || '🌐';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Histórico de Roteiros
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar roteiros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Scripts List */}
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredScripts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "Nenhum roteiro encontrado" : "Nenhum roteiro gerado ainda"}
                </p>
              </div>
            ) : (
              <div className="space-y-3 pr-4">
                {filteredScripts.map((script) => (
                  <div
                    key={script.id}
                    className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate mb-1">
                          {script.title}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {script.content.substring(0, 150)}...
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDuration(script.duration)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getLanguageFlag(script.language)} {script.language}
                          </Badge>
                          {script.model_used && (
                            <Badge variant="secondary" className="text-xs">
                              {script.model_used}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {script.credits_used} créditos
                          </Badge>
                        </div>
                        {script.created_at && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(script.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopy(script.content)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            onLoadScript(script);
                            onOpenChange(false);
                          }}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(script.id)}
                          disabled={deletingId === script.id}
                        >
                          {deletingId === script.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Stats */}
          {scripts.length > 0 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
              <span>{scripts.length} roteiros no histórico</span>
              <span>
                Total: {scripts.reduce((acc, s) => acc + s.credits_used, 0)} créditos usados
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
