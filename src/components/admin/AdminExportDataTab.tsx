import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Database, FileJson, FileSpreadsheet, Download, Loader2, Upload, AlertTriangle, FileArchive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import JSZip from "jszip";

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
type ImportMode = "replace" | "merge";

export const AdminExportDataTab = () => {
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("json");
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTable, setCurrentTable] = useState("");

  // Import states
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importCurrentTable, setImportCurrentTable] = useState("");
  const [importMode, setImportMode] = useState<ImportMode>("merge");
  const [importData, setImportData] = useState<Record<string, any[]> | null>(null);
  const [importFileName, setImportFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Import functions
  const processJsonContent = (content: string, fileName: string) => {
    try {
      const parsed = JSON.parse(content);
      const extracted = extractTableData(parsed, fileName);
      
      const validTables = Object.keys(extracted);
      if (validTables.length === 0) {
        toast.error("Nenhuma tabela válida encontrada no arquivo. Verifique se a estrutura é compatível.");
        console.log("Estrutura do arquivo:", typeof parsed, Array.isArray(parsed) ? "array" : "object");
        return;
      }

      setImportData(extracted);
      setImportFileName(fileName);
      setImportModalOpen(true);
    } catch (error) {
      console.error("Erro ao processar JSON:", error);
      toast.error("Erro ao ler arquivo. Verifique se é um JSON válido.");
    }
  };

  // Try to extract table data from various JSON structures
  const extractTableData = (parsed: any, fileName: string): Record<string, any[]> => {
    const result: Record<string, any[]> = {};
    
    // Case 1: Direct table structure { table_name: [...], table_name2: [...] }
    if (typeof parsed === "object" && !Array.isArray(parsed)) {
      for (const [key, value] of Object.entries(parsed)) {
        if (Array.isArray(value) && ALL_TABLES.some(t => t.name === key)) {
          result[key] = value;
        }
      }
    }
    
    // Case 2: Array of records - try to guess table from filename
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Try to extract table name from filename (e.g., "profiles.json" -> "profiles")
      const baseName = fileName.replace(/\.json$/i, "").split("/").pop() || "";
      const cleanName = baseName.replace(/[^a-z_]/gi, "_").toLowerCase();
      
      const matchingTable = ALL_TABLES.find(t => 
        t.name === cleanName || 
        cleanName.includes(t.name) ||
        t.name.includes(cleanName)
      );
      
      if (matchingTable) {
        result[matchingTable.name] = parsed;
      }
    }
    
    return result;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();

    // Handle ZIP files
    if (fileName.endsWith(".zip")) {
      try {
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(file);
        
        // Find JSON files in the ZIP (including in subdirectories)
        const jsonFiles = Object.keys(zipContent.files).filter(name => 
          name.toLowerCase().endsWith(".json") && !zipContent.files[name].dir
        );

        if (jsonFiles.length === 0) {
          toast.error("Nenhum arquivo JSON encontrado no ZIP.");
          return;
        }

        // Process all JSON files and merge them
        const allData: Record<string, any[]> = {};
        const processedFiles: string[] = [];
        const skippedFiles: string[] = [];
        
        for (const jsonFile of jsonFiles) {
          try {
            const content = await zipContent.files[jsonFile].async("string");
            const parsed = JSON.parse(content);
            const extracted = extractTableData(parsed, jsonFile);
            
            if (Object.keys(extracted).length > 0) {
              processedFiles.push(jsonFile);
              // Merge tables from this file
              for (const [table, data] of Object.entries(extracted)) {
                if (allData[table]) {
                  allData[table] = [...allData[table], ...data];
                } else {
                  allData[table] = data;
                }
              }
            } else {
              skippedFiles.push(jsonFile);
            }
          } catch (e) {
            console.error(`Erro ao processar ${jsonFile}:`, e);
            skippedFiles.push(jsonFile);
          }
        }

        const validTables = Object.keys(allData);
        if (validTables.length === 0) {
          const filesList = jsonFiles.slice(0, 3).join(", ") + (jsonFiles.length > 3 ? "..." : "");
          toast.error(`Nenhuma tabela válida encontrada. Arquivos: ${filesList}. Verifique se a estrutura é compatível.`);
          console.log("Arquivos encontrados no ZIP:", jsonFiles);
          console.log("Arquivos ignorados:", skippedFiles);
          return;
        }

        if (skippedFiles.length > 0) {
          console.log("Arquivos ignorados (estrutura não reconhecida):", skippedFiles);
        }

        setImportData(allData);
        setImportFileName(`${file.name} (${processedFiles.length} arquivo(s) processado(s))`);
        setImportModalOpen(true);
      } catch (error) {
        console.error("Erro ao processar ZIP:", error);
        toast.error("Erro ao ler arquivo ZIP. Verifique se o arquivo não está corrompido.");
      }
    } 
    // Handle JSON files
    else if (fileName.endsWith(".json")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        processJsonContent(content, file.name);
      };
      reader.readAsText(file);
    } else {
      toast.error("Formato não suportado. Use arquivos .json ou .zip");
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Define a ordem correta de importação (tabelas base primeiro, dependentes depois)
  const IMPORT_ORDER: string[] = [
    // 1. Tabelas de sistema sem dependências
    "plan_permissions",
    "credit_packages",
    "admin_settings",
    "api_providers",
    "email_templates",
    "niche_best_times",
    
    // 2. Perfis de usuário (base para quase tudo)
    "profiles",
    
    // 3. Tabelas de usuário que dependem de profiles
    "user_roles",
    "user_credits",
    "user_preferences",
    "user_api_settings",
    "user_goals",
    "user_individual_permissions",
    "user_kanban_settings",
    
    // 4. Pastas e organização (base para outras tabelas)
    "folders",
    "tags",
    
    // 5. Agentes (base para scripts)
    "script_agents",
    
    // 6. Canais monitorados (base para notificações e vídeos)
    "monitored_channels",
    
    // 7. Tabelas de conteúdo
    "analyzed_videos",
    "generated_titles",
    "generated_scripts",
    "generated_images",
    "generated_audios",
    "scene_prompts",
    "saved_prompts",
    "reference_thumbnails",
    "batch_generation_history",
    
    // 8. Análises e vídeos
    "channel_analyses",
    "channel_goals",
    "pinned_videos",
    "video_analyses",
    "video_notifications",
    "saved_analytics_channels",
    
    // 9. Organização dependente
    "title_tags",
    "agent_files",
    
    // 10. Agenda e tarefas
    "publication_schedule",
    "production_board_tasks",
    "task_completion_history",
    "schedule_reminders_sent",
    "pomodoro_state",
    
    // 11. Créditos e transações
    "credit_transactions",
    "credit_usage",
    "imagefx_monthly_usage",
    
    // 12. Outros
    "push_subscriptions",
    "srt_history",
    "user_file_uploads",
    "video_generation_jobs",
    
    // 13. Blog e marketing
    "blog_articles",
    "blog_page_views",
    "product_clicks",
    "newsletter_subscribers",
    "migration_invites",
  ];

  const executeImport = async () => {
    if (!importData) return;

    setImporting(true);
    setImportProgress(0);

    // Ordenar tabelas pela ordem de importação
    const allTableNames = Object.keys(importData);
    const orderedTables = [
      // Primeiro as tabelas na ordem definida
      ...IMPORT_ORDER.filter(t => allTableNames.includes(t)),
      // Depois as tabelas que não estão na lista (caso existam novas)
      ...allTableNames.filter(t => !IMPORT_ORDER.includes(t))
    ];

    const totalTables = orderedTables.length;
    let successCount = 0;
    const errorDetails: { table: string; error: string; records: number }[] = [];
    const skippedTables: { table: string; reason: string }[] = [];

    try {
      for (let i = 0; i < orderedTables.length; i++) {
        const tableName = orderedTables[i];
        const tableData = importData[tableName];
        setImportCurrentTable(tableName);
        setImportProgress(Math.round(((i + 1) / totalTables) * 100));

        if (!tableData || tableData.length === 0) continue;

        let tableHasError = false;

        try {
          if (importMode === "replace") {
            // Delete all existing data first
            const { error: deleteError } = await supabase
              .from(tableName as any)
              .delete()
              .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

            if (deleteError) {
              console.error(`Erro ao limpar ${tableName}:`, deleteError);
              errorDetails.push({ table: tableName, error: `Limpar: ${deleteError.message}`, records: tableData.length });
              tableHasError = true;
            }
          }

          // Insert data in batches of 100
          const batchSize = 100;
          let batchErrors = 0;
          
          for (let j = 0; j < tableData.length; j += batchSize) {
            const batch = tableData.slice(j, j + batchSize);
            
            if (importMode === "merge") {
              // Upsert - merge with existing data
              const { error } = await supabase
                .from(tableName as any)
                .upsert(batch, { onConflict: "id", ignoreDuplicates: false });

              if (error) {
                console.error(`Erro ao importar ${tableName} (batch ${j}):`, error);
                batchErrors++;
                if (!tableHasError) {
                  errorDetails.push({ table: tableName, error: error.message, records: tableData.length });
                  tableHasError = true;
                }
              }
            } else {
              // Insert - replace mode already deleted
              const { error } = await supabase
                .from(tableName as any)
                .insert(batch);

              if (error) {
                console.error(`Erro ao importar ${tableName} (batch ${j}):`, error);
                batchErrors++;
                if (!tableHasError) {
                  errorDetails.push({ table: tableName, error: error.message, records: tableData.length });
                  tableHasError = true;
                }
              }
            }
          }

          if (!tableHasError) {
            successCount++;
          }
        } catch (tableError: any) {
          console.error(`Erro na tabela ${tableName}:`, tableError);
          errorDetails.push({ table: tableName, error: tableError?.message || "Erro desconhecido", records: tableData.length });
        }
      }

      if (errorDetails.length === 0) {
        toast.success(`${successCount} tabela(s) importada(s) com sucesso!`);
      } else {
        // Log detailed errors for debugging
        console.group("📋 Detalhes dos erros de importação:");
        errorDetails.forEach(({ table, error, records }) => {
          console.log(`❌ ${table} (${records} registros): ${error}`);
        });
        console.groupEnd();
        
        // Categorizar erros para ajudar o usuário
        const fkErrors = errorDetails.filter(e => e.error.includes("foreign key") || e.error.includes("fkey"));
        const rlsErrors = errorDetails.filter(e => e.error.includes("row-level security"));
        const duplicateErrors = errorDetails.filter(e => e.error.includes("duplicate") || e.error.includes("unique constraint"));
        
        if (fkErrors.length > 0) {
          console.log("⚠️ Erros de FK: Dados referenciam usuários que não existem neste projeto.");
        }
        if (rlsErrors.length > 0) {
          console.log("⚠️ Erros de RLS: Verifique se você é admin e tem permissões corretas.");
        }
        if (duplicateErrors.length > 0) {
          console.log("⚠️ Erros de duplicação: Dados já existem com conflitos em campos únicos.");
        }
        
        const errorTablesPreview = errorDetails.slice(0, 3).map(e => e.table).join(", ");
        const moreErrors = errorDetails.length > 3 ? ` e mais ${errorDetails.length - 3}` : "";
        
        toast.warning(
          `Importação: ${successCount} sucesso, ${errorDetails.length} tabelas com erro (${errorTablesPreview}${moreErrors}). Ver console para detalhes.`,
          { duration: 8000 }
        );
      }

      setImportModalOpen(false);
      setImportData(null);
    } catch (error) {
      console.error("Erro ao importar:", error);
      toast.error("Erro ao importar dados");
    } finally {
      setImporting(false);
      setImportProgress(0);
      setImportCurrentTable("");
    }
  };

  const userTables = ALL_TABLES.filter(t => t.category === "user");
  const systemTables = ALL_TABLES.filter(t => t.category === "system");

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Exportar Dados do Sistema</h2>
          </div>
          {/* Import button */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".json,.zip"
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Importar Dados
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground mb-6">
          Exporte todas as tabelas do banco de dados para backup ou análise. Importação suporta arquivos <Badge variant="outline" className="ml-1">.json</Badge> e <Badge variant="outline" className="ml-1">.zip</Badge>
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

      {/* Import Confirmation Modal */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Importar Dados
            </DialogTitle>
            <DialogDescription>
              Arquivo selecionado: <span className="font-medium text-foreground">{importFileName}</span>
            </DialogDescription>
          </DialogHeader>

          {importData && (
            <div className="space-y-4 py-4">
              {/* Tables found */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Tabelas encontradas no arquivo:
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(importData).map(([table, data]) => (
                    <Badge key={table} variant="secondary" className="text-xs">
                      {ALL_TABLES.find(t => t.name === table)?.displayName || table} ({data.length})
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Import mode */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Modo de importação:
                </label>
                <Select value={importMode} onValueChange={(v) => setImportMode(v as ImportMode)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="merge">
                      <div className="flex flex-col">
                        <span>Mesclar (Merge)</span>
                        <span className="text-xs text-muted-foreground">Atualiza existentes e adiciona novos</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="replace">
                      <div className="flex flex-col">
                        <span>Substituir (Replace)</span>
                        <span className="text-xs text-muted-foreground">Remove todos os dados e insere novos</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Warning for replace mode */}
              {importMode === "replace" && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-md border border-destructive/20">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive">Atenção!</p>
                    <p className="text-muted-foreground">
                      O modo Substituir irá apagar TODOS os dados existentes nas tabelas selecionadas antes de importar.
                    </p>
                  </div>
                </div>
              )}

              {/* Progress bar (when importing) */}
              {importing && (
                <div className="space-y-2">
                  <Progress value={importProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    Importando: {importCurrentTable} ({importProgress}%)
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportModalOpen(false)} disabled={importing}>
              Cancelar
            </Button>
            <Button onClick={executeImport} disabled={importing} className="gap-2">
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Iniciar Importação
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
