import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Mic, Video, Key, Download, Plus, Info, Loader2, CheckCircle, XCircle, Eye, EyeOff, Pencil, Trash2, Rocket, ImageIcon, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Json } from "@/integrations/supabase/types";

interface ApiProvider {
  id: string;
  name: string;
  provider: string;
  model: string;
  credits_per_unit: number;
  real_cost_per_unit: number;
  unit_type: string;
  unit_size: number;
  markup: number;
  is_active: number;
  is_default: number;
  is_premium: number;
}

interface ApiKeyConfig {
  key: string;
  setKey: (v: string) => void;
  keyName: string;
  displayName: string;
  provider: string;
  validated: boolean;
  setValidated: (v: boolean) => void;
  icon: React.ReactNode;
  description: string;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
}

export function AdminAPIsTab() {
  // API Keys
  const [openaiKey, setOpenaiKey] = useState("");
  const [openaiValidated, setOpenaiValidated] = useState(false);
  const [openaiShowPassword, setOpenaiShowPassword] = useState(false);
  
  const [geminiKey, setGeminiKey] = useState("");
  const [geminiValidated, setGeminiValidated] = useState(false);
  const [geminiShowPassword, setGeminiShowPassword] = useState(false);
  
  const [claudeKey, setClaudeKey] = useState("");
  const [claudeValidated, setClaudeValidated] = useState(false);
  const [claudeShowPassword, setClaudeShowPassword] = useState(false);
  
  const [elevenlabsKey, setElevenlabsKey] = useState("");
  const [elevenlabsValidated, setElevenlabsValidated] = useState(false);
  const [elevenlabsShowPassword, setElevenlabsShowPassword] = useState(false);
  
  const [youtubeKey, setYoutubeKey] = useState("");
  const [youtubeValidated, setYoutubeValidated] = useState(false);
  const [youtubeShowPassword, setYoutubeShowPassword] = useState(false);
  
  const [downsubKey, setDownsubKey] = useState("");
  const [downsubValidated, setDownsubValidated] = useState(false);
  const [downsubShowPassword, setDownsubShowPassword] = useState(false);
  
  const [laozhangKey, setLaozhangKey] = useState("");
  const [laozhangValidated, setLaozhangValidated] = useState(false);
  const [laozhangShowPassword, setLaozhangShowPassword] = useState(false);

  const [veo3Key, setVeo3Key] = useState("");
  const [veo3Validated, setVeo3Validated] = useState(false);
  const [veo3ShowPassword, setVeo3ShowPassword] = useState(false);

  // n8n Webhook URL
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState("");
  const [savingN8nWebhook, setSavingN8nWebhook] = useState(false);
  const [testingN8nWebhook, setTestingN8nWebhook] = useState(false);
  // Global ImageFX Cookies
  const [globalImagefxCookies, setGlobalImagefxCookies] = useState({
    cookie1: "",
    cookie2: "",
    cookie3: ""
  });
  const [globalImagefxShowPassword, setGlobalImagefxShowPassword] = useState(false);
  const [savingGlobalImagefx, setSavingGlobalImagefx] = useState(false);

  const [apiProviders, setApiProviders] = useState<ApiProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ApiProvider | null>(null);
  const [savingProvider, setSavingProvider] = useState(false);
  
  // Form states for modal
  const [formName, setFormName] = useState("");
  const [formProvider, setFormProvider] = useState("");
  const [formModel, setFormModel] = useState("");
  const [formCreditsPerUnit, setFormCreditsPerUnit] = useState(1);
  const [formRealCostPerUnit, setFormRealCostPerUnit] = useState(0);
  const [formUnitType, setFormUnitType] = useState("tokens");
  const [formUnitSize, setFormUnitSize] = useState(1000);
  const [formMarkup, setFormMarkup] = useState(1);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [formIsPremium, setFormIsPremium] = useState(false);

  useEffect(() => {
    loadApiSettings();
    fetchApiProviders();
  }, []);

  const loadApiSettings = async () => {
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "api_keys")
      .maybeSingle();

    if (data?.value) {
      const keys = data.value as Record<string, unknown>;
      setOpenaiKey((keys.openai as string) || "");
      setOpenaiValidated(!!(keys.openai_validated));
      setGeminiKey((keys.gemini as string) || "");
      setGeminiValidated(!!(keys.gemini_validated));
      setClaudeKey((keys.claude as string) || "");
      setClaudeValidated(!!(keys.claude_validated));
      setElevenlabsKey((keys.elevenlabs as string) || "");
      setElevenlabsValidated(!!(keys.elevenlabs_validated));
      setYoutubeKey((keys.youtube as string) || "");
      setYoutubeValidated(!!(keys.youtube_validated));
      setDownsubKey((keys.downsub as string) || "");
      setDownsubValidated(!!(keys.downsub_validated));
      setLaozhangKey((keys.laozhang as string) || "");
      setLaozhangValidated(!!(keys.laozhang_validated));
      setVeo3Key((keys.veo3 as string) || "");
      setVeo3Validated(!!(keys.veo3_validated));
    }

    // Load n8n webhook URL
    const { data: n8nData } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "n8n_video_webhook")
      .maybeSingle();

    if (n8nData?.value) {
      const n8nConfig = n8nData.value as Record<string, string>;
      setN8nWebhookUrl(n8nConfig.webhook_url || "");
    }

    // Load global ImageFX cookies
    const { data: imagefxData } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "global_imagefx_cookies")
      .maybeSingle();

    if (imagefxData?.value) {
      const cookies = imagefxData.value as Record<string, string>;
      setGlobalImagefxCookies({
        cookie1: cookies.cookie1 || "",
        cookie2: cookies.cookie2 || "",
        cookie3: cookies.cookie3 || ""
      });
    }
  };

  const fetchApiProviders = async () => {
    setLoading(true);
    const { data } = await supabase.from("api_providers").select("*");
    if (data) setApiProviders(data);
    setLoading(false);
  };

  const saveApiKey = async (keyName: string, value: string, validated: boolean, displayName: string) => {
    setSaving(keyName);
    
    try {
      const { data: current } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "api_keys")
        .maybeSingle();

      const currentValue = (current?.value as Record<string, string | boolean>) || {};
      const newValue: Json = { 
        ...currentValue, 
        [keyName]: value,
        [`${keyName}_validated`]: validated
      };

      // Check if record exists
      if (current) {
        const { error } = await supabase
          .from("admin_settings")
          .update({ 
            value: newValue,
            updated_at: new Date().toISOString() 
          })
          .eq("key", "api_keys");

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("admin_settings")
          .insert([{ 
            key: "api_keys", 
            value: newValue
          }]);

        if (error) throw error;
      }

      toast.success(`${displayName} salva com sucesso!`);
    } catch (error) {
      console.error("Error saving API key:", error);
      toast.error(`Erro ao salvar ${displayName}`);
    } finally {
      setSaving(null);
    }
  };

  const validateApiKey = async (provider: string, apiKey: string, setValidated: (v: boolean) => void) => {
    if (!apiKey.trim()) {
      toast.error("Insira uma chave de API válida");
      return;
    }

    setValidating(provider);

    try {
      const { data, error } = await supabase.functions.invoke('validate-api-key', {
        body: { provider, apiKey }
      });

      if (error) throw error;

      if (data.valid) {
        setValidated(true);
        toast.success(`Chave ${provider.toUpperCase()} validada com sucesso!`);
      } else {
        setValidated(false);
        toast.error(`Chave ${provider.toUpperCase()} inválida: ${data.error || 'Verifique a chave'}`);
      }
    } catch (error) {
      console.error('Error validating API key:', error);
      setValidated(false);
      toast.error(`Erro ao validar chave ${provider}`);
    } finally {
      setValidating(null);
    }
  };

  const openEditModal = (provider: ApiProvider) => {
    setEditingProvider(provider);
    setFormName(provider.name);
    setFormProvider(provider.provider);
    setFormModel(provider.model);
    setFormCreditsPerUnit(provider.credits_per_unit);
    setFormRealCostPerUnit(provider.real_cost_per_unit || 0);
    setFormUnitType(provider.unit_type || "tokens");
    setFormUnitSize(provider.unit_size || 1000);
    setFormMarkup(provider.markup || 1);
    setFormIsActive(provider.is_active === 1);
    setFormIsDefault(provider.is_default === 1);
    setFormIsPremium(provider.is_premium === 1);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingProvider(null);
    setFormName("");
    setFormProvider("");
    setFormModel("");
    setFormCreditsPerUnit(1);
    setFormRealCostPerUnit(0);
    setFormUnitType("tokens");
    setFormUnitSize(1000);
    setFormMarkup(1);
    setFormIsActive(true);
    setFormIsDefault(false);
    setFormIsPremium(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProvider(null);
  };

  const saveProvider = async () => {
    if (!formName.trim() || !formProvider.trim() || !formModel.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setSavingProvider(true);

    try {
      const providerData = {
        name: formName,
        provider: formProvider,
        model: formModel,
        credits_per_unit: formCreditsPerUnit,
        real_cost_per_unit: formRealCostPerUnit,
        unit_type: formUnitType,
        unit_size: formUnitSize,
        markup: formMarkup,
        is_active: formIsActive ? 1 : 0,
        is_default: formIsDefault ? 1 : 0,
        is_premium: formIsPremium ? 1 : 0,
      };

      if (editingProvider) {
        const { error } = await supabase
          .from("api_providers")
          .update(providerData)
          .eq("id", editingProvider.id);

        if (error) throw error;
        toast.success("Provedor atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("api_providers")
          .insert([providerData]);

        if (error) throw error;
        toast.success("Provedor adicionado com sucesso!");
      }

      closeModal();
      fetchApiProviders();
    } catch (error) {
      console.error("Error saving provider:", error);
      toast.error("Erro ao salvar provedor");
    } finally {
      setSavingProvider(false);
    }
  };

  const deleteProvider = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este provedor?")) return;

    try {
      const { error } = await supabase
        .from("api_providers")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Provedor excluído com sucesso!");
      fetchApiProviders();
    } catch (error) {
      console.error("Error deleting provider:", error);
      toast.error("Erro ao excluir provedor");
    }
  };

  const apiConfigs: ApiKeyConfig[] = [
    {
      key: openaiKey,
      setKey: setOpenaiKey,
      keyName: "openai",
      displayName: "OpenAI",
      provider: "openai",
      validated: openaiValidated,
      setValidated: setOpenaiValidated,
      icon: <Key className="w-5 h-5 text-green-500" />,
      description: "Chave para GPT-4o, GPT-4, e modelos de voz TTS. Usada para análises e geração de conteúdo.",
      showPassword: openaiShowPassword,
      setShowPassword: setOpenaiShowPassword,
    },
    {
      key: geminiKey,
      setKey: setGeminiKey,
      keyName: "gemini",
      displayName: "Google Gemini",
      provider: "gemini",
      validated: geminiValidated,
      setValidated: setGeminiValidated,
      icon: <Key className="w-5 h-5 text-blue-500" />,
      description: "Chave para Gemini Pro e Flash. Usada para análises multimodais e geração de imagens.",
      showPassword: geminiShowPassword,
      setShowPassword: setGeminiShowPassword,
    },
    {
      key: claudeKey,
      setKey: setClaudeKey,
      keyName: "claude",
      displayName: "Anthropic Claude",
      provider: "claude",
      validated: claudeValidated,
      setValidated: setClaudeValidated,
      icon: <Key className="w-5 h-5 text-orange-500" />,
      description: "Chave para Claude 3 Sonnet/Opus. Usada para análises de alta qualidade.",
      showPassword: claudeShowPassword,
      setShowPassword: setClaudeShowPassword,
    },
    {
      key: elevenlabsKey,
      setKey: setElevenlabsKey,
      keyName: "elevenlabs",
      displayName: "ElevenLabs",
      provider: "elevenlabs",
      validated: elevenlabsValidated,
      setValidated: setElevenlabsValidated,
      icon: <Mic className="w-5 h-5 text-purple-500" />,
      description: "Chave para vozes premium de alta qualidade. Usada na geração de áudio.",
      showPassword: elevenlabsShowPassword,
      setShowPassword: setElevenlabsShowPassword,
    },
    {
      key: youtubeKey,
      setKey: setYoutubeKey,
      keyName: "youtube",
      displayName: "YouTube Data API",
      provider: "youtube",
      validated: youtubeValidated,
      setValidated: setYoutubeValidated,
      icon: <Video className="w-5 h-5 text-red-500" />,
      description: "Chave para acessar dados do YouTube. Usada para análise de vídeos e canais.",
      showPassword: youtubeShowPassword,
      setShowPassword: setYoutubeShowPassword,
    },
    {
      key: downsubKey,
      setKey: setDownsubKey,
      keyName: "downsub",
      displayName: "DownSub",
      provider: "downsub",
      validated: downsubValidated,
      setValidated: setDownsubValidated,
      icon: <Download className="w-5 h-5 text-cyan-500" />,
      description: "Chave para extração de legendas/transcrições de vídeos do YouTube.",
      showPassword: downsubShowPassword,
      setShowPassword: setDownsubShowPassword,
    },
    {
      key: laozhangKey,
      setKey: setLaozhangKey,
      keyName: "laozhang",
      displayName: "Laozhang AI",
      provider: "laozhang",
      validated: laozhangValidated,
      setValidated: setLaozhangValidated,
      icon: <Rocket className="w-5 h-5 text-yellow-500" />,
      description: "Chave para API Laozhang AI. Gateway para modelos OpenAI, Claude e outros com custos reduzidos.",
      showPassword: laozhangShowPassword,
      setShowPassword: setLaozhangShowPassword,
    },
    {
      key: veo3Key,
      setKey: setVeo3Key,
      keyName: "veo3",
      displayName: "Veo3 (Geração de Vídeo)",
      provider: "veo3",
      validated: veo3Validated,
      setValidated: setVeo3Validated,
      icon: <Video className="w-5 h-5 text-purple-500" />,
      description: "Chave para API Veo3 (veo3gen.co). Usada para geração de vídeos por IA nas cenas.",
      showPassword: veo3ShowPassword,
      setShowPassword: setVeo3ShowPassword,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert className="border-primary/50 bg-primary/10">
        <Info className="w-4 h-4 text-primary" />
        <AlertDescription className="text-primary">
          Configure as chaves de API do sistema. Essas chaves serão usadas como fallback quando os usuários não tiverem suas próprias chaves configuradas.
          <strong className="block mt-1">Importante:</strong> Valide cada chave antes de salvar para garantir que está funcionando.
        </AlertDescription>
      </Alert>

      {/* API Keys Cards */}
      {apiConfigs.map((config) => (
        <Card key={config.keyName} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {config.icon}
              <h3 className="font-semibold text-foreground">{config.displayName}</h3>
              {config.validated ? (
                <Badge variant="outline" className="text-success border-success">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Validada
                </Badge>
              ) : config.key ? (
                <Badge variant="outline" className="text-destructive border-destructive">
                  <XCircle className="w-3 h-3 mr-1" />
                  Não validada
                </Badge>
              ) : null}
            </div>
          </div>
          
          <label className="text-sm text-muted-foreground mb-2 block">Chave da API</label>
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Input
                placeholder={`Cole sua chave da API ${config.displayName} aqui`}
                value={config.key}
                onChange={(e) => {
                  config.setKey(e.target.value);
                  config.setValidated(false);
                }}
                className="bg-secondary border-border pr-10"
                type={config.showPassword ? "text" : "password"}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => config.setShowPassword(!config.showPassword)}
              >
                {config.showPassword ? (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <Button 
              variant="outline" 
              onClick={() => validateApiKey(config.provider, config.key, config.setValidated)}
              disabled={validating === config.provider || !config.key.trim()}
            >
              {validating === config.provider ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : null}
              Verificar
            </Button>
            <Button 
              onClick={() => saveApiKey(config.keyName, config.key, config.validated, config.displayName)}
              disabled={saving === config.keyName}
              className="bg-primary"
            >
              {saving === config.keyName ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : null}
              Salvar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </Card>
      ))}

      {/* Global ImageFX Cookies Section */}
      <Card className="p-6 border-2 border-primary/30 bg-primary/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Cookies ImageFX Globais</h3>
            <Badge variant="secondary" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              Para todos usuários
            </Badge>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setGlobalImagefxShowPassword(!globalImagefxShowPassword)}
          >
            {globalImagefxShowPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          Configure cookies do ImageFX que serão usados como <strong>fallback</strong> quando usuários não tiverem seus próprios cookies configurados.
          Esses cookies serão compartilhados entre todos os usuários da plataforma.
        </p>

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Cookie Global 1 (Principal)</Label>
            <Input
              placeholder="Cole o cookie __Secure-1PSID aqui"
              value={globalImagefxCookies.cookie1}
              onChange={(e) => setGlobalImagefxCookies(prev => ({ ...prev, cookie1: e.target.value }))}
              className="bg-secondary border-border font-mono text-xs"
              type={globalImagefxShowPassword ? "text" : "password"}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Cookie Global 2 (Backup)</Label>
            <Input
              placeholder="Cookie adicional para balanceamento"
              value={globalImagefxCookies.cookie2}
              onChange={(e) => setGlobalImagefxCookies(prev => ({ ...prev, cookie2: e.target.value }))}
              className="bg-secondary border-border font-mono text-xs"
              type={globalImagefxShowPassword ? "text" : "password"}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Cookie Global 3 (Extra)</Label>
            <Input
              placeholder="Cookie extra para alta demanda"
              value={globalImagefxCookies.cookie3}
              onChange={(e) => setGlobalImagefxCookies(prev => ({ ...prev, cookie3: e.target.value }))}
              className="bg-secondary border-border font-mono text-xs"
              type={globalImagefxShowPassword ? "text" : "password"}
            />
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button
            onClick={async () => {
              setSavingGlobalImagefx(true);
              try {
                const { data: current } = await supabase
                  .from("admin_settings")
                  .select("id")
                  .eq("key", "global_imagefx_cookies")
                  .maybeSingle();

                const cookiesValue = {
                  cookie1: globalImagefxCookies.cookie1.trim(),
                  cookie2: globalImagefxCookies.cookie2.trim(),
                  cookie3: globalImagefxCookies.cookie3.trim()
                };

                if (current) {
                  await supabase
                    .from("admin_settings")
                    .update({ value: cookiesValue, updated_at: new Date().toISOString() })
                    .eq("key", "global_imagefx_cookies");
                } else {
                  await supabase
                    .from("admin_settings")
                    .insert([{ key: "global_imagefx_cookies", value: cookiesValue }]);
                }

                toast.success("Cookies ImageFX globais salvos com sucesso!");
              } catch (error) {
                console.error("Error saving global ImageFX cookies:", error);
                toast.error("Erro ao salvar cookies");
              } finally {
                setSavingGlobalImagefx(false);
              }
            }}
            disabled={savingGlobalImagefx}
            className="bg-primary"
          >
            {savingGlobalImagefx && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Cookies Globais
          </Button>
        </div>
      </Card>

      {/* n8n Video Webhook Section */}
      <Card className="p-6 border-2 border-purple-500/30 bg-purple-500/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-foreground">Webhook n8n - Geração de Vídeo</h3>
            <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-300">
              Automação
            </Badge>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          Configure a URL do webhook n8n para geração de vídeos. O n8n processará a requisição usando suas credenciais do Veo3 e retornará o vídeo gerado.
          <br />
          <span className="text-xs text-purple-400">Formato esperado do retorno: {"{ videoUrl: string, status: 'completed' | 'processing' }"}</span>
        </p>

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">URL do Webhook n8n</Label>
            <Input
              placeholder="https://seu-n8n.app/webhook/video-generation"
              value={n8nWebhookUrl}
              onChange={(e) => setN8nWebhookUrl(e.target.value)}
              className="bg-secondary border-border font-mono text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end mt-4 gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              if (!n8nWebhookUrl) {
                toast.error("Configure a URL do webhook primeiro");
                return;
              }
              
              setTestingN8nWebhook(true);
              try {
                // Construir URL com parâmetros de teste
                const testUrl = new URL(n8nWebhookUrl);
                testUrl.searchParams.set('prompt', 'Test video generation from admin panel');
                testUrl.searchParams.set('model', 'veo31-fast');
                testUrl.searchParams.set('aspect_ratio', '16:9');
                testUrl.searchParams.set('duration', '5');
                testUrl.searchParams.set('test', 'true');
                
                console.log('[n8n Test] URL:', testUrl.toString());
                
                const response = await fetch(testUrl.toString(), {
                  method: 'GET',
                  headers: { 'Accept': 'application/json' }
                });
                
                console.log('[n8n Test] Status:', response.status);
                const responseText = await response.text();
                console.log('[n8n Test] Response:', responseText.substring(0, 500));
                
                if (response.ok) {
                  try {
                    const data = JSON.parse(responseText);
                    if (data.videoUrl || data.video_url || data.url) {
                      toast.success(`✅ Webhook funcionando! Video URL recebida.`);
                    } else if (data.status === 'processing' || data.success) {
                      toast.success(`✅ Webhook respondeu corretamente! Status: ${data.status || 'OK'}`);
                    } else {
                      toast.success(`✅ Webhook acessível! Resposta: ${JSON.stringify(data).substring(0, 100)}`);
                    }
                  } catch {
                    // Resposta não é JSON válido
                    if (responseText.includes('http') && responseText.includes('mp4')) {
                      toast.success(`✅ Webhook funcionando! URL de vídeo detectada.`);
                    } else {
                      toast.success(`✅ Webhook acessível! (${response.status})`);
                    }
                  }
                } else {
                  toast.error(`❌ Erro ${response.status}: ${responseText.substring(0, 100)}`);
                }
              } catch (error) {
                console.error('[n8n Test] Error:', error);
                toast.error(`❌ Erro ao testar: ${error instanceof Error ? error.message : 'Falha na conexão'}`);
              } finally {
                setTestingN8nWebhook(false);
              }
            }}
            disabled={!n8nWebhookUrl || testingN8nWebhook}
          >
            {testingN8nWebhook && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Testar Webhook
          </Button>
          <Button
            onClick={async () => {
              setSavingN8nWebhook(true);
              try {
                const { data: current } = await supabase
                  .from("admin_settings")
                  .select("id")
                  .eq("key", "n8n_video_webhook")
                  .maybeSingle();

                const webhookValue = {
                  webhook_url: n8nWebhookUrl.trim(),
                  updated_at: new Date().toISOString()
                };

                if (current) {
                  await supabase
                    .from("admin_settings")
                    .update({ value: webhookValue, updated_at: new Date().toISOString() })
                    .eq("key", "n8n_video_webhook");
                } else {
                  await supabase
                    .from("admin_settings")
                    .insert([{ key: "n8n_video_webhook", value: webhookValue }]);
                }

                toast.success("Webhook n8n salvo com sucesso!");
              } catch (error) {
                console.error("Error saving n8n webhook:", error);
                toast.error("Erro ao salvar webhook");
              } finally {
                setSavingN8nWebhook(false);
              }
            }}
            disabled={savingN8nWebhook}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {savingN8nWebhook && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Webhook
          </Button>
        </div>
      </Card>

      {/* API Providers Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">Provedores de API Configurados</h3>
          </div>
          <Button size="sm" className="bg-primary" onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-1" />
            Adicionar Provedor
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NOME</TableHead>
                <TableHead>PROVEDOR</TableHead>
                <TableHead>MODELO</TableHead>
                <TableHead>CRÉDITOS/UNIDADE</TableHead>
                <TableHead>TIPO</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiProviders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhum provedor configurado
                  </TableCell>
                </TableRow>
              ) : (
                apiProviders.map((api) => (
                  <TableRow key={api.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {api.name}
                        {api.is_default === 1 && (
                          <Badge variant="outline" className="text-xs">Padrão</Badge>
                        )}
                        {api.is_premium === 1 && (
                          <Badge variant="secondary" className="text-xs">Premium</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{api.provider}</TableCell>
                    <TableCell className="font-mono text-xs">{api.model}</TableCell>
                    <TableCell>{api.credits_per_unit}</TableCell>
                    <TableCell className="text-xs">{api.unit_size} {api.unit_type}</TableCell>
                    <TableCell>
                      <Badge variant={api.is_active ? "default" : "secondary"}>
                        {api.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openEditModal(api)}
                        >
                          <Pencil className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => deleteProvider(api.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Edit/Add Provider Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProvider ? "Editar Provedor" : "Adicionar Provedor"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: OpenAI GPT-4o"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider">Provedor *</Label>
                <Select value={formProvider} onValueChange={setFormProvider}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o provedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="gemini">Google Gemini</SelectItem>
                    <SelectItem value="claude">Anthropic Claude</SelectItem>
                    <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                    <SelectItem value="platform">Platform AI</SelectItem>
                    <SelectItem value="laozhang">Laozhang AI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Modelo *</Label>
              <Input
                id="model"
                value={formModel}
                onChange={(e) => setFormModel(e.target.value)}
                placeholder="Ex: gpt-4o, gemini-2.5-pro, claude-3-sonnet"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="creditsPerUnit">Créditos/Unidade</Label>
                <Input
                  id="creditsPerUnit"
                  type="number"
                  step="0.01"
                  value={formCreditsPerUnit}
                  onChange={(e) => setFormCreditsPerUnit(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="realCost">Custo Real/Unidade ($)</Label>
                <Input
                  id="realCost"
                  type="number"
                  step="0.0001"
                  value={formRealCostPerUnit}
                  onChange={(e) => setFormRealCostPerUnit(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="markup">Markup (x)</Label>
                <Input
                  id="markup"
                  type="number"
                  step="0.1"
                  value={formMarkup}
                  onChange={(e) => setFormMarkup(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitSize">Tamanho da Unidade</Label>
                <Input
                  id="unitSize"
                  type="number"
                  value={formUnitSize}
                  onChange={(e) => setFormUnitSize(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitType">Tipo de Unidade</Label>
                <Select value={formUnitType} onValueChange={setFormUnitType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tokens">Tokens</SelectItem>
                    <SelectItem value="characters">Caracteres</SelectItem>
                    <SelectItem value="requests">Requisições</SelectItem>
                    <SelectItem value="minutes">Minutos</SelectItem>
                    <SelectItem value="images">Imagens</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={formIsActive}
                  onCheckedChange={setFormIsActive}
                />
                <Label htmlFor="isActive">Ativo</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isDefault"
                  checked={formIsDefault}
                  onCheckedChange={setFormIsDefault}
                />
                <Label htmlFor="isDefault">Padrão</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isPremium"
                  checked={formIsPremium}
                  onCheckedChange={setFormIsPremium}
                />
                <Label htmlFor="isPremium">Premium</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Cancelar
            </Button>
            <Button onClick={saveProvider} disabled={savingProvider}>
              {savingProvider && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingProvider ? "Salvar Alterações" : "Adicionar Provedor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
