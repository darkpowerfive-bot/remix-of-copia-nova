import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.gif";

interface MobileMenuProps {
  scrollToSection: (id: string) => void;
}

export const MobileMenu = ({ scrollToSection }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    scrollToSection(sectionId);
    setIsOpen(false);
  };

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-secondary transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-foreground" />
        ) : (
          <Menu className="w-6 h-6 text-foreground" />
        )}
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 top-20 bg-background/95 backdrop-blur-md z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu Content */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed left-0 right-0 top-20 z-50 bg-card border-b border-border shadow-2xl"
            >
              <div className="flex flex-col p-6 space-y-2">
                {/* Logo in menu */}
                <div className="flex items-center gap-3 pb-4 mb-4 border-b border-border">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-amber-400 to-primary animate-spin-slow opacity-75 blur-sm" />
                    <div className="w-10 h-10 rounded-full overflow-hidden relative z-10 border-2 border-primary bg-black">
                      <img src={logo} alt="La Casa Dark CORE" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <span className="font-bold text-lg">La Casa Dark <span className="text-primary">CORE</span></span>
                </div>

                {/* Navigation Links */}
                <button
                  onClick={() => handleNavClick("funcionalidades")}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                >
                  Funcionalidades
                </button>
                <button
                  onClick={() => handleNavClick("como-funciona")}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                >
                  Como Funciona
                </button>
                <button
                  onClick={() => handleNavClick("planos")}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                >
                  Planos
                </button>
                <Link
                  to="/blog"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                >
                  Blog
                </Link>
                <button
                  onClick={() => handleNavClick("faq")}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                >
                  FAQ
                </button>

                {/* CTA Button */}
                <div className="pt-4 mt-4 border-t border-border">
                  <Link to="/auth" onClick={() => setIsOpen(false)}>
                    <Button className="gradient-button text-primary-foreground font-semibold text-lg h-14 w-full">
                      Acessar Core
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
