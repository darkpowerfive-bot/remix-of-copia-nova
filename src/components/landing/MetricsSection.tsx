import { motion } from "framer-motion";
import { Video, Eye, TrendingUp, MessageSquare, BarChart, Clock } from "lucide-react";

const metrics = [
  { icon: Video, label: "Total de Vídeos", value: "127", status: "ATIVO" },
  { icon: Eye, label: "Total de Views", value: "11.7K", status: "ATIVO" },
  { icon: Clock, label: "Horas Economizadas", value: "2,340h", status: "ATIVO" },
  { icon: TrendingUp, label: "CTR Médio", value: "9.9%", status: null },
  { icon: MessageSquare, label: "Comentários", value: "8,432", status: null },
  { icon: BarChart, label: "Taxa de Retenção", value: "67%", status: null },
];

const MetricsSection = () => {
  return (
    <section className="py-12 sm:py-16 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-[300px] sm:h-[400px] bg-gradient-to-b from-primary/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs sm:text-sm font-medium mb-4">
            📊 DASHBOARD
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            Métricas em
            <span className="text-gradient"> Tempo Real</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Acompanhe todas as métricas de performance dos seus canais em um só lugar.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="relative p-3 sm:p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/40 transition-all group"
            >
              {/* Glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity" />
              
              {metric.status && (
                <span className="absolute -top-2 right-2 px-2 py-0.5 rounded text-[8px] sm:text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                  {metric.status}
                </span>
              )}
              <div className="relative z-10">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 sm:mb-3">
                  <metric.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <p className="text-lg sm:text-xl md:text-2xl font-bold">{metric.value}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{metric.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MetricsSection;