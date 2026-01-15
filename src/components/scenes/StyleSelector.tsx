import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StylePreviewCard } from "./StylePreviewCard";
import { 
  THUMBNAIL_STYLE_CATEGORIES, 
  getStylesByCategory,
  getStyleById,
  ThumbnailStyle 
} from "@/lib/thumbnailStyles";
import { Palette, ChevronDown } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";

interface StyleSelectorProps {
  selectedStyleId: string;
  onStyleSelect: (styleId: string) => void;
}

// Virtualizado grid de estilos
const VirtualizedStyleGrid = ({ 
  styles, 
  selectedStyleId, 
  onSelect,
  categoryId
}: { 
  styles: ThumbnailStyle[];
  selectedStyleId: string;
  onSelect: (style: ThumbnailStyle) => void;
  categoryId: string;
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Calcular número de colunas baseado no tamanho
  const columns = 3;
  const rowCount = Math.ceil(styles.length / columns);
  
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // altura estimada de cada row
    overscan: 2,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div 
      ref={parentRef} 
      className="h-[55vh] overflow-auto pr-2"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={categoryId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {virtualItems.map((virtualRow) => {
              const startIndex = virtualRow.index * columns;
              const rowStyles = styles.slice(startIndex, startIndex + columns);
              
              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="grid grid-cols-2 md:grid-cols-3 gap-4 px-1"
                >
                  {rowStyles.map((style) => (
                    <StylePreviewCard
                      key={style.id}
                      style={style}
                      isSelected={selectedStyleId === style.id}
                      onClick={() => onSelect(style)}
                    />
                  ))}
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export const StyleSelector = ({ selectedStyleId, onStyleSelect }: StyleSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("3d-animacao");
  
  const selectedStyle = getStyleById(selectedStyleId);
  
  const categoryStyles = useMemo(() => 
    getStylesByCategory(activeCategory), 
    [activeCategory]
  );
  
  const handleSelect = (style: ThumbnailStyle) => {
    onStyleSelect(style.id);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between h-auto py-3"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{selectedStyle?.icon || "🎨"}</span>
            <div className="text-left">
              <div className="font-medium">{selectedStyle?.name || "Selecionar Estilo"}</div>
              <div className="text-xs text-muted-foreground">{selectedStyle?.description || "Clique para escolher"}</div>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Biblioteca de Estilos Visuais
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mt-4">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {THUMBNAIL_STYLE_CATEGORIES.map((cat) => (
              <TabsTrigger 
                key={cat.id} 
                value={cat.id}
                className="text-xs px-3 py-1.5"
              >
                {cat.icon} {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {THUMBNAIL_STYLE_CATEGORIES.map((cat) => (
            <TabsContent key={cat.id} value={cat.id} className="mt-4">
              {activeCategory === cat.id && (
                <VirtualizedStyleGrid
                  styles={categoryStyles}
                  selectedStyleId={selectedStyleId}
                  onSelect={handleSelect}
                  categoryId={cat.id}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
