import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Facebook, 
  Chrome, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Mail, 
  Copy,
  ChevronUp,
  ChevronDown,
  Eye,
  Info,
  Loader2,
  Rocket,
  RefreshCw,
  Wand2,
  Send,
  Upload,
  Image as ImageIcon,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EmailTemplate {
  id: string;
  template_type: string;
  subject: string;
  body: string;
  variables: string[];
  is_active: boolean;
}

// Default email logo URL
const DEFAULT_EMAIL_LOGO_FALLBACK_PATH = "/images/logo-email.gif";
const DEFAULT_EMAIL_LOGO = (() => {
  try {
    return typeof window !== "undefined"
      ? `${window.location.origin}${DEFAULT_EMAIL_LOGO_FALLBACK_PATH}`
      : DEFAULT_EMAIL_LOGO_FALLBACK_PATH;
  } catch {
    return DEFAULT_EMAIL_LOGO_FALLBACK_PATH;
  }
})();

// Function to generate email header with dynamic logo
const getEmailHeader = (logoUrl: string) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    
    /* Mobile Responsive */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .email-content {
        padding: 24px 16px !important;
      }
      .email-header {
        padding: 24px 16px !important;
      }
      .email-footer {
        padding: 24px 16px !important;
      }
      .email-title {
        font-size: 22px !important;
      }
      .email-subtitle {
        font-size: 11px !important;
      }
      .content-title {
        font-size: 24px !important;
      }
      .content-text {
        font-size: 14px !important;
      }
      .icon-container {
        width: 70px !important;
        height: 70px !important;
      }
      .icon-emoji {
        font-size: 32px !important;
        line-height: 70px !important;
      }
      .cta-button {
        padding: 14px 28px !important;
        font-size: 14px !important;
      }
      .details-box {
        padding: 16px !important;
      }
      .details-label {
        font-size: 12px !important;
      }
      .details-value {
        font-size: 12px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Plus Jakarta Sans', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 20px 10px;" role="presentation">
    <tr>
      <td align="center">
        <table class="email-container" width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(180deg, #141414 0%, #0a0a0a 100%); border-radius: 20px; border: 1px solid rgba(245, 158, 11, 0.3); overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); max-width: 600px;" role="presentation">
          <!-- Logo Header -->
          <tr>
            <td class="email-header" style="padding: 32px 40px; text-align: center; border-bottom: 1px solid rgba(245, 158, 11, 0.15);">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <img src="${logoUrl}" alt="La Casa Dark Core" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; display: block; margin: 0 auto;" onerror="this.style.display='none'"/>
                    <h1 class="email-title" style="margin: 16px 0 0 0; color: #f59e0b; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">La Casa Dark Core</h1>
                    <p class="email-subtitle" style="margin: 6px 0 0 0; color: #71717a; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 2px;">Sistema Operacional de Viralização</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;

// Static header for default templates (uses placeholder that gets replaced)
const EMAIL_HEADER = getEmailHeader(DEFAULT_EMAIL_LOGO);

const EMAIL_FOOTER = `
          <!-- Footer -->
          <tr>
            <td class="email-footer" style="padding: 32px 40px; background: linear-gradient(180deg, #141414 0%, #0a0a0a 100%); border-top: 1px solid rgba(245, 158, 11, 0.3);">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <p style="color: #f59e0b; font-size: 18px; font-weight: 800; margin: 0 0 12px 0; letter-spacing: 0.5px;">La Casa Dark Core®</p>
                    <p style="color: #a3a3a3; font-size: 13px; margin: 0 0 6px 0; font-style: italic;">A infraestrutura por trás de canais dark profissionais</p>
                    <p style="color: #737373; font-size: 12px; margin: 0 0 20px 0;">A revolução chegou. Não há espaço para amadores.</p>
                    <table cellpadding="0" cellspacing="0" style="margin: 0 auto;" role="presentation">
                      <tr>
                        <td style="padding: 0 8px;">
                          <a href="https://www.canaisdarks.com.br" style="color: #f59e0b; font-size: 13px; text-decoration: underline; font-weight: 600;">www.canaisdarks.com.br</a>
                        </td>
                      </tr>
                    </table>
                    <p style="color: #737373; font-size: 12px; margin: 24px 0 0 0;">
                      © ${new Date().getFullYear()} La Casa Dark Core. Todos os direitos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// Helper function to generate mobile-friendly icon circles
const getIconCircle = (emoji: string, borderColor: string, bgGradient: string) => `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;" role="presentation">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td class="icon-container" style="width: 80px; height: 80px; border-radius: 50%; background: ${bgGradient}; border: 2px solid ${borderColor}; text-align: center; vertical-align: middle;">
                          <span class="icon-emoji" style="font-size: 40px; line-height: 80px; display: block;">${emoji}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>`;

// Premium email templates with La Casa Dark Core branding
const DEFAULT_TEMPLATES: Record<string, { subject: string; body: string }> = {
  welcome: {
    subject: "🚀 Bem-vindo à La Casa Dark Core!",
    body: `${EMAIL_HEADER}
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <!-- Badge -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%); border: 1px solid rgba(245, 158, 11, 0.3); color: #f59e0b; font-size: 12px; font-weight: 600; padding: 8px 16px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;">
                      ✨ Novo Membro
                    </span>
                  </td>
                </tr>
              </table>
              
              <h2 style="color: #ffffff; margin: 0 0 16px 0; font-size: 28px; font-weight: 700; text-align: center;">
                Olá, <span style="color: #f59e0b;">{{name}}</span>! 🎉
              </h2>
              
              <p style="color: #a3a3a3; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0; text-align: center;">
                Seja bem-vindo à <strong style="color: #f59e0b;">La Casa Dark Core</strong>! Sua conta foi ativada com sucesso e você já pode acessar todas as ferramentas da plataforma.
              </p>
              
              <!-- Features Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 12px; margin: 24px 0;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="color: #f59e0b; font-size: 14px; font-weight: 600; margin: 0 0 16px 0;">🔥 O que você pode fazer agora:</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr><td style="color: #d4d4d4; font-size: 14px; padding: 6px 0;">✓ Analisar vídeos virais e identificar padrões</td></tr>
                      <tr><td style="color: #d4d4d4; font-size: 14px; padding: 6px 0;">✓ Gerar roteiros otimizados com IA</td></tr>
                      <tr><td style="color: #d4d4d4; font-size: 14px; padding: 6px 0;">✓ Criar thumbnails que convertem</td></tr>
                      <tr><td style="color: #d4d4d4; font-size: 14px; padding: 6px 0;">✓ Monitorar canais concorrentes</td></tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0 0 0;">
                <tr>
                  <td align="center">
                    <a href="{{login_url}}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #0a0a0a; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);">
                      Acessar Plataforma →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
${EMAIL_FOOTER}`
  },
  access_approved: {
    subject: "✅ Seu acesso foi liberado!",
    body: `${EMAIL_HEADER}
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <!-- Success Icon -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.1) 100%); border: 2px solid #22c55e; display: inline-flex; align-items: center; justify-content: center;">
                      <span style="font-size: 40px;">✓</span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <h2 style="color: #22c55e; margin: 0 0 16px 0; font-size: 28px; font-weight: 700; text-align: center;">
                Parabéns, {{name}}! 🎊
              </h2>
              
              <p style="color: #a3a3a3; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0; text-align: center;">
                Seu acesso ao plano <strong style="color: #f59e0b;">{{plan_name}}</strong> foi aprovado com sucesso!
              </p>
              
              <!-- Benefits Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(34, 197, 94, 0.05); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 12px; margin: 24px 0;">
                <tr>
                  <td style="padding: 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr><td style="color: #22c55e; font-size: 14px; padding: 8px 0;">✓ Todas as funcionalidades do seu plano estão ativas</td></tr>
                      <tr><td style="color: #22c55e; font-size: 14px; padding: 8px 0;">✓ Créditos disponíveis para uso imediato</td></tr>
                      <tr><td style="color: #22c55e; font-size: 14px; padding: 8px 0;">✓ Suporte prioritário habilitado</td></tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0 0 0;">
                <tr>
                  <td align="center">
                    <a href="{{login_url}}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(34, 197, 94, 0.4);">
                      Começar Agora →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
