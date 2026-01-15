import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { LandingSettingsProvider } from "@/hooks/useLandingSettings";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ThemeProvider } from "next-themes";
import { BackgroundImageGenerationProvider } from "@/hooks/useBackgroundImageGeneration";
import { BackgroundGenerationIndicator } from "@/components/layout/BackgroundGenerationIndicator";
import { MaintenanceGuard } from "@/components/maintenance/MaintenanceGuard";
import { useAppDomainRedirect } from "@/hooks/useAppDomainRedirect";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { Loader2 } from "lucide-react";
import { Suspense, lazy } from "react";

// Critical pages loaded immediately
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy load pages with preload capability for faster navigation
const lazyWithPreload = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) => {
  const Component = lazy(importFn);
  (Component as any).preload = importFn;
  return Component;
};

// Core tools - preload immediately after initial render
const VideoAnalyzer = lazyWithPreload(() => import("./pages/VideoAnalyzer"));
const ExploreNiche = lazyWithPreload(() => import("./pages/ExploreNiche"));
const ViralAgents = lazyWithPreload(() => import("./pages/ViralAgents"));
const SceneGenerator = lazyWithPreload(() => import("./pages/SceneGenerator"));
const PromptsImages = lazyWithPreload(() => import("./pages/PromptsImages"));
const ChannelAnalyzer = lazyWithPreload(() => import("./pages/ChannelAnalyzer"));
const ViralScriptGenerator = lazyWithPreload(() => import("./pages/ViralScriptGenerator"));

