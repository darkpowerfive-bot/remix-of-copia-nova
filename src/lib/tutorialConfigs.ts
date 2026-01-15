import type { GuidedStep } from "@/components/tutorial/GuidedTutorial";

export interface TutorialConfig {
  id: string;
  title: string;
  description: string;
  steps: GuidedStep[];
}

// Tutorial: Prompts para Cenas
export const PROMPTS_IMAGES_TUTORIAL: TutorialConfig = {
  id: "prompts-images",
  title: "Gerador de Cenas",
  description: "Aprenda a criar prompts visuais profissionais",
  steps: [
    {
      title: "Cole seu Roteiro",
      description: "Comece colando o texto do seu roteiro neste campo. O sistema analisará automaticamente o conteúdo para gerar prompts de imagem para cada cena.",
      icon: "📝",
      selector: "[data-tutorial='script-input']",
      position: "right",
    },
    {
      title: "Configure o Estilo Visual",
      description: "Escolha o modelo de IA e o estilo visual das imagens. Isso define a estética de todas as cenas geradas.",
      icon: "🎨",
      selector: "[data-tutorial='style-settings']",
      position: "bottom",
    },
    {
      title: "Ajuste Palavras por Cena",
      description: "Defina quantas palavras cada cena terá. Menos palavras = mais cenas e um ritmo mais dinâmico.",
      icon: "⏱️",
      selector: "[data-tutorial='words-per-scene']",
      position: "bottom",
    },
    {
      title: "Gere os Prompts",
      description: "Clique aqui para a IA criar prompts detalhados para cada cena do seu roteiro. Você pode editar qualquer prompt depois.",
      icon: "✨",
      selector: "[data-tutorial='generate-button']",
      position: "top",
    },
    {
      title: "Navegue pelo Histórico",
      description: "Acesse gerações anteriores na aba 'Histórico'. Você pode reutilizar prompts de projetos passados.",
      icon: "📚",
      selector: "[data-tutorial='history-tab']",
      position: "bottom",
    },
  ],
};

// Tutorial: Analisador de Vídeos
export const VIDEO_ANALYZER_TUTORIAL: TutorialConfig = {
  id: "video-analyzer",
  title: "Analisador de Vídeos",
  description: "Descubra os segredos de vídeos virais",
  steps: [
    {
      title: "Cole a URL do Vídeo",
      description: "Insira o link de qualquer vídeo do YouTube que você quer analisar. Pode ser um vídeo viral do seu nicho ou de um concorrente.",
      icon: "🔗",
      selector: "[data-tutorial='video-url-input']",
      position: "bottom",
    },
    {
      title: "Inicie a Análise",
      description: "Clique para extrair métricas, thumbnail, título e transcrição automaticamente.",
      icon: "🔍",
      selector: "[data-tutorial='analyze-button']",
      position: "bottom",
    },
    {
      title: "Veja os Resultados",
      description: "Após a análise, você verá todas as informações do vídeo aqui, incluindo pontuação do título e dicas de melhoria.",
      icon: "📊",
      selector: "[data-tutorial='analysis-results']",
      position: "top",
    },
    {
      title: "Gere Títulos Virais",
      description: "Use as informações da análise para gerar variações de títulos otimizados para CTR.",
      icon: "💡",
      selector: "[data-tutorial='generate-titles-button']",
      position: "left",
    },
  ],
};

// Tutorial: Agentes Virais
export const VIRAL_AGENTS_TUTORIAL: TutorialConfig = {
  id: "viral-agents",
  title: "Agentes Virais",
  description: "Crie agentes especializados para seu nicho",
  steps: [
    {
      title: "Seus Agentes",
      description: "Agentes são assistentes de IA personalizados que aprendem o estilo do seu canal e geram roteiros seguindo suas fórmulas específicas.",
      icon: "🤖",
      selector: "[data-tutorial='agents-list']",
      position: "right",
    },
    {
      title: "Crie um Novo Agente",
      description: "Clique aqui para criar um agente. Configure nicho, gatilhos mentais e estrutura de roteiro.",
      icon: "➕",
      selector: "[data-tutorial='create-agent-button']",
      position: "bottom",
    },
    {
      title: "Converse com seu Agente",
      description: "Selecione um agente e inicie uma conversa para gerar roteiros personalizados no seu estilo.",
      icon: "💬",
      selector: "[data-tutorial='agent-chat']",
      position: "left",
    },
  ],
};

// Tutorial: Canais Monitorados
export const MONITORED_CHANNELS_TUTORIAL: TutorialConfig = {
  id: "monitored-channels",
  title: "Canais Monitorados",
  description: "Monitore a concorrência automaticamente",
  steps: [
    {
      title: "Adicione um Canal",
      description: "Insira a URL de canais do YouTube que você quer acompanhar. Podem ser concorrentes ou inspirações.",
      icon: "📺",
      selector: "[data-tutorial='add-channel-input']",
      position: "bottom",
    },
    {
      title: "Lista de Canais",
      description: "Veja todos os canais que você está monitorando. Clique em um canal para ver seus vídeos recentes.",
      icon: "📋",
      selector: "[data-tutorial='channels-list']",
      position: "right",
    },
    {
      title: "Notificações",
      description: "Ative o sino para receber alertas quando um canal publicar um novo vídeo.",
      icon: "🔔",
      selector: "[data-tutorial='notification-toggle']",
      position: "left",
    },
  ],
};

