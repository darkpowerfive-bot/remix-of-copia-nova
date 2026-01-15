import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TagBadgeProps {
  name: string;
  color: string;
  onRemove?: () => void;
  onClick?: () => void;
  size?: "sm" | "md";
}

export function TagBadge({ name, color, onRemove, onClick, size = "md" }: TagBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`cursor-pointer border-transparent transition-all ${
        size === "sm" ? "text-xs px-1.5 py-0" : "px-2 py-0.5"
      }`}
      style={{ 
        backgroundColor: `${color}20`, 
        borderColor: color,
        color: color 
      }}
      onClick={onClick}
    >
      {name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:opacity-70"
        >
          <X className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />
        </button>
      )}
    </Badge>
  );
}
