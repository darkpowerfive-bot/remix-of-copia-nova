import { Component, ErrorInfo, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  maxRetries?: number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
  isRetrying: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  public state: State = {
    hasError: false,
    error: null,
    retryCount: 0,
    isRetrying: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  private isChunkLoadError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('failed to fetch dynamically imported module') ||
      message.includes('loading chunk') ||
      message.includes('loading css chunk') ||
      message.includes('dynamically imported module') ||
      message.includes('failed to load module script')
    );
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // If it's a chunk loading error, force reload to get new assets
    if (this.isChunkLoadError(error)) {
      console.log("Chunk load error detected, reloading page...");
      // Clear any cached state and reload
      sessionStorage.setItem('chunk_reload_attempted', 'true');
      
      // Only auto-reload if we haven't already tried
      const alreadyReloaded = sessionStorage.getItem('chunk_reload_attempted');
      if (!alreadyReloaded) {
        window.location.reload();
        return;
      }
    }
    
    const maxRetries = this.props.maxRetries ?? 2;
    
    // Auto-retry if we haven't exceeded max retries
    if (this.state.retryCount < maxRetries) {
      this.scheduleRetry();
    }
  }

  public componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private scheduleRetry = () => {
    this.setState({ isRetrying: true });
    
    // Wait before retrying (exponential backoff: 500ms, 1000ms, 2000ms...)
    const delay = Math.min(500 * Math.pow(2, this.state.retryCount), 3000);
    
    this.retryTimeoutId = setTimeout(() => {
      this.setState((prevState) => ({
        hasError: false,
        error: null,
        retryCount: prevState.retryCount + 1,
        isRetrying: false,
      }));
    }, delay);
  };

  private handleManualRetry = () => {
    // Clear the chunk reload flag so reload will work next time
    sessionStorage.removeItem('chunk_reload_attempted');
    this.setState({
      hasError: false,
      error: null,
      retryCount: 0,
      isRetrying: false,
    });
  };

  private handleReload = () => {
    // Clear the chunk reload flag and force reload
    sessionStorage.removeItem('chunk_reload_attempted');
    window.location.reload();
  };

  public render() {
    const maxRetries = this.props.maxRetries ?? 2;
    const isChunkError = this.state.error ? this.isChunkLoadError(this.state.error) : false;

    // Show loading state during auto-retry
    if (this.state.isRetrying) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">
              Tentando reconectar... ({this.state.retryCount + 1}/{maxRetries})
            </p>
          </div>
        </div>
      );
    }

    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                {isChunkError ? "Atualização Disponível" : (this.props.fallbackTitle || "Algo deu errado")}
              </h2>
              <p className="text-muted-foreground text-sm">
                {isChunkError 
                  ? "Uma nova versão da aplicação foi publicada. Clique em 'Recarregar Página' para atualizar."
                  : (this.props.fallbackMessage || 
                    "Ocorreu um erro inesperado ao carregar esta página. Por favor, tente novamente.")}
              </p>
              {this.state.retryCount > 0 && !isChunkError && (
                <p className="text-xs text-muted-foreground">
                  Tentativas automáticas esgotadas ({this.state.retryCount}/{maxRetries})
                </p>
              )}
            </div>

            {this.state.error && !isChunkError && (
              <div className="bg-muted/50 rounded-lg p-3 text-left">
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleManualRetry} variant="default" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </Button>
              <Button onClick={this.handleReload} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Recarregar Página
              </Button>
              <Button asChild variant="ghost" className="gap-2">
                <Link to="/dashboard">
                  <Home className="w-4 h-4" />
                  Dashboard
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
