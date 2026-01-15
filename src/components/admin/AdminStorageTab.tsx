import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { HardDrive, Image, Database, Loader2, RefreshCw, Search, FolderOpen, Trash2, FileImage, FileText, File, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserStorage {
  id: string;
  email: string | null;
  full_name: string | null;
  whatsapp: string | null;
  storage_used: number | null;
  storage_limit: number | null;
}

interface UserFile {
  id: string;
  bucket_name: string;
  file_path: string;
  file_size: number;
  file_type: string | null;
  created_at: string;
}

export function AdminStorageTab() {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<UserStorage[]>([]);
  const [stats, setStats] = useState({
    totalSpace: 0,
    usedSpace: 0,
    freeSpace: 0,
    imagesSize: 0,
  });

  // Files modal state
  const [filesModalOpen, setFilesModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserStorage | null>(null);
  const [userFiles, setUserFiles] = useState<UserFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  useEffect(() => {
    fetchStorageData();
  }, []);

  const fetchStorageData = async () => {
    setLoading(true);
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name, whatsapp, storage_used, storage_limit")
        .order("storage_used", { ascending: false });

      if (profiles) {
        setUsers(profiles);
        
        const totalUsed = profiles.reduce((acc, p) => acc + (p.storage_used || 0), 0);
        const totalLimit = profiles.reduce((acc, p) => acc + (p.storage_limit || 1), 0);
        
        setStats({
          totalSpace: totalLimit,
          usedSpace: totalUsed,
          freeSpace: totalLimit - totalUsed,
          imagesSize: totalUsed * 0.7, // Approximate
        });
      }
    } catch (error) {
      console.error("Error fetching storage data:", error);
      toast.error("Erro ao carregar dados de armazenamento");
    } finally {
      setLoading(false);
    }
  };

  // Dynamic search filter
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(term) ||
        u.full_name?.toLowerCase().includes(term) ||
        u.whatsapp?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  const formatSize = (gb: number) => {
    if (gb < 0.001) return `${(gb * 1024 * 1024).toFixed(2)} KB`;
    if (gb < 1) return `${(gb * 1024).toFixed(2)} MB`;
    return `${gb.toFixed(2)} GB`;
  };

  const getUsagePercent = (used: number | null, limit: number | null) => {
    if (!limit || limit === 0) return 0;
    return ((used || 0) / limit) * 100;
  };

  const handleResetStorage = async (userId: string) => {
    try {
      // Delete all file upload records for this user
      const { error: deleteError } = await supabase
        .from("user_file_uploads")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      // Reset storage in profile (trigger will also update this, but let's be explicit)
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ storage_used: 0 })
        .eq("id", userId);

      if (updateError) throw updateError;

      toast.success("Armazenamento resetado!");
      fetchStorageData();
    } catch (error) {
      console.error("Error resetting storage:", error);
      toast.error("Erro ao resetar armazenamento");
    }
  };

  const handleUpdateLimit = async (userId: string, newLimit: number) => {
    const { error } = await supabase
      .from("profiles")
      .update({ storage_limit: newLimit })
      .eq("id", userId);

    if (error) {
      toast.error("Erro ao atualizar limite");
    } else {
      toast.success("Limite atualizado!");
      fetchStorageData();
    }
  };

  const handleViewFiles = async (user: UserStorage) => {
    setSelectedUser(user);
    setFilesModalOpen(true);
    setLoadingFiles(true);
    
    try {
      const { data, error } = await supabase
        .from("user_file_uploads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUserFiles(data || []);
    } catch (error) {
      console.error("Error fetching user files:", error);
      toast.error("Erro ao carregar arquivos");
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleDeleteFile = async (file: UserFile) => {
    if (!selectedUser) return;
    
    setDeletingFileId(file.id);
    try {
      // Delete from storage bucket
      await supabase.storage.from(file.bucket_name).remove([file.file_path]);

      // Delete from tracking table
      const { error } = await supabase
        .from("user_file_uploads")
        .delete()
        .eq("id", file.id);

      if (error) throw error;

      setUserFiles(prev => prev.filter(f => f.id !== file.id));
      toast.success("Arquivo excluído!");
      fetchStorageData();
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Erro ao excluir arquivo");
    } finally {
      setDeletingFileId(null);
    }
  };

  const handleDownloadFile = async (file: UserFile) => {
    try {
      const { data, error } = await supabase.storage
        .from(file.bucket_name)
        .download(file.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = getFileName(file.file_path);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Download iniciado!");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Erro ao baixar arquivo");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <File className="w-4 h-4 text-muted-foreground" />;
    if (fileType.startsWith("image/")) return <FileImage className="w-4 h-4 text-primary" />;
    if (fileType.includes("pdf") || fileType.includes("document")) return <FileText className="w-4 h-4 text-blue-400" />;
    return <File className="w-4 h-4 text-muted-foreground" />;
  };

  const getFileName = (filePath: string) => {
    const parts = filePath.split("/");
    return parts[parts.length - 1];
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Estatísticas do Servidor</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Espaço Total</p>
            <p className="text-2xl font-bold text-foreground">{formatSize(stats.totalSpace)}</p>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg border-l-4 border-l-primary">
            <p className="text-sm text-muted-foreground mb-1">Espaço Usado (Total Usuários)</p>
            <p className="text-2xl font-bold text-foreground">{formatSize(stats.usedSpace)}</p>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Espaço Disponível (Livre)</p>
            <p className="text-2xl font-bold text-success">{formatSize(stats.freeSpace)}</p>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Imagens Geradas</p>
            <p className="text-2xl font-bold text-primary">{formatSize(stats.imagesSize)}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Armazenamento por Usuário</h3>
          </div>
          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email, nome ou whatsapp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 bg-secondary border-border pl-10"
              />
            </div>
            <Button variant="outline" onClick={fetchStorageData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {searchTerm && (
          <p className="text-xs text-muted-foreground mb-4">
            {filteredUsers.length} resultado(s) encontrado(s)
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>EMAIL</TableHead>
                <TableHead>WHATSAPP</TableHead>
                <TableHead>NOME</TableHead>
                <TableHead>USO</TableHead>
                <TableHead>LIMITE</TableHead>
                <TableHead>%</TableHead>
                <TableHead>AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {searchTerm ? "Nenhum usuário encontrado" : "Nenhum dado de armazenamento"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const percent = getUsagePercent(user.storage_used, user.storage_limit);
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="text-primary">{user.email}</TableCell>
                      <TableCell className="text-muted-foreground">{user.whatsapp || "N/A"}</TableCell>
                      <TableCell className="text-muted-foreground">{user.full_name || "N/A"}</TableCell>
                      <TableCell>{formatSize(user.storage_used || 0)}</TableCell>
                      <TableCell>{formatSize(user.storage_limit || 1)}</TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            percent > 90 
                              ? "bg-destructive/20 text-destructive" 
                              : percent > 70 
                                ? "bg-primary/20 text-primary" 
                                : "bg-success/20 text-success"
                          }
                        >
                          {percent.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="text-primary"
                            onClick={() => handleViewFiles(user)}
                          >
                            <FolderOpen className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleResetStorage(user.id)}
                          >
                            Resetar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => {
                              const newLimit = prompt("Novo limite (GB):", String(user.storage_limit || 1));
                              if (newLimit) handleUpdateLimit(user.id, Number(newLimit));
                            }}
                          >
                            Limite
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Files Modal */}
      <Dialog open={filesModalOpen} onOpenChange={setFilesModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary" />
              Arquivos de {selectedUser?.full_name || selectedUser?.email}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto">
            {loadingFiles ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : userFiles.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum arquivo encontrado</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{userFiles.length} arquivo(s)</span>
                  <span>
                    Total: {formatFileSize(userFiles.reduce((acc, f) => acc + f.file_size, 0))}
                  </span>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ARQUIVO</TableHead>
                      <TableHead>BUCKET</TableHead>
                      <TableHead>TAMANHO</TableHead>
                      <TableHead>DATA</TableHead>
                      <TableHead>AÇÕES</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userFiles.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getFileIcon(file.file_type)}
                            <span className="truncate max-w-[200px]" title={file.file_path}>
                              {getFileName(file.file_path)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {file.bucket_name}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatFileSize(file.file_size)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(file.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-primary hover:text-primary"
                              onClick={() => handleDownloadFile(file)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteFile(file)}
                              disabled={deletingFileId === file.id}
                            >
                              {deletingFileId === file.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
