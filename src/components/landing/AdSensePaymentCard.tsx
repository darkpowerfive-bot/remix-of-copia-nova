import { motion } from "framer-motion";
import { Check } from "lucide-react";

const AdSensePaymentCard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full max-w-md"
    >
      {/* Glow effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-cyan-500/10 to-blue-500/20 rounded-3xl blur-2xl opacity-60" />
      
      {/* Card */}
      <div className="relative rounded-2xl overflow-hidden bg-card border border-border/30 shadow-2xl">
        {/* Header with gradient */}
        <div className="relative p-5 bg-gradient-to-br from-blue-600/90 via-blue-700/80 to-cyan-600/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Google AdSense Logo */}
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 24 24" className="w-6 h-6">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-white">Google AdSense</p>
                <p className="text-xs text-white/70">Pagamento processado</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">Ativo</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* Amount Section */}
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">Pagamento Recebido</p>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-start justify-center"
            >
              <span className="text-lg text-muted-foreground mt-2 mr-1">$</span>
              <span className="text-5xl font-bold text-foreground tracking-tight">12,847</span>
              <span className="text-2xl font-medium text-muted-foreground mt-1">.56</span>
            </motion.div>
            <p className="text-xs text-muted-foreground">USD - 1 de Janeiro, 2026</p>
          </div>

          {/* Payment Details */}
          <div className="space-y-3 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Método de pagamento</span>
              <span className="text-sm font-medium text-foreground">Transferência bancária</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Conta</span>
              <span className="text-sm font-medium text-foreground">****4892</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">Concluído</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/50">
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">2.4M</p>
              <p className="text-xs text-muted-foreground">Impressões</p>
            </div>
            <div className="text-center border-x border-border/50">
              <p className="text-xl font-bold text-foreground">$5.35</p>
              <p className="text-xs text-muted-foreground">RPM</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-emerald-400">+47%</p>
              <p className="text-xs text-muted-foreground">vs mês anterior</p>
            </div>
          </div>

          {/* Next Payment */}
          <div className="pt-4 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground">
              Próximo pagamento estimado: <span className="font-semibold text-foreground underline decoration-primary/50">$14,230.00</span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdSensePaymentCard;