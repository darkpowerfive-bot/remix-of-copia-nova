import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Database, FileJson, FileSpreadsheet, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TableInfo {
  name: string;
  category: "user" | "system";
  displayName: string;
}

const ALL_TABLES: TableInfo[] = [
  // User data tables
  { name: "profiles", category: "user", displayName: "Perfis de Usuários" },
  { name: "user_roles", category: "user", displayName: "Roles de Usuários" },
  { name: "user_credits", category: "user", displayName: "Créditos de Usuários" },
  { name: "user_preferences", category: "user", displayName: "Preferências de Usuários" },
  { name: "user_api_settings", category: "user", displayName: "Configurações de API" },
  { name: "user_goals", category: "user", displayName: "Metas de Usuários" },
  { name: "user_individual_permissions", category: "user", displayName: "Permissões Individuais" },
  { name: "user_file_uploads", category: "user", displayName: "Uploads de Arquivos" },
  { name: "user_kanban_settings", category: "user", displayName: "Configurações Kanban" },
  
  // Content tables
  { name: "analyzed_videos", category: "user", displayName: "Vídeos Analisados" },
  { name: "generated_scripts", category: "user", displayName: "Roteiros Gerados" },
  { name: "generated_titles", category: "user", displayName: "Títulos Gerados" },
  { name: "generated_images", category: "user", displayName: "Imagens Geradas" },
  { name: "generated_audios", category: "user", displayName: "Áudios Gerados" },
  { name: "scene_prompts", category: "user", displayName: "Prompts de Cenas" },
  { name: "saved_prompts", category: "user", displayName: "Prompts Salvos" },
  { name: "reference_thumbnails", category: "user", displayName: "Thumbnails de Referência" },
  { name: "batch_generation_history", category: "user", displayName: "Histórico de Geração em Lote" },
  
  // Channel & monitoring
  { name: "monitored_channels", category: "user", displayName: "Canais Monitorados" },
  { name: "channel_analyses", category: "user", displayName: "Análises de Canais" },
  { name: "channel_goals", category: "user", displayName: "Metas de Canais" },
  { name: "pinned_videos", category: "user", displayName: "Vídeos Fixados" },
  { name: "video_analyses", category: "user", displayName: "Análises de Vídeos" },
  { name: "video_notifications", category: "user", displayName: "Notificações de Vídeos" },
  { name: "saved_analytics_channels", category: "user", displayName: "Canais de Analytics Salvos" },
  
  // Organization
  { name: "folders", category: "user", displayName: "Pastas" },
  { name: "tags", category: "user", displayName: "Tags" },
  { name: "title_tags", category: "user", displayName: "Tags de Títulos" },
  { name: "video_tags", category: "user", displayName: "Tags de Vídeos" },
  
  // Scheduling & tasks
  { name: "publication_schedule", category: "user", displayName: "Agenda de Publicação" },
  { name: "production_board_tasks", category: "user", displayName: "Tarefas do Quadro" },
  { name: "task_completion_history", category: "user", displayName: "Histórico de Tarefas" },
  { name: "schedule_reminders_sent", category: "user", displayName: "Lembretes Enviados" },
  { name: "pomodoro_state", category: "user", displayName: "Estado Pomodoro" },
  
  // Agents
  { name: "script_agents", category: "user", displayName: "Agentes de Roteiro" },
  { name: "agent_files", category: "user", displayName: "Arquivos de Agentes" },
  
  // Credits & transactions
  { name: "credit_transactions", category: "user", displayName: "Transações de Créditos" },
  { name: "credit_usage", category: "user", displayName: "Uso de Créditos" },
  { name: "imagefx_monthly_usage", category: "user", displayName: "Uso Mensal ImageFX" },
  
  // Subscriptions
  { name: "push_subscriptions", category: "user", displayName: "Subscrições Push" },
  
  // SRT
  { name: "srt_history", category: "user", displayName: "Histórico SRT" },
  
  // System tables
  { name: "plan_permissions", category: "system", displayName: "Permissões de Planos" },
  { name: "credit_packages", category: "system", displayName: "Pacotes de Créditos" },
  { name: "admin_settings", category: "system", displayName: "Configurações Admin" },
  { name: "api_providers", category: "system", displayName: "Provedores de API" },
  { name: "email_templates", category: "system", displayName: "Templates de Email" },
  { name: "niche_best_times", category: "system", displayName: "Melhores Horários por Nicho" },
  { name: "migration_invites", category: "system", displayName: "Convites de Migração" },
  
  // Blog
  { name: "blog_articles", category: "system", displayName: "Artigos do Blog" },
  { name: "blog_page_views", category: "system", displayName: "Visualizações do Blog" },
  { name: "product_clicks", category: "system", displayName: "Cliques em Produtos" },
  { name: "newsletter_subscribers", category: "system", displayName: "Assinantes Newsletter" },
  
  // Video generation
  { name: "video_generation_jobs", category: "user", displayName: "Jobs de Geração de Vídeo" },
];

type ExportFormat = "json" | "csv";

