import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { TagBadge } from "./TagBadge";

interface TagData {
  id: string;
  name: string;
  color: string;
}

interface TagFilterProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

export function TagFilter({ selectedTagIds, onChange }: TagFilterProps) {
  const { user } = useAuth();

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

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const selectedTags = allTags?.filter((t) => selectedTagIds.includes(t.id)) || [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-12 gap-2">
          <Tag className="w-4 h-4" />
          {selectedTags.length > 0 ? (
            <span className="flex gap-1 items-center">
              {selectedTags.slice(0, 2).map((tag) => (
                <span
                  key={tag.id}
                  className="px-1.5 py-0.5 rounded text-xs"
                  style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
              {selectedTags.length > 2 && (
                <span className="text-xs text-muted-foreground">
                  +{selectedTags.length - 2}
                </span>
              )}
            </span>
          ) : (
            "Filtrar por tags"
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Filtrar por tags</p>
            {selectedTagIds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => onChange([])}
              >
                Limpar
              </Button>
            )}
          </div>
          
          {!allTags?.length ? (
            <p className="text-sm text-muted-foreground">Nenhuma tag criada</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-2 py-1 rounded-full text-xs font-medium transition-all border ${
                    selectedTagIds.includes(tag.id)
                      ? "ring-2 ring-offset-1 ring-offset-background ring-primary"
                      : "opacity-70 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: `${tag.color}20`,
                    borderColor: tag.color,
                    color: tag.color,
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
