import { motion } from "framer-motion";
import { Crown, ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";

const PrivacyPolicy = () => {
  return (
    <>
      <SEOHead
        title="Política de Privacidade"
        description="Política de privacidade da plataforma La Casa Dark CORE. Saiba como coletamos, usamos e protegemos seus dados pessoais de acordo com a LGPD."
        canonical="/politica-de-privacidade"
        keywords="política de privacidade, LGPD, proteção de dados, la casa dark"
      />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary via-orange-500 to-yellow-500 flex items-center justify-center">
                <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="font-black text-lg sm:text-xl text-foreground">La Casa Dark</span>
              <span className="font-black text-lg sm:text-xl text-primary">CORE</span>
            </Link>
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black">
                  Política de <span className="text-primary">Privacidade</span>
                </h1>
              </div>
              <p className="text-muted-foreground mb-8">Última atualização: Janeiro de 2026</p>

              <div className="prose prose-invert max-w-none space-y-8">
                <section className="p-4 sm:p-6 rounded-2xl bg-card/50 border border-border/50">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">1. Informações que Coletamos</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4 text-sm sm:text-base">Coletamos as seguintes informações:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 text-sm sm:text-base">
                    <li><strong>Dados de cadastro:</strong> nome, e-mail, telefone</li>
                    <li><strong>Dados de pagamento:</strong> processados por gateways seguros</li>
                    <li><strong>Dados de uso:</strong> interações com a plataforma, preferências</li>
                    <li><strong>Dados do YouTube:</strong> métricas dos canais conectados (com autorização)</li>
                    <li><strong>Dados técnicos:</strong> IP, navegador, dispositivo</li>
                  </ul>
                </section>

                <section className="p-4 sm:p-6 rounded-2xl bg-card/50 border border-border/50">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">2. Como Usamos seus Dados</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4 text-sm sm:text-base">Utilizamos suas informações para:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 text-sm sm:text-base">
                    <li>Fornecer e melhorar nossos serviços</li>
                    <li>Personalizar sua experiência na plataforma</li>
                    <li>Processar pagamentos e assinaturas</li>
                    <li>Enviar comunicações sobre a plataforma</li>
                    <li>Analisar métricas e melhorar o produto</li>
                    <li>Prevenir fraudes e garantir segurança</li>
                  </ul>
                </section>

                <section className="p-4 sm:p-6 rounded-2xl bg-card/50 border border-border/50">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">3. Compartilhamento de Dados</h2>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                    Não vendemos seus dados pessoais. Podemos compartilhar informações com:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4 text-sm sm:text-base">
                    <li>Processadores de pagamento (Stripe, PayPal)</li>
                    <li>Serviços de hospedagem e infraestrutura</li>
                    <li>Ferramentas de analytics (de forma anonimizada)</li>
                    <li>Autoridades legais quando exigido por lei</li>
                  </ul>
                </section>

                <section className="p-4 sm:p-6 rounded-2xl bg-card/50 border border-border/50">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">4. Segurança dos Dados</h2>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                    Implementamos medidas de segurança robustas para proteger suas informações:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4 text-sm sm:text-base">
                    <li>Criptografia SSL/TLS em todas as transmissões</li>
                    <li>Armazenamento em servidores seguros</li>
                    <li>Acesso restrito a dados sensíveis</li>
                    <li>Monitoramento contínuo de segurança</li>
                    <li>Backups regulares e criptografados</li>
                  </ul>
                </section>

                <section className="p-4 sm:p-6 rounded-2xl bg-card/50 border border-border/50">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">5. Seus Direitos (LGPD)</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4 text-sm sm:text-base">
                    De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 text-sm sm:text-base">
                    <li>Acessar seus dados pessoais</li>
                    <li>Corrigir dados incompletos ou desatualizados</li>
                    <li>Solicitar a exclusão de seus dados</li>
                    <li>Revogar o consentimento para uso de dados</li>
                    <li>Solicitar a portabilidade de dados</li>
                    <li>Ser informado sobre o uso de seus dados</li>
                  </ul>
                </section>

                <section className="p-4 sm:p-6 rounded-2xl bg-card/50 border border-border/50">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">6. Cookies e Tecnologias</h2>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                    Utilizamos cookies e tecnologias similares para melhorar sua experiência:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4 text-sm sm:text-base">
                    <li><strong>Cookies essenciais:</strong> necessários para o funcionamento</li>
                    <li><strong>Cookies de preferência:</strong> lembram suas configurações</li>
                    <li><strong>Cookies analíticos:</strong> nos ajudam a entender o uso</li>
                  </ul>
                </section>

                <section className="p-4 sm:p-6 rounded-2xl bg-card/50 border border-border/50">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">7. Retenção de Dados</h2>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                    Mantemos seus dados enquanto sua conta estiver ativa ou conforme necessário 
                    para fornecer serviços. Após o encerramento da conta, os dados são retidos 
                    por até 5 anos para fins legais, depois são excluídos permanentemente.
                  </p>
                </section>

                <section className="p-4 sm:p-6 rounded-2xl bg-card/50 border border-border/50">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">8. Alterações na Política</h2>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                    Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças 
                    significativas por e-mail ou através da plataforma. A data da última atualização 
                    será sempre indicada no início do documento.
                  </p>
                </section>

                <section className="p-4 sm:p-6 rounded-2xl bg-card/50 border border-border/50">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">9. Contato do DPO</h2>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                    Para questões sobre privacidade ou para exercer seus direitos, entre em contato com nosso 
                    Encarregado de Proteção de Dados (DPO):
                  </p>
                  <p className="text-primary mt-4 text-sm sm:text-base">privacidade@lacasadark.com</p>
                </section>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </>
  );
};

export default PrivacyPolicy;
