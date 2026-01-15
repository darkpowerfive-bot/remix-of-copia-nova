import { BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

interface Metric {
  label: string;
  value: string | number;
}

interface MetricsCardProps {
  title: string;
  icon?: React.ReactNode;
  metrics: Metric[];
}

export function MetricsCard({ title, icon, metrics }: MetricsCardProps) {
  return (
    <div className="group bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          {icon || <BarChart3 className="w-4 h-4 text-primary" />}
        </div>
        <h3 className="font-semibold text-foreground text-sm">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric, index) => (
          <motion.div
            key={index}
            className="bg-secondary/30 border border-border/30 rounded-lg p-4 transition-all duration-200 hover:bg-secondary/50 hover:border-primary/20"
            whileHover={{ scale: 1.02 }}
          >
            <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
            <p className="text-lg font-bold text-foreground">{metric.value}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}