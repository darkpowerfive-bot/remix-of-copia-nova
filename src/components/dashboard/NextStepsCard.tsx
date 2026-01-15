import { Rocket, Video, Settings, BarChart3, Check } from "lucide-react";
import { motion } from "framer-motion";

interface NextStepsCardProps {
  stats?: {
    totalVideos: number;
    scriptsGenerated: number;
    imagesGenerated: number;
  };
}

export function NextStepsCard({ stats }: NextStepsCardProps) {
  const safeStats = stats || { totalVideos: 0, scriptsGenerated: 0, imagesGenerated: 0 };
  
  const steps = [
    { number: 1, icon: Video, text: "Analise seu primeiro vídeo viral", done: safeStats.totalVideos > 0 },
    { number: 2, icon: Settings, text: "Configure suas chaves de API", done: false },
    { number: 3, icon: BarChart3, text: "Gere seu primeiro roteiro", done: safeStats.scriptsGenerated > 0 },
  ];

  return (
    <div className="group h-full bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Rocket className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground text-sm">Próximos Passos</h3>
      </div>
      <div className="space-y-2">
        {steps.map((step) => (
          <motion.div
            key={step.number}
            className={`flex items-center gap-3 p-3 border rounded-lg transition-all duration-200 cursor-pointer ${step.done ? "bg-success/5 border-success/20" : "bg-secondary/30 border-border/30 hover:bg-secondary/50 hover:border-primary/20"}`}
            whileHover={{ x: 4 }}
            transition={{ duration: 0.2 }}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${step.done ? "bg-success/20 border border-success/30 text-success" : "bg-primary/20 border border-primary/30 text-primary"}`}>
              {step.done ? <Check className="w-3 h-3" /> : step.number}
            </div>
            <step.icon className={`w-4 h-4 flex-shrink-0 ${step.done ? "text-success/70" : "text-primary/70"}`} />
            <p className={`text-xs ${step.done ? "text-success line-through" : "text-muted-foreground"}`}>{step.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}