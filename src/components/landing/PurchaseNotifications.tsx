import { useState, useEffect } from "react";
import { Rocket, Zap, Star } from "lucide-react";

const purchaseData = [
  { name: "Natália S.", city: "Sorocaba", plan: "Pro" },
  { name: "Mariana L.", city: "Porto Alegre", plan: "Master Pro" },
  { name: "Carlos E.", city: "São Paulo", plan: "Turbo Maker" },
  { name: "Amanda S.", city: "Rio de Janeiro", plan: "Start Creator" },
  { name: "Pedro H.", city: "Brasília", plan: "Master Pro" },
  { name: "Juliana M.", city: "Curitiba", plan: "Turbo Maker" },
  { name: "Rafael C.", city: "Belo Horizonte", plan: "Pro" },
  { name: "Fernanda R.", city: "Salvador", plan: "Start Creator" },
  { name: "Lucas P.", city: "Fortaleza", plan: "Turbo Maker" },
  { name: "Beatriz A.", city: "Recife", plan: "Master Pro" },
  { name: "Thiago M.", city: "Florianópolis", plan: "Pro" },
  { name: "Camila G.", city: "Manaus", plan: "Start Creator" },
  { name: "Diego S.", city: "Goiânia", plan: "Master Pro" },
  { name: "Isabela F.", city: "Vitória", plan: "Turbo Maker" },
  { name: "Gabriel R.", city: "Campinas", plan: "Pro" },
  { name: "Vinícius O.", city: "João Pessoa", plan: "Turbo Maker" },
  { name: "Larissa T.", city: "Campo Grande", plan: "Start Creator" },
  { name: "Rodrigo N.", city: "Cuiabá", plan: "Master Pro" },
  { name: "Patrícia C.", city: "Teresina", plan: "Pro" },
  { name: "André M.", city: "Maceió", plan: "Start Creator" },
  { name: "Jéssica B.", city: "Aracaju", plan: "Master Pro" },
  { name: "Marcelo D.", city: "São Luís", plan: "Turbo Maker" },
  { name: "Vanessa P.", city: "Belém", plan: "Pro" },
  { name: "Eduardo K.", city: "Londrina", plan: "Master Pro" },
  { name: "Renata S.", city: "Santos", plan: "Turbo Maker" },
];

export const PurchaseNotifications = () => {
  const [currentNotification, setCurrentNotification] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const showNotification = () => {
      setIsExiting(false);
      setIsVisible(true);
      
      // Hide after 4 seconds
      setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          setIsVisible(false);
          setCurrentNotification((prev) => (prev + 1) % purchaseData.length);
        }, 500);
      }, 4000);
    };

    // Initial show after 3 seconds
    const initialTimeout = setTimeout(showNotification, 3000);

    // Then show every 8-15 seconds (random interval)
    const interval = setInterval(() => {
      const randomDelay = Math.random() * 7000 + 8000; // 8-15 seconds
      setTimeout(showNotification, randomDelay);
    }, 15000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  const notification = purchaseData[currentNotification];

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-8 left-8 z-50 hidden md:block">
      <div 
        className={`flex items-center gap-4 px-5 py-4 rounded-2xl bg-card/95 backdrop-blur-sm border border-border/50 shadow-2xl shadow-black/40 transition-all duration-500 ${
          isExiting ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}
      >
        {/* Left icon - Lightning in circle */}
        <div className="w-12 h-12 rounded-full bg-secondary/80 border border-border/50 flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-primary fill-primary" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top line with rocket */}
          <div className="flex items-center gap-1.5 mb-0.5">
            <Rocket className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-sm text-emerald-400 font-medium">Acabou de assinar!</span>
          </div>
          
          {/* Name */}
          <p className="font-bold text-foreground">{notification.name}</p>
          
          {/* City and Plan */}
          <p className="text-sm text-muted-foreground">
            {notification.city} • Plano <span className="text-primary">{notification.plan}</span>
          </p>
        </div>
        
        {/* Right star */}
        <Star className="w-5 h-5 text-primary fill-primary flex-shrink-0" />
      </div>
    </div>
  );
};
