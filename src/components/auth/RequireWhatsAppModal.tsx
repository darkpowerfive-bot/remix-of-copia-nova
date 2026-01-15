import { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface RequireWhatsAppModalProps {
  open: boolean;
  userId: string;
  onComplete: () => void;
}

export function RequireWhatsAppModal({ open, userId, onComplete }: RequireWhatsAppModalProps) {
  const [whatsapp, setWhatsapp] = useState("");
  const [saving, setSaving] = useState(false);

  const formatWhatsApp = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, "");
    
    // Format as Brazilian phone: +55 (11) 99999-9999
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `+${digits.slice(0, 2)} (${digits.slice(2)}`;
    if (digits.length <= 9) return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4)}`;
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9, 13)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value);
    setWhatsapp(formatted);
  };

  const handleSave = async () => {
    const digits = whatsapp.replace(/\D/g, "");
    
    if (digits.length < 12) {
      toast.error("Digite um número de WhatsApp válido com DDD");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ whatsapp: whatsapp })
        .eq("id", userId);

      if (error) throw error;

      // Envia WhatsApp de boas-vindas / pendente após o número ser cadastrado (não bloqueia o fluxo)
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name, status")
          .eq("id", userId)
          .maybeSingle();

        const status = profile?.status;
        const messageType = status === "active" || status === "approved" ? "approved" : "pending";

        await supabase.functions.invoke("send-whatsapp-welcome", {
          body: {
            whatsapp,
            fullName: profile?.full_name ?? undefined,
            email: profile?.email ?? undefined,
            messageType,
          },
        });
      } catch (whatsError) {
        console.error("Error sending WhatsApp welcome:", whatsError);
      }

      toast.success("WhatsApp cadastrado com sucesso!");
      onComplete();
    } catch (error: any) {
      console.error("Error saving WhatsApp:", error);
      toast.error("Erro ao salvar WhatsApp");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  // Render via portal with higher z-index than tutorial (z-[9999])
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[10001]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 bg-card border border-primary/50 rounded-xl shadow-xl"
          >
            {/* Header */}
            <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
              <h2 className="flex items-center gap-2 text-xl font-semibold leading-none tracking-tight">
                <Phone className="w-5 h-5 text-primary" />
                Cadastre seu WhatsApp
              </h2>
              <p className="text-sm text-muted-foreground">
                Para continuar usando a plataforma, precisamos do seu número de WhatsApp para suporte e notificações importantes.
              </p>
            </div>

            {/* Content */}
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp">Número do WhatsApp</Label>
                <Input
                  id="whatsapp"
                  placeholder="+55 (11) 99999-9999"
                  value={whatsapp}
                  onChange={handleChange}
                  className="text-lg"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Inclua o código do país e DDD
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <Button 
                onClick={handleSave} 
                disabled={saving || whatsapp.replace(/\D/g, "").length < 12}
                className="w-full"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Phone className="w-4 h-4 mr-2" />
                )}
                Salvar e Continuar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
