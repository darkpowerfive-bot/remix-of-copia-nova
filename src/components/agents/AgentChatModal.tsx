import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Loader2, User, Trash2, Rocket, FileText, X, Zap, Copy, Pencil, Check, Brain, RefreshCw, Save, Download, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import logoGif from "@/assets/logo.gif";
import { supabase } from "@/integrations/supabase/client";
import { generateNarrationSrt } from "@/lib/srtGenerator";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { useCreditDeduction } from "@/hooks/useCreditDeduction";
import { toast } from "sonner";
import { addBrandingFooter } from "@/lib/utils";

const AI_MODELS = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", description: "Rápido e inteligente" },
  { id: "claude-4-sonnet", name: "Claude 4 Sonnet", provider: "Anthropic", description: "Criativo e detalhado" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", description: "Contexto extenso" },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isScript?: boolean;
}

interface ScriptAgent {
  id: string;
  name: string;
  niche: string | null;
  sub_niche: string | null;
  formula: string | null;
  formula_structure: any;
  mental_triggers: string[] | null;
  times_used: number | null;
  preferred_model: string | null;
}

interface AgentChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: ScriptAgent;
  onModelChange?: (model: string) => void;
  onTriggersUpdate?: (triggers: string[]) => void;
}

export function AgentChatModal({ open, onOpenChange, agent, onModelChange, onTriggersUpdate }: AgentChatModalProps) {
  const { user } = useAuth();
  const { balance } = useCredits();
  const { usePlatformCredits, deduct } = useCreditDeduction();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(agent.preferred_model || "gpt-4o");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isSavingTriggers, setIsSavingTriggers] = useState(false);
  
  // Script generation state
  const [showScriptForm, setShowScriptForm] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentPart, setCurrentPart] = useState(0);
  const [totalParts, setTotalParts] = useState(0);
  const [scriptTitle, setScriptTitle] = useState("");
  const [scriptDuration, setScriptDuration] = useState("5");
  const [scriptLanguage, setScriptLanguage] = useState("pt-BR");
  const [ctaInicio, setCtaInicio] = useState(false);
  const [ctaMeio, setCtaMeio] = useState(false);
  const [ctaFinal, setCtaFinal] = useState(true);
  const [autoTriggers, setAutoTriggers] = useState<string[]>([]);
  const [isGeneratingTriggers, setIsGeneratingTriggers] = useState(false);
  const [useAutoTriggers, setUseAutoTriggers] = useState(false);
  
  // SRT Preview state
  const [showSrtPreview, setShowSrtPreview] = useState(false);
  const [srtPreviewContent, setSrtPreviewContent] = useState("");
  const [srtPreviewTitle, setSrtPreviewTitle] = useState("");
  
  // Agent files state
  const [agentFiles, setAgentFiles] = useState<Array<{
    id: string;
    file_name: string;
    file_path: string;
    file_type: string | null;
    content?: string;
  }>>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Load agent files when modal opens
  useEffect(() => {
    const loadAgentFiles = async () => {
      if (!open || !agent.id) return;
      
      setLoadingFiles(true);
      try {
        // Fetch files from agent_files table
        const { data: files, error } = await supabase
          .from('agent_files')
          .select('*')
          .eq('agent_id', agent.id);
        
        if (error) {
          console.error('[AgentChat] Error loading agent files:', error);
          return;
        }
        
        if (!files || files.length === 0) {
          setAgentFiles([]);
          return;
        }
        
        // For text files, download and include content
        const filesWithContent = await Promise.all(
          files.map(async (file) => {
            const isTextFile = 
              file.file_type?.includes('text') ||
              file.file_name.endsWith('.txt') ||
              file.file_name.endsWith('.md') ||
              file.file_name.endsWith('.json');
            
            if (isTextFile) {
              try {
                const { data: fileData } = await supabase.storage
                  .from('agent-files')
                  .download(file.file_path);
                
                if (fileData) {
                  const content = await fileData.text();
                  return { ...file, content };
                }
              } catch (downloadError) {
                console.error(`[AgentChat] Error downloading file ${file.file_name}:`, downloadError);
              }
            }
            
            return file;
          })
        );
        
        setAgentFiles(filesWithContent);
        console.log(`[AgentChat] Loaded ${filesWithContent.length} agent files`);
      } catch (error) {
        console.error('[AgentChat] Error in loadAgentFiles:', error);
      } finally {
        setLoadingFiles(false);
      }
    };
    
    loadAgentFiles();
  }, [open, agent.id]);

  useEffect(() => {
    if (open) {
      setSelectedModel(agent.preferred_model || "gpt-4o");
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: `Olá! Sou o agente "${agent.name}". ${agent.niche ? `Especializado em ${agent.niche}${agent.sub_niche ? ` - ${agent.sub_niche}` : ''}.` : ''} Como posso ajudar você hoje?\n\n💡 Dica: Clique em "Gerar Roteiro" para criar um roteiro completo usando minha fórmula viral!`,
        timestamp: new Date()
      }]);
    }
  }, [open, agent]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleModelChange = async (newModel: string) => {
    setSelectedModel(newModel);
    try {
      await supabase
        .from('script_agents')
        .update({ preferred_model: newModel })
        .eq('id', agent.id);
      onModelChange?.(newModel);
    } catch (error) {
      console.error("Error saving model preference:", error);
    }
  };

  const buildSystemPrompt = () => {
    // Build file content section
    const fileContents = agentFiles
      .filter(f => f.content)
      .map(f => `📎 ARQUIVO: ${f.file_name}\n---\n${f.content}\n---`)
      .join('\n\n');
    
    let systemPrompt = `
╔══════════════════════════════════════════════════════════════════╗
║  ⚠️ REGRAS ABSOLUTAS - VOCÊ DEVE SEGUIR À RISCA ⚠️             ║
╚══════════════════════════════════════════════════════════════════╝

Você é "${agent.name}", um agente de IA especializado em criar conteúdo viral para YouTube.
${agent.niche ? `🎯 Nicho de especialização: ${agent.niche}` : ''}
${agent.sub_niche ? ` | Subnicho: ${agent.sub_niche}` : ''}

═══════════════════════════════════════════════════════════════════
1️⃣ MEMÓRIA DO AGENTE (CONTEXTO OBRIGATÓRIO)
   Use estas informações como base de conhecimento permanente:
═══════════════════════════════════════════════════════════════════
${agent.formula_structure?.memory ? agent.formula_structure.memory : '(Nenhuma memória configurada)'}

═══════════════════════════════════════════════════════════════════
2️⃣ INSTRUÇÕES/FÓRMULA (SIGA EXATAMENTE)
   Esta é a fórmula que você DEVE seguir em TODAS as gerações:
═══════════════════════════════════════════════════════════════════
${agent.formula ? agent.formula : '(Nenhuma instrução específica configurada)'}

═══════════════════════════════════════════════════════════════════
3️⃣ GATILHOS MENTAIS (USE TODOS OBRIGATORIAMENTE)
   Aplique TODOS estes gatilhos em seu conteúdo:
═══════════════════════════════════════════════════════════════════
${agent.mental_triggers && agent.mental_triggers.length > 0 
  ? agent.mental_triggers.map(t => `• ${t}`).join('\n') 
  : '(Nenhum gatilho configurado)'}

${fileContents ? `
═══════════════════════════════════════════════════════════════════
4️⃣ ARQUIVOS DE REFERÊNCIA (INFORMAÇÕES CRÍTICAS)
   Use este conteúdo como base de conhecimento adicional:
═══════════════════════════════════════════════════════════════════
${fileContents}
` : ''}

🚨 ATENÇÃO MÁXIMA:
- Todas as informações acima são OBRIGATÓRIAS
- NÃO ignore NENHUMA instrução
- NÃO improvise fora do contexto fornecido
- SIGA a fórmula/instruções À RISCA
- USE os gatilhos mentais em TODAS as gerações
- CONSULTE os arquivos de referência quando relevante

═══════════════════════════════════════════════════════════════════
REGRAS DE COMPORTAMENTO:
═══════════════════════════════════════════════════════════════════
• NUNCA diga que não pode gerar conteúdo por ser muito longo
• NUNCA peça para o usuário dividir o pedido
• Se o conteúdo for extenso, gere a primeira parte e continue
• Você DEVE gerar roteiros de QUALQUER duração
• Responda sempre em português brasileiro
• Seja criativo e envolvente
• Aplique técnicas de copywriting viral
• SEMPRE gere o conteúdo solicitado, independente do tamanho
`;
    return systemPrompt.trim();
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // CRÍTICO: Deduzir créditos ANTES do chat (custo fixo de 3 créditos por mensagem = ai_assistant)
    const CHAT_CREDITS = 3;
    let deductionResult: { success: boolean; refund: () => Promise<void> } | null = null;
    
    if (usePlatformCredits !== false) {
      deductionResult = await deduct({
        operationType: 'agent_chat',
        customAmount: CHAT_CREDITS,
        modelUsed: selectedModel,
        details: { agentName: agent.name }
      });

      if (!deductionResult.success) {
        setIsLoading(false);
        return;
      }
    }

    try {
      const conversationHistory = messages
        .filter(m => m.id !== "welcome")
        .map(m => ({ role: m.role, content: m.content }));

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          type: "agent_chat",
          prompt: input.trim(),
          agentData: {
            name: agent.name,
            niche: agent.niche,
            subNiche: agent.sub_niche,
            formula: agent.formula,
            memory: agent.formula_structure?.memory,
            mentalTriggers: agent.mental_triggers,
            systemPrompt: buildSystemPrompt(),
            conversationHistory,
            // Include files with content for backend processing
            files: agentFiles.filter(f => f.content).map(f => ({
              name: f.file_name,
              content: f.content
            })),
            // CRITICAL: Include preferred model so backend respects it
            preferredModel: selectedModel
          },
          model: selectedModel
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || data.text || "Desculpe, não consegui gerar uma resposta.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      await supabase
        .from('script_agents')
        .update({ times_used: (agent.times_used || 0) + 1 })
        .eq('id', agent.id);

    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem. Tente novamente.");
      
      // Reembolsar créditos em caso de erro
      if (deductionResult?.refund) {
        await deductionResult.refund();
      }
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: `Olá! Sou o agente "${agent.name}". ${agent.niche ? `Especializado em ${agent.niche}${agent.sub_niche ? ` - ${agent.sub_niche}` : ''}.` : ''} Como posso ajudar você hoje?\n\n💡 Dica: Clique em "Gerar Roteiro" para criar um roteiro completo usando minha fórmula viral!`,
      timestamp: new Date()
    }]);
  };

  // Script generation logic
  const wordsPerMinute = 150; // Velocidade média de narração
  const estimatedWords = parseInt(scriptDuration || "1") * wordsPerMinute;
  const estimatedParts = Math.max(1, Math.ceil(parseInt(scriptDuration || "1") / 3));
  
  const getLanguageName = (code: string) => {
    const languages: Record<string, string> = {
      "pt-BR": "Português (Brasil)",
      "en-US": "English (US)",
      "en-GB": "English (UK)",
      "es": "Español",
      "es-MX": "Español (México)",
      "fr": "Français",
      "de": "Deutsch",
      "it": "Italiano",
      "ja": "日本語",
      "ko": "한국어",
      "zh": "中文",
      "ru": "Русский",
      "ar": "العربية",
      "hi": "हिन्दी",
      "nl": "Nederlands",
      "pl": "Polski",
      "tr": "Türkçe",
    };
    return languages[code] || code;
  };
  
  // Custo fixo: 1 crédito por minuto de roteiro
  const getCreditsForScript = () => {
    const durationNum = parseInt(scriptDuration || "1");
    return durationNum; // 1 crédito por minuto
  };
  const estimatedCredits = getCreditsForScript();

  // Generate auto triggers based on niche and title
  const handleGenerateTriggers = async () => {
    if (!scriptTitle.trim()) {
      toast.error("Insira um título primeiro para gerar gatilhos personalizados");
      return;
    }

    setIsGeneratingTriggers(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          type: "generate_mental_triggers",
          prompt: `Você é um ESPECIALISTA em YouTube com +10 anos de experiência em vídeos virais. Analise profundamente este título e nicho para gerar os MELHORES gatilhos mentais que farão o vídeo VIRALIZAR.

TÍTULO DO VÍDEO: "${scriptTitle}"
NICHO: ${agent.niche || "Geral"}
SUBNICHO: ${agent.sub_niche || "Geral"}

🎯 SUA MISSÃO: Gerar 8 gatilhos mentais ULTRA-PODEROSOS baseados em:

1. PSICOLOGIA DO ALGORITMO DO YOUTUBE:
   - Gatilhos que aumentam RETENÇÃO (watch time)
   - Gatilhos que geram CLIQUES (CTR alto)
   - Gatilhos que provocam ENGAJAMENTO (comentários, likes)

2. NEUROCIÊNCIA DA VIRALIZAÇÃO:
   - Dopamina: Curiosidade, Surpresa, Recompensa
   - Urgência: FOMO, Escassez, Tempo limitado
   - Emoção: Medo, Esperança, Raiva, Alegria
   - Social: Prova Social, Autoridade, Pertencimento

3. FÓRMULAS COMPROVADAS DE VIRAIS:
   - Contraste Dramático (Antes/Depois)
   - Segredo Revelado
   - Desafio Impossível
   - História de Transformação
   - Polêmica Controlada
   - Especificidade Numérica

4. GATILHOS ESPECÍFICOS PARA O NICHO "${agent.niche || 'Geral'}":
   - Adapte os gatilhos para ressoar com a audiência deste nicho
   - Use linguagem e referências que esta audiência conhece

⚠️ REGRAS:
- Cada gatilho deve ter NO MÁXIMO 3 palavras
- Devem ser ACIONÁVEIS no roteiro
- Foque nos gatilhos mais FORTES para este título específico
- Pense: "O que faria QUALQUER PESSOA parar de scrollar e assistir?"

Retorne APENAS os 8 gatilhos, um por linha, sem numeração, hífens ou explicação. Apenas as palavras/frases dos gatilhos.`,
          model: selectedModel,
        },
      });

      if (error) throw error;

      const triggersText = data?.response || data?.text || data?.result || "";
      const triggers = triggersText
        .split('\n')
        .map((t: string) => t.trim())
        .filter((t: string) => t.length > 0 && t.length < 50)
        .slice(0, 8);

      if (triggers.length > 0) {
        setAutoTriggers(triggers);
        setUseAutoTriggers(true);
        toast.success(`${triggers.length} gatilhos mentais gerados!`);
      } else {
        toast.error("Não foi possível gerar gatilhos");
      }
    } catch (error) {
      console.error("Error generating triggers:", error);
      toast.error("Erro ao gerar gatilhos mentais");
    } finally {
      setIsGeneratingTriggers(false);
    }
  };

  const handleSaveTriggersToAgent = async () => {
    if (autoTriggers.length === 0) {
      toast.error("Nenhum gatilho para salvar");
      return;
    }

    setIsSavingTriggers(true);
    
    try {
      // Merge existing triggers with new ones (avoid duplicates)
      const existingTriggers = agent.mental_triggers || [];
      const mergedTriggers = [...new Set([...existingTriggers, ...autoTriggers])];
      
      const { error } = await supabase
        .from('script_agents')
        .update({ 
          mental_triggers: mergedTriggers,
          updated_at: new Date().toISOString()
        })
        .eq('id', agent.id);

      if (error) throw error;

      onTriggersUpdate?.(mergedTriggers);
      toast.success(`${autoTriggers.length} gatilhos salvos no agente!`);
      
      // Clear auto triggers after saving
      setAutoTriggers([]);
      setUseAutoTriggers(false);
      
    } catch (error) {
      console.error("Error saving triggers:", error);
      toast.error("Erro ao salvar gatilhos");
    } finally {
      setIsSavingTriggers(false);
    }
  };

  const handleGenerateScript = async () => {
    if (!scriptTitle.trim()) {
      toast.error("Por favor, insira o título do vídeo");
      return;
    }
    if (!user) {
      toast.error("Você precisa estar logado");
      return;
    }

    setIsGeneratingScript(true);
    setGenerationStatus("Preparando dados do agente...");
    setGenerationProgress(5);
    setShowScriptForm(false);
    
    // Create a preview message that will be updated in real-time
    const previewMessageId = `preview-${Date.now()}`;
    const previewMessage: Message = {
      id: previewMessageId,
      role: "assistant",
      content: "⏳ *Gerando roteiro...*\n\n",
      timestamp: new Date(),
      isScript: true
    };
    setMessages(prev => [...prev, previewMessage]);

    // CRÍTICO: Deduzir créditos ANTES da geração
    let deductionResult: { success: boolean; refund: () => Promise<void> } | null = null;
    
    if (usePlatformCredits !== false) {
      deductionResult = await deduct({
        operationType: 'generate_script',
        customAmount: estimatedCredits,
        modelUsed: selectedModel,
        details: { title: scriptTitle, duration: scriptDuration, agentName: agent.name }
      });

      if (!deductionResult.success) {
        setIsGeneratingScript(false);
        setMessages(prev => prev.filter(msg => msg.id !== previewMessageId));
        return;
      }
    }
    
    try {
      const ctaPositions = [];
      if (ctaInicio) ctaPositions.push("início (primeiros 30 segundos)");
      if (ctaMeio) ctaPositions.push("meio (metade do vídeo)");
      if (ctaFinal) ctaPositions.push("final (últimos 30 segundos)");

      const userDuration = parseInt(scriptDuration || "1");
      const duration = userDuration + 1;
      
      // Dividir em partes de 3 minutos para roteiros longos
      const MINUTES_PER_PART = 3;
      const numParts = Math.max(1, Math.ceil(duration / MINUTES_PER_PART));
      setTotalParts(numParts);
      
      let fullScript = "";
      let totalCreditsUsed = 0;
      
      setGenerationStatus("Aplicando fórmula viral e gatilhos mentais...");
      setGenerationProgress(10);

      for (let partIndex = 0; partIndex < numParts; partIndex++) {
        setCurrentPart(partIndex + 1);
        setGenerationProgress(10 + Math.round((partIndex / numParts) * 70));
        
        const partMinutes = Math.ceil(duration / numParts);
        const partWords = partMinutes * 150;
        const isFirstPart = partIndex === 0;
        const isLastPart = partIndex === numParts - 1;

        setGenerationStatus(numParts > 1 
          ? `Gerando parte ${partIndex + 1} de ${numParts}...` 
          : "Gerando roteiro com IA...");

        // Build prompt for this part
        const languageInstruction = scriptLanguage !== 'pt-BR' 
          ? `\n\n🌍 IDIOMA OBRIGATÓRIO: ${getLanguageName(scriptLanguage)}\n⚠️ ESCREVA TODO O ROTEIRO INTEIRAMENTE EM ${getLanguageName(scriptLanguage).toUpperCase()}! NÃO USE PORTUGUÊS!`
          : '';
        
        // Build file content section for script generation
        const fileContentsForScript = agentFiles
          .filter(f => f.content)
          .map(f => `📎 ${f.file_name}:\n${f.content}`)
          .join('\n\n---\n\n');
        
        const prompt = `
╔══════════════════════════════════════════════════════════════════╗
║  ⚠️ REGRAS ABSOLUTAS DO AGENTE - SIGA À RISCA ⚠️              ║
╚══════════════════════════════════════════════════════════════════╝

${numParts > 1 ? `GERE A PARTE ${partIndex + 1} DE ${numParts} de um` : 'GERE um'} ROTEIRO DE NARRAÇÃO PARA VOICE-OVER.
${languageInstruction}

TÍTULO DO VÍDEO: "${scriptTitle}"

${numParts > 1 ? `
📍 CONTEXTO DESTA PARTE (${partIndex + 1}/${numParts}):
${isFirstPart ? '- Esta é a PRIMEIRA parte: inclua um HOOK poderoso nos primeiros 30 segundos' : ''}
${!isFirstPart ? `- Continue de onde parou. Texto anterior (últimas 200 palavras para contexto):\n...${fullScript.slice(-800)}` : ''}
${isLastPart ? '- Esta é a ÚLTIMA parte: inclua uma conclusão impactante e CTA' : ''}
${!isLastPart ? '- NÃO conclua ainda - deixe um gancho para a continuação' : ''}

📏 DURAÇÃO DESTA PARTE: ~${partMinutes} minutos (~${partWords} palavras)
` : `
📏 DURAÇÃO: ${duration} minuto(s) = aproximadamente ${duration * 150} palavras (150 palavras/minuto)
`}

═══════════════════════════════════════════════════════════════════
🎯 FÓRMULA/INSTRUÇÕES DO AGENTE (SIGA EXATAMENTE):
═══════════════════════════════════════════════════════════════════
${agent.formula || '(Nenhuma fórmula específica)'}

═══════════════════════════════════════════════════════════════════
📝 MEMÓRIA/CONTEXTO DO AGENTE (OBRIGATÓRIO):
═══════════════════════════════════════════════════════════════════
${agent.formula_structure?.memory || '(Nenhuma memória configurada)'}

═══════════════════════════════════════════════════════════════════
🧠 GATILHOS MENTAIS (USE TODOS OBRIGATORIAMENTE):
═══════════════════════════════════════════════════════════════════
${(() => {
  const allTriggers = [
    ...(agent.mental_triggers || []),
    ...(useAutoTriggers ? autoTriggers : [])
  ];
  return allTriggers.length > 0 
    ? allTriggers.map(t => `• ${t}`).join('\n') 
    : '(Nenhum gatilho configurado)';
})()}

${agent.formula_structure?.instructions ? `
═══════════════════════════════════════════════════════════════════
📋 INSTRUÇÕES ESPECÍFICAS (SIGA À RISCA):
═══════════════════════════════════════════════════════════════════
${agent.formula_structure.instructions}
` : ''}

${fileContentsForScript ? `
═══════════════════════════════════════════════════════════════════
📎 ARQUIVOS DE REFERÊNCIA DO AGENTE (USE COMO BASE):
═══════════════════════════════════════════════════════════════════
${fileContentsForScript}
` : ''}

═══════════════════════════════════════════════════════════════════
⚠️ REGRAS CRÍTICAS DE FORMATO:
═══════════════════════════════════════════════════════════════════
1. SOMENTE TEXTO DE NARRAÇÃO - Nenhuma indicação de cena, corte, música ou efeito sonoro
2. O texto deve ser LIDO EM VOZ ALTA naturalmente
3. Sem colchetes, parênteses ou instruções técnicas
4. Apenas o que o narrador deve FALAR
5. IDIOMA: ${getLanguageName(scriptLanguage)} - ESCREVA INTEIRAMENTE NESTE IDIOMA!

${isFirstPart && ctaInicio ? '✅ INCLUIR CTA NO INÍCIO' : ''}
${isLastPart && ctaFinal ? '✅ INCLUIR CTA NO FINAL' : ''}
${numParts === 1 && ctaMeio ? '✅ INCLUIR CTA NO MEIO' : ''}

🚨 LEMBRETE: SIGA A FÓRMULA/INSTRUÇÕES E GATILHOS DO AGENTE À RISCA!

GERE AGORA ${numParts > 1 ? `A PARTE ${partIndex + 1}` : 'O ROTEIRO COMPLETO'} DE NARRAÇÃO EM ${getLanguageName(scriptLanguage).toUpperCase()}:
        `.trim();

        const { data, error } = await supabase.functions.invoke("ai-assistant", {
          body: {
            type: "generate_script_with_formula",
            prompt,
            model: selectedModel,
            duration: partMinutes,
            minDuration: partMinutes,
            maxDuration: partMinutes + 1,
            language: scriptLanguage,
            userId: user.id,
            agentData: {
              name: agent.name,
              niche: agent.niche,
              sub_niche: agent.sub_niche,
              formula: agent.formula,
              formula_structure: agent.formula_structure,
              mental_triggers: agent.mental_triggers,
              // Include files for backend context
              files: agentFiles.filter(f => f.content).map(f => ({
                name: f.file_name,
                content: f.content
              })),
              // CRITICAL: Include preferred model so backend respects it
              preferredModel: selectedModel
            },
          },
        });

        if (error) throw error;
        if (data?.error) {
          toast.error(data.error);
          return;
        }

        const partContent = typeof data?.result === 'string' ? data.result : JSON.stringify(data?.result, null, 2);
        fullScript += (fullScript ? "\n\n" : "") + partContent;
        totalCreditsUsed += data?.creditsUsed || 0;

        // Update preview message with the content so far (real-time update)
        const progressLabel = numParts > 1 
          ? `📝 **Roteiro em progresso** (Parte ${partIndex + 1}/${numParts} concluída)\n\n---\n\n` 
          : "";
        setMessages(prev => prev.map(msg => 
          msg.id === previewMessageId 
            ? { ...msg, content: progressLabel + fullScript }
            : msg
        ));

        if (numParts > 1) {
          toast.success(`Parte ${partIndex + 1}/${numParts} concluída`);
        }
      }

      setGenerationProgress(90);
      setGenerationStatus("Salvando roteiro...");

      // Save script
      await supabase
        .from('generated_scripts')
        .insert({
          user_id: user.id,
          agent_id: agent.id,
          title: scriptTitle,
          content: fullScript,
          duration: duration,
          language: scriptLanguage,
          model_used: selectedModel,
          credits_used: totalCreditsUsed || estimatedCredits
        });

      // Update agent usage
      await supabase
        .from("script_agents")
        .update({ 
          times_used: (agent.times_used || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq("id", agent.id);

      setGenerationProgress(100);
      setGenerationStatus("Concluído!");

      // Calculate actual word count and estimated reading time
      const wordCount = fullScript.split(/\s+/).filter((w: string) => w.length > 0).length;
      const actualMinutes = Math.round((wordCount / 150) * 10) / 10;
      const actualSeconds = Math.round((wordCount / 150) * 60);
      const formattedTime = actualMinutes >= 1 
        ? `${Math.floor(actualMinutes)}:${String(Math.round((actualMinutes % 1) * 60)).padStart(2, '0')} min`
        : `${actualSeconds} seg`;

      // Update the preview message to final state
      setMessages(prev => prev.map(msg => 
        msg.id === previewMessageId 
          ? { ...msg, content: fullScript }
          : msg
      ));
      
      setScriptTitle("");
      toast.success(`Roteiro completo gerado: ${wordCount} palavras (~${formattedTime})`);
      
    } catch (error) {
      console.error("[GenerateScript] Error:", error);
      toast.error("Erro ao gerar roteiro. Tente novamente.");
      // Remove the preview message on error
      setMessages(prev => prev.filter(msg => msg.id !== previewMessageId));
      
      // Reembolsar créditos em caso de erro
      if (deductionResult?.refund) {
        await deductionResult.refund();
      }
    } finally {
      setIsGeneratingScript(false);
      setGenerationStatus("");
      setGenerationProgress(0);
      setCurrentPart(0);
      setTotalParts(0);
    }
  };

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");

  const copyToClipboard = (content: string) => {
    // Remove marcações de partes (Parte 1:, Parte 2:, etc.) e títulos
    const cleanContent = content
      .replace(/^(Parte\s*\d+\s*[:\.]\s*)/gim, '')
      .replace(/^\*\*Parte\s*\d+\s*[:\.]\s*\*\*/gim, '')
      .replace(/^#+ .+$/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    navigator.clipboard.writeText(cleanContent);
    toast.success("Roteiro copiado!");
  };

  // Calculate word count and estimated time for a script
  const getScriptStats = (content: string) => {
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    const minutes = Math.floor(wordCount / 150);
    const seconds = Math.round((wordCount % 150) / 2.5);
    const formattedTime = minutes >= 1 
      ? `${minutes}:${String(seconds).padStart(2, '0')}`
      : `${Math.round(wordCount / 2.5)}s`;
    return { wordCount, formattedTime };
  };

  // Convert script to SRT format using the same logic as SRTConverter
  const convertToSRT = (content: string) => {
    // Clean the content first (remove part labels, titles, etc.)
    const cleanContent = content
      .replace(/^(Parte\s*\d+\s*[:\.]\s*)/gim, '')
      .replace(/^\*\*Parte\s*\d+\s*[:\.]\s*\*\*/gim, '')
      .replace(/^#+ .+$/gm, '')
      .replace(/^\[[\d:]+\]\s*/gm, '') // Remove time markers like [00:00]
      .replace(/^---+$/gm, '') // Remove separators
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Split into paragraphs to create scenes
    const paragraphs = cleanContent
      .split(/\n\n+/)
      .filter(p => p.trim().length > 0);

    // Create scenes for the SRT generator
    const scenes = paragraphs.map((text, index) => {
      const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
      const duration = Math.max(2, wordCount / 2.5); // 150 WPM = 2.5 words/second
      
      // Calculate start/end times based on accumulated duration
      let startSeconds = 0;
      for (let i = 0; i < index; i++) {
        const prevWords = paragraphs[i].split(/\s+/).filter(w => w.length > 0).length;
        startSeconds += Math.max(2, prevWords / 2.5) + 10; // +10 gap between scenes
      }
      
      return {
        number: index + 1,
        text: text.trim(),
        startSeconds,
        endSeconds: startSeconds + duration
      };
    });

    // Use the same SRT generator as the SRTConverter tool
    return generateNarrationSrt(scenes, {
      maxCharsPerBlock: 499,
      gapBetweenScenes: 10
    });
  };

  // Open SRT preview modal
  const openSrtPreview = (content: string, title: string) => {
    const srtContent = convertToSRT(content);
    setSrtPreviewContent(srtContent);
    setSrtPreviewTitle(title || 'roteiro');
    setShowSrtPreview(true);
  };

  const downloadSRT = (content: string, title: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}.srt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("SRT baixado com sucesso!");
  };

  const copySrtToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("SRT copiado!");
  };

  const startEditing = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditedContent(content);
  };

  const saveEdit = (messageId: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          content: editedContent
        };
      }
      return msg;
    }));
    setEditingMessageId(null);
    setEditedContent("");
    toast.success("Roteiro atualizado!");
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditedContent("");
  };

  // Loading modal steps for script generation
  const loadingSteps = [
    "Analisando título e nicho",
    "Aplicando fórmula viral",
    "Ativando gatilhos mentais",
    "Gerando roteiro 10/10",
    "Otimizando para retenção",
    "Finalizando roteiro viral",
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isGeneratingScript) {
      setCurrentStep(0);
      setProgress(0);
      
      const stepInterval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < loadingSteps.length - 1) return prev + 1;
          return prev;
        });
      }, 3000);
      
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 95) return prev + Math.random() * 5;
          return prev;
        });
      }, 500);

      return () => {
        clearInterval(stepInterval);
        clearInterval(progressInterval);
      };
    } else {
      setProgress(100);
    }
  }, [isGeneratingScript]);

  return (
    <>
      {/* Loading Modal durante geração - PADRONIZADO */}
      <Dialog open={isGeneratingScript} onOpenChange={() => {}}>
        <DialogContent className="bg-card border-primary/50 rounded-2xl max-w-sm text-center p-8" onPointerDownOutside={(e) => e.preventDefault()}>
          <div className="flex flex-col items-center gap-6">
            {/* Logo com efeito de pulso - PADRONIZADO w-24 */}
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
              <div className="relative w-24 h-24 rounded-full border-2 border-primary/50 overflow-hidden">
                <img src={logoGif} alt="Logo" className="w-full h-full object-cover scale-110" />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">
                Gerando Roteiro Viral
              </h3>
              <p className="text-sm text-muted-foreground">
                {generationStatus || loadingSteps[currentStep]}
              </p>
            </div>

            {/* Part indicator */}
            {totalParts > 1 && (
              <div className="flex items-center gap-2">
                {Array.from({ length: totalParts }, (_, i) => (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                      i < currentPart
                        ? "bg-primary text-primary-foreground"
                        : i === currentPart - 1
                        ? "bg-primary/80 text-primary-foreground animate-pulse"
                        : "bg-muted-foreground/20 text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            )}

            {/* Progress Bar */}
            <div className="w-full space-y-2">
              <Progress value={generationProgress > 0 ? generationProgress : progress} className="h-1.5" />
              <p className="text-xs text-muted-foreground">
                {Math.round(generationProgress > 0 ? generationProgress : progress)}%
              </p>
            </div>

            {/* Steps indicator - smaller */}
            <div className="flex gap-1">
              {loadingSteps.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    idx <= currentStep 
                      ? "bg-primary" 
                      : "bg-muted-foreground/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* SRT Preview Modal */}
      <Dialog open={showSrtPreview} onOpenChange={setShowSrtPreview}>
        <DialogContent className="bg-card border-primary/30 rounded-2xl max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader className="pb-4 border-b border-border/50">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-primary" />
              Preview do SRT
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 max-h-[50vh]">
            <pre className="text-sm font-mono text-muted-foreground whitespace-pre-wrap p-4 bg-background/50 rounded-lg border border-border/50">
              {srtPreviewContent}
            </pre>
          </ScrollArea>

          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="text-xs text-muted-foreground">
              {srtPreviewContent.split('\n\n').filter(b => b.trim()).length} blocos • Max 499 chars • 10s gap
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copySrtToClipboard(srtPreviewContent)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  downloadSRT(srtPreviewContent, srtPreviewTitle);
                  setShowSrtPreview(false);
                }}
                className="bg-primary hover:bg-primary/90"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar SRT
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Modal */}
      <Dialog open={open && !isGeneratingScript} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-primary/30 rounded-2xl max-w-2xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-5 pb-4 border-b border-border/50">
          <DialogTitle className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/30 to-amber-500/20 flex items-center justify-center border border-primary/40 shrink-0">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-lg text-foreground truncate">{agent.name}</p>
                {agent.niche && (
                  <p className="text-xs text-muted-foreground font-normal truncate">
                    {agent.niche}{agent.sub_niche ? ` • ${agent.sub_niche}` : ''}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Select value={selectedModel} onValueChange={handleModelChange}>
                <SelectTrigger className="w-[140px] h-9 text-xs bg-background/50 border-border/50 rounded-lg">
                  <Rocket className="w-3.5 h-3.5 mr-1.5 text-primary" />
                  <SelectValue placeholder="Modelo" />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearChat}
                className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Limpar conversa"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    message.role === "user"
                      ? "bg-primary/20 text-primary"
                      : "bg-gradient-to-br from-primary/20 to-amber-500/20 text-primary"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background/50 border border-border/50 text-foreground"
                  } ${message.isScript ? 'max-w-[95%]' : ''}`}
                >
                  {editingMessageId === message.id ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="min-h-[300px] text-sm bg-background/80 border-primary/30 resize-y"
                        placeholder="Edite o roteiro..."
                      />
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          {editedContent.split(/\s+/).filter(w => w.length > 0).length} palavras
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelEdit}
                            className="h-7 px-2 text-xs"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => saveEdit(message.id)}
                            className="h-7 px-3 text-xs bg-primary text-primary-foreground"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Salvar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.isScript && (
                          <div className="absolute top-0 right-0 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm rounded-bl-lg rounded-tr-lg px-2 py-1 border-l border-b border-border/30">
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {getScriptStats(message.content).wordCount} palavras
                            </span>
                            <span className="text-[10px] text-primary font-medium">
                              ~{getScriptStats(message.content).formattedTime}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                        <p className="text-[10px] opacity-60">
                          {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {message.isScript && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(message.id, message.content)}
                              className="h-6 px-2 text-xs"
                            >
                              <Pencil className="w-3 h-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(message.content)}
                              className="h-6 px-2 text-xs"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copiar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openSrtPreview(message.content, scriptTitle || 'roteiro')}
                              className="h-6 px-2 text-xs"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              SRT
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-background/50 border border-border/50 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Pensando...</span>
                  </div>
                </div>
              </div>
            )}

            {isGeneratingScript && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-background/50 border border-border/50 rounded-2xl px-4 py-3 w-full max-w-xs">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-primary">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm font-medium">
                        {totalParts > 1 ? `Parte ${currentPart}/${totalParts}` : 'Gerando roteiro...'}
                      </span>
                    </div>
                    {generationStatus && (
                      <span className="text-xs text-muted-foreground">{generationStatus}</span>
                    )}
                    {/* Barra de progresso */}
                    <div className="w-full space-y-1">
                      <Progress value={generationProgress} className="h-1.5 bg-secondary" />
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-muted-foreground">
                          {totalParts > 1 ? `Parte ${currentPart} de ${totalParts}` : 'Processando'}
                        </span>
                        <span className="text-[10px] font-medium text-primary">
                          {generationProgress}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Script Generation Form */}
        {showScriptForm && (
          <div className="p-4 border-t border-border/50 bg-secondary/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Gerar Roteiro</span>
              </div>
              <div className="flex items-center gap-2">
                {usePlatformCredits === false ? (
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    Usando sua API
                  </Badge>
                ) : (
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    ~{estimatedCredits} créditos
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowScriptForm(false)}
                  className="h-6 w-6"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Input
              placeholder="Título do vídeo..."
              value={scriptTitle}
              onChange={(e) => setScriptTitle(e.target.value)}
              className="bg-background/50 border-border/50 text-sm"
            />

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Duração (min)</Label>
                <Input
                  type="number"
                  min="1"
                  max="15"
                  value={scriptDuration}
                  onChange={(e) => setScriptDuration(e.target.value)}
                  className="bg-background/50 border-border/50 h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Partes</Label>
                <Input
                  value={estimatedParts}
                  readOnly
                  className="bg-background/50 border-border/50 h-9 text-sm opacity-70 cursor-not-allowed"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Idioma</Label>
                <Select value={scriptLanguage} onValueChange={setScriptLanguage}>
                  <SelectTrigger className="bg-background/50 border-border/50 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="pt-BR">🇧🇷 Português (BR)</SelectItem>
                    <SelectItem value="en-US">🇺🇸 English (US)</SelectItem>
                    <SelectItem value="en-GB">🇬🇧 English (UK)</SelectItem>
                    <SelectItem value="es">🇪🇸 Español</SelectItem>
                    <SelectItem value="es-MX">🇲🇽 Español (MX)</SelectItem>
                    <SelectItem value="fr">🇫🇷 Français</SelectItem>
                    <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                    <SelectItem value="it">🇮🇹 Italiano</SelectItem>
                    <SelectItem value="ja">🇯🇵 日本語</SelectItem>
                    <SelectItem value="ko">🇰🇷 한국어</SelectItem>
                    <SelectItem value="zh">🇨🇳 中文</SelectItem>
                    <SelectItem value="ru">🇷🇺 Русский</SelectItem>
                    <SelectItem value="ar">🇸🇦 العربية</SelectItem>
                    <SelectItem value="hi">🇮🇳 हिन्दी</SelectItem>
                    <SelectItem value="nl">🇳🇱 Nederlands</SelectItem>
                    <SelectItem value="pl">🇵🇱 Polski</SelectItem>
                    <SelectItem value="tr">🇹🇷 Türkçe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Auto Mental Triggers Section */}
            <div className="bg-background/30 rounded-lg p-3 border border-border/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-foreground">Gatilhos Mentais Automáticos</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateTriggers}
                  disabled={isGeneratingTriggers || !scriptTitle.trim()}
                  className="h-7 px-2 text-xs"
                >
                  {isGeneratingTriggers ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : autoTriggers.length > 0 ? (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Regenerar
                    </>
                  ) : (
                    <>
                      <Rocket className="w-3 h-3 mr-1" />
                      Gerar
                    </>
                  )}
                </Button>
              </div>
              
              {autoTriggers.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {autoTriggers.map((trigger, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary border-primary/20 cursor-pointer hover:bg-primary/20"
                        onClick={() => {
                          setAutoTriggers(prev => prev.filter((_, i) => i !== idx));
                        }}
                      >
                        {trigger} ×
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <Checkbox
                        checked={useAutoTriggers}
                        onCheckedChange={(c) => setUseAutoTriggers(c === true)}
                        className="h-3.5 w-3.5"
                      />
                      <span className="text-muted-foreground">Usar no roteiro</span>
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveTriggersToAgent}
                      disabled={isSavingTriggers || autoTriggers.length === 0}
                      className="h-6 px-2 text-xs bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20"
                    >
                      {isSavingTriggers ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <Save className="w-3 h-3 mr-1" />
                          Salvar no Agente
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Insira o título e clique em "Gerar" para criar gatilhos mentais otimizados para viralizar
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox
                  checked={ctaInicio}
                  onCheckedChange={(c) => setCtaInicio(c === true)}
                  className="h-4 w-4"
                />
                CTA Início
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox
                  checked={ctaMeio}
                  onCheckedChange={(c) => setCtaMeio(c === true)}
                  className="h-4 w-4"
                />
                CTA Meio
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox
                  checked={ctaFinal}
                  onCheckedChange={(c) => setCtaFinal(c === true)}
                  className="h-4 w-4"
                />
                CTA Final
              </label>
            </div>

            {/* Insufficient Credits Warning - só se usa créditos da plataforma */}
            {balance < estimatedCredits && usePlatformCredits !== false && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-destructive">Créditos Insuficientes</p>
                    <p className="text-xs text-muted-foreground">
                      Você precisa de <span className="font-bold text-foreground">{estimatedCredits} créditos</span> para gerar este roteiro, 
                      mas possui apenas <span className="font-bold text-foreground">{balance} créditos</span>.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    navigate("/plans");
                  }}
                  className="w-full bg-gradient-to-r from-primary to-amber-500 text-primary-foreground hover:opacity-90"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Comprar Créditos
                </Button>
              </div>
            )}
            
            {/* Indicador de uso de API própria */}
            {usePlatformCredits === false && (
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                <p className="text-xs text-primary text-center flex items-center justify-center gap-1.5">
                  <Zap className="h-3 w-3" />
                  Usando sua API - Sem consumo de créditos da plataforma
                </p>
              </div>
            )}

            <Button
              onClick={handleGenerateScript}
              disabled={!scriptTitle.trim() || isGeneratingScript || (balance < estimatedCredits && usePlatformCredits !== false)}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isGeneratingScript ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  {usePlatformCredits === false
                    ? "Gerar Roteiro"
                    : `Gerar Roteiro (${estimatedCredits} créditos)`}
                </>
              )}
            </Button>
          </div>
        )}

        <div className="p-4 border-t border-border/50">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowScriptForm(!showScriptForm)}
              className={`shrink-0 ${showScriptForm ? 'bg-primary/20 border-primary/50' : ''}`}
              disabled={isLoading || isGeneratingScript}
            >
              <FileText className="w-4 h-4" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Digite sua mensagem..."
              className="bg-background/50 border-border/50"
              disabled={isLoading || isGeneratingScript}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading || isGeneratingScript}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            💡 Clique no ícone de documento para gerar roteiros com a fórmula do agente
          </p>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}