${EMAIL_FOOTER}`
  },
  password_recovery: {
    subject: "🔐 Recuperação de Senha - La Casa Dark Core",
    body: `${EMAIL_HEADER}
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <!-- Lock Icon -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%); border: 2px solid #3b82f6; display: inline-flex; align-items: center; justify-content: center;">
                      <span style="font-size: 40px;">🔐</span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <h2 style="color: #ffffff; margin: 0 0 16px 0; font-size: 28px; font-weight: 700; text-align: center;">
                Recuperar Senha
              </h2>
              
              <p style="color: #a3a3a3; font-size: 16px; line-height: 1.7; margin: 0 0 8px 0; text-align: center;">
                Olá, <strong style="color: #f59e0b;">{{name}}</strong>
              </p>
              
              <p style="color: #737373; font-size: 15px; line-height: 1.7; margin: 0 0 32px 0; text-align: center;">
                Você solicitou a recuperação de senha da sua conta. Clique no botão abaixo para criar uma nova senha segura:
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 32px 0;">
                <tr>
                  <td align="center">
                    <a href="{{reset_link}}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);">
                      Redefinir Minha Senha
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Warning -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(113, 113, 122, 0.1); border: 1px solid rgba(113, 113, 122, 0.2); border-radius: 8px;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="color: #71717a; font-size: 13px; margin: 0; text-align: center;">
                      ⚠️ Se você não solicitou esta recuperação, ignore este email.<br>
                      O link expira em <strong>24 horas</strong>.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
${EMAIL_FOOTER}`
  },
  payment_confirmation: {
    subject: "💳 Pagamento Confirmado - La Casa Dark Core",
    body: `${EMAIL_HEADER}
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <!-- Success Badge -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.1) 100%); border: 2px solid #22c55e; display: inline-flex; align-items: center; justify-content: center;">
                      <span style="font-size: 40px;">💳</span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <h2 style="color: #22c55e; margin: 0 0 16px 0; font-size: 28px; font-weight: 700; text-align: center;">
                Pagamento Confirmado!
              </h2>
              
              <p style="color: #a3a3a3; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0; text-align: center;">
                Olá, <strong style="color: #f59e0b;">{{name}}</strong>! Seu pagamento foi processado com sucesso.
              </p>
              
              <!-- Receipt Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(20, 20, 20, 0.8); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 12px; margin: 24px 0;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="color: #f59e0b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">Detalhes da Compra</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #737373; font-size: 14px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">Plano</td>
                        <td style="color: #f59e0b; font-size: 14px; padding: 10px 0; text-align: right; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.05);">{{plan_name}}</td>
                      </tr>
                      <tr>
                        <td style="color: #737373; font-size: 14px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">Valor</td>
                        <td style="color: #22c55e; font-size: 14px; padding: 10px 0; text-align: right; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.05);">{{amount}}</td>
                      </tr>
                      <tr>
                        <td style="color: #737373; font-size: 14px; padding: 10px 0;">Status</td>
                        <td style="padding: 10px 0; text-align: right;">
                          <span style="background: rgba(34, 197, 94, 0.2); color: #22c55e; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px;">{{status}}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0 0 0;">
                <tr>
                  <td align="center">
                    <a href="{{login_url}}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #0a0a0a; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);">
                      Acessar Plataforma →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
${EMAIL_FOOTER}`
  },
  credits_purchase: {
    subject: "⚡ Créditos Adicionados - La Casa Dark Core",
    body: `${EMAIL_HEADER}
          <!-- Content -->
          <tr>
            <td style="padding: 40px; text-align: center;">
              <!-- Credits Badge -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%); border: 1px solid rgba(245, 158, 11, 0.3); color: #f59e0b; font-size: 12px; font-weight: 600; padding: 8px 16px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;">
                      ⚡ Créditos Adicionados
                    </span>
                  </td>
                </tr>
              </table>
              
              <h2 style="color: #ffffff; margin: 0 0 24px 0; font-size: 24px; font-weight: 700;">
                Olá, <span style="color: #f59e0b;">{{name}}</span>!
              </h2>
              
              <!-- Big Credits Display -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 auto 24px auto;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.05) 100%); border: 2px solid #f59e0b; border-radius: 20px; padding: 32px 48px;">
                      <p style="color: #f59e0b; font-size: 56px; font-weight: 800; margin: 0; line-height: 1;">+{{credits_amount}}</p>
                      <p style="color: #737373; font-size: 14px; margin: 8px 0 0 0; text-transform: uppercase; letter-spacing: 2px;">créditos</p>
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="color: #a3a3a3; font-size: 16px; line-height: 1.7; margin: 0 0 32px 0;">
                Sua compra de <strong style="color: #22c55e;">{{amount}}</strong> foi processada com sucesso!<br>
                Os créditos já estão disponíveis na sua conta.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{login_url}}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #0a0a0a; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);">
                      Usar Meus Créditos →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
