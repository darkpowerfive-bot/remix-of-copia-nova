import { useState } from "react";
import { Plus, Tag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TagBadge } from "./TagBadge";

interface TagData {
  id: string;
  name: string;
  color: string;
}

interface TagManagerProps {
  itemId: string;
  itemType: "video" | "title";
  existingTags?: TagData[];
}

const TAG_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", 
  "#14b8a6", "#3b82f6", "#6366f1", "#a855f7", "#ec4899"
];

export function TagManager({ itemId, itemType, existingTags = [] }: TagManagerProps) {
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all user tags
  const { data: allTags } = useQuery({
    queryKey: ["tags", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("user_id", user.id)
        .order("name");
      if (error) throw error;
      return data as TagData[];
    },
    enabled: !!user,
  });

  // Add tag to item
  const addTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      if (itemType === "video") {
        const { error } = await supabase
          .from("video_tags")
          .insert({ video_id: itemId, tag_id: tagId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("title_tags")
          .insert({ title_id: itemId, tag_id: tagId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-tags"] });
      queryClient.invalidateQueries({ queryKey: ["title-tags"] });
      toast({ title: "Tag adicionada!" });
    },
    onError: (error: Error) => {
      if (error.message.includes("duplicate")) {
        toast({ title: "Tag já adicionada", variant: "destructive" });
      } else {
        toast({ title: "Erro ao adicionar tag", variant: "destructive" });
      }
    },
  });

  // Remove tag from item
  const removeTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      if (itemType === "video") {
        const { error } = await supabase
          .from("video_tags")
          .delete()
          .eq("video_id", itemId)
          .eq("tag_id", tagId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("title_tags")
          .delete()
          .eq("title_id", itemId)
          .eq("tag_id", tagId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-tags"] });
      queryClient.invalidateQueries({ queryKey: ["title-tags"] });
      toast({ title: "Tag removida!" });
    },
  });

  // Create new tag
  const createTagMutation = useMutation({
    mutationFn: async () => {
      if (!user || !newTagName.trim()) return;
      
      const { data, error } = await supabase
        .from("tags")
        .insert({
          user_id: user.id,
          name: newTagName.trim(),
          color: selectedColor,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setNewTagName("");
      if (data) {
        addTagMutation.mutate(data.id);
      }
      toast({ title: "Tag criada!" });
    },
    onError: (error: Error) => {
      if (error.message.includes("duplicate")) {
        toast({ title: "Tag já existe", variant: "destructive" });
      } else {
        toast({ title: "Erro ao criar tag", variant: "destructive" });
      }
    },
  });

  const existingTagIds = existingTags.map((t) => t.id);
  const availableTags = allTags?.filter((t) => !existingTagIds.includes(t.id)) || [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Gerenciar tags">
          <Tag className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <div className="space-y-3">
          <p className="text-sm font-medium">Tags</p>
          
          {/* Existing tags on item */}
          {existingTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {existingTags.map((tag) => (
                <TagBadge
                  key={tag.id}
                  name={tag.name}
                  color={tag.color}
                  size="sm"
                  onRemove={() => removeTagMutation.mutate(tag.id)}
                />
              ))}
            </div>
          )}

          {/* Available tags */}
          {availableTags.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Adicionar tag existente</p>
              <div className="flex flex-wrap gap-1">
                {availableTags.map((tag) => (
                  <TagBadge
                    key={tag.id}
                    name={tag.name}
                    color={tag.color}
                    size="sm"
                    onClick={() => addTagMutation.mutate(tag.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Create new tag */}
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">Criar nova tag</p>
            <div className="flex gap-2">
              <Input
                placeholder="Nome da tag"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="h-8 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTagName.trim()) {
                    createTagMutation.mutate();
                  }
                }}
              />
              <Button
                size="sm"
                className="h-8 px-2"
                onClick={() => createTagMutation.mutate()}
                disabled={!newTagName.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-1 flex-wrap">
              {TAG_COLORS.map((color) => (
                <button
                  key={color}
                  className={`w-5 h-5 rounded-full transition-all ${
                    selectedColor === color ? "ring-2 ring-offset-2 ring-offset-background ring-primary" : ""
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