// Secondary tools - lazy loaded
const Folders = lazy(() => import("./pages/Folders"));
const MonitoredChannels = lazy(() => import("./pages/MonitoredChannels"));
const Analytics = lazy(() => import("./pages/Analytics"));
const ViralLibrary = lazy(() => import("./pages/ViralLibrary"));
const VoiceGenerator = lazy(() => import("./pages/VoiceGenerator"));
const VideoGenerator = lazy(() => import("./pages/VideoGenerator"));
const YouTubeIntegration = lazy(() => import("./pages/YouTubeIntegration"));
const SearchChannels = lazy(() => import("./pages/SearchChannels"));
const SRTConverter = lazy(() => import("./pages/SRTConverter"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const AnalysisHistory = lazy(() => import("./pages/AnalysisHistory"));
const PlansCredits = lazy(() => import("./pages/PlansCredits"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PendingApproval = lazy(() => import("./pages/PendingApproval"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const Blog = lazy(() => import("./pages/Blog"));
const DynamicArticle = lazy(() => import("./pages/blog/DynamicArticle"));
const PublicationSchedule = lazy(() => import("./pages/PublicationSchedule"));

// Preload core tools after initial render
if (typeof window !== 'undefined') {
  const preloadCoreTools = () => {
    (VideoAnalyzer as any).preload?.();
    (ExploreNiche as any).preload?.();
    (ViralAgents as any).preload?.();
    (SceneGenerator as any).preload?.();
    (PromptsImages as any).preload?.();
    (ChannelAnalyzer as any).preload?.();
    (ViralScriptGenerator as any).preload?.();
  };
  
  // Use requestIdleCallback with fallback for Safari/iOS
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(preloadCoreTools);
  } else {
    setTimeout(preloadCoreTools, 2000);
  }
}

// Static blog article pages (legacy)
const ComoGanharDinheiroYouTube = lazy(() => import("./pages/blog/ComoGanharDinheiroYouTube"));
const NichosLucrativosYouTube = lazy(() => import("./pages/blog/NichosLucrativosYouTube"));
const ComoCriarCanalDark = lazy(() => import("./pages/blog/ComoCriarCanalDark"));
const RoteirosViraisIA = lazy(() => import("./pages/blog/RoteirosViraisIA"));
const ThumbnailsProfissionais = lazy(() => import("./pages/blog/ThumbnailsProfissionais"));
const SEOYouTube = lazy(() => import("./pages/blog/SEOYouTube"));
const AlgoritmoYouTube = lazy(() => import("./pages/blog/AlgoritmoYouTube"));
const FerramentasCriacaoVideos = lazy(() => import("./pages/blog/FerramentasCriacaoVideos"));
const ShortsVirais = lazy(() => import("./pages/blog/ShortsVirais"));
const MonetizacaoAfiliados = lazy(() => import("./pages/blog/MonetizacaoAfiliados"));
const CrescimentoRapido = lazy(() => import("./pages/blog/CrescimentoRapido"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

// Smart redirect: logged in -> dashboard, not logged in -> landing
const RootRedirect = () => {
  const { user, loading } = useAuth();
  useAppDomainRedirect();
  
  if (loading) {
    return <PageLoader />;
  }
  
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/landing" replace />;
};

// Wrapper component that handles domain redirect for all routes
const AppRoutes = () => {
  useAppDomainRedirect();
  
  return (
    <MaintenanceGuard>
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/landing" element={<LandingSettingsProvider><Landing /></LandingSettingsProvider>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/analyzer" element={<ProtectedRoute><VideoAnalyzer /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><AnalysisHistory /></ProtectedRoute>} />
            <Route path="/explore" element={<ProtectedRoute><ExploreNiche /></ProtectedRoute>} />
            <Route path="/folders" element={<ProtectedRoute><Folders /></ProtectedRoute>} />
            <Route path="/channels" element={<ProtectedRoute><MonitoredChannels /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/library" element={<ProtectedRoute><ViralLibrary /></ProtectedRoute>} />
            <Route path="/agents" element={<ProtectedRoute><ViralAgents /></ProtectedRoute>} />
            <Route path="/viral-script" element={<ProtectedRoute><ViralScriptGenerator /></ProtectedRoute>} />
            <Route path="/prompts" element={<ProtectedRoute><PromptsImages /></ProtectedRoute>} />
            <Route path="/voice" element={<ProtectedRoute><VoiceGenerator /></ProtectedRoute>} />
            
            <Route path="/video-gen" element={<ProtectedRoute><VideoGenerator /></ProtectedRoute>} />
            <Route path="/youtube" element={<ProtectedRoute><YouTubeIntegration /></ProtectedRoute>} />
            <Route path="/search-channels" element={<ProtectedRoute><SearchChannels /></ProtectedRoute>} />
            <Route path="/channel-analyzer" element={<ProtectedRoute><ChannelAnalyzer /></ProtectedRoute>} />
            <Route path="/srt" element={<ProtectedRoute><SRTConverter /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
            
            <Route path="/scenes" element={<ProtectedRoute><SceneGenerator /></ProtectedRoute>} />
            <Route path="/schedule" element={<ProtectedRoute><PublicationSchedule /></ProtectedRoute>} />
            <Route path="/plans" element={<ProtectedRoute><PlansCredits /></ProtectedRoute>} />
            <Route path="/planos-creditos" element={<Navigate to="/plans" replace />} />
            <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
            {/* Rotas canônicas em português - redirecionamento das versões em inglês */}
            <Route path="/terms" element={<Navigate to="/termos-de-uso" replace />} />
            <Route path="/termos-de-uso" element={<TermsOfService />} />
            <Route path="/privacy" element={<Navigate to="/politica-de-privacidade" replace />} />
            <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/pending-approval" element={<ProtectedRoute><PendingApproval /></ProtectedRoute>} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/blog" element={<Blog />} />
            {/* Static legacy blog routes */}
            <Route path="/blog/como-ganhar-dinheiro-youtube" element={<ComoGanharDinheiroYouTube />} />
            <Route path="/blog/nichos-lucrativos-youtube" element={<NichosLucrativosYouTube />} />
            <Route path="/blog/como-criar-canal-dark" element={<ComoCriarCanalDark />} />
            <Route path="/blog/roteiros-virais-ia" element={<RoteirosViraisIA />} />
            <Route path="/blog/thumbnails-profissionais" element={<ThumbnailsProfissionais />} />
            <Route path="/blog/seo-youtube" element={<SEOYouTube />} />
            <Route path="/blog/algoritmo-youtube" element={<AlgoritmoYouTube />} />
            <Route path="/blog/ferramentas-criacao-videos" element={<FerramentasCriacaoVideos />} />
            <Route path="/blog/shorts-virais" element={<ShortsVirais />} />
            <Route path="/blog/monetizacao-afiliados" element={<MonetizacaoAfiliados />} />
            <Route path="/blog/crescimento-rapido" element={<CrescimentoRapido />} />
            {/* Dynamic blog articles from database */}
            <Route path="/blog/:slug" element={<DynamicArticle />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </MaintenanceGuard>
  );
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Optimize query behavior
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>
        <BackgroundImageGenerationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
              <BackgroundGenerationIndicator />
            </BrowserRouter>
          </TooltipProvider>
        </BackgroundImageGenerationProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