// Tutorial: Biblioteca Viral
export const VIRAL_LIBRARY_TUTORIAL: TutorialConfig = {
  id: "viral-library",
  title: "Biblioteca Viral",
  description: "Organize seus títulos e análises",
  steps: [
    {
      title: "Seus Títulos Salvos",
      description: "Aqui ficam todos os títulos que você gerou e salvou. Use as abas para filtrar por tipo.",
      icon: "📁",
      selector: "[data-tutorial='titles-list']",
      position: "right",
    },
    {
      title: "Filtros e Busca",
      description: "Use os filtros para encontrar títulos por pontuação, fórmula ou palavras-chave.",
      icon: "🔍",
      selector: "[data-tutorial='search-filter']",
      position: "bottom",
    },
    {
      title: "Ações Rápidas",
      description: "Copie, edite ou delete títulos com um clique. Marque os melhores como favoritos.",
      icon: "⭐",
      selector: "[data-tutorial='title-actions']",
      position: "left",
    },
  ],
};

// Tutorial: Gerador de Cenas (SceneGenerator)
export const SCENE_GENERATOR_TUTORIAL: TutorialConfig = {
  id: "scene-generator",
  title: "Gerador de Cenas",
  description: "Transforme roteiros em prompts de imagem",
  steps: [
    {
      title: "Insira o Roteiro",
      description: "Cole o texto completo do seu roteiro. Quanto mais detalhado, melhores serão os prompts gerados.",
      icon: "📝",
      selector: "[data-tutorial='script-textarea']",
      position: "right",
    },
    {
      title: "Escolha o Estilo",
      description: "Selecione o estilo visual das imagens: fotorealista, cinematográfico, anime, etc.",
      icon: "🎨",
      selector: "[data-tutorial='style-select']",
      position: "bottom",
    },
    {
      title: "Gere e Copie",
      description: "Clique em gerar e depois copie os prompts para usar em qualquer ferramenta de IA.",
      icon: "📋",
      selector: "[data-tutorial='generate-copy-button']",
      position: "top",
    },
  ],
};

// Tutorial: Conversor SRT
export const SRT_CONVERTER_TUTORIAL: TutorialConfig = {
  id: "srt-converter",
  title: "Conversor SRT",
  description: "Crie legendas profissionais",
  steps: [
    {
      title: "Cole o Texto",
      description: "Insira a transcrição ou roteiro que você quer converter para legendas.",
      icon: "📝",
      selector: "[data-tutorial='srt-input']",
      position: "right",
    },
    {
      title: "Configure o Timing",
      description: "Ajuste o WPM (palavras por minuto) para controlar a velocidade das legendas.",
      icon: "⏱️",
      selector: "[data-tutorial='wpm-setting']",
      position: "bottom",
    },
    {
      title: "Baixe o Arquivo",
      description: "Clique para exportar o arquivo .srt pronto para importar no seu editor.",
      icon: "💾",
      selector: "[data-tutorial='download-srt']",
      position: "top",
    },
  ],
};

// Tutorial: Dashboard
export const DASHBOARD_TUTORIAL: TutorialConfig = {
  id: "dashboard",
  title: "Dashboard",
  description: "Seu centro de comando",
  steps: [
    {
      title: "Estatísticas",
      description: "Veja um resumo das suas atividades: vídeos analisados, títulos gerados e créditos disponíveis.",
      icon: "📊",
      selector: "[data-tutorial='stats-cards']",
      position: "bottom",
    },
    {
      title: "Atividade Recente",
      description: "Acompanhe suas ações recentes e continue trabalhos em andamento.",
      icon: "🕐",
      selector: "[data-tutorial='recent-activity']",
      position: "left",
    },
    {
      title: "Navegação Rápida",
      description: "Use o menu lateral para acessar rapidamente qualquer ferramenta da plataforma.",
      icon: "🚀",
      selector: "[data-tutorial='sidebar-nav']",
      position: "right",
    },
  ],
};

// Tutorial: Analytics
export const ANALYTICS_TUTORIAL: TutorialConfig = {
  id: "analytics",
  title: "Analytics de Canais",
  description: "Analise performance de canais",
  steps: [
    {
      title: "Adicione Canais",
      description: "Cole a URL de um canal do YouTube para começar a acompanhar suas métricas.",
      icon: "📈",
      selector: "[data-tutorial='add-analytics-channel']",
      position: "bottom",
    },
    {
      title: "Métricas Detalhadas",
      description: "Veja inscritos, views, quantidade de vídeos e taxa de crescimento.",
      icon: "📊",
      selector: "[data-tutorial='channel-metrics']",
      position: "right",
    },
    {
      title: "Histórico de Vídeos",
      description: "Analise os vídeos recentes do canal e identifique padrões de sucesso.",
      icon: "🎬",
      selector: "[data-tutorial='video-history']",
      position: "left",
    },
  ],
};

// Export all tutorials as a map
export const TUTORIALS: Record<string, TutorialConfig> = {
  "prompts-images": PROMPTS_IMAGES_TUTORIAL,
  "video-analyzer": VIDEO_ANALYZER_TUTORIAL,
  "viral-agents": VIRAL_AGENTS_TUTORIAL,
  "monitored-channels": MONITORED_CHANNELS_TUTORIAL,
  "viral-library": VIRAL_LIBRARY_TUTORIAL,
  "scene-generator": SCENE_GENERATOR_TUTORIAL,
  "srt-converter": SRT_CONVERTER_TUTORIAL,
  "dashboard": DASHBOARD_TUTORIAL,
  "analytics": ANALYTICS_TUTORIAL,
};
