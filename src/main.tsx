import "./index.css";
import { createRoot } from "react-dom/client";

type RequiredEnvKey = "VITE_SUPABASE_URL" | "VITE_SUPABASE_PUBLISHABLE_KEY";

const REQUIRED_ENV: RequiredEnvKey[] = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
];

const missing = REQUIRED_ENV.filter((k) => !import.meta.env[k]);

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found");

const root = createRoot(rootEl);

if (missing.length > 0) {
  root.render(
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-lg border border-border bg-card p-6">
        <h1 className="text-xl font-semibold">Configuração incompleta</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          O app foi publicado sem variáveis de ambiente obrigatórias. Faça um rebuild
          passando os <span className="font-medium">Build Args</span> do Vite.
        </p>
        <div className="mt-4 rounded-md bg-muted p-3">
          <pre className="text-xs whitespace-pre-wrap">{missing.join("\n")}</pre>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Dica: em painéis como EasyPanel, definir "Environment Variables" em runtime
          não substitui os valores no build; é necessário configurar os <b>Build Args</b>
          e disparar um novo build (sem cache).
        </p>
      </div>
    </div>
  );
} else {
  import("./App.tsx").then(({ default: App }) => {
    root.render(<App />);
  });
}

