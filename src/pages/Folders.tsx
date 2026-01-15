import { MainLayout } from "@/components/layout/MainLayout";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { SEOHead } from "@/components/seo/SEOHead";
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
  FolderOpen,
  Plus,
  Search,
  Trash2,
  Loader2,
  X,
  RefreshCw,
  ExternalLink,
  Archive,
  Folder,
  ChevronLeft,
  ChevronRight,
  Rocket,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";

interface AnalyzedVideo {
  id: string;
  video_url: string;
  original_title: string | null;
  translated_title: string | null;
  detected_niche: string | null;
  analyzed_at: string | null;
  created_at: string | null;
  folder_id: string | null;
  analysis_data_json: any;
}

interface FolderData {
  id: string;
  name: string;
  items_count: number | null;
  created_at: string | null;
}

const Folders = () => {
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [nicheFilter, setNicheFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch folders
  const { data: folders, isLoading: loadingFolders } = useQuery({
    queryKey: ["folders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as FolderData[];
    },
    enabled: !!user,
  });

  // Fetch videos based on selected folder
  const { data: videos, isLoading: loadingVideos, refetch: refetchVideos } = useQuery({
    queryKey: ["folder-videos", user?.id, selectedFolderId],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from("analyzed_videos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (selectedFolderId) {
        query = query.eq("folder_id", selectedFolderId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AnalyzedVideo[];
    },
    enabled: !!user,
  });

  // Get unique niches from videos
  const uniqueNiches = [...new Set(videos?.map(v => v.detected_niche).filter(Boolean) || [])];

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const { error } = await supabase.from("folders").insert({
        user_id: user.id,
        name: newFolderName,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      setNewFolderName("");
      toast({ title: "Pasta criada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar pasta", variant: "destructive" });
    },
  });

  // Delete folder mutation
  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: string) => {
      // First, unset folder_id for all videos in this folder
      await supabase
        .from("analyzed_videos")
        .update({ folder_id: null })
        .eq("folder_id", folderId);
      
      const { error } = await supabase
        .from("folders")
        .delete()
        .eq("id", folderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      if (selectedFolderId) {
        setSelectedFolderId(null);
      }
      toast({ title: "Pasta removida!" });
    },
  });

  // Delete video mutation
  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const { error } = await supabase
        .from("analyzed_videos")
        .delete()
        .eq("id", videoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folder-videos"] });
      toast({ title: "Vídeo removido!" });
    },
  });

  // Delete selected videos
  const deleteSelectedMutation = useMutation({
    mutationFn: async () => {
      for (const id of selectedVideos) {
        await supabase.from("analyzed_videos").delete().eq("id", id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folder-videos"] });
      setSelectedVideos([]);
      toast({ title: `${selectedVideos.length} vídeos removidos!` });
    },
  });

  // Filter videos
  const filteredVideos = videos?.filter((video) => {
    const matchesSearch =
      !searchTerm ||
      video.original_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.translated_title?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesNiche =
      nicheFilter === "all" || video.detected_niche === nicheFilter;

    let matchesDate = true;
    if (dateFilter !== "all" && video.created_at) {
      const videoDate = new Date(video.created_at);
      const now = new Date();
      if (dateFilter === "today") {
        matchesDate = videoDate.toDateString() === now.toDateString();
      } else if (dateFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = videoDate >= weekAgo;
      } else if (dateFilter === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = videoDate >= monthAgo;
      }
    }

    return matchesSearch && matchesNiche && matchesDate;
  }) || [];

  // Pagination
  const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);
  const paginatedVideos = filteredVideos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setNicheFilter("all");
    setDateFilter("all");
  };

  const toggleSelectAll = () => {
    if (selectedVideos.length === paginatedVideos.length) {
      setSelectedVideos([]);
    } else {
      setSelectedVideos(paginatedVideos.map((v) => v.id));
    }
  };

  const toggleSelectVideo = (videoId: string) => {
    setSelectedVideos((prev) =>
      prev.includes(videoId)
        ? prev.filter((id) => id !== videoId)
        : [...prev, videoId]
    );
  };

  const handleUseVideo = (video: AnalyzedVideo) => {
    // Navigate to analyzer with video URL
    navigate(`/analyzer?url=${encodeURIComponent(video.video_url)}`);
  };

  const handleLoadStrategicPlan = (video: AnalyzedVideo) => {
    // Salvar dados no localStorage para carregar no ExploreNiche
    const data = video.analysis_data_json;
    
    // Salvar URL do canal
    localStorage.setItem("explore_channelUrl", JSON.stringify(video.video_url));
    
    // Salvar o plano estratégico
    const strategicPlan = {
      channelName: data.channelName,
      niche: data.niche,
      strategy: data.strategy,
      contentIdeas: data.contentIdeas || [],
      differentials: data.differentials || [],
      recommendations: data.recommendations || [],
      positioning: data.positioning,
      uniqueValue: data.uniqueValue,
      postingSchedule: data.postingSchedule,
      growthTimeline: data.growthTimeline,
      quickWins: data.quickWins,
      summary: data.summary,
      strengths: data.strengths,
      weaknesses: data.weaknesses,
      opportunities: data.opportunities,
      threats: data.threats,
      metrics: data.metrics,
      dataSource: data.dataSource,
      idealVideoDuration: data.idealVideoDuration,
      bestPostingTimes: data.bestPostingTimes || [],
      bestPostingDays: data.bestPostingDays || [],
      exampleTitles: data.exampleTitles || [],
      thumbnailTips: data.thumbnailTips || [],
      audienceInsights: data.audienceInsights,
      strategicKeywords: data.strategicKeywords || [],
    };
    localStorage.setItem("explore_strategicPlan", JSON.stringify(strategicPlan));
    
    toast({ title: "Plano carregado! Redirecionando..." });
    navigate("/explore");
  };

  const isChannelAnalysis = (video: AnalyzedVideo) => {
    return video.analysis_data_json?.type === "channel_analysis";
  };

  const selectedFolder = folders?.find((f) => f.id === selectedFolderId);

  return (
    <MainLayout>
      <SEOHead
        title="Pastas e Histórico"
        description="Organize suas análises em pastas e acesse seu histórico completo de vídeos."
        noindex={true}
      />
      <PermissionGate permission="pastas" featureName="Pastas">
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Pastas e Histórico</h1>
              <p className="text-muted-foreground">
                Organize suas análises em pastas e acesse seu histórico completo
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Folders */}
            <Card className="lg:col-span-1 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Folder className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">Minhas Pastas</h3>
              </div>

              {/* Create folder input */}
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Nome da nova pasta"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="bg-secondary border-border text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newFolderName.trim()) {
                      createFolderMutation.mutate();
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={() => createFolderMutation.mutate()}
                  disabled={!newFolderName.trim() || createFolderMutation.isPending}
                  className="bg-primary text-primary-foreground shrink-0"
                >
                  {createFolderMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Folder list */}
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {/* General History */}
                <button
                  onClick={() => setSelectedFolderId(null)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedFolderId === null
                      ? "bg-primary/10 text-primary border border-primary/50"
                      : "hover:bg-secondary text-muted-foreground"
                  }`}
                >
                  <Archive className="w-4 h-4" />
                  <span>Histórico Geral</span>
                </button>

                {loadingFolders ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  folders?.map((folder) => (
                    <div
                      key={folder.id}
                      className={`group flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                        selectedFolderId === folder.id
                          ? "bg-primary/10 text-primary border border-primary/50"
                          : "hover:bg-secondary text-muted-foreground"
                      }`}
                    >
                      <button
                        onClick={() => setSelectedFolderId(folder.id)}
                        className="flex-1 flex items-center gap-2 text-left"
                      >
                        <Folder className="w-4 h-4" />
                        <span className="truncate">{folder.name}</span>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFolderMutation.mutate(folder.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Right Content - Videos Table */}
            <Card className="lg:col-span-3 p-4">
              {/* Folder Title & Filters */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {selectedFolder?.name || "HISTÓRICO GERAL"}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedFolder
                      ? `Análises da pasta ${selectedFolder.name}`
                      : "Todas as suas análises de vídeos"}
                  </p>
                </div>
                {(searchTerm || nicheFilter !== "all" || dateFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-primary hover:text-primary/80"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Limpar Filtros
                  </Button>
                )}
              </div>

              {/* Filter Row */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por título..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-secondary border-border"
                  />
                </div>
                <Select value={nicheFilter} onValueChange={setNicheFilter}>
                  <SelectTrigger className="w-full sm:w-48 bg-secondary border-border">
                    <SelectValue placeholder="Todos os Nichos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Nichos</SelectItem>
                    {uniqueNiches.map((niche) => (
                      <SelectItem key={niche} value={niche!}>
                        {niche}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full sm:w-48 bg-secondary border-border">
                    <SelectValue placeholder="Todas as Datas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Datas</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Última Semana</SelectItem>
                    <SelectItem value="month">Último Mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bulk Actions */}
              {selectedVideos.length > 0 && (
                <div className="flex items-center gap-2 mb-4 p-2 bg-secondary rounded-md">
                  <span className="text-sm text-muted-foreground">
                    {selectedVideos.length} selecionado(s)
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteSelectedMutation.mutate()}
                    disabled={deleteSelectedMutation.isPending}
                  >
                    {deleteSelectedMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-1" />
                    )}
                    Excluir Selecionados
                  </Button>
                </div>
              )}

              {/* Table */}
              {loadingVideos ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : paginatedVideos.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Nenhuma análise encontrada</p>
                </div>
              ) : (
                <>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-secondary/50">
                          <TableHead className="w-10">
                            <Checkbox
                              checked={selectedVideos.length === paginatedVideos.length && paginatedVideos.length > 0}
                              onCheckedChange={toggleSelectAll}
                            />
                          </TableHead>
                          <TableHead className="text-primary font-semibold">TÍTULO ORIGINAL</TableHead>
                          <TableHead className="text-primary font-semibold">NICHO</TableHead>
                          <TableHead className="text-primary font-semibold">DATA E HORA</TableHead>
                          <TableHead className="text-primary font-semibold text-right">AÇÕES</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedVideos.map((video) => (
                          <TableRow key={video.id} className="hover:bg-secondary/30">
                            <TableCell>
                              <Checkbox
                                checked={selectedVideos.includes(video.id)}
                                onCheckedChange={() => toggleSelectVideo(video.id)}
                              />
                            </TableCell>
                            <TableCell className="max-w-md">
                              <span className="line-clamp-1" title={video.original_title || video.translated_title || ""}>
                                {video.original_title || video.translated_title || "Sem título"}
                              </span>
                            </TableCell>
                            <TableCell>
                              {video.detected_niche ? (
                                <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                                  {video.detected_niche}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDate(video.analyzed_at || video.created_at)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {isChannelAnalysis(video) && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleLoadStrategicPlan(video)}
                                    title="Carregar Plano Estratégico"
                                    className="text-blue-500 hover:bg-blue-500/10"
                                  >
                                    <Rocket className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleUseVideo(video)}
                                  title="Recarregar títulos"
                                  className="text-primary hover:bg-primary/10"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteVideoMutation.mutate(video.id)}
                                  className="text-destructive hover:bg-destructive/10"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        Mostrando {(currentPage - 1) * itemsPerPage + 1}-
                        {Math.min(currentPage * itemsPerPage, filteredVideos.length)} de{" "}
                        {filteredVideos.length} análises
                      </span>
                      <span className="ml-4">Itens por página:</span>
                      <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(val) => {
                          setItemsPerPage(Number(val));
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="w-20 h-8 bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-8 w-8"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum = i + 1;
                        if (totalPages > 5) {
                          if (currentPage > 3) {
                            pageNum = currentPage - 2 + i;
                          }
                          if (pageNum > totalPages) {
                            pageNum = totalPages - 4 + i;
                          }
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="icon"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`h-8 w-8 ${currentPage === pageNum ? "bg-primary text-primary-foreground" : ""}`}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="h-8 w-8"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
      </PermissionGate>
    </MainLayout>
  );
};

export default Folders;
