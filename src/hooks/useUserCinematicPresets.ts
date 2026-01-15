import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type { CinematicSettings } from "@/lib/xmlGenerator";

export interface UserCinematicPreset {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  settings: CinematicSettings;
  created_at: string;
  updated_at: string;
}

export function useUserCinematicPresets() {
  const { user } = useAuth();
  const [userPresets, setUserPresets] = useState<UserCinematicPreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Buscar presets do usuário
  const fetchPresets = useCallback(async () => {
    if (!user) {
      setUserPresets([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_cinematic_presets" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      const presets = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        name: item.name,
        icon: item.icon,
        settings: item.settings as CinematicSettings,
        created_at: item.created_at,
        updated_at: item.updated_at,
      })) as UserCinematicPreset[];
      
      setUserPresets(presets);
    } catch (error) {
      console.error("Error fetching presets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  // Salvar novo preset
  const savePreset = useCallback(async (
    name: string,
    icon: string,
    settings: CinematicSettings
  ): Promise<boolean> => {
    if (!user) {
      toast.error("Você precisa estar logado para salvar presets");
      return false;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("user_cinematic_presets" as any)
        .insert({
          user_id: user.id,
          name,
          icon,
          settings,
        } as any);

      if (error) throw error;

      await fetchPresets();
      toast.success(`Preset "${name}" salvo com sucesso!`);
      return true;
    } catch (error) {
      console.error("Error saving preset:", error);
      toast.error("Erro ao salvar preset");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user, fetchPresets]);

  // Atualizar preset existente
  const updatePreset = useCallback(async (
    id: string,
    updates: { name?: string; icon?: string; settings?: CinematicSettings }
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("user_cinematic_presets" as any)
        .update(updates as any)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchPresets();
      toast.success("Preset atualizado!");
      return true;
    } catch (error) {
      console.error("Error updating preset:", error);
      toast.error("Erro ao atualizar preset");
      return false;
    }
  }, [user, fetchPresets]);

  // Deletar preset
  const deletePreset = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("user_cinematic_presets" as any)
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchPresets();
      toast.success("Preset deletado!");
      return true;
    } catch (error) {
      console.error("Error deleting preset:", error);
      toast.error("Erro ao deletar preset");
      return false;
    }
  }, [user, fetchPresets]);

  // Exportar presets como JSON
  const exportPresets = useCallback(() => {
    if (userPresets.length === 0) {
      toast.error("Nenhum preset para exportar");
      return;
    }

    const exportData = userPresets.map(({ name, icon, settings }) => ({
      name,
      icon,
      settings,
    }));

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cinematic-presets-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`${userPresets.length} preset(s) exportado(s)!`);
  }, [userPresets]);

  // Importar presets de JSON
  const importPresets = useCallback(async (file: File): Promise<number> => {
    if (!user) {
      toast.error("Você precisa estar logado para importar presets");
      return 0;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        toast.error("Formato de arquivo inválido");
        return 0;
      }

      let imported = 0;
      for (const preset of data) {
        if (preset.name && preset.icon && preset.settings) {
          const { error } = await supabase
            .from("user_cinematic_presets" as any)
            .insert({
              user_id: user.id,
              name: preset.name,
              icon: preset.icon,
              settings: preset.settings,
            } as any);

          if (!error) imported++;
        }
      }

      await fetchPresets();
      toast.success(`${imported} preset(s) importado(s) com sucesso!`);
      return imported;
    } catch (error) {
      console.error("Error importing presets:", error);
      toast.error("Erro ao importar presets. Verifique o formato do arquivo.");
      return 0;
    }
  }, [user, fetchPresets]);

  return {
    userPresets,
    isLoading,
    isSaving,
    savePreset,
    updatePreset,
    deletePreset,
    exportPresets,
    importPresets,
    refetch: fetchPresets,
  };
}
