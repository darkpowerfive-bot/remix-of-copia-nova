import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Crown, Zap, Rocket } from "lucide-react";

const notifications = [
  { name: "Lucas M.", city: "São Paulo", plan: "Elite", icon: Crown },
  { name: "Rafael S.", city: "Rio de Janeiro", plan: "Pro", icon: Zap },
  { name: "Ana Clara", city: "Curitiba", plan: "Elite", icon: Crown },
  { name: "Pedro H.", city: "Belo Horizonte", plan: "Pro", icon: Zap },
  { name: "Mariana L.", city: "Porto Alegre", plan: "Elite", icon: Crown },
  { name: "João V.", city: "Brasília", plan: "Starter", icon: Rocket },
  { name: "Camila R.", city: "Salvador", plan: "Pro", icon: Zap },
  { name: "Gustavo F.", city: "Fortaleza", plan: "Elite", icon: Crown },
  { name: "Juliana A.", city: "Recife", plan: "Pro", icon: Zap },
  { name: "Diego M.", city: "Manaus", plan: "Starter", icon: Rocket },
  { name: "Fernanda C.", city: "Goiânia", plan: "Elite", icon: Crown },
  { name: "Thiago B.", city: "Campinas", plan: "Pro", icon: Zap },
  { name: "Larissa O.", city: "Florianópolis", plan: "Elite", icon: Crown },
  { name: "Bruno K.", city: "Vitória", plan: "Starter", icon: Rocket },
  { name: "Carolina D.", city: "Natal", plan: "Pro", icon: Zap },
  { name: "Matheus G.", city: "João Pessoa", plan: "Elite", icon: Crown },
  { name: "Isabela N.", city: "Aracaju", plan: "Pro", icon: Zap },
  { name: "Felipe T.", city: "Maceió", plan: "Starter", icon: Rocket },
  { name: "Amanda W.", city: "Cuiabá", plan: "Elite", icon: Crown },
  { name: "Rodrigo P.", city: "Londrina", plan: "Pro", icon: Zap },
  { name: "Beatriz Q.", city: "Santos", plan: "Elite", icon: Crown },
  { name: "Leonardo J.", city: "Ribeirão Preto", plan: "Starter", icon: Rocket },
  { name: "Gabriela E.", city: "São José", plan: "Pro", icon: Zap },
  { name: "Victor H.", city: "Uberlândia", plan: "Elite", icon: Crown },
  { name: "Natália S.", city: "Sorocaba", plan: "Pro", icon: Zap },
];

const planColors: Record<string, string> = {
  Elite: "from-yellow-500/20 to-orange-500/20 border-yellow-500/50 text-yellow-400",
  Pro: "from-primary/20 to-orange-500/20 border-primary/50 text-primary",
  Starter: "from-blue-500/20 to-cyan-500/20 border-blue-500/50 text-blue-400",
};

const FakeNotifications = () => {
  const [currentNotification, setCurrentNotification] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);

  // Pause notifications when page is not visible (tab inactive)
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!isPageVisible) return;

    const showNotification = () => {
      const randomIndex = Math.floor(Math.random() * notifications.length);
      setCurrentNotification(randomIndex);
      setIsVisible(true);

      setTimeout(() => {
        setIsVisible(false);
      }, 4000);
    };

    // Initial delay
    const initialTimeout = setTimeout(() => {
      showNotification();
    }, 3000);

    // Regular interval - longer to reduce CPU usage
    const interval = setInterval(() => {
      showNotification();
    }, 12000 + Math.random() * 6000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [isPageVisible]);

  if (currentNotification === null) return null;

  const notification = notifications[currentNotification];
  const Icon = notification.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -100, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-6 left-6 z-50 hidden md:block"
        >
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r ${planColors[notification.plan]} border backdrop-blur-xl`}>
            <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {notification.name} <span className="text-muted-foreground">de</span> {notification.city}
              </p>
              <p className="text-xs text-muted-foreground">
                Acabou de adquirir o plano <span className={planColors[notification.plan].split(' ').pop()}>{notification.plan}</span>
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FakeNotifications;
