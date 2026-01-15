import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Film, Clock, Rocket } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const VideoGenerator = () => {
  return (
    <MainLayout>
      <SEOHead
        title="Gerador de Vídeo"
        description="Crie vídeos incríveis com IA usando Sora 2 e Veo 3.1."
        noindex={true}
      />
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center gap-3">
            <Film className="w-8 h-8 text-primary" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-foreground">Gerador de Vídeo</h1>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  Em Breve
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Crie vídeos incríveis com IA usando Sora 2 e Veo 3.1
              </p>
            </div>
          </div>

          {/* Coming Soon Card */}
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <Rocket className="w-12 h-12 text-primary" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Em Breve!</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Estamos finalizando a integração com os modelos de geração de vídeo Sora 2 (OpenAI) e Veo 3.1 (Google). 
                  Em breve você poderá criar vídeos cinematográficos diretamente pela plataforma.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg mt-4">
                <div className="p-4 bg-secondary/50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary">Sora 2</div>
                  <div className="text-xs text-muted-foreground">OpenAI</div>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary">Veo 3.1</div>
                  <div className="text-xs text-muted-foreground">Google</div>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary">4K</div>
                  <div className="text-xs text-muted-foreground">Qualidade</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
                <Clock className="w-4 h-4" />
                <span>Previsão de lançamento: Em breve</span>
              </div>

              <Button disabled className="mt-4 opacity-50 cursor-not-allowed">
                <Film className="w-4 h-4 mr-2" />
                Gerar Vídeo
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default VideoGenerator;
