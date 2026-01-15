import { motion } from "framer-motion";
import { TrendingUp, Users, Play, Zap, Clock } from "lucide-react";

const stats = [
  { 
    icon: Zap, 
    label: "Automação",
    description: "Inteligente",
    color: "from-emerald-500 to-green-500"
  },
  { 
    icon: Clock, 
    label: "Suporte",
    description: "24/7",
    color: "from-violet-500 to-purple-500"
  },
  { 
    icon: TrendingUp, 
    label: "Performance",
    description: "Otimizada",
    color: "from-primary to-orange-500"
  },
  { 
    icon: Users, 
    label: "Comunidade",
    description: "Exclusiva",
    color: "from-blue-500 to-cyan-500"
  },
  { 
    icon: Play, 
    label: "Updates",
    description: "Constantes",
    color: "from-purple-500 to-pink-500"
  },
];

const StatsSection = () => {
  return (
    <section className="py-12 sm:py-16 relative z-10">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative group"
            >
              {/* Glow effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-opacity duration-500`} />
              
              {/* Card */}
              <div className="relative p-4 sm:p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center mb-3 sm:mb-4 shadow-lg`}>
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-1">
                  {stat.description}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
