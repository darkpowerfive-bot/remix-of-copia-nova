import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown } from "lucide-react";
import logo from "@/assets/logo.gif";
import { SEOHead } from "@/components/seo/SEOHead";

const TermsOfService = () => {
  return (
    <>
      <SEOHead
        title="Termos de Uso"
        description="Termos de uso da plataforma La Casa Dark CORE. Regras de uso, pagamentos, propriedade intelectual e responsabilidades."
        canonical="/termos-de-uso"
        keywords="termos de uso, condições de uso, la casa dark, canal dark youtube"
      />
      <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-amber-400 to-primary animate-spin-slow opacity-75 blur-sm" />
                <img src={logo} alt="La Casa Dark CORE" className="w-12 h-12 rounded-full relative z-10 border-2 border-primary" />
              </div>
              <span className="font-bold text-xl">La Casa Dark <span className="text-primary">CORE</span></span>
            </Link>
            
            <Link to="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="pt-32 pb-20 px-4">
        <article className="max-w-4xl mx-auto prose prose-invert prose-lg">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-foreground">
            Termos de <span className="text-primary">Uso</span>
          </h1>
          
          <p className="text-muted-foreground text-lg mb-8">
            Última atualização: 1 de Janeiro de 2026
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Ao acessar e utilizar o La Casa Dark CORE ("Plataforma"), você concorda em cumprir e estar sujeito a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá usar nossa plataforma.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">2. Descrição do Serviço</h2>
            <p className="text-muted-foreground leading-relaxed">
              O La Casa Dark CORE é uma plataforma de ferramentas para criadores de conteúdo no YouTube, oferecendo:
            </p>
            <ul className="text-muted-foreground mt-4 space-y-2">
              <li>Análise de títulos e thumbnails com IA</li>
              <li>Geração de roteiros automatizada</li>
              <li>Criação de imagens e thumbnails</li>
              <li>Conversão de texto para fala (TTS)</li>
              <li>Análise de canais e nichos</li>
              <li>Ferramentas de automação para YouTube</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">3. Cadastro e Conta</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para utilizar os serviços, você deve criar uma conta fornecendo informações precisas e atualizadas. Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">4. Planos e Pagamentos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Os serviços são oferecidos em diferentes planos de assinatura. Os preços e características de cada plano estão disponíveis na página de planos. O pagamento é processado de forma segura através de nossos parceiros de pagamento.
            </p>
            <ul className="text-muted-foreground mt-4 space-y-2">
              <li>Os créditos adquiridos não expiram</li>
              <li>Upgrade e downgrade podem ser feitos a qualquer momento</li>
              <li>Cancelamentos são processados imediatamente</li>
              <li>Não há reembolso para créditos já utilizados</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">5. Uso Aceitável</h2>
            <p className="text-muted-foreground leading-relaxed">
              Ao usar nossa plataforma, você concorda em:
            </p>
            <ul className="text-muted-foreground mt-4 space-y-2">
              <li>Não violar leis ou regulamentos aplicáveis</li>
              <li>Não criar conteúdo que infrinja direitos autorais de terceiros</li>
              <li>Não usar a plataforma para atividades fraudulentas</li>
              <li>Não tentar acessar sistemas ou dados não autorizados</li>
              <li>Respeitar as diretrizes de comunidade do YouTube</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">6. Propriedade Intelectual</h2>
            <p className="text-muted-foreground leading-relaxed">
              Todo o conteúdo, design, código e funcionalidades da plataforma são de propriedade exclusiva do La Casa Dark CORE. O conteúdo gerado pelos usuários permanece de propriedade dos respectivos usuários, que concedem à plataforma licença para processamento e armazenamento.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">7. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground leading-relaxed">
              A plataforma é fornecida "como está", sem garantias expressas ou implícitas. Não nos responsabilizamos por danos diretos, indiretos, incidentais ou consequenciais decorrentes do uso da plataforma.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">8. Modificações dos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após a publicação. O uso continuado da plataforma após as alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">9. Contato</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para dúvidas sobre estes termos, entre em contato através do email: <a href="mailto:suporte@canaisdarks.com.br" className="text-primary hover:underline">suporte@canaisdarks.com.br</a>
            </p>
          </section>
        </article>
      </main>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 La Casa Dark CORE. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <Link to="/termos-de-uso" className="text-primary hover:underline">Termos de Uso</Link>
            <Link to="/politica-de-privacidade" className="hover:text-foreground transition-colors">Política de Privacidade</Link>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
};

export default TermsOfService;
