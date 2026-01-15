import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send, ChevronDown, Bot } from "lucide-react";

const faqData = [
  {
    question: "O que é o La Casa Dark CORE?",
    answer: "É a plataforma mais completa para criação e gestão de canais dark no YouTube. Oferecemos ferramentas de IA, automação e analytics em um só lugar para escalar sua operação."
  },
  {
    question: "Como funciona o período de teste?",
    answer: "Você recebe 50 créditos gratuitos para testar todas as funcionalidades da plataforma. Não é necessário cartão de crédito para começar!"
  },
  {
    question: "Os créditos expiram?",
    answer: "Não! Seus créditos nunca expiram. Você pode usar quando quiser, no seu próprio ritmo."
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer: "Sim! Você pode cancelar, fazer upgrade ou downgrade do seu plano a qualquer momento, sem multas ou taxas de cancelamento."
  },
  {
    question: "Como funciona a geração de roteiros?",
    answer: "Nossa IA analisa padrões virais do seu nicho e cria roteiros otimizados com ganchos de retenção, estrutura viral e linguagem persuasiva."
  },
  {
    question: "Vocês têm suporte?",
    answer: "Sim! Oferecemos suporte via Telegram e email, com tempo médio de resposta de 15 minutos. Estamos disponíveis de segunda a sexta, das 9h às 18h."
  },
  {
    question: "O que são os Agentes Virais?",
    answer: "São IAs que trabalham 24/7 automatizando processos de criação e otimização de conteúdo. Eles analisam dados, geram roteiros, criam thumbnails e muito mais."
  },
  {
    question: "Qual plano é melhor para iniciantes?",
    answer: "Recomendamos o START CREATOR com 800 créditos/mês. É perfeito para quem está começando e quer testar a plataforma com mais recursos que o plano gratuito."
  }
];

export const AutoChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [showingAnswer, setShowingAnswer] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState("");

  const handleQuestionClick = (index: number) => {
    setSelectedQuestion(index);
    setShowingAnswer(true);
    setTypedAnswer("");
    
    // Type the answer character by character
    const answer = faqData[index].answer;
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < answer.length) {
        setTypedAnswer(answer.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 15);
  };

  const handleBack = () => {
    setSelectedQuestion(null);
    setShowingAnswer(false);
    setTypedAnswer("");
  };

  return (
    <>
      {/* Chat Button */}
      {/* Pulse ring effect */}
      <div className="!fixed !bottom-6 !right-6 z-[9998] w-16 h-16 pointer-events-none">
        <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
        <span className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`!fixed !bottom-6 !right-6 z-[9999] w-16 h-16 rounded-full gradient-button shadow-2xl shadow-primary/30 hover:scale-110 transition-all duration-300`}
        size="icon"
      >
        {isOpen ? (
          <X className="w-7 h-7" />
        ) : (
          <MessageCircle className="w-7 h-7" />
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="!fixed !bottom-24 !right-6 z-[9999] w-96 max-w-[calc(100vw-3rem)] h-[500px] bg-card border-border shadow-2xl shadow-primary/20 flex flex-col overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="p-5 bg-primary text-primary-foreground flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">Assistente La Casa</h3>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Online agora
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {!showingAnswer ? (
              <>
                {/* Welcome Message */}
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm p-4 max-w-[80%]">
                    <p className="text-base">Olá! 👋 Sou o assistente do La Casa Dark CORE. Como posso ajudar você hoje?</p>
                  </div>
                </div>

                {/* Quick Questions */}
                <div className="space-y-3 pt-4">
                  <p className="text-sm text-muted-foreground font-medium">Perguntas frequentes:</p>
                  {faqData.map((faq, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuestionClick(index)}
                      className="w-full text-left p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 text-base"
                    >
                      {faq.question}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* User Question */}
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm p-4 max-w-[80%]">
                    <p className="text-base">{faqData[selectedQuestion!].question}</p>
                  </div>
                </div>

                {/* Bot Answer */}
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm p-4 max-w-[80%]">
                    <p className="text-base">{typedAnswer}<span className="animate-pulse">|</span></p>
                  </div>
                </div>

                {/* Back Button */}
                {typedAnswer.length === faqData[selectedQuestion!].answer.length && (
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-primary text-base hover:underline mx-auto pt-4"
                  >
                    <ChevronDown className="w-5 h-5 rotate-90" />
                    Ver outras perguntas
                  </button>
                )}
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Digite sua pergunta..."
                className="flex-1 px-5 py-3 rounded-full bg-muted border border-border focus:border-primary focus:outline-none transition-colors text-base"
                disabled
              />
              <Button size="icon" className="rounded-full w-12 h-12 gradient-button" disabled>
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-3">
              Clique em uma pergunta acima para começar
            </p>
          </div>
        </Card>
      )}
    </>
  );
};