${EMAIL_FOOTER}`
  },
  plan_cancellation: {
    subject: "📋 Cancelamento de Plano - La Casa Dark Core",
    body: `${EMAIL_HEADER}
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <!-- Icon -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <div style="width: 80px; height: 80px; border-radius: 50%; background: rgba(113, 113, 122, 0.1); border: 2px solid #71717a; display: inline-flex; align-items: center; justify-content: center;">
                      <span style="font-size: 40px;">📋</span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <h2 style="color: #ffffff; margin: 0 0 16px 0; font-size: 28px; font-weight: 700; text-align: center;">
                Cancelamento Recebido
              </h2>
              
              <p style="color: #a3a3a3; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0; text-align: center;">
                Olá, <strong style="color: #f59e0b;">{{name}}</strong>. Recebemos sua solicitação de cancelamento do plano <strong style="color: #f59e0b;">{{plan_name}}</strong>.
              </p>
              
              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(20, 20, 20, 0.8); border: 1px solid rgba(113, 113, 122, 0.2); border-radius: 12px; margin: 24px 0;">
                <tr>
                  <td style="padding: 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #737373; font-size: 14px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">📅 Data do cancelamento</td>
                        <td style="color: #d4d4d4; font-size: 14px; padding: 10px 0; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.05);">{{date_cancellation}}</td>
                      </tr>
                      <tr>
                        <td style="color: #737373; font-size: 14px; padding: 10px 0;">⏰ Acesso disponível até</td>
                        <td style="color: #f59e0b; font-size: 14px; padding: 10px 0; text-align: right; font-weight: 600;">{{date_end}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="color: #71717a; font-size: 14px; line-height: 1.7; margin: 0; text-align: center;">
                Você continuará tendo acesso a todas as funcionalidades até a data de expiração.<br>
                Sentiremos sua falta! 💛
              </p>
            </td>
          </tr>
${EMAIL_FOOTER}`
  },
  blocked_password: {
    subject: "🔒 Alerta de Segurança - Senha Bloqueada",
    body: `${EMAIL_HEADER}
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <!-- Warning Icon -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%); border: 2px solid #ef4444; display: inline-flex; align-items: center; justify-content: center;">
                      <span style="font-size: 40px;">🔒</span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <h2 style="color: #ef4444; margin: 0 0 16px 0; font-size: 28px; font-weight: 700; text-align: center;">
                Alerta de Segurança
              </h2>
              
              <p style="color: #a3a3a3; font-size: 16px; line-height: 1.7; margin: 0 0 8px 0; text-align: center;">
                Olá, <strong style="color: #f59e0b;">{{name}}</strong>
              </p>
              
              <p style="color: #737373; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0; text-align: center;">
                Sua senha foi bloqueada por motivos de segurança devido a múltiplas tentativas de acesso incorretas.
              </p>
              
              <!-- Warning Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; margin: 24px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #ef4444; font-size: 14px; margin: 0; text-align: center;">
                      ⚠️ Para recuperar o acesso à sua conta, clique no botão abaixo e crie uma nova senha.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 32px 0;">
                <tr>
                  <td align="center">
                    <a href="{{reset_link}}" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);">
                      Redefinir Senha Agora
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #525252; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                Se você não reconhece esta atividade, entre em contato com nosso suporte imediatamente.
              </p>
            </td>
          </tr>
${EMAIL_FOOTER}`
  },
  pending_approval: {
    subject: "⏳ Cadastro Recebido - Aguardando Liberação",
    body: `${EMAIL_HEADER}
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <!-- Pending Icon -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%); border: 2px solid #f59e0b; display: inline-flex; align-items: center; justify-content: center;">
                      <span style="font-size: 40px;">⏳</span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <h2 style="color: #f59e0b; margin: 0 0 16px 0; font-size: 28px; font-weight: 700; text-align: center;">
                Cadastro Recebido!
              </h2>
              
              <p style="color: #a3a3a3; font-size: 16px; line-height: 1.7; margin: 0 0 8px 0; text-align: center;">
                Olá, <strong style="color: #f59e0b;">{{name}}</strong>
              </p>
              
              <p style="color: #737373; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0; text-align: center;">
                Seu cadastro foi recebido com sucesso! Nossa equipe está analisando sua solicitação e em breve você receberá um email confirmando a liberação do seu acesso.
              </p>
              
              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 12px; margin: 24px 0;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="color: #f59e0b; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">📋 Próximos passos:</p>
                    <p style="color: #a3a3a3; font-size: 14px; margin: 0;">
                      1. Nossa equipe vai analisar seu cadastro<br>
                      2. Você receberá um email de confirmação<br>
                      3. Após aprovado, poderá acessar a plataforma
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="color: #525252; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                O tempo médio de análise é de até 24 horas úteis. Fique atento ao seu email!
              </p>
            </td>
          </tr>