export const AdminExportDataTab = () => {
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("json");
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTable, setCurrentTable] = useState("");

  const toggleTable = (tableName: string) => {
    setSelectedTables(prev => 
      prev.includes(tableName) 
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    );
  };

  const selectAll = () => {
    setSelectedTables(ALL_TABLES.map(t => t.name));
  };

  const selectUserData = () => {
    setSelectedTables(ALL_TABLES.filter(t => t.category === "user").map(t => t.name));
  };

  const selectSystemData = () => {
    setSelectedTables(ALL_TABLES.filter(t => t.category === "system").map(t => t.name));
  };

  const clearSelection = () => {
    setSelectedTables([]);
  };

  const convertToCSV = (data: any[]): string => {
    if (!data || data.length === 0) return "";
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return "";
          if (typeof value === "object") return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          if (typeof value === "string" && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        }).join(",")
      )
    ];
    
    return csvRows.join("\n");
  };

  const exportData = async () => {
    if (selectedTables.length === 0) {
      toast.error("Selecione pelo menos uma tabela");
      return;
    }

    setExporting(true);
    setProgress(0);

    try {
      const exportData: Record<string, any[]> = {};
      const totalTables = selectedTables.length;

      for (let i = 0; i < selectedTables.length; i++) {
        const tableName = selectedTables[i];
        setCurrentTable(tableName);
        setProgress(Math.round(((i + 1) / totalTables) * 100));

        const { data, error } = await supabase
          .from(tableName as any)
          .select("*")
          .limit(10000);

        if (error) {
          console.error(`Erro ao exportar ${tableName}:`, error);
          continue;
        }

        exportData[tableName] = data || [];
      }

      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
      
      if (exportFormat === "json") {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `export_${timestamp}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Export as CSV (one file per table in a zip, or combined)
        // For simplicity, we'll create separate downloads or a combined file
        let combinedCSV = "";
        
        for (const [tableName, data] of Object.entries(exportData)) {
          if (data.length > 0) {
            combinedCSV += `\n\n=== ${tableName.toUpperCase()} ===\n`;
            combinedCSV += convertToCSV(data);
          }
        }

        const blob = new Blob([combinedCSV], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `export_${timestamp}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast.success(`${selectedTables.length} tabela(s) exportada(s) com sucesso!`);
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar dados");
    } finally {
      setExporting(false);
      setProgress(0);
      setCurrentTable("");
    }
  };

  const userTables = ALL_TABLES.filter(t => t.category === "user");
  const systemTables = ALL_TABLES.filter(t => t.category === "system");

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-2">
          <Database className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Exportar Dados do Sistema</h2>
        </div>
        <p className="text-muted-foreground mb-6">
          Exporte todas as tabelas do banco de dados para backup ou análise
        </p>

        {/* Format selector */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-sm font-medium text-foreground">Formato:</span>
          <div className="flex gap-2">
            <Button
              variant={exportFormat === "json" ? "default" : "outline"}
              size="sm"
              onClick={() => setExportFormat("json")}
              className="gap-2"
            >
              <FileJson className="h-4 w-4" />
              JSON
            </Button>
            <Button
              variant={exportFormat === "csv" ? "default" : "outline"}
              size="sm"
              onClick={() => setExportFormat("csv")}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              CSV
            </Button>
          </div>
        </div>

        {/* Quick selection buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Selecionar Todas
          </Button>
          <Button variant="outline" size="sm" onClick={selectUserData}>
            Selecionar Dados de Usuários
          </Button>
          <Button variant="outline" size="sm" onClick={selectSystemData}>
            Selecionar Dados do Sistema
          </Button>
          <Button variant="outline" size="sm" onClick={clearSelection}>
            Limpar Seleção
          </Button>
        </div>

        {/* Selected count */}
        <div className="mb-4">
          <Badge variant="secondary" className="text-sm">
            {selectedTables.length} tabela(s) selecionada(s)
          </Badge>
        </div>

        {/* Progress bar (when exporting) */}
        {exporting && (
          <div className="mb-6 space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              Exportando: {currentTable} ({progress}%)
            </p>
          </div>
        )}

        {/* Export button */}
        <div className="flex justify-end mb-6">
          <Button
            onClick={exportData}
            disabled={exporting || selectedTables.length === 0}
            className="gap-2"
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Exportar
              </>
            )}
          </Button>
        </div>

        {/* Tables grid */}
        <div className="space-y-6">
          {/* User data tables */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Badge variant="outline">Dados de Usuários</Badge>
              <span className="text-sm text-muted-foreground">({userTables.length} tabelas)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {userTables.map((table) => (
                <div
                  key={table.name}
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleTable(table.name)}
                >
                  <Checkbox
                    checked={selectedTables.includes(table.name)}
                    onCheckedChange={() => toggleTable(table.name)}
                  />
                  <span className="text-sm text-foreground">{table.displayName}</span>
                </div>
              ))}
            </div>
          </div>

          {/* System tables */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Badge variant="outline">Dados do Sistema</Badge>
              <span className="text-sm text-muted-foreground">({systemTables.length} tabelas)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {systemTables.map((table) => (
                <div
                  key={table.name}
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleTable(table.name)}
                >
                  <Checkbox
                    checked={selectedTables.includes(table.name)}
                    onCheckedChange={() => toggleTable(table.name)}
                  />
                  <span className="text-sm text-foreground">{table.displayName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
