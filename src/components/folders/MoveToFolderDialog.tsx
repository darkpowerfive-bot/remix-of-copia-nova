import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FolderSelect } from "./FolderSelect";
import { Loader2, FolderInput } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MoveToFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemType: "analyzed_videos" | "generated_titles" | "generated_scripts";
  currentFolderId: string | null;
  itemTitle?: string;
}

export function MoveToFolderDialog({
  open,
  onOpenChange,
  itemId,
  itemType,
  currentFolderId,
  itemTitle,
}: MoveToFolderDialogProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const moveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from(itemType)
        .update({ folder_id: selectedFolderId })
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analyzed-videos"] });
      queryClient.invalidateQueries({ queryKey: ["generated-titles"] });
      queryClient.invalidateQueries({ queryKey: ["generated-scripts"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      onOpenChange(false);
      toast({
        title: "Item movido!",
        description: selectedFolderId
          ? "Item movido para a pasta selecionada"
          : "Item removido da pasta",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível mover o item",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderInput className="w-5 h-5" />
            Mover para Pasta
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {itemTitle && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              "{itemTitle}"
            </p>
          )}
          <FolderSelect
            value={selectedFolderId}
            onChange={setSelectedFolderId}
            placeholder="Selecione uma pasta"
            showCreateButton={true}
          />
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => moveMutation.mutate()}
              disabled={moveMutation.isPending}
              className="flex-1 bg-primary text-primary-foreground"
            >
              {moveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Mover
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
