import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subLabel?: string;
  status?: "default" | "active" | "warning";
  action?: React.ReactNode;
  progress?: {
    value: number;
    max: number;
  };
}

export function StatsCard({
  icon: Icon,
  label,
  value,
  subLabel,
  status = "default",
  action,
  progress,
}: StatsCardProps) {
  return (
    <motion.div 
      className="group relative bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 flex flex-col gap-3 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 overflow-hidden"
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      {/* Subtle hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.08) 0%, transparent 60%)',
        }}
      />
      
      <div className="flex items-start justify-between relative z-10">
        <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/15 transition-colors duration-300">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        {status === "active" && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/20 text-success border border-success/30">
            ATIVO
          </span>
        )}
        {subLabel && status === "default" && (
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{subLabel}</span>
        )}
      </div>
      <div className="relative z-10">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">{value}</p>
      </div>
      {progress && (
        <div className="space-y-1.5 relative z-10">
          <div className="h-1 bg-secondary/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((progress.value / progress.max) * 100, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            {((progress.value / progress.max) * 100).toFixed(0)}% usado de {progress.max} GB
          </p>
        </div>
      )}
      {action && <div className="relative z-10 mt-auto">{action}</div>}
    </motion.div>
  );
}