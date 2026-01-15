import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Image, 
  Upload, 
  Rocket, 
  Loader2, 
  Trash2,
  Lightbulb,
  Wand2,
  Download,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  Copy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { THUMBNAIL_STYLES, THUMBNAIL_STYLE_CATEGORIES, getStylesByCategory } from "@/lib/thumbnailStyles";
import { usePersistedState } from "@/hooks/usePersistedState";

interface ReferenceThumbnail {
  id: string;
  image_url: string;
  channel_name: string | null;
  niche: string | null;
  sub_niche: string | null;
  description: string | null;
  extracted_prompt: string | null;
  folder_id: string | null;
  created_at: string;
  style_analysis?: {
    headlineStyle?: string;
    commonStyle?: string;
    colorPalette?: string;
    composition?: string;
    [key: string]: unknown;
  } | null;
}

interface ThumbnailLibraryProps {
  currentNiche?: string;
  currentSubNiche?: string;
  currentTitle?: string;
  onGenerateThumbnail?: (prompt: string, title: string) => void;
}

interface GeneratedThumbnail {
  variationNumber: number;
  imageBase64: string;
  headline: string | null;
  seoDescription: string;
  seoTags: string;
  prompt: string;
  style: string;
}

export function ThumbnailLibrary({ 
  currentNiche, 
  currentSubNiche, 
  currentTitle,
  onGenerateThumbnail 
}: ThumbnailLibraryProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Upload states (non-persisted)
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [channelName, setChannelName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("none");
  
  // Persisted states - survive navigation
  const [niche, setNiche] = usePersistedState("thumbnail_niche", currentNiche || "");
  const [subNiche, setSubNiche] = usePersistedState("thumbnail_subNiche", currentSubNiche || "");
  const [videoTitle, setVideoTitle] = usePersistedState("thumbnail_videoTitle", currentTitle || "");
  const [genModel, setGenModel] = usePersistedState("thumbnail_genModel", "gpt-4.1");
  const [genLanguage, setGenLanguage] = usePersistedState("thumbnail_genLanguage", "pt-BR");
  const [artStyle, setArtStyle] = usePersistedState("thumbnail_artStyle", "foto-realista");
  const [includeHeadline, setIncludeHeadline] = usePersistedState("thumbnail_includeHeadline", true);
  const [useTitle, setUseTitle] = usePersistedState("thumbnail_useTitle", false);
  const [generatedThumbnails, setGeneratedThumbnails] = usePersistedState<GeneratedThumbnail[]>("thumbnail_generatedThumbnails", []);
  const [savedToLibrary, setSavedToLibrary] = usePersistedState<number[]>("thumbnail_savedToLibrary", []);
  
  // Analysis states
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisModel, setAnalysisModel] = useState("gpt-4.1");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState("");
  
  // Generation states
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);
  const [thumbnailLoadingMessage, setThumbnailLoadingMessage] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [selectedPrompt, setSelectedPrompt] = useState<string>("1");
  
  // Elite motivational messages for thumbnail generation (La Casa Dark Core style)
  const THUMBNAIL_LOADING_MESSAGES = [
    "Iniciando motor de IA premium...",
    "Analisando padrões visuais de alto impacto...",
    "Renderizando composições exclusivas...",
    "Aplicando estética profissional...",
    "Otimizando para máxima conversão...",
    "Gerando headlines magnéticas...",
    "Finalizando sua obra-prima visual...",
    "Thumbnails premium quase prontas...",
  ];
  
  // Analysis progress messages
  const ANALYSIS_LOADING_MESSAGES = [
    "Iniciando análise visual avançada...",
    "Identificando paleta de cores dominante...",
    "Analisando composição e enquadramento...",
    "Detectando elementos visuais chave...",
    "Extraindo estilo tipográfico...",
    "Mapeando hierarquia visual...",
    "Gerando prompt padrão otimizado...",
    "Finalizando extração de estilo...",
  ];
  
  // Preview state for generated thumbnails
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [savingToLibrary, setSavingToLibrary] = useState<number | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Preview state for reference thumbnails
  const [referencePreviewOpen, setReferencePreviewOpen] = useState(false);
  const [selectedReferenceThumbnail, setSelectedReferenceThumbnail] = useState<ReferenceThumbnail | null>(null);

  // Copy to clipboard helper
  const copyToClipboard = async (text: string, fieldId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: "Copiado!", description: "Texto copiado para a área de transferência" });
  };
  // Sync videoTitle when currentTitle changes (from selected title in VideoAnalyzer)
  useEffect(() => {
    if (currentTitle) {
      setVideoTitle(currentTitle);
    }
  }, [currentTitle]);

  // Fetch folders
  const { data: folders } = useQuery({
    queryKey: ["folders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("folders")
        .select("*")
        .eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch saved thumbnails
  const { data: savedThumbnails, isLoading: loadingThumbnails } = useQuery({
    queryKey: ["reference-thumbnails", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("reference_thumbnails")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return (data || []) as ReferenceThumbnail[];
    },
    enabled: !!user,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo é 5MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    
    setUploading(true);
    try {
      // Upload to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("reference-thumbnails")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("reference-thumbnails")
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from("reference_thumbnails")
        .insert({
          user_id: user.id,
          image_url: urlData.publicUrl,
          folder_id: selectedFolder !== "none" ? selectedFolder : null,
          channel_name: channelName || null,
          niche: niche || null,
          sub_niche: subNiche || null,
          description: description || null,
        });

      if (dbError) throw dbError;

      toast({ title: "Upload concluído!", description: "Thumbnail salva com sucesso" });
      
      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setChannelName("");
      setDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Refresh list
      queryClient.invalidateQueries({ queryKey: ["reference-thumbnails"] });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer o upload da thumbnail",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyzeStyle = async () => {
    if (!savedThumbnails || savedThumbnails.length === 0) {
      toast({
        title: "Sem thumbnails",
        description: "Faça upload de pelo menos uma thumbnail de referência",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisMessage(ANALYSIS_LOADING_MESSAGES[0]);
    
    // Animate progress and rotate messages
    let progressValue = 0;
    let messageIndex = 0;
    
    const progressInterval = setInterval(() => {
      progressValue += Math.random() * 8 + 3;
      if (progressValue > 92) progressValue = 92;
      setAnalysisProgress(progressValue);
      
      const newMessageIndex = Math.min(
        Math.floor((progressValue / 100) * ANALYSIS_LOADING_MESSAGES.length),
        ANALYSIS_LOADING_MESSAGES.length - 1
      );
      if (newMessageIndex !== messageIndex) {
        messageIndex = newMessageIndex;
        setAnalysisMessage(ANALYSIS_LOADING_MESSAGES[messageIndex]);
      }
    }, 600);
    
    try {
      // Call AI to analyze thumbnails and generate 3 adapted prompts
      const response = await supabase.functions.invoke("ai-assistant", {
        body: {
          type: "analyze_thumbnails",
          model: analysisModel,
          niche: niche || "",
          subNiche: subNiche || "",
          agentData: {
            thumbnails: savedThumbnails.slice(0, 5).map(t => ({
              url: t.image_url,
              niche: t.niche,
              subNiche: t.sub_niche,
            })),
            videoTitle: videoTitle || "",
          },
        },
      });

      if (response.error) throw response.error;

      // Update thumbnails with extracted prompts
      const result = response.data?.result;
      if (result?.prompts && Array.isArray(result.prompts)) {
        // Store the 3 prompts - each prompt object contains prompt text and focus
        for (let i = 0; i < Math.min(result.prompts.length, savedThumbnails.length); i++) {
          const promptData = result.prompts[i];
          const promptText = typeof promptData === 'string' ? promptData : promptData.prompt;
          await supabase
            .from("reference_thumbnails")
            .update({
              extracted_prompt: promptText,
              style_analysis: {
                ...result,
                promptFocus: promptData.focus || null,
              },
            })
            .eq("id", savedThumbnails[i].id);
        }
      }

      clearInterval(progressInterval);
      setAnalysisProgress(100);
      toast({ title: "Análise concluída!", description: `${result?.prompts?.length || 0} prompts padrão gerados` });
      queryClient.invalidateQueries({ queryKey: ["reference-thumbnails"] });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Erro na análise",
        description: "Não foi possível analisar as thumbnails",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => setAnalysisProgress(0), 500);
      setAnalyzing(false);
    }
  };

  const handleGenerateThumbnail = async () => {
    if (!videoTitle.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Digite o título do vídeo",
        variant: "destructive",
      });
      return;
    }

    const selectedStyle = THUMBNAIL_STYLES.find(s => s.id === artStyle);
    const styleName = selectedStyle?.name || artStyle;

    setGeneratingThumbnail(true);
    setGeneratedThumbnails([]);
    setSavedToLibrary([]);
    setThumbnailLoadingMessage(THUMBNAIL_LOADING_MESSAGES[0]);
    setLoadingProgress(0);
    
    // Animate progress and rotate messages
    let progressValue = 0;
    let messageIndex = 0;
    
    const progressInterval = setInterval(() => {
      progressValue += Math.random() * 8 + 2; // Random increment between 2-10
      if (progressValue > 92) progressValue = 92; // Cap at 92% until complete
      setLoadingProgress(progressValue);
      
      // Update message based on progress
      const newMessageIndex = Math.min(
        Math.floor((progressValue / 100) * THUMBNAIL_LOADING_MESSAGES.length),
        THUMBNAIL_LOADING_MESSAGES.length - 1
      );
      if (newMessageIndex !== messageIndex) {
        messageIndex = newMessageIndex;
        setThumbnailLoadingMessage(THUMBNAIL_LOADING_MESSAGES[messageIndex]);
      }
    }, 800);
    
    const messageInterval = progressInterval; // Keep reference for cleanup
    try {
      // Get the selected style's prompt prefix
      const selectedStyleObj = THUMBNAIL_STYLES.find(s => s.id === artStyle);
      const stylePromptPrefix = selectedStyleObj?.promptPrefix || "";
      
      // Get reference thumbnail prompt and headline style if available
      const selectedReference = thumbnailsWithPrompts.length > 0 
        ? thumbnailsWithPrompts[parseInt(selectedPrompt) - 1]
        : undefined;
      
      const referencePrompt = selectedReference?.extracted_prompt;
      
      // Extract headline style from style_analysis if available
      const referenceHeadlineStyle = selectedReference?.style_analysis?.headlineStyle || 
        (selectedReference?.style_analysis?.commonStyle 
          ? `Style: ${selectedReference.style_analysis.commonStyle}. Colors: ${selectedReference.style_analysis.colorPalette || 'high contrast'}. Composition: ${selectedReference.style_analysis.composition || 'centered'}` 
          : undefined);
      
      // Call the generate-thumbnail edge function
      const response = await supabase.functions.invoke("generate-thumbnail", {
        body: {
          videoTitle,
          niche: niche || "Geral",
          subNiche: subNiche || undefined,
          style: styleName,
          stylePromptPrefix,
          includeHeadline,
          useTitle,
          referencePrompt,
          referenceHeadlineStyle,
          language: genLanguage === "pt-BR" ? "Português" : genLanguage === "es" ? "Español" : "English",
        },
      });

      if (response.error) throw response.error;

      const result = response.data;
      if (result?.variations && result.variations.length > 0) {
        setGeneratedThumbnails(result.variations);
        setPreviewOpen(true);
        setActivePreviewIndex(0);
        toast({ title: "Thumbnails geradas!", description: `${result.variations.length} variações prontas` });
        
        if (onGenerateThumbnail && result.variations[0]?.prompt) {
          onGenerateThumbnail(result.variations[0].prompt, videoTitle);
        }
      } else {
        throw new Error("Nenhuma thumbnail foi gerada");
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Erro na geração",
        description: "Não foi possível gerar as thumbnails",
        variant: "destructive",
      });
    } finally {
      clearInterval(messageInterval);
      setLoadingProgress(100);
      setTimeout(() => setLoadingProgress(0), 500);
      setGeneratingThumbnail(false);
    }
  };

  const handleDownloadThumbnail = async (imageBase64: string, index: number) => {
    try {
      // Extract base64 data
      const base64Data = imageBase64.includes(",") 
        ? imageBase64.split(",")[1] 
        : imageBase64.replace("data:image/png;base64,", "");
      
      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/png" });
      
      // Create canvas for resizing to 1280x720 only
      const img = document.createElement("img");
      img.src = URL.createObjectURL(blob);
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 720;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, 1280, 720);
        
        canvas.toBlob((resizedBlob) => {
          if (resizedBlob) {
            const url = URL.createObjectURL(resizedBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `thumbnail-${index + 1}-1280x720.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        }, "image/png");
      }
      
      URL.revokeObjectURL(img.src);
      
      toast({ title: "Download iniciado!", description: "Thumbnail 1280x720" });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar a thumbnail",
        variant: "destructive",
      });
    }
  };

  const handleDeleteThumbnail = async (id: string) => {
    try {
      await supabase.from("reference_thumbnails").delete().eq("id", id);
      toast({ title: "Excluído!", description: "Thumbnail removida" });
      queryClient.invalidateQueries({ queryKey: ["reference-thumbnails"] });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível excluir", variant: "destructive" });
    }
  };

  const handleSaveToLibrary = async (thumb: GeneratedThumbnail, index: number) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para salvar",
        variant: "destructive",
      });
      return;
    }

    setSavingToLibrary(index);
    try {
      // Extract base64 data
      const base64Data = thumb.imageBase64.includes(",")
        ? thumb.imageBase64.split(",")[1]
        : thumb.imageBase64.replace("data:image/png;base64,", "");

      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/png" });

      // Create file object
      const fileName = `${user.id}/${Date.now()}-${index}.png`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("reference-thumbnails")
        .upload(fileName, blob, { contentType: "image/png" });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("reference-thumbnails")
        .getPublicUrl(fileName);

      // Save to reference_thumbnails for prompts extraction
      await supabase
        .from("reference_thumbnails")
        .insert({
          user_id: user.id,
          image_url: urlData.publicUrl,
          niche: niche || null,
          sub_niche: subNiche || null,
          description: `Thumbnail gerada para: ${videoTitle}`,
          extracted_prompt: thumb.prompt,
          style_analysis: {
            style: thumb.style,
            headline: thumb.headline,
            seoDescription: thumb.seoDescription,
            seoTags: thumb.seoTags,
          },
        });

      // Also save to viral_thumbnails for the Viral Library
      const { error: viralError } = await supabase
        .from("viral_thumbnails")
        .insert({
          user_id: user.id,
          image_url: urlData.publicUrl,
          video_title: videoTitle,
          headline: thumb.headline,
          seo_description: thumb.seoDescription,
          seo_tags: Array.isArray(thumb.seoTags) ? thumb.seoTags.join(", ") : thumb.seoTags,
          prompt: thumb.prompt,
          style: thumb.style,
          niche: niche || null,
          sub_niche: subNiche || null,
        });

      if (viralError) throw viralError;

      setSavedToLibrary(prev => [...prev, index]);
      toast({ title: "Salvo na Biblioteca Viral!", description: "Thumbnail salva em Thumbnails Virais" });
      queryClient.invalidateQueries({ queryKey: ["reference-thumbnails"] });
      queryClient.invalidateQueries({ queryKey: ["viral-thumbnails"] });
    } catch (error) {
      console.error("Save to library error:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar na biblioteca",
        variant: "destructive",
      });
    } finally {
      setSavingToLibrary(null);
    }
  };

  const thumbnailsWithPrompts = savedThumbnails?.filter(t => t.extracted_prompt) || [];

  return (
    <div className="space-y-6">
      {/* Biblioteca de Thumbnails de Referência */}
      <Card className="p-6 border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <Image className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            Biblioteca de Thumbnails de Referência
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Faça upload de thumbnails do seu canal para que a IA sempre replique o estilo visual nas novas gerações.
        </p>

        {/* Upload Section */}
        <div className="bg-secondary/30 rounded-lg p-6 mb-6">
          <h4 className="font-medium text-foreground mb-2">Adicionar Thumbnail de Referência</h4>
          <p className="text-xs text-primary mb-4">
            <Lightbulb className="w-3 h-3 inline mr-1" />
            Os campos serão preenchidos automaticamente com os dados da análise atual
          </p>

          <div className="space-y-4">
            {/* File Input */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Imagem da Thumbnail</label>
              <div className="flex gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="bg-secondary border-border"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Formatos suportados: JPG, PNG, WebP (máx. 5MB)
              </p>
              {previewUrl && (
                <div className="mt-2 relative w-32 h-20 rounded overflow-hidden">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Folder Select */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Pasta (Opcional)</label>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Nenhuma pasta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma pasta</SelectItem>
                  {folders?.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Associe esta thumbnail a uma pasta específica
              </p>
            </div>

            {/* Channel Name */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Nome do Canal (Opcional)</label>
              <Input
                placeholder="Ex: Meu Canal"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            {/* Niche & SubNiche */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Nicho</label>
                <Input
                  placeholder="Ex: História"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Subnicho</label>
                <Input
                  placeholder="Ex: Mistérios / Civilizações Antigas"
                  value={subNiche}
                  onChange={(e) => setSubNiche(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              A thumbnail será usada para gerar novas thumbnails deste nicho/subnicho específico
            </p>

            {/* Description */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Descrição (Opcional)</label>
              <Textarea
                placeholder="Descreva o estilo ou características desta thumbnail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-secondary border-border"
                rows={2}
              />
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full bg-primary text-primary-foreground"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Upload Thumbnail
            </Button>
          </div>
        </div>

        {/* Saved Thumbnails */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-medium text-foreground">Thumbnails Salvas</h4>
              {loadingThumbnails ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {savedThumbnails?.length || 0} thumbnail(s) de referência
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Modelo de IA para Análise:</label>
                <Select value={analysisModel} onValueChange={setAnalysisModel}>
                  <SelectTrigger className="w-48 bg-secondary border-border h-9">
                    <SelectValue placeholder="Escolher modelo..." />
                  </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4.1">GPT-4.1</SelectItem>
                          <SelectItem value="claude-sonnet-4-20250514">Claude 4 Sonnet</SelectItem>
                          <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                          <SelectItem value="deepseek-r1">DeepSeek R1</SelectItem>
                        </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAnalyzeStyle}
                disabled={analyzing || !savedThumbnails?.length}
                className="bg-primary text-primary-foreground mt-auto"
              >
                {analyzing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Rocket className="w-4 h-4 mr-2" />
                )}
                Analisar Estilo e Criar Prompt Padrão
              </Button>
            </div>
          </div>

          {/* Analysis Progress Bar */}
          {analyzing && (
            <div className="space-y-3 mb-6 p-4 bg-secondary/30 rounded-lg border border-primary/20">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm font-medium text-foreground">{analysisMessage}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Analisando thumbnails de referência...</span>
                <span className="text-primary font-semibold">{Math.round(analysisProgress)}%</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary via-primary to-amber-400 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Thumbnails Grid */}
          {savedThumbnails && savedThumbnails.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedThumbnails.map((thumb) => (
                <div key={thumb.id} className="relative group border border-border/50 rounded-lg overflow-hidden bg-secondary/20">
                  <div className="flex gap-4 p-4">
                    {/* Thumbnail Image - Clickable for preview */}
                    <div className="w-48 flex-shrink-0">
                      <div 
                        className="aspect-video rounded-lg overflow-hidden bg-secondary relative cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                        onClick={() => {
                          setSelectedReferenceThumbnail(thumb);
                          setReferencePreviewOpen(true);
                        }}
                      >
                        <img
                          src={thumb.image_url}
                          alt="Reference thumbnail"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReferenceThumbnail(thumb);
                              setReferencePreviewOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteThumbnail(thumb.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 truncate">
                        {thumb.niche || "Sem nicho"} {thumb.sub_niche ? `/ ${thumb.sub_niche}` : ""}
                      </p>
                    </div>
                    
                    {/* Extracted Prompt */}
                    <div className="flex-1 min-w-0">
                      {thumb.extracted_prompt ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-success/20 text-success border-success/30 text-xs">
                              <Check className="w-3 h-3 mr-1" />
                              Prompt Extraído
                            </Badge>
                          </div>
                          <div className="bg-secondary/50 rounded-lg p-3 border border-border/30">
                            <p className="text-xs text-muted-foreground mb-1 font-medium">Prompt Padrão:</p>
                            <p className="text-sm text-foreground leading-relaxed line-clamp-4">
                              {thumb.extracted_prompt}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs"
                            onClick={() => copyToClipboard(thumb.extracted_prompt || "", `prompt-${thumb.id}`)}
                          >
                            {copiedField === `prompt-${thumb.id}` ? (
                              <Check className="w-3 h-3 mr-1 text-success" />
                            ) : (
                              <Copy className="w-3 h-3 mr-1" />
                            )}
                            {copiedField === `prompt-${thumb.id}` ? "Copiado!" : "Copiar Prompt"}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-4">
                          <Lightbulb className="w-8 h-8 text-muted-foreground/50 mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Clique em "Analisar Estilo" para extrair o prompt desta thumbnail
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma thumbnail de referência salva ainda.
            </p>
          )}
        </div>
      </Card>

      {/* Gerador de Thumbnail Completa */}
      <Card className="p-6 border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <Wand2 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            Gerador de Thumbnail Completa
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Digite o título e o sistema gerará automaticamente: thumbnail pronta, headline de impacto, descrição SEO e tags principais, tudo baseado no estilo das suas thumbnails de referência.
        </p>

        <div className="space-y-4">
          {/* Video Title */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Título do Vídeo</label>
            <Input
              placeholder="Ex: A CIDADE FLUTUANTE dos Astecas: 3 TÉCNICAS GENIAIS que Arqueólogos Ainda Não Conseguem Explicar"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              className="bg-secondary border-border"
            />
            <p className="text-xs text-muted-foreground mt-1">
              O sistema adaptará automaticamente o estilo das thumbnails de referência para este título.
            </p>
          </div>

          {/* Prompt Selection */}
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Prompt Padrão a Usar</label>
            <Select value={selectedPrompt} onValueChange={setSelectedPrompt}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Selecione um prompt" />
              </SelectTrigger>
              <SelectContent>
                {thumbnailsWithPrompts.length > 0 ? (
                  thumbnailsWithPrompts.map((thumb, i) => (
                    <SelectItem key={thumb.id} value={String(i + 1)}>
                      Prompt {i + 1} - {thumb.niche || "Geral"}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="1">Prompt 1 (Padrão)</SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Selecione qual dos {thumbnailsWithPrompts.length || 3} prompts padrão usar para gerar a thumbnail
            </p>
          </div>

          {/* Model, Language, Style */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Modelo de IA</label>
              <Select value={genModel} onValueChange={setGenModel}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4.1">GPT-4.1</SelectItem>
                          <SelectItem value="claude-sonnet-4-20250514">Claude 4 Sonnet</SelectItem>
                          <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                          <SelectItem value="deepseek-r1">DeepSeek R1</SelectItem>
                        </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Idioma</label>
              <Select value={genLanguage} onValueChange={setGenLanguage}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Estilo de Arte</label>
              <Select value={artStyle} onValueChange={setArtStyle}>
                <SelectTrigger className="bg-secondary border-border border-primary">
                  <SelectValue placeholder="Selecione um estilo" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {THUMBNAIL_STYLE_CATEGORIES.map((category) => (
                    <div key={category.id}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-secondary/50">
                        {category.icon} {category.name}
                      </div>
                      {getStylesByCategory(category.id).map((style) => (
                        <SelectItem key={style.id} value={style.id}>
                          <span className="flex items-center gap-2">
                            <span>{style.icon}</span>
                            <span>{style.name}</span>
                            <span className="text-xs text-muted-foreground">- {style.description}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="include-headline" 
                checked={includeHeadline}
                onCheckedChange={(checked) => setIncludeHeadline(checked as boolean)}
              />
              <label htmlFor="include-headline" className="text-sm text-muted-foreground cursor-pointer">
                Incluir headline na imagem
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="use-title" 
                checked={useTitle}
                onCheckedChange={(checked) => setUseTitle(checked as boolean)}
              />
              <label htmlFor="use-title" className="text-sm text-muted-foreground cursor-pointer">
                Usar o título como headline
              </label>
            </div>
          </div>

          {/* Generate Button with Progress Bar */}
          <div className="space-y-3">
            <Button
              onClick={handleGenerateThumbnail}
              disabled={generatingThumbnail || !videoTitle.trim()}
              className="w-full bg-primary text-primary-foreground h-14 text-base relative overflow-hidden"
            >
              {generatingThumbnail ? (
                <div className="flex items-center z-10 relative">
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  <span className="font-medium">{thumbnailLoadingMessage}</span>
                </div>
              ) : (
                <>
                  <Rocket className="w-5 h-5 mr-2" />
                  Gerar Thumbnail Completa
                </>
              )}
              {/* Progress bar overlay */}
              {generatingThumbnail && (
                <div 
                  className="absolute left-0 top-0 h-full bg-white/10 transition-all duration-300 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                />
              )}
            </Button>
            
            {/* Progress indicator with percentage */}
            {generatingThumbnail && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Gerando thumbnails premium...</span>
                  <span className="text-primary font-semibold">{Math.round(loadingProgress)}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary via-primary to-amber-400 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>
                <p className="text-xs text-center text-muted-foreground italic">
                  Aguarde enquanto nossa IA cria obras-primas visuais exclusivas para você
                </p>
              </div>
            )}
            
            {!generatingThumbnail && (
              <p className="text-xs text-muted-foreground text-center">
                O sistema gerará 4 variações da thumbnail com headline, SEO e tags prontos
              </p>
            )}
          </div>

          {/* Generated Thumbnails Grid - Layout igual à referência */}
          {generatedThumbnails.length > 0 && (
            <div className="mt-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {generatedThumbnails.map((thumb, index) => (
                  <Card key={index} className="border-border/50 overflow-hidden">
                    {/* Header com número da variação */}
                    <div className="px-4 py-2 border-b border-border/50 bg-secondary/20">
                      <span className="text-sm font-medium text-foreground">Variação {index + 1}</span>
                    </div>
                    
                    {/* Imagem da Thumbnail */}
                    <div className="p-4">
                      <div className="aspect-video rounded-lg overflow-hidden bg-secondary border border-border mb-4">
                        <img
                          src={thumb.imageBase64}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Botões de ação */}
                      <div className="flex gap-2 mb-4">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDownloadThumbnail(thumb.imageBase64, index)}
                          className="flex-1"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Baixar Imagem
                        </Button>
                        <Button
                          size="sm"
                          variant={savedToLibrary.includes(index) ? "default" : "default"}
                          className={savedToLibrary.includes(index) ? "bg-success hover:bg-success/90 flex-1" : "bg-success hover:bg-success/90 flex-1"}
                          onClick={() => handleSaveToLibrary(thumb, index)}
                          disabled={savingToLibrary === index || savedToLibrary.includes(index)}
                        >
                          {savingToLibrary === index ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : savedToLibrary.includes(index) ? (
                            <Check className="w-3 h-3 mr-1" />
                          ) : (
                            <Save className="w-3 h-3 mr-1" />
                          )}
                          {savedToLibrary.includes(index) ? "Salvo!" : "Salvar!"}
                        </Button>
                      </div>
                      
                      {/* Headline de Impacto */}
                      {thumb.headline && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-semibold text-primary">★ Headline de Impacto</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs"
                              onClick={() => copyToClipboard(thumb.headline || "", `headline-${index}`)}
                            >
                              {copiedField === `headline-${index}` ? (
                                <Check className="w-3 h-3 mr-1 text-green-500" />
                              ) : (
                                <Copy className="w-3 h-3 mr-1" />
                              )}
                              {copiedField === `headline-${index}` ? "Copiado!" : "Copiar"}
                            </Button>
                          </div>
                          <p className="text-foreground font-medium">{thumb.headline}</p>
                        </div>
                      )}
                      
                      {/* Descrição SEO */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-primary">★ Descrição SEO</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                            onClick={() => copyToClipboard(thumb.seoDescription || "", `desc-${index}`)}
                          >
                            {copiedField === `desc-${index}` ? (
                              <Check className="w-3 h-3 mr-1 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3 mr-1" />
                            )}
                            {copiedField === `desc-${index}` ? "Copiado!" : "Copiar"}
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {thumb.seoDescription || "Descrição SEO otimizada para o vídeo..."}
                        </p>
                      </div>
                      
                      {/* Tags Principais */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-primary">★ Tags Principais</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                            onClick={() => copyToClipboard(
                              Array.isArray(thumb.seoTags) ? thumb.seoTags.join(", ") : (thumb.seoTags || ""),
                              `tags-${index}`
                            )}
                          >
                            {copiedField === `tags-${index}` ? (
                              <Check className="w-3 h-3 mr-1 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3 mr-1" />
                            )}
                            {copiedField === `tags-${index}` ? "Copiado!" : "Copiar"}
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {Array.isArray(thumb.seoTags) ? thumb.seoTags.join(", ") : (thumb.seoTags || "Tags otimizadas para SEO...")}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Full Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-6xl w-full h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <span>Preview da Thumbnail {activePreviewIndex + 1} de {generatedThumbnails.length}</span>
              <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {generatedThumbnails[activePreviewIndex] && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Main Image - Fixed 1280x720 aspect ratio */}
              <div className="flex-1 relative bg-secondary/30 rounded-lg overflow-hidden flex items-center justify-center p-4">
                <div className="relative w-full max-w-[1280px] mx-auto" style={{ aspectRatio: '1280/720' }}>
                  <img
                    src={generatedThumbnails[activePreviewIndex].imageBase64}
                    alt={`Thumbnail ${activePreviewIndex + 1}`}
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
                
                {/* Navigation Arrows */}
                {generatedThumbnails.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute left-2 top-1/2 -translate-y-1/2"
                      onClick={() => setActivePreviewIndex(prev => prev > 0 ? prev - 1 : generatedThumbnails.length - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setActivePreviewIndex(prev => prev < generatedThumbnails.length - 1 ? prev + 1 : 0)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
              
              {/* Details Panel */}
              <div className="flex-shrink-0 mt-4 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      {generatedThumbnails[activePreviewIndex].style}
                    </Badge>
                    {generatedThumbnails[activePreviewIndex].headline && (
                      <span className="ml-2 text-sm font-medium text-foreground">
                        Headline: "{generatedThumbnails[activePreviewIndex].headline}"
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={savedToLibrary.includes(activePreviewIndex) ? "default" : "outline"}
                      className={savedToLibrary.includes(activePreviewIndex) ? "bg-green-600 hover:bg-green-700" : ""}
                      onClick={() => handleSaveToLibrary(generatedThumbnails[activePreviewIndex], activePreviewIndex)}
                      disabled={savingToLibrary === activePreviewIndex || savedToLibrary.includes(activePreviewIndex)}
                    >
                      {savingToLibrary === activePreviewIndex ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : savedToLibrary.includes(activePreviewIndex) ? (
                        <Check className="w-4 h-4 mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {savedToLibrary.includes(activePreviewIndex) ? "Salvo na Biblioteca" : "Salvar na Biblioteca"}
                    </Button>
                    <Button
                      onClick={() => handleDownloadThumbnail(
                        generatedThumbnails[activePreviewIndex].imageBase64, 
                        activePreviewIndex
                      )}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Baixar Imagem
                    </Button>
                  </div>
                </div>
                
                {/* SEO Content */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-secondary/30 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Descrição SEO</p>
                    <p className="text-foreground">{generatedThumbnails[activePreviewIndex].seoDescription}</p>
                  </div>
                  <div className="bg-secondary/30 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Tags</p>
                    <p className="text-foreground">{generatedThumbnails[activePreviewIndex].seoTags}</p>
                  </div>
                </div>
                
                {/* Thumbnails Strip */}
                <div className="flex gap-2 overflow-x-auto py-2">
                  {generatedThumbnails.map((thumb, index) => (
                    <button
                      key={index}
                      onClick={() => setActivePreviewIndex(index)}
                      className={`flex-shrink-0 w-24 h-14 rounded-md overflow-hidden border-2 transition-all ${
                        index === activePreviewIndex 
                          ? "border-primary ring-2 ring-primary/20" 
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <img
                        src={thumb.imageBase64}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Reference Thumbnail Preview Modal */}
      <Dialog open={referencePreviewOpen} onOpenChange={setReferencePreviewOpen}>
        <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-y-auto border-primary/50 bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Preview da Thumbnail de Referência</span>
              <Button variant="ghost" size="sm" onClick={() => setReferencePreviewOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {selectedReferenceThumbnail && (
            <div className="space-y-6">
              {/* Main Image - 1280x720 ratio */}
              <div className="relative bg-secondary/30 rounded-lg overflow-hidden">
                <div className="w-full" style={{ aspectRatio: '1280/720' }}>
                  <img
                    src={selectedReferenceThumbnail.image_url}
                    alt="Reference thumbnail"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              
              {/* Info Section */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  {selectedReferenceThumbnail.niche && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Nicho</p>
                      <Badge variant="outline" className="border-primary text-primary">
                        {selectedReferenceThumbnail.niche}
                      </Badge>
                    </div>
                  )}
                  {selectedReferenceThumbnail.sub_niche && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Subnicho</p>
                      <Badge variant="outline">
                        {selectedReferenceThumbnail.sub_niche}
                      </Badge>
                    </div>
                  )}
                  {selectedReferenceThumbnail.channel_name && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Canal</p>
                      <p className="text-sm text-foreground">{selectedReferenceThumbnail.channel_name}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  {selectedReferenceThumbnail.description && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                      <p className="text-sm text-foreground">{selectedReferenceThumbnail.description}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Extracted Prompt */}
              {selectedReferenceThumbnail.extracted_prompt && (
                <div className="bg-secondary/50 rounded-lg p-4 border border-primary/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-success/20 text-success border-success/30">
                        <Check className="w-3 h-3 mr-1" />
                        Prompt Extraído
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(selectedReferenceThumbnail.extracted_prompt || "", `preview-prompt-${selectedReferenceThumbnail.id}`)}
                    >
                      {copiedField === `preview-prompt-${selectedReferenceThumbnail.id}` ? (
                        <Check className="w-3 h-3 mr-1 text-success" />
                      ) : (
                        <Copy className="w-3 h-3 mr-1" />
                      )}
                      {copiedField === `preview-prompt-${selectedReferenceThumbnail.id}` ? "Copiado!" : "Copiar Prompt"}
                    </Button>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {selectedReferenceThumbnail.extracted_prompt}
                  </p>
                </div>
              )}
              
              {!selectedReferenceThumbnail.extracted_prompt && (
                <div className="bg-secondary/30 rounded-lg p-6 border border-border/50 text-center">
                  <Lightbulb className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Clique em "Analisar Estilo e Criar Prompt Padrão" para extrair o prompt desta thumbnail
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
