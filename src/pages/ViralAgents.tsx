import { MainLayout } from "@/components/layout/MainLayout";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Bot, 
  Plus, 
  Settings, 
  Trash2, 
  FileText, 
  MessageSquare, 
  ArrowLeft,
  Loader2,
  Rocket,
  Pencil,
  Check,
  X,
  Clock,
  Zap,
  Target,
  Upload,
  File,
  Download
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { AgentChatModal } from "@/components/agents/AgentChatModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useStorage } from "@/hooks/useStorage";
import { toast } from "sonner";
import { useTutorial } from "@/hooks/useTutorial";
import { TutorialModal, TutorialHelpButton } from "@/components/tutorial/TutorialModal";
import { VIRAL_AGENTS_TUTORIAL } from "@/lib/tutorialConfigs";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ScriptAgent {
  id: string;
  name: string;
  niche: string | null;
  sub_niche: string | null;
  formula: string | null;
  formula_structure: any;
  based_on_title: string | null;
  mental_triggers: string[] | null;
  times_used: number | null;
  preferred_model: string | null;
  created_at: string;
  updated_at: string;
}

interface AgentFile {
  id: string;
  agent_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string | null;
  created_at: string;
}

const ViralAgents = () => {
  const { user } = useAuth();
  const { registerUpload, unregisterUpload, canUpload } = useStorage();
  const [agents, setAgents] = useState<ScriptAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<ScriptAgent | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showNewAgentModal, setShowNewAgentModal] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingName, setSavingName] = useState(false);
  
  // Tutorial hook
  const { showTutorial, completeTutorial, openTutorial } = useTutorial(VIRAL_AGENTS_TUTORIAL.id);

  // New agent form
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentNiche, setNewAgentNiche] = useState("");
  const [newAgentSubniche, setNewAgentSubniche] = useState("");
  const [creatingAgent, setCreatingAgent] = useState(false);

  // Edit modals
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showTriggersModal, setShowTriggersModal] = useState(false);
  const [editMemory, setEditMemory] = useState("");
  const [editInstructions, setEditInstructions] = useState("");
  const [editTriggers, setEditTriggers] = useState<string[]>([]);
  const [newTrigger, setNewTrigger] = useState("");
  const [savingMemory, setSavingMemory] = useState(false);
  const [savingInstructions, setSavingInstructions] = useState(false);
  const [savingTriggers, setSavingTriggers] = useState(false);

  // Files
  const [agentFiles, setAgentFiles] = useState<AgentFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat modal
  const [showChatModal, setShowChatModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadAgents();
    }
  }, [user?.id]);

  useEffect(() => {
    if (selectedAgent?.id) {
      loadAgentFiles(selectedAgent.id);
    } else {
      setAgentFiles([]);
    }
  }, [selectedAgent?.id]);

  const loadAgents = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('script_agents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Error loading agents:', error);
      toast.error('Erro ao carregar agentes');
    } finally {
      setLoading(false);
    }
  };

  const loadAgentFiles = async (agentId: string) => {
    if (!user?.id) return;
    setLoadingFiles(true);
    try {
      const { data, error } = await supabase
        .from('agent_files')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgentFiles(data || []);
    } catch (error) {
      console.error('Error loading agent files:', error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id || !selectedAgent) return;

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 10MB.");
      return;
    }

    // Check storage limit
    const hasSpace = await canUpload(file.size);
    if (!hasSpace) {
      toast.error("Limite de armazenamento atingido! Faça upgrade do seu plano.");
      return;
    }

    setUploadingFile(true);
    try {
      const filePath = `${user.id}/${selectedAgent.id}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('agent-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Register upload for storage tracking
      await registerUpload({
        bucket_name: 'agent-files',
        file_path: filePath,
        file_size: file.size,
        file_type: file.type || undefined
      });

      const { data, error: dbError } = await supabase
        .from('agent_files')
        .insert({
          agent_id: selectedAgent.id,
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type || null
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setAgentFiles(prev => [data, ...prev]);
      toast.success("Arquivo enviado!");
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Erro ao enviar arquivo');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteFile = async (fileId: string, filePath: string) => {
    setDeletingFileId(fileId);
    try {
      await supabase.storage.from('agent-files').remove([filePath]);

      // Unregister upload for storage tracking
      await unregisterUpload('agent-files', filePath);

      const { error } = await supabase
        .from('agent_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;

      setAgentFiles(prev => prev.filter(f => f.id !== fileId));
      toast.success("Arquivo excluído!");
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Erro ao excluir arquivo');
    } finally {
      setDeletingFileId(null);
    }
  };

  const handleDownloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('agent-files')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Erro ao baixar arquivo');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const totalFilesSize = agentFiles.reduce((acc, f) => acc + f.file_size, 0);

  const handleDeleteAgent = async () => {
    if (!deletingId) return;
    
    try {
      const { error } = await supabase
        .from('script_agents')
        .delete()
        .eq('id', deletingId);

      if (error) throw error;

      setAgents(prev => prev.filter(a => a.id !== deletingId));
      if (selectedAgent?.id === deletingId) {
        setSelectedAgent(null);
      }
      toast.success("Agente excluído!");
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Erro ao excluir agente');
    } finally {
      setShowDeleteDialog(false);
      setDeletingId(null);
    }
  };

  const handleUpdateName = async () => {
    if (!selectedAgent || !newName.trim()) return;
    
    setSavingName(true);
    try {
      const { error } = await supabase
        .from('script_agents')
        .update({ name: newName.trim() })
        .eq('id', selectedAgent.id);

      if (error) throw error;

      setAgents(prev => prev.map(a => 
        a.id === selectedAgent.id ? { ...a, name: newName.trim() } : a
      ));
      setSelectedAgent({ ...selectedAgent, name: newName.trim() });
      setEditingName(false);
      toast.success("Nome atualizado!");
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error('Erro ao atualizar nome');
    } finally {
      setSavingName(false);
    }
  };

  const handleCreateAgent = async () => {
    if (!user?.id || !newAgentName.trim()) {
      toast.error("Digite um nome para o agente");
      return;
    }

    setCreatingAgent(true);
    try {
      const { data, error } = await supabase
        .from('script_agents')
        .insert({
          user_id: user.id,
          name: newAgentName.trim(),
          niche: newAgentNiche.trim() || null,
          sub_niche: newAgentSubniche.trim() || null
        })
        .select()
        .single();

      if (error) throw error;

      setAgents(prev => [data, ...prev]);
      setShowNewAgentModal(false);
      setNewAgentName("");
      setNewAgentNiche("");
      setNewAgentSubniche("");
      toast.success("Agente criado com sucesso!");
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error('Erro ao criar agente');
    } finally {
      setCreatingAgent(false);
    }
  };

  const openMemoryModal = () => {
    if (!selectedAgent) return;
    const currentMemory = selectedAgent.formula_structure?.memory || "";
    setEditMemory(currentMemory);
    setShowMemoryModal(true);
  };

  const openInstructionsModal = () => {
    if (!selectedAgent) return;
    setEditInstructions(selectedAgent.formula || "");
    setShowInstructionsModal(true);
  };

  const handleSaveMemory = async () => {
    if (!selectedAgent) return;
    
    setSavingMemory(true);
    try {
      const updatedStructure = {
        ...(selectedAgent.formula_structure || {}),
        memory: editMemory.trim()
      };

      const { error } = await supabase
        .from('script_agents')
        .update({ formula_structure: updatedStructure })
        .eq('id', selectedAgent.id);

      if (error) throw error;

      const updated = { ...selectedAgent, formula_structure: updatedStructure };
      setAgents(prev => prev.map(a => a.id === selectedAgent.id ? updated : a));
      setSelectedAgent(updated);
      setShowMemoryModal(false);
      toast.success("Memória atualizada!");
    } catch (error) {
      console.error('Error updating memory:', error);
      toast.error('Erro ao atualizar memória');
    } finally {
      setSavingMemory(false);
    }
  };

  const handleSaveInstructions = async () => {
    if (!selectedAgent) return;
    
    setSavingInstructions(true);
    try {
      const { error } = await supabase
        .from('script_agents')
        .update({ formula: editInstructions.trim() || null })
        .eq('id', selectedAgent.id);

      if (error) throw error;

      const updated = { ...selectedAgent, formula: editInstructions.trim() || null };
      setAgents(prev => prev.map(a => a.id === selectedAgent.id ? updated : a));
      setSelectedAgent(updated);
      setShowInstructionsModal(false);
      toast.success("Instruções atualizadas!");
    } catch (error) {
      console.error('Error updating instructions:', error);
      toast.error('Erro ao atualizar instruções');
    } finally {
      setSavingInstructions(false);
    }
  };

  const openTriggersModal = () => {
    if (!selectedAgent) return;
    setEditTriggers(selectedAgent.mental_triggers || []);
    setNewTrigger("");
    setShowTriggersModal(true);
  };

  const addTrigger = () => {
    const trigger = newTrigger.trim();
    if (trigger && !editTriggers.includes(trigger)) {
      setEditTriggers(prev => [...prev, trigger]);
      setNewTrigger("");
    }
  };

  const removeTrigger = (index: number) => {
    setEditTriggers(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveTriggers = async () => {
    if (!selectedAgent) return;
    
    setSavingTriggers(true);
    try {
      const triggers = editTriggers.length > 0 ? editTriggers : null;
      
      const { error } = await supabase
        .from('script_agents')
        .update({ mental_triggers: triggers })
        .eq('id', selectedAgent.id);

      if (error) throw error;

      const updated = { ...selectedAgent, mental_triggers: triggers };
      setAgents(prev => prev.map(a => a.id === selectedAgent.id ? updated : a));
      setSelectedAgent(updated);
      setShowTriggersModal(false);
      toast.success("Gatilhos atualizados!");
    } catch (error) {
      console.error('Error updating triggers:', error);
      toast.error('Erro ao atualizar gatilhos');
    } finally {
      setSavingTriggers(false);
    }
  };

  // Simple grid animation removed - use CSS transitions instead

  return (
    <>
      <SEOHead
        title="Agentes Virais"
        description="Gerencie seus agentes de IA para criação de roteiros virais."
        noindex={true}
      />
      <MainLayout>
        <PermissionGate permission="agentes_virais" featureName="Agentes Virais">
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div 
            className="flex items-center justify-between mb-8 animate-fade-in"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center border border-primary/30">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Agentes Virais</h1>
                <p className="text-muted-foreground text-sm">
                  Crie e gerencie agentes de IA personalizados com memória, instruções e arquivos
                </p>
              </div>
              <TutorialHelpButton onClick={openTutorial} />
            </div>
            <Button
              onClick={() => setShowNewAgentModal(true)}
              className="bg-gradient-to-r from-primary to-amber-500 text-primary-foreground hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Agente
            </Button>
          </div>

          {selectedAgent ? (
              /* Agent Detail View */
              <div
                key="detail"
                className="animate-fade-in"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Agent Header */}
                    <Card className="p-6 bg-card/50 backdrop-blur-xl border-border/50 rounded-2xl">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedAgent(null)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ArrowLeft className="w-5 h-5" />
                          </Button>
                          <div className="flex-1">
                            {editingName ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={newName}
                                  onChange={(e) => setNewName(e.target.value)}
                                  className="h-9 text-xl font-bold"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUpdateName();
                                    if (e.key === 'Escape') setEditingName(false);
                                  }}
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={handleUpdateName}
                                  disabled={savingName}
                                  className="text-green-500 hover:text-green-600"
                                >
                                  {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setEditingName(false)}
                                  className="text-muted-foreground"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <h2 className="text-2xl font-bold text-foreground">{selectedAgent.name}</h2>
                            )}
                            {selectedAgent.based_on_title && (
                              <p className="text-muted-foreground text-sm mt-1">
                                Agente gerado automaticamente a partir do vídeo "{selectedAgent.based_on_title}". 
                                Nicho: {selectedAgent.niche || 'N/A'} | Subnicho: {selectedAgent.sub_niche || 'N/A'}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setNewName(selectedAgent.name);
                              setEditingName(true);
                            }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Settings className="w-5 h-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeletingId(selectedAgent.id);
                              setShowDeleteDialog(true);
                            }}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </Card>

                    {/* Chat Section */}
                    <Card className="p-6 bg-card/50 backdrop-blur-xl border-border/50 rounded-2xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-foreground">Chat com o Agente</h3>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-4">
                        Converse com seu agente usando IA. O agente utilizará suas instruções, memória e gatilhos mentais para gerar respostas personalizadas.
                      </p>

                      <Button 
                        onClick={() => setShowChatModal(true)}
                        className="w-full bg-gradient-to-r from-primary to-amber-500 text-primary-foreground hover:opacity-90"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Iniciar Conversa
                      </Button>

                      <p className="text-xs text-muted-foreground mt-3 text-center">
                        {selectedAgent.times_used || 0} conversas realizadas
                      </p>
                    </Card>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-4">
                    {/* Memory Card */}
                    <Card className="p-4 bg-card/50 backdrop-blur-xl border-border/50 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-primary font-medium">Memória</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>🔒 Apenas você</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-6 h-6"
                            onClick={openMemoryModal}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      {selectedAgent.formula_structure?.memory ? (
                        <p className="text-sm text-muted-foreground line-clamp-4">
                          {selectedAgent.formula_structure.memory}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhuma memória definida</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Última atualização {new Date(selectedAgent.updated_at).toLocaleDateString('pt-BR')}
                      </p>
                    </Card>

                    {/* Instructions Card */}
                    <Card className="p-4 bg-card/50 backdrop-blur-xl border-border/50 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-primary font-medium">Instruções</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-6 h-6"
                          onClick={openInstructionsModal}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                      </div>
                      {selectedAgent.formula ? (
                        <p className="text-sm text-muted-foreground line-clamp-4">
                          {selectedAgent.formula}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhuma instrução definida</p>
                      )}
                    </Card>

                    {/* Triggers Card */}
                    <Card className="p-4 bg-card/50 backdrop-blur-xl border-border/50 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-primary font-medium">Gatilhos Mentais</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-6 h-6"
                          onClick={openTriggersModal}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                      </div>
                      {selectedAgent.mental_triggers && selectedAgent.mental_triggers.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedAgent.mental_triggers.map((trigger, idx) => (
                            <Badge key={idx} variant="secondary" className="bg-primary/10 text-primary">
                              {trigger}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Nenhum gatilho definido</p>
                      )}
                    </Card>

                    {/* Files Card */}
                    <Card className="p-4 bg-card/50 backdrop-blur-xl border-border/50 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-primary font-medium">Arquivos</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-6 h-6"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingFile}
                        >
                          {uploadingFile ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Upload className="w-3 h-3" />
                          )}
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          onChange={handleFileUpload}
                          accept=".pdf,.doc,.docx,.txt,.md,.json,.csv"
                        />
                      </div>

                      {loadingFiles ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : agentFiles.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum arquivo</p>
                      ) : (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {agentFiles.map((file) => (
                            <div 
                              key={file.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/30 group"
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-foreground truncate">
                                    {file.file_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatFileSize(file.file_size)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-6 h-6"
                                  onClick={() => handleDownloadFile(file.file_path, file.file_name)}
                                >
                                  <Download className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-6 h-6 text-destructive"
                                  onClick={() => handleDeleteFile(file.id, file.file_path)}
                                  disabled={deletingFileId === file.id}
                                >
                                  {deletingFileId === file.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-3">
                        <div className="h-1 bg-border rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all" 
                            style={{ width: `${Math.min((totalFilesSize / (10 * 1024 * 1024)) * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatFileSize(totalFilesSize)} de 10 MB utilizados
                        </p>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            ) : (
              /* Agents Grid */
              <div
                key="grid"
                className="animate-fade-in"
              >
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : agents.length === 0 ? (
                  <Card className="p-16 text-center bg-card/30 backdrop-blur-xl border-border/30 rounded-2xl">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center mx-auto mb-6 border border-primary/20">
                      <Bot className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Nenhum agente criado</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      Crie agentes de IA personalizados para gerar roteiros baseados em fórmulas virais extraídas de vídeos de sucesso
                    </p>
                    <Button
                      data-tutorial="create-agent-button"
                      onClick={() => setShowNewAgentModal(true)}
                      className="bg-gradient-to-r from-primary to-amber-500 text-primary-foreground"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeiro Agente
                    </Button>
                  </Card>
                ) : (
                  <div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  >
                    {agents.map((agent, index) => (
                      <div 
                        key={agent.id} 
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <Card 
                          className="p-5 bg-card/50 backdrop-blur-xl border-border/50 rounded-2xl hover:border-primary/30 transition-all duration-300 cursor-pointer group"
                          onClick={() => setSelectedAgent(agent)}
                        >
                          <h3 className="font-bold text-foreground text-lg mb-2 group-hover:text-primary transition-colors">
                            {agent.name}
                          </h3>
                          
                          {agent.based_on_title && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              Agente gerado automaticamente a partir do vídeo "{agent.based_on_title}". 
                              Nicho: {agent.niche || 'N/A'} | Subnicho: {agent.sub_niche || 'N/A'}
                            </p>
                          )}
                          
                          {!agent.based_on_title && agent.niche && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {agent.niche}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2 mb-4">
                            {agent.niche && (
                              <Badge variant="secondary" className="bg-background/50 text-foreground text-xs">
                                {agent.niche}
                              </Badge>
                            )}
                            {agent.sub_niche && (
                              <Badge variant="secondary" className="bg-background/50 text-foreground text-xs">
                                {agent.sub_niche}
                              </Badge>
                            )}
                            {agent.formula && (
                              <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs">
                                <Check className="w-3 h-3 mr-1" />
                                Fórmula Viral
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" />
                              <span>0 arquivos</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{agent.times_used || 0} conversas</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(agent.created_at).toLocaleDateString('pt-BR')}
                            </div>
                            {agent.preferred_model && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-primary/10 border-primary/30 text-primary">
                                <Rocket className="w-2.5 h-2.5 mr-1" />
                                {agent.preferred_model === 'gpt-4o' ? 'GPT-4o' : 
                                 agent.preferred_model === 'claude-4-sonnet' ? 'Claude 4' : 
                                 agent.preferred_model === 'gemini-2.5-pro' ? 'Gemini Pro' : 
                                 agent.preferred_model}
                              </Badge>
                            )}
                          </div>
                        </Card>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
        </div>
      </div>

      {/* New Agent Modal */}
      <Dialog open={showNewAgentModal} onOpenChange={setShowNewAgentModal}>
        <DialogContent className="bg-card border-primary/30 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" />
              Criar Novo Agente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Nome do Agente *</label>
              <Input
                placeholder="Ex: Agente de Histórias"
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
                className="bg-background/50 border-border/50"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Nicho</label>
              <Input
                placeholder="Ex: Histórias, Finanças, Curiosidades..."
                value={newAgentNiche}
                onChange={(e) => setNewAgentNiche(e.target.value)}
                className="bg-background/50 border-border/50"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Subnicho</label>
              <Input
                placeholder="Ex: Histórias de Conflitos, Investimentos..."
                value={newAgentSubniche}
                onChange={(e) => setNewAgentSubniche(e.target.value)}
                className="bg-background/50 border-border/50"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowNewAgentModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateAgent}
                disabled={creatingAgent || !newAgentName.trim()}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {creatingAgent ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Criar Agente
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card border-destructive/30">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Agente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este agente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAgent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Memory Edit Modal */}
      <Dialog open={showMemoryModal} onOpenChange={setShowMemoryModal}>
        <DialogContent className="bg-card border-primary/30 rounded-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Editar Memória do Agente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Memória (informações que o agente deve lembrar permanentemente)
              </label>
              <Textarea
                placeholder="Ex: O usuário prefere roteiros de 8-10 minutos. Sempre usar tom informal e bem-humorado. Evitar jargões técnicos..."
                value={editMemory}
                onChange={(e) => setEditMemory(e.target.value)}
                className="bg-background/50 border-border/50 min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground mt-2">
                A memória ajuda o agente a personalizar as respostas de acordo com suas preferências.
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowMemoryModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveMemory}
                disabled={savingMemory}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {savingMemory ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Salvar Memória
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Instructions Edit Modal */}
      <Dialog open={showInstructionsModal} onOpenChange={setShowInstructionsModal}>
        <DialogContent className="bg-card border-primary/30 rounded-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Editar Instruções do Agente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Instruções (como o agente deve se comportar e gerar conteúdo)
              </label>
              <Textarea
                placeholder="Ex: Você é um especialista em criar roteiros virais para YouTube. Use ganchos fortes no início. Estruture o roteiro com introdução, desenvolvimento e conclusão..."
                value={editInstructions}
                onChange={(e) => setEditInstructions(e.target.value)}
                className="bg-background/50 border-border/50 min-h-[250px]"
              />
              <p className="text-xs text-muted-foreground mt-2">
                As instruções definem a personalidade, tom de voz e metodologia do agente.
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowInstructionsModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveInstructions}
                disabled={savingInstructions}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {savingInstructions ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Salvar Instruções
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Triggers Edit Modal */}
      <Dialog open={showTriggersModal} onOpenChange={setShowTriggersModal}>
        <DialogContent className="bg-card border-primary/30 rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Editar Gatilhos Mentais
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Adicionar novo gatilho
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: Escassez, Curiosidade, Urgência..."
                  value={newTrigger}
                  onChange={(e) => setNewTrigger(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTrigger();
                    }
                  }}
                  className="bg-background/50 border-border/50"
                />
                <Button
                  onClick={addTrigger}
                  disabled={!newTrigger.trim()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Gatilhos ativos ({editTriggers.length})
              </label>
              {editTriggers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border/50 rounded-lg">
                  Nenhum gatilho adicionado
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 p-3 border border-border/50 rounded-lg bg-background/30 max-h-40 overflow-y-auto">
                  {editTriggers.map((trigger, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="bg-primary/10 text-primary pr-1 flex items-center gap-1"
                    >
                      {trigger}
                      <button
                        onClick={() => removeTrigger(idx)}
                        className="ml-1 p-0.5 rounded-full hover:bg-destructive/20 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Gatilhos mentais ajudam a guiar o tom persuasivo dos roteiros gerados.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowTriggersModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveTriggers}
                disabled={savingTriggers}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {savingTriggers ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Salvar Gatilhos
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Agent Chat Modal */}
      {selectedAgent && (
        <AgentChatModal
          open={showChatModal}
          onOpenChange={setShowChatModal}
          agent={selectedAgent}
          onModelChange={(model) => {
            setSelectedAgent({ ...selectedAgent, preferred_model: model });
            setAgents(prev => prev.map(a => 
              a.id === selectedAgent.id ? { ...a, preferred_model: model } : a
            ));
          }}
          onTriggersUpdate={(triggers) => {
            setSelectedAgent({ ...selectedAgent, mental_triggers: triggers });
            setAgents(prev => prev.map(a => 
              a.id === selectedAgent.id ? { ...a, mental_triggers: triggers } : a
            ));
          }}
        />
      )}
      {/* Tutorial Modal */}
      <TutorialModal
        open={showTutorial}
        onOpenChange={(open) => !open && completeTutorial()}
        title={VIRAL_AGENTS_TUTORIAL.title}
        description={VIRAL_AGENTS_TUTORIAL.description}
        steps={VIRAL_AGENTS_TUTORIAL.steps}
        onComplete={completeTutorial}
      />
        </PermissionGate>
      </MainLayout>
    </>
  );
};

export default ViralAgents;
