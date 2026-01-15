import { BookOpen, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { getDailyQuote } from "@/lib/dailyQuotes";
import { useState, useEffect } from "react";

export function DailyQuoteCard() {
  const [isRead, setIsRead] = useState(false);
  const quote = getDailyQuote();
  
  useEffect(() => {
    const readKey = `quote_read_${quote.dayOfYear}_${new Date().getFullYear()}`;
    setIsRead(localStorage.getItem(readKey) === "true");
  }, [quote.dayOfYear]);

  const handleMarkAsRead = () => {
    const readKey = `quote_read_${quote.dayOfYear}_${new Date().getFullYear()}`;
    localStorage.setItem(readKey, "true");
    setIsRead(true);
  };

  return (
    <div className="group bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground text-sm">Palavra do Dia</h3>
        </div>
        <span className="text-[10px] text-muted-foreground">Dia {quote.dayOfYear}/365</span>
      </div>
      <motion.div 
        className={`relative border rounded-lg p-4 overflow-hidden transition-all duration-300 ${isRead ? "bg-success/5 border-success/20" : "bg-gradient-to-br from-primary/5 to-transparent border-primary/10"}`}
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
      >
        <div className="absolute top-2 right-3 text-4xl text-primary/10 font-serif">"</div>
        
        <p className="text-foreground/90 italic text-sm leading-relaxed mb-3 relative z-10">
          "{quote.text}"
        </p>
        <div className="flex items-center justify-between relative z-10">
          <span className="text-primary font-medium text-xs">— {quote.ref}</span>
          <Button 
            variant={isRead ? "ghost" : "outline"}
            size="sm"
            onClick={handleMarkAsRead}
            disabled={isRead}
            className={`h-7 text-xs ${isRead ? "text-success" : "border-primary/30 hover:bg-primary/10 hover:text-primary"}`}
          >
            <Check className="w-3 h-3 mr-1" />
            {isRead ? "Lido" : "Marcar lido"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}