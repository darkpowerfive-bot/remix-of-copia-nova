import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { question: "Os créditos expiram?", answer: "Créditos de execução recorrente expiram ao final do ciclo ativo. Créditos de expansão pontual não expiram." },
  { question: "Posso ajustar minha capacidade?", answer: "Sim. A capacidade pode ser ampliada ou reduzida conforme sua necessidade operacional a qualquer momento." },
  { question: "Como funciona a integração com o YouTube?", answer: "A integração permite upload direto, gerenciamento de vídeos, análise de métricas e automação completa do canal." },
  { question: "O que são os Agentes Virais?", answer: "São bots automatizados que executam tarefas como análise de tendências, geração de conteúdo e otimização 24/7." },
  { question: "Existe suporte técnico?", answer: "Sim, todos os planos incluem suporte via Discord. Planos Master Pro têm acesso a suporte prioritário." },
  { question: "Posso testar antes de assinar?", answer: "O Acesso Inicial é gratuito e permite que você experimente as funcionalidades básicas da plataforma." },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-24 relative">
      <div className="container mx-auto px-6 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Perguntas<span className="text-gradient"> Frequentes</span></h2>
          <p className="text-muted-foreground text-lg">Tire suas dúvidas sobre o La Casa Dark Core</p>
        </motion.div>
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border border-border rounded-xl px-6 bg-gradient-card data-[state=open]:border-primary/40 transition-colors">
              <AccordionTrigger className="text-left font-semibold hover:text-primary">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
