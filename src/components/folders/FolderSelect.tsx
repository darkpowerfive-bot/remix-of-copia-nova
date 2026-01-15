import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FolderOpen, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FolderSelectProps {
  value: string | null;
  onChange: (folderId: string | null) => void;
  placeholder?: string;
  showCreateButton?: boolean;
  className?: string;
}

export function FolderSelect({
  value,
  onChange,
  placeholder = "Selecione uma pasta",
  showCreateButton = true,
  className,
}: FolderSelectProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newFolderName, setNewFolderName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: folders, isLoading } = useQuery({
    queryKey: ["folders-with-counts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get folders
      const { data: folderData, error: folderError } = await supabase
        .from("folders")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });
      if (folderError) throw folderError;
      
      // Count items for each folder (analyzed_videos + generated_titles)
      const foldersWithCounts = await Promise.all(
        (folderData || []).map(async (folder) => {
          // Count analyzed_videos in this folder
          const { count: videoCount } = await supabase
            .from("analyzed_videos")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("folder_id", folder.id);
          
          // Count generated_titles in this folder
          const { count: titleCount } = await supabase
            .from("generated_titles")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("folder_id", folder.id);
          
          return {
            ...folder,
            items_count: (videoCount || 0) + (titleCount || 0),
          };
        })
      );
      
      return foldersWithCounts;
    },
    enabled: !!user,
  });

  const createFolderMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("folders")
        .insert({
          user_id: user.id,
          name: newFolderName,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["folders-with-counts"] });
      setNewFolderName("");
      setDialogOpen(false);
      onChange(data.id);
      toast({
        title: "Pasta criada!",
        description: `Pasta "${data.name}" criada com sucesso`,
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar a pasta",
        variant: "destructive",
      });
    },
  });

  return (
    <div className={`flex gap-2 ${className}`}>
      <Select
        value={value || "none"}
        onValueChange={(val) => onChange(val === "none" ? null : val)}
      >
        <SelectTrigger className="bg-secondary border-border flex-1">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-muted-foreground" />
            <SelectValue placeholder={placeholder} />
          </div>
        </SelectTrigger>
        <SelectContent className="z-[200] bg-popover" position="popper" sideOffset={4}>
          <SelectItem value="none">Sem pasta</SelectItem>
          {isLoading ? (
            <div className="flex justify-center py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : (
            folders?.map((folder) => (
              <SelectItem key={folder.id} value={folder.id}>
                {folder.name} ({folder.items_count || 0} itens)
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {showCreateButton && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="border-border">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Pasta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Nome da pasta"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="bg-secondary border-border"
              />
              <Button
                onClick={() => createFolderMutation.mutate()}
                disabled={!newFolderName.trim() || createFolderMutation.isPending}
                className="w-full bg-primary text-primary-foreground"
              >
                {createFolderMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Criar Pasta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