${EMAIL_FOOTER}`
  },
  plan_start: {
    subject: "🎉 Parabéns! Seu Plano {{plan_name}} foi Ativado!",
    body: `${EMAIL_HEADER}
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <!-- Success Icon -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.1) 100%); border: 2px solid #22c55e; display: inline-flex; align-items: center; justify-content: center;">
                      <span style="font-size: 40px;">🎉</span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <h2 style="color: #22c55e; margin: 0 0 16px 0; font-size: 28px; font-weight: 700; text-align: center;">
                Plano Ativado com Sucesso!
              </h2>
              
              <p style="color: #a3a3a3; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0; text-align: center;">
                Olá, <strong style="color: #f59e0b;">{{name}}</strong>! Seu plano <strong style="color: #22c55e;">{{plan_name}}</strong> está ativo.
              </p>
              
              <!-- Plan Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(20, 20, 20, 0.8); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 12px; margin: 24px 0;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="color: #22c55e; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">Detalhes do Plano</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #737373; font-size: 14px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">Plano</td>
                        <td style="color: #22c55e; font-size: 14px; padding: 10px 0; text-align: right; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.05);">{{plan_name}}</td>
                      </tr>
                      <tr>
                        <td style="color: #737373; font-size: 14px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">Créditos Mensais</td>
                        <td style="color: #f59e0b; font-size: 14px; padding: 10px 0; text-align: right; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.05);">{{credits_amount}}</td>
                      </tr>
                      <tr>
                        <td style="color: #737373; font-size: 14px; padding: 10px 0;">Valor</td>
                        <td style="color: #d4d4d4; font-size: 14px; padding: 10px 0; text-align: right; font-weight: 600;">{{amount}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0 0 0;">
                <tr>
                  <td align="center">
                    <a href="{{login_url}}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(34, 197, 94, 0.4);">
                      Começar a Usar →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
${EMAIL_FOOTER}`
  },
  plan_renewal: {
    subject: "🔄 Seu Plano {{plan_name}} foi Renovado!",
    body: `${EMAIL_HEADER}
          <!-- Content -->
          <tr>
            <td class="email-content" style="padding: 40px;">
              <!-- Renewal Icon -->
              ${getIconCircle('🔄', '#3b82f6', 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)')}
              
              <h2 style="color: #3b82f6; margin: 0 0 16px 0; font-size: 28px; font-weight: 700; text-align: center;">
                Plano Renovado!
              </h2>
              
              <p style="color: #a3a3a3; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0; text-align: center;">
                Olá, <strong style="color: #f59e0b;">{{name}}</strong>! Seu plano <strong style="color: #3b82f6;">{{plan_name}}</strong> foi renovado automaticamente.
              </p>
              
              <!-- Renewal Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(20, 20, 20, 0.8); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; margin: 24px 0;">
                <tr>
                  <td style="padding: 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #737373; font-size: 14px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">Plano</td>
                        <td style="color: #3b82f6; font-size: 14px; padding: 10px 0; text-align: right; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.05);">{{plan_name}}</td>
                      </tr>
                      <tr>
                        <td style="color: #737373; font-size: 14px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">Valor Cobrado</td>
                        <td style="color: #22c55e; font-size: 14px; padding: 10px 0; text-align: right; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.05);">{{amount}}</td>
                      </tr>
                      <tr>
                        <td style="color: #737373; font-size: 14px; padding: 10px 0;">Próxima Renovação</td>
                        <td style="color: #d4d4d4; font-size: 14px; padding: 10px 0; text-align: right; font-weight: 600;">{{date_end}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="color: #525252; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                Seus créditos mensais foram recarregados. Continue criando conteúdo incrível!
              </p>
            </td>
          </tr>
${EMAIL_FOOTER}`
  },
  renewal_reminder: {
    subject: "⏰ Seu Plano Vence em {{days_remaining}} Dias - Renove Agora!",
    body: `${EMAIL_HEADER}
          <!-- Content -->
          <tr>
            <td class="email-content" style="padding: 40px;">
              <!-- Warning Icon -->
              ${getIconCircle('⏰', '#fb923c', 'linear-gradient(135deg, rgba(251, 146, 60, 0.2) 0%, rgba(234, 88, 12, 0.1) 100%)')}
              
              <h2 style="color: #fb923c; margin: 0 0 16px 0; font-size: 28px; font-weight: 700; text-align: center;">
                Seu Plano Vence em Breve!
              </h2>
              
              <p style="color: #a3a3a3; font-size: 16px; line-height: 1.7; margin: 0 0 8px 0; text-align: center;">
                Olá, <strong style="color: #f59e0b;">{{name}}</strong>
              </p>
              
              <p style="color: #737373; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0; text-align: center;">
                Seu plano <strong style="color: #fb923c;">{{plan_name}}</strong> vence em <strong style="color: #ef4444;">{{days_remaining}} dias</strong>. Renove agora para continuar aproveitando todos os benefícios!
              </p>
              
              <!-- Expiration Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(251, 146, 60, 0.05); border: 1px solid rgba(251, 146, 60, 0.3); border-radius: 12px; margin: 24px 0;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="color: #fb923c; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">📅 Data de Vencimento</p>
                    <p style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0;">{{date_end}}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Benefits List -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                <tr>
                  <td>
                    <p style="color: #a3a3a3; font-size: 14px; margin: 0 0 16px 0; text-align: center;">Não perca acesso às ferramentas exclusivas:</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr><td style="color: #22c55e; font-size: 14px; padding: 8px 0;">✓ Análise ilimitada de vídeos virais</td></tr>
                      <tr><td style="color: #22c55e; font-size: 14px; padding: 8px 0;">✓ Geração de scripts com IA avançada</td></tr>
                      <tr><td style="color: #22c55e; font-size: 14px; padding: 8px 0;">✓ Thumbnails profissionais</td></tr>
                      <tr><td style="color: #22c55e; font-size: 14px; padding: 8px 0;">✓ Suporte prioritário 24/7</td></tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0 0 0;">
                <tr>
                  <td align="center">
                    <a href="{{renewal_link}}" style="display: inline-block; background: linear-gradient(135deg, #fb923c 0%, #ea580c 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(251, 146, 60, 0.4);">
                      Renovar Meu Plano →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #525252; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
                Dúvidas? Entre em contato com nosso suporte.
              </p>
            </td>
          </tr>
${EMAIL_FOOTER}`
  },
  plan_expired: {
    subject: "🚫 Seu Plano Expirou - Acesso Suspenso",
    body: `${EMAIL_HEADER}
          <!-- Content -->
          <tr>
            <td class="email-content" style="padding: 40px;">
              <!-- Expired Icon -->
              ${getIconCircle('🚫', '#ef4444', 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.1) 100%)')}
              
              <h2 style="color: #ef4444; margin: 0 0 16px 0; font-size: 28px; font-weight: 700; text-align: center;">
                Seu Plano Expirou
              </h2>
              
              <p style="color: #a3a3a3; font-size: 16px; line-height: 1.7; margin: 0 0 8px 0; text-align: center;">
                Olá, <strong style="color: #f59e0b;">{{name}}</strong>
              </p>
              
              <p style="color: #737373; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0; text-align: center;">
                Seu plano <strong style="color: #ef4444;">{{plan_name}}</strong> expirou e seu acesso foi suspenso. Não se preocupe, seus dados estão seguros!
              </p>
              
              <!-- Warning Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; margin: 24px 0;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="color: #ef4444; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">⚠️ Acesso Suspenso</p>
                    <p style="color: #a3a3a3; font-size: 14px; margin: 0;">
                      Você perdeu acesso às seguintes funcionalidades:
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Lost Features List -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr><td style="color: #ef4444; font-size: 14px; padding: 8px 0;">✗ Análise de vídeos virais</td></tr>
                      <tr><td style="color: #ef4444; font-size: 14px; padding: 8px 0;">✗ Geração de scripts com IA</td></tr>
                      <tr><td style="color: #ef4444; font-size: 14px; padding: 8px 0;">✗ Criação de thumbnails profissionais</td></tr>
                      <tr><td style="color: #ef4444; font-size: 14px; padding: 8px 0;">✗ Suporte prioritário</td></tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Recovery Message -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(34, 197, 94, 0.05); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 12px; margin: 24px 0;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="color: #22c55e; font-size: 14px; margin: 0;">
                      💡 Reative agora e recupere seu acesso instantaneamente!
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0 0 0;">
                <tr>
                  <td align="center">
                    <a href="{{renewal_link}}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(34, 197, 94, 0.4);">
                      Reativar Meu Plano →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #525252; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
                Seus dados serão mantidos por 30 dias. Após esse período, poderão ser excluídos permanentemente.
              </p>
            </td>
          </tr>
${EMAIL_FOOTER}`
  },
  newsletter_welcome: {
    subject: "🚀 Bem-vindo à Newsletter da La Casa Dark Core!",
    body: `${EMAIL_HEADER}
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <!-- Rocket Icon -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%); border: 2px solid #f59e0b; display: inline-flex; align-items: center; justify-content: center;">
                      <span style="font-size: 40px;">🚀</span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <h2 style="color: #ffffff; margin: 0 0 16px 0; font-size: 28px; font-weight: 700; text-align: center;">
                Você está <span style="color: #f59e0b;">dentro!</span> 🎉
              </h2>
              
              <p style="color: #a3a3a3; font-size: 16px; line-height: 1.7; margin: 0 0 24px 0; text-align: center;">
                Obrigado por se inscrever na newsletter da <strong style="color: #f59e0b;">La Casa Dark Core</strong>! A partir de agora você receberá conteúdo exclusivo sobre canais dark diretamente no seu email.
              </p>
              
              <!-- What to Expect Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 12px; margin: 24px 0;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="color: #f59e0b; font-size: 14px; font-weight: 600; margin: 0 0 16px 0;">📬 O que você vai receber:</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr><td style="color: #d4d4d4; font-size: 14px; padding: 6px 0;">✓ Dicas exclusivas sobre canais dark</td></tr>
                      <tr><td style="color: #d4d4d4; font-size: 14px; padding: 6px 0;">✓ Estratégias de viralização e monetização</td></tr>
                      <tr><td style="color: #d4d4d4; font-size: 14px; padding: 6px 0;">✓ Novidades e atualizações da plataforma</td></tr>
                      <tr><td style="color: #d4d4d4; font-size: 14px; padding: 6px 0;">✓ Conteúdos especiais para assinantes</td></tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0 0 0;">
                <tr>
                  <td align="center">
                    <a href="{{blog_url}}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #0a0a0a; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);">
                      Ver Artigos do Blog →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #525252; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
                Enviamos no máximo 1 email por semana. Você pode cancelar sua inscrição a qualquer momento.
              </p>
            </td>
          </tr>
${EMAIL_FOOTER}`
  }
};

export function AdminPixelTab() {
  const [facebookPixel, setFacebookPixel] = useState("");
  const [googleAdsEmail, setGoogleAdsEmail] = useState("");
  const [googleAdsConversion, setGoogleAdsConversion] = useState("");
  const [whatsappId, setWhatsappId] = useState("");
  const [whatsappBusinessId, setWhatsappBusinessId] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpEmail, setSmtpEmail] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [useSsl, setUseSsl] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [savingTracking, setSavingTracking] = useState(false);
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [emailLogoUrl, setEmailLogoUrl] = useState(DEFAULT_EMAIL_LOGO);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [sendingTemplate, setSendingTemplate] = useState<string | null>(null);
  const [testEmailDestination, setTestEmailDestination] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
    fetchEmailTemplates();
  }, []);

  const loadSettings = async () => {
    const { data: tracking } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "tracking")
      .single();

    if (tracking?.value) {
      const t = tracking.value as Record<string, string>;
      setFacebookPixel(t.facebook_pixel || "");
      setGoogleAdsEmail(t.google_ads_email || "");
      setGoogleAdsConversion(t.google_ads_conversion || "");
    }

    const { data: notifs } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "notifications")
      .single();

    if (notifs?.value) {
      const n = notifs.value as Record<string, string>;
      setWhatsappId(n.whatsapp_id || "");
      setWhatsappBusinessId(n.whatsapp_business_id || "");
      setWebhookUrl(n.whatsapp_webhook || "");
    }

    const { data: smtp } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "smtp")
      .single();

    if (smtp?.value) {
      const s = smtp.value as Record<string, any>;
      setSmtpHost(s.host || "");
      setSmtpPort(String(s.port || 587));
      setSmtpEmail(s.email || "");
      setSmtpPassword(s.password || "");
      setUseSsl(s.use_ssl || false);
    }

    // Load email logo
    const { data: emailSettings } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "email_branding")
      .single();

    if (emailSettings?.value) {
      const e = emailSettings.value as Record<string, string>;
      const raw = e.logo_url;

      // Ignore legacy/invalid logo URLs (from other projects)
      const isLegacy = typeof raw === "string" && raw.includes("kabnbvnephjifeazaiis.supabase.co");
      if (raw && !isLegacy) setEmailLogoUrl(raw);
      else setEmailLogoUrl(DEFAULT_EMAIL_LOGO);
    } else {
      setEmailLogoUrl(DEFAULT_EMAIL_LOGO);
    }

    setLoading(false);
  };

  const fetchEmailTemplates = async () => {
    const { data } = await supabase.from("email_templates").select("*").order("template_type");
    if (data) setEmailTemplates(data);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem");
      return;
    }

    // Validate file size (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 3MB");
      return;
    }

    setUploadingLogo(true);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        throw new Error("Você precisa estar logado para fazer upload do logo");
      }

      const userId = userData.user.id;

      // Get file extension
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "png";
      const filePath = `${userId}/logo-email.${fileExt}`;

      // Delete existing logos (same user folder)
      await supabase.storage.from("avatars").remove([
        `${userId}/logo-email.png`,
        `${userId}/logo-email.gif`,
        `${userId}/logo-email.jpg`,
        `${userId}/logo-email.jpeg`,
        `${userId}/logo-email.webp`,
      ]);

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const newLogoUrl = urlData.publicUrl + `?t=${Date.now()}`;
      setEmailLogoUrl(newLogoUrl);

      // Save to admin_settings
      await supabase
        .from("admin_settings")
        .upsert({
          key: "email_branding",
          value: { logo_url: newLogoUrl },
          updated_at: new Date().toISOString(),
        }, { onConflict: "key" });

      toast.success("Logo atualizado com sucesso!");
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast.error(error.message || "Erro ao fazer upload do logo");
    }

    setUploadingLogo(false);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const resetLogoToDefault = async () => {
    setEmailLogoUrl(DEFAULT_EMAIL_LOGO);
    
    await supabase
      .from("admin_settings")
      .upsert({
        key: "email_branding",
        value: { logo_url: DEFAULT_EMAIL_LOGO },
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });

    toast.success("Logo resetado para o padrão");
  };

  const saveTracking = async () => {
    setSavingTracking(true);
    const { error } = await supabase
      .from("admin_settings")
      .update({
        value: {
          facebook_pixel: facebookPixel,
          google_ads_email: googleAdsEmail,
          google_ads_conversion: googleAdsConversion,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("key", "tracking");

    if (error) toast.error("Erro ao salvar");
    else toast.success("Configurações de tracking salvas!");
    setSavingTracking(false);
  };

  const saveWhatsapp = async () => {
    setSavingWhatsapp(true);
    const { data: current } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "notifications")
      .single();

    const currentValue = (current?.value as Record<string, any>) || {};

    const { error } = await supabase
      .from("admin_settings")
      .update({
        value: {
          ...currentValue,
          whatsapp_id: whatsappId,
          whatsapp_business_id: whatsappBusinessId,
          whatsapp_webhook: webhookUrl,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("key", "notifications");

    if (error) toast.error("Erro ao salvar");
    else toast.success("Configurações WhatsApp salvas!");
    setSavingWhatsapp(false);
  };

  const saveSmtp = async () => {
    setSavingSmtp(true);
    const { error } = await supabase
      .from("admin_settings")
      .upsert({
        key: "smtp",
        value: {
          host: smtpHost,
          port: Number(smtpPort),
          email: smtpEmail,
          password: smtpPassword,
          use_ssl: useSsl,
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    if (error) toast.error("Erro ao salvar SMTP");
    else toast.success("Configurações SMTP salvas!");
    setSavingSmtp(false);
  };

  const testSmtpConnection = async () => {
    if (!smtpHost || !smtpEmail || !smtpPassword) {
      toast.error("Preencha todos os campos SMTP antes de testar.");
      return;
    }

    // First save the settings
    const { error: saveError } = await supabase
      .from("admin_settings")
      .upsert({
        key: "smtp_settings",
        value: {
          host: smtpHost,
          port: parseInt(smtpPort) || 587,
          email: smtpEmail,
          password: smtpPassword,
          useSsl: useSsl,
          fromName: "La Casa Dark"
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    if (saveError) {
      toast.error("Erro ao salvar configurações antes do teste");
      return;
    }

    setTestingSmtp(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-test-email', {
        body: { toEmail: smtpEmail }
      });

      if (error) {
        console.error("Edge function error:", error);
        toast.error(error.message || "Erro ao enviar email de teste");
      } else if (data?.success) {
        toast.success(data.message || "Email de teste enviado com sucesso!");
      } else {
        toast.error(data?.error || "Erro ao enviar email de teste");
      }
    } catch (err: any) {
      console.error("Test email error:", err);
      toast.error(err.message || "Erro ao conectar com o serviço de email");
    }
    
    setTestingSmtp(false);
  };

  const updateTemplate = async (template: EmailTemplate) => {
    const { error } = await supabase
      .from("email_templates")
      .update({
        subject: template.subject,
        body: template.body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", template.id);

    if (error) toast.error("Erro ao salvar template");
    else toast.success("Template salvo!");
  };

  const resetTemplateToDefault = async (template: EmailTemplate) => {
    const defaultTemplate = DEFAULT_TEMPLATES[template.template_type];
    if (!defaultTemplate) {
      toast.error("Template padrão não encontrado");
      return;
    }

    // Replace logo URL in template body with current logo
    const updatedBody = replaceLogoInHtml(defaultTemplate.body);

    const { error } = await supabase
      .from("email_templates")
      .update({
        subject: defaultTemplate.subject,
        body: updatedBody,
        updated_at: new Date().toISOString(),
      })
      .eq("id", template.id);

    if (error) {
      toast.error("Erro ao resetar template");
    } else {
      toast.success("Template resetado com o logo atual!");
      fetchEmailTemplates();
    }
  };

  const resetAllTemplatesToDefault = async () => {
    toast.loading("Aplicando tema La Casa Dark com logo atual...", { id: "apply-theme" });
    
    for (const template of emailTemplates) {
      const defaultTemplate = DEFAULT_TEMPLATES[template.template_type];
      if (defaultTemplate) {
        // Replace logo URL in template body with current logo
        const updatedBody = replaceLogoInHtml(defaultTemplate.body);

        await supabase
          .from("email_templates")
          .update({
            subject: defaultTemplate.subject,
            body: updatedBody,
            updated_at: new Date().toISOString(),
          })
          .eq("id", template.id);
      }
    }
    
    toast.success("Templates atualizados com tema La Casa Dark e logo atual!", { id: "apply-theme" });
    fetchEmailTemplates();
  };

  const sendTemplateTest = async (template: EmailTemplate) => {
    const email = testEmailDestination.trim() || smtpEmail;
    if (!email) {
      toast.error("Configure um email de destino para o teste");
      return;
    }

    setSendingTemplate(template.id);

    try {
      // Replace variables with sample data
      const htmlBody = renderPreviewWithVariables(template.body);

      const { data, error } = await supabase.functions.invoke("send-template-test", {
        body: {
          toEmail: email,
          subject: template.subject.replace(/\{\{plan_name\}\}/g, "TURBO MAKER"),
          htmlBody,
        },
      });

      if (error) {
        console.error("Send template error:", error);
        toast.error(error.message || "Erro ao enviar template");
      } else if (data?.success) {
        toast.success(`Template "${getTemplateLabel(template.template_type)}" enviado para ${email}!`);
      } else {
        toast.error(data?.error || "Erro ao enviar template");
      }
    } catch (err: any) {
      console.error("Send template error:", err);
      toast.error(err.message || "Erro ao enviar template");
    }

    setSendingTemplate(null);
  };

  const getTemplateLabel = (type: string) => {
    const labels: Record<string, string> = {
      welcome: "Bem-vindo (Registro)",
      pending_approval: "Aguardando Liberação",
      access_approved: "Acesso Liberado (Aprovação)",
      password_recovery: "Recuperação de Senha",
      plan_cancellation: "Cancelamento de Plano",
      payment_confirmation: "Confirmação de Pagamento",
      credits_purchase: "Compra de Pacote de Créditos",
      blocked_password: "Senha Bloqueada",
      plan_start: "Plano Ativado",
      plan_renewal: "Plano Renovado",
      renewal_reminder: "Lembrete de Renovação",
      plan_expired: "Plano Expirado",
    };
    return labels[type] || type;
  };

  const getTemplateIcon = (type: string) => {
    const icons: Record<string, string> = {
      welcome: "🚀",
      pending_approval: "⏳",
      access_approved: "✅",
      password_recovery: "🔐",
      plan_cancellation: "📋",
      payment_confirmation: "💳",
      credits_purchase: "⚡",
      blocked_password: "🔒",
      plan_start: "🎉",
      plan_renewal: "🔄",
      renewal_reminder: "⏰",
      plan_expired: "🚫",
    };
    return icons[type] || "📧";
  };

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const resolveLogoUrl = (raw?: string) => {
    if (!raw) return DEFAULT_EMAIL_LOGO;

    // block known legacy URL that points to a different project
    if (raw.includes("kabnbvnephjifeazaiis.supabase.co")) return DEFAULT_EMAIL_LOGO;

    // allow absolute http(s)
    if (/^https?:\/\//i.test(raw)) return raw;

    // allow absolute path
    if (raw.startsWith("/")) {
      try {
        return typeof window !== "undefined" ? `${window.location.origin}${raw}` : raw;
      } catch {
        return raw;
      }
    }

    // otherwise fallback
    return DEFAULT_EMAIL_LOGO;
  };

  const replaceLogoInHtml = (html: string) => {
    const logo = resolveLogoUrl(emailLogoUrl);

    // Replace any previous default/legacy logo URLs and any logo-email.* occurrences
    const legacyDefaults = [
      DEFAULT_EMAIL_LOGO,
      "https://kabnbvnephjifeazaiis.supabase.co/storage/v1/object/public/avatars/logo-email.gif",
      "https://aqbpqxxcuvueqfwyhrgw.supabase.co/storage/v1/object/public/blog-images/logo-email.gif",
      "https://aqbpqxxcuvueqfwyhrgw.supabase.co/storage/v1/object/public/avatars/logo-email.gif",
    ];

    let out = html;

    // Replace {{logo_url}} placeholder
    out = out.replace(/\{\{logo_url\}\}/g, logo);

    for (const legacy of legacyDefaults) {
      out = out.replace(new RegExp(escapeRegExp(legacy), "g"), logo);
    }

    out = out.replace(
      /src="[^"]*logo-email\.(?:gif|png|jpe?g|webp)(?:\?[^\"]*)?"/gi,
      `src="${logo}"`
    );

    return out;
  };

  const renderPreviewWithVariables = (body: string) => {
    // Replace variables with sample data for preview
    const withVars = body
      .replace(/\{\{name\}\}/g, "João Silva")
      .replace(/\{\{email\}\}/g, "joao@exemplo.com")
      .replace(/\{\{login_url\}\}/g, "#")
      .replace(/\{\{reset_link\}\}/g, "#")
      .replace(/\{\{plan_name\}\}/g, "TURBO MAKER")
      .replace(/\{\{amount\}\}/g, "R$ 99,90")
      .replace(/\{\{status\}\}/g, "Aprovado")
      .replace(/\{\{credits_amount\}\}/g, "5.000")
      .replace(/\{\{date_cancellation\}\}/g, "06/01/2026")
      .replace(/\{\{date_end\}\}/g, "06/02/2026")
      .replace(/\{\{transaction_id\}\}/g, "TXN-123456")
      .replace(/\{\{days_remaining\}\}/g, "3")
      .replace(/\{\{renewal_link\}\}/g, "#");

    return replaceLogoInHtml(withVars);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Facebook Pixel */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Facebook className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-foreground">Facebook Pixel</h3>
        </div>
        <label className="text-sm text-muted-foreground mb-2 block">Pixel ID do Facebook</label>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Ex: 1234567890123456"
            value={facebookPixel}
            onChange={(e) => setFacebookPixel(e.target.value)}
            className="bg-secondary border-border flex-1"
          />
          <Button onClick={saveTracking} disabled={savingTracking}>
            {savingTracking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
          </Button>
        </div>
        <Alert className="border-primary/50 bg-primary/10">
          <Info className="w-4 h-4 text-primary" />
          <AlertDescription className="text-primary">
            O Facebook Pixel permite rastrear conversões e otimizar anúncios. Configure o Pixel ID para rastrear eventos na plataforma.
          </AlertDescription>
        </Alert>
      </Card>

      {/* Google Ads */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Chrome className="w-5 h-5 text-green-500" />
          <h3 className="font-semibold text-foreground">Google Ads (Conversion Tracking)</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Email Conectado para Google Ads
            </label>
            <Input
              placeholder="c-adx@domain.gserviceaccount.com"
              value={googleAdsEmail}
              onChange={(e) => setGoogleAdsEmail(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Código de conversão
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="AW-xxxxxxxxx/xxxxxxxxx"
                value={googleAdsConversion}
                onChange={(e) => setGoogleAdsConversion(e.target.value)}
                className="bg-secondary border-border flex-1"
              />
              <Button onClick={saveTracking} disabled={savingTracking}>
                {savingTracking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Tracking Status */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-semibold text-foreground">Status de Rastreamento</h3>
        </div>
        <div className="flex gap-4 flex-wrap">
          <Badge className={facebookPixel ? "bg-success/20 text-success" : "bg-secondary"}>
            <span className="mr-2">Facebook Pixel</span>
            {facebookPixel ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          </Badge>
          <Badge className={googleAdsConversion ? "bg-success/20 text-success" : "bg-secondary"}>
            <span className="mr-2">Google Ads</span>
            {googleAdsConversion ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          </Badge>
          <Badge className={smtpHost && smtpEmail ? "bg-success/20 text-success" : "bg-secondary"}>
            <span className="mr-2">SMTP Email</span>
            {smtpHost && smtpEmail ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          </Badge>
          <Badge className={whatsappBusinessId ? "bg-success/20 text-success" : "bg-secondary"}>
            <span className="mr-2">WhatsApp</span>
            {whatsappBusinessId ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          </Badge>
        </div>
      </Card>

      {/* WhatsApp Webhook */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-green-500" />
          <h3 className="font-semibold text-foreground">Webhook WhatsApp (Mensagens Automáticas)</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Token de Acesso WhatsApp Business API
            </label>
            <Input
              placeholder="EAAxxxxx..."
              value={whatsappId}
              onChange={(e) => setWhatsappId(e.target.value)}
              className="bg-secondary border-border"
              type="password"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Número do WhatsApp Business (somente números)
            </label>
            <Input
              placeholder="Ex: 5511984780012"
              value={whatsappBusinessId}
              onChange={(e) => setWhatsappBusinessId(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              URL do Webhook
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="https://api.seudominio.com/webhook/whatsapp"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="bg-secondary border-border flex-1"
              />
              <Button 
                variant="outline" 
                onClick={() => {
                  navigator.clipboard.writeText(webhookUrl);
                  toast.success("URL copiada!");
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Button onClick={saveWhatsapp} disabled={savingWhatsapp} className="w-full">
            {savingWhatsapp ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Salvar Configurações WhatsApp
          </Button>
        </div>
      </Card>

      {/* Email Logo Upload */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Logo dos Emails</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Faça upload do logo que aparecerá no header de todos os emails enviados pela plataforma.
        </p>

        <div className="flex items-center gap-6">
          {/* Logo Preview */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/70 p-[3px]">
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                <img 
                  src={emailLogoUrl} 
                  alt="Email Logo" 
                  className="w-20 h-20 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_EMAIL_LOGO_FALLBACK_PATH;
                  }}
                />
              </div>
            </div>
          </div>

          {/* Upload Controls */}
          <div className="flex-1 space-y-3">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            
            <div className="flex gap-2">
              <Button 
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="bg-primary text-primary-foreground"
              >
                {uploadingLogo ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {uploadingLogo ? "Enviando..." : "Upload Logo"}
              </Button>
              
              <Button 
                variant="outline"
                onClick={resetLogoToDefault}
                disabled={uploadingLogo}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Resetar
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Formato: PNG, JPG ou GIF. Tamanho máximo: 3MB. Recomendado: 200x200px
            </p>
          </div>
        </div>

        <Alert className="mt-4 border-primary/50 bg-primary/10">
          <Info className="w-4 h-4 text-primary" />
          <AlertDescription className="text-primary">
            O logo será exibido em formato circular no header dos emails. Use uma imagem quadrada para melhor resultado.
          </AlertDescription>
        </Alert>
      </Card>

      {/* Email Templates */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Templates de Email Automático</h3>
          </div>
          <Button size="sm" variant="outline" onClick={resetAllTemplatesToDefault} className="gap-2">
            <Wand2 className="w-4 h-4" />
            Aplicar Tema La Casa Dark
          </Button>
        </div>
        
        {/* Test Email Destination */}
        <div className="flex items-center gap-4 mb-4 p-4 bg-secondary/30 rounded-lg">
          <div className="flex-1">
            <label className="text-sm text-muted-foreground mb-2 block">Email de Destino para Testes</label>
            <Input
              placeholder="Deixe vazio para usar o email SMTP configurado"
              value={testEmailDestination}
              onChange={(e) => setTestEmailDestination(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div className="text-xs text-muted-foreground mt-6">
            📱 Envie para seu email e teste em dispositivos móveis
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Templates HTML premium com o tema La Casa Dark Core. Use o botão ✉️ para enviar e testar em dispositivos móveis.
        </p>

        <div className="space-y-3">
          {emailTemplates.map((template) => (
            <div key={template.id} className="border border-border rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => setExpandedTemplate(expandedTemplate === template.id ? null : template.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getTemplateIcon(template.template_type)}</span>
                  <Badge variant="secondary">{getTemplateLabel(template.template_type)}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      sendTemplateTest(template);
                    }}
                    disabled={sendingTemplate === template.id}
                    title="Enviar template por email"
                    className="text-primary hover:text-primary"
                  >
                    {sendingTemplate === template.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewTemplate(template);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetTemplateToDefault(template);
                    }}
                    title="Resetar para padrão"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  {expandedTemplate === template.id ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {expandedTemplate === template.id && (
                <div className="p-4 border-t border-border space-y-4 bg-secondary/20">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Assunto do Email</label>
                    <Input
                      value={template.subject}
                      onChange={(e) =>
                        setEmailTemplates((prev) =>
                          prev.map((t) => (t.id === template.id ? { ...t, subject: e.target.value } : t))
                        )
                      }
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Corpo do Email (HTML)</label>
                    <Textarea
                      value={template.body}
                      onChange={(e) =>
                        setEmailTemplates((prev) =>
                          prev.map((t) => (t.id === template.id ? { ...t, body: e.target.value } : t))
                        )
                      }
                      className="bg-secondary border-border min-h-48 font-mono text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">Variáveis:</span>
                    {template.variables.map((v) => (
                      <Badge key={v} variant="outline" className="text-xs font-mono">
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-success text-success-foreground hover:bg-success/90"
                      onClick={() => updateTemplate(template)}
                    >
                      Salvar Template
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* SMTP Configuration */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Configuração de SMTP (Envio de Emails)</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Servidor SMTP</label>
            <Input
              placeholder="smtp.gmail.com"
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Porta</label>
            <Input
              placeholder="587"
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Email de Envio</label>
            <Input
              placeholder="noreply@seudominio.com"
              value={smtpEmail}
              onChange={(e) => setSmtpEmail(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Senha/App Password</label>
            <Input
              placeholder="••••••••••••••••"
              value={smtpPassword}
              onChange={(e) => setSmtpPassword(e.target.value)}
              className="bg-secondary border-border"
              type="password"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <Checkbox checked={useSsl} onCheckedChange={(v) => setUseSsl(!!v)} />
          <span className="text-sm text-muted-foreground">Usar SSL/TLS</span>
        </div>
        <div className="flex gap-2">
          <Button onClick={saveSmtp} disabled={savingSmtp} className="flex-1 bg-success text-success-foreground">
            {savingSmtp ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Salvar Configuração SMTP
          </Button>
          <Button 
            variant="secondary" 
            className="flex-1"
            onClick={testSmtpConnection}
            disabled={testingSmtp}
          >
            {testingSmtp ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Enviar Email de Teste
          </Button>
        </div>
        <Alert className="mt-4 border-primary/50 bg-primary/10">
          <Info className="w-4 h-4 text-primary" />
          <AlertDescription className="text-primary">
            Para Gmail, use uma "App Password" em vez da senha normal. Acesse: Google Account → Security → 2-Step Verification → App passwords.
          </AlertDescription>
        </Alert>
      </Card>

      {/* Email Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Preview: {previewTemplate && getTemplateLabel(previewTemplate.template_type)}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-4">
            {previewTemplate && (
              <div className="space-y-4">
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">
                    <strong>Assunto:</strong> {previewTemplate.subject}
                  </p>
                </div>
                <div 
                  className="border border-border rounded-lg overflow-auto max-h-[60vh]"
                  dangerouslySetInnerHTML={{ 
                    __html: renderPreviewWithVariables(previewTemplate.body) 
                  }}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
