import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LandingSettings {
  // Video
  videoUrl: string;
  videoId: string | null;
  // Hero
  heroBadge: string;
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  heroCta: string;
  heroCtaSecondary: string;
  // Video Section
  videoSectionBadge: string;
  videoSectionTitle: string;
  videoSectionHighlight: string;
  videoSectionSubtitle: string;
  videoDuration: string;
}

const defaultSettings: LandingSettings = {
  videoUrl: "",
  videoId: null,
  heroBadge: "PLATAFORMA EXCLUSIVA",
  heroTitle: "Escale seu Canal Dark",
  heroHighlight: "para $10K+/mês",
  heroSubtitle: "Ferramentas de IA, automação completa e estratégias comprovadas para dominar o YouTube sem aparecer.",
  heroCta: "Começar Agora",
  heroCtaSecondary: "Ver Demonstração",
  videoSectionBadge: "VEJA EM AÇÃO",
  videoSectionTitle: "Conheça o Poder do",
  videoSectionHighlight: "La Casa Dark CORE",
  videoSectionSubtitle: "Assista uma demonstração completa das funcionalidades que vão revolucionar sua operação no YouTube.",
  videoDuration: "5 minutos",
};

interface LandingSettingsContextType {
  settings: LandingSettings;
  loading: boolean;
}

const LandingSettingsContext = createContext<LandingSettingsContextType>({
  settings: defaultSettings,
  loading: true,
});

export const useLandingSettings = () => useContext(LandingSettingsContext);

export const LandingSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<LandingSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("admin_settings")
          .select("value")
          .eq("key", "landing_settings")
          .maybeSingle();

        if (!error && data?.value) {
          setSettings({ ...defaultSettings, ...(data.value as Partial<LandingSettings>) });
        }
      } catch (error) {
        console.error("Error fetching landing settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return (
    <LandingSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </LandingSettingsContext.Provider>
  );
};
