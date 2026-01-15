import { MainLayout } from "@/components/layout/MainLayout";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Video, TrendingUp, Plus, Loader2, Zap, Key } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { usePersistedState } from "@/hooks/usePersistedState";
import { SessionIndicator } from "@/components/ui/session-indicator";
import { useCreditDeduction } from "@/hooks/useCreditDeduction";

interface SimilarChannel {
  name: string;
  subscribers: string;
  videos: number;
  similarity: string;
  url?: string;
}

const SEARCH_CREDITS = 5;

const SearchChannels = () => {
  const { user } = useAuth();
  const { deduct, usePlatformCredits } = useCreditDeduction();
  
  // Persisted states
  const [channelUrl, setChannelUrl] = usePersistedState("searchChannels_url", "");
  const [similarChannels, setSimilarChannels] = usePersistedState<SimilarChannel[]>("searchChannels_results", []);
  
  // Non-persisted states
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!channelUrl.trim()) {
      toast.error("Cole a URL de um canal de referência");
      return;
    }

    setLoading(true);

    // CRÍTICO: Deduzir créditos ANTES da busca
    let deductionResult: { success: boolean; refund: () => Promise<void> } | null = null;
    
    if (usePlatformCredits !== false) {
      deductionResult = await deduct({
        operationType: 'search_channels',
        customAmount: SEARCH_CREDITS,
        details: { channelUrl }
      });

      if (!deductionResult.success) {
        setLoading(false);
        return;
      }
    }

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          action: 'search_channels',
          channelUrl: channelUrl
        }
      });

      if (error) throw error;

      if (data.channels) {
        setSimilarChannels(data.channels);
        toast.success(`${data.channels.length} canais similares encontrados!`);
      }
    } catch (error) {
      console.error('Error searching channels:', error);
      toast.error('Erro ao buscar canais similares');
      
      // Reembolsar créditos em caso de erro
      if (deductionResult?.refund) {
        await deductionResult.refund();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddToMonitored = async (channel: SimilarChannel) => {
    if (!user) {
      toast.error("Faça login para adicionar canais");
      return;
    }

    try {
      const { error } = await supabase
        .from('monitored_channels')
        .insert({
          user_id: user.id,
          channel_url: channel.url || `https://youtube.com/@${channel.name.replace(/\s/g, '')}`,
          channel_name: channel.name,
          subscribers: channel.subscribers,
          videos_count: channel.videos
        });

      if (error) throw error;
      toast.success(`${channel.name} adicionado aos canais monitorados!`);
    } catch (error) {
      console.error('Error adding channel:', error);
      toast.error('Erro ao adicionar canal');
    }
  };

  return (
    <MainLayout>
      <SEOHead
        title="Buscar Canais"
        description="Encontre canais do YouTube semelhantes ao seu canal de referência."
        noindex={true}
      />
      <PermissionGate permission="buscar_canais" featureName="Buscar Canais">
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Session Indicator */}
          <SessionIndicator 
            storageKeys={["searchChannels_url", "searchChannels_results"]}
            label="Busca anterior"
            onClear={() => {
              setChannelUrl("");
              setSimilarChannels([]);
            }}
          />

          <div className="mb-8 mt-4">
            <h1 className="text-3xl font-bold text-foreground mb-2">Buscar Canais Semelhantes</h1>
            <p className="text-muted-foreground">
              Encontre canais com conteúdo similar ao seu ou de referência
            </p>
          </div>

          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">Buscar canais similares</h3>
              {usePlatformCredits === false ? (
                <Badge variant="outline" className="text-green-500 border-green-500/50 bg-green-500/10">
                  <Key className="w-3 h-3 mr-1" />
                  Usando sua API
                </Badge>
              ) : (
                <Badge variant="outline" className="text-primary border-primary">
                  <Zap className="w-3 h-3 mr-1" />
                  {SEARCH_CREDITS} créditos por busca
                </Badge>
              )}
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Cole a URL de um canal de referência..."
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  className="bg-secondary border-border"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button 
                onClick={handleSearch}
                disabled={loading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Buscar Similares
              </Button>
            </div>
          </Card>

          {similarChannels.length === 0 && !loading && (
            <Card className="p-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Busque canais similares</h3>
              <p className="text-muted-foreground">
                Cole a URL de um canal de referência para encontrar canais com conteúdo similar
              </p>
            </Card>
          )}

          <div className="space-y-4">
            {similarChannels.map((channel, index) => (
              <Card key={index} className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{channel.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {channel.subscribers}
                        </span>
                        <span className="flex items-center gap-1">
                          <Video className="w-4 h-4" />
                          {channel.videos} vídeos
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Similaridade</p>
                      <p className="text-lg font-semibold text-primary">{channel.similarity}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="border-border text-primary hover:bg-secondary"
                      onClick={() => handleAddToMonitored(channel)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
      </PermissionGate>
    </MainLayout>
  );
};

export default SearchChannels;
