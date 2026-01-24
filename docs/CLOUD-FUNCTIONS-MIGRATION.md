# 🔥 Guia de Migração: Edge Functions → Cloud Functions

Este guia detalha como converter as **52 Edge Functions** do Supabase (Deno) para **Cloud Functions** do Firebase (Node.js).

## 📊 Visão Geral da Migração

| Aspecto | Supabase Edge Functions | Firebase Cloud Functions |
|---------|------------------------|-------------------------|
| Runtime | Deno | Node.js 18/20 |
| Linguagem | TypeScript (Deno) | TypeScript (Node.js) |
| Deploy | Automático via Lovable | `firebase deploy --only functions` |
| Secrets | `Deno.env.get()` | `functions.config()` ou Secret Manager |
| CORS | Manual | Manual ou HTTPS Callable |
| Auth | JWT manual | Firebase Admin SDK |
| Database | Supabase Client | Firebase Admin SDK |

---

## 🗂️ Inventário de Functions (52 total)

### 🤖 AI & Geração (8)
| Function | Complexidade | Dependências |
|----------|-------------|--------------|
| `ai-assistant` | 🔴 Alta | OpenAI, Gemini, Claude, Laozhang |
| `generate-image` | 🟡 Média | ImageFX, Lovable AI |
| `generate-imagefx` | 🟡 Média | ImageFX API |
| `generate-scenes` | 🟡 Média | AI APIs |
| `generate-thumbnail` | 🟡 Média | AI APIs |
| `generate-tts` | 🟡 Média | ElevenLabs |
| `generate-video-laozhang` | 🟡 Média | Laozhang API |
| `generate-video-montage` | 🟡 Média | FFmpeg |

### 📺 YouTube (8)
| Function | Complexidade | Dependências |
|----------|-------------|--------------|
| `youtube-auth-url` | 🟢 Baixa | OAuth |
| `youtube-oauth-callback` | 🟡 Média | OAuth |
| `youtube-refresh-token` | 🟢 Baixa | OAuth |
| `youtube-disconnect` | 🟢 Baixa | - |
| `youtube-upload` | 🟡 Média | YouTube API |
| `youtube-channel-analytics` | 🟡 Média | YouTube API |
| `fetch-youtube-analytics` | 🟡 Média | YouTube API |
| `fetch-channel-videos` | 🟡 Média | YouTube API |

### 💳 Pagamentos (4)
| Function | Complexidade | Dependências |
|----------|-------------|--------------|
| `stripe-webhook` | 🔴 Alta | Stripe SDK |
| `create-checkout` | 🟡 Média | Stripe SDK |
| `customer-portal` | 🟢 Baixa | Stripe SDK |
| `check-subscription` | 🟡 Média | Stripe SDK |

### 📧 Email (12)
| Function | Complexidade | Dependências |
|----------|-------------|--------------|
| `send-welcome-email` | 🟡 Média | Nodemailer |
| `send-approved-email` | 🟡 Média | Nodemailer |
| `send-pending-email` | 🟡 Média | Nodemailer |
| `send-auth-email` | 🟡 Média | Nodemailer |
| `send-password-reset` | 🟡 Média | Nodemailer |
| `send-email-viral` | 🟡 Média | Nodemailer |
| `send-migration-invite` | 🟡 Média | Nodemailer |
| `send-newsletter-welcome` | 🟡 Média | Nodemailer |
| `send-renewal-reminders` | 🟡 Média | Nodemailer |
| `send-template-test` | 🟡 Média | Nodemailer |
| `send-test-email` | 🟢 Baixa | Nodemailer |
| `send-admin-notification` | 🟡 Média | Nodemailer |

### 📱 WhatsApp (2)
| Function | Complexidade | Dependências |
|----------|-------------|--------------|
| `send-whatsapp-viral` | 🟡 Média | WhatsApp API |
| `send-whatsapp-welcome` | 🟡 Média | WhatsApp API |

### 📊 Análise (7)
| Function | Complexidade | Dependências |
|----------|-------------|--------------|
| `analyze-channel` | 🟡 Média | AI APIs |
| `analyze-posting-times` | 🟡 Média | AI APIs |
| `analyze-titles` | 🟡 Média | AI APIs |
| `analyze-transcript` | 🟡 Média | AI APIs |
| `transcribe-video` | 🟡 Média | Whisper API |
| `check-new-videos` | 🟡 Média | YouTube API |
| `get-viral-monitoring-configs` | 🟢 Baixa | - |

### 📝 Blog & SEO (4)
| Function | Complexidade | Dependências |
|----------|-------------|--------------|
| `generate-blog-article` | 🟡 Média | AI APIs |
| `generate-blog-cover` | 🟡 Média | AI APIs |
| `generate-sitemap` | 🟢 Baixa | - |
| `track-blog-view` | 🟢 Baixa | - |

### 🔧 Utilitários (7)
| Function | Complexidade | Dependências |
|----------|-------------|--------------|
| `ensure-user-profile` | 🟢 Baixa | - |
| `delete-user` | 🟡 Média | Auth |
| `validate-api-key` | 🟢 Baixa | - |
| `check-schedule-reminders` | 🟡 Média | - |
| `trigger-viral-detection` | 🟡 Média | n8n |
| `viral-webhook` | 🟡 Média | - |
| `track-product-click` | 🟢 Baixa | - |

---

## 🔄 Padrões de Conversão

### 1. Estrutura Básica

**Supabase (Deno):**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { param1, param2 } = await req.json();
    
    // Lógica aqui
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

**Firebase (Node.js):**
```typescript
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import cors from "cors";

// Inicializar admin se ainda não foi
if (!admin.apps.length) {
  admin.initializeApp();
}

const corsHandler = cors({ origin: true });

export const myFunction = functions
  .region("southamerica-east1")
  .https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
      try {
        const { param1, param2 } = req.body;
        
        // Lógica aqui
        
        res.status(200).json({ success: true });
      } catch (error: any) {
        console.error("Error:", error);
        res.status(500).json({ error: error.message });
      }
    });
  });
```

### 2. Variáveis de Ambiente

**Supabase (Deno):**
```typescript
const apiKey = Deno.env.get("API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
```

**Firebase (Node.js) - Opção 1: Environment Config:**
```typescript
// Definir: firebase functions:config:set api.key="your-key"
const apiKey = functions.config().api.key;
```

**Firebase (Node.js) - Opção 2: Secret Manager (Recomendado):**
```typescript
import { defineSecret } from "firebase-functions/params";

const apiKey = defineSecret("API_KEY");

export const myFunction = functions
  .runWith({ secrets: [apiKey] })
  .https.onRequest((req, res) => {
    const key = apiKey.value();
    // ...
  });
```

### 3. Autenticação de Usuário

**Supabase (Deno):**
```typescript
const authHeader = req.headers.get("authorization");
const token = authHeader?.replace("Bearer ", "");

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const { data: { user } } = await supabaseAdmin.auth.getUser(token);
const userId = user?.id;
```

**Firebase (Node.js):**
```typescript
// Verificar token do Firebase Auth
const authHeader = req.headers.authorization;
const token = authHeader?.replace("Bearer ", "");

if (!token) {
  return res.status(401).json({ error: "Unauthorized" });
}

try {
  const decodedToken = await admin.auth().verifyIdToken(token);
  const userId = decodedToken.uid;
  // ...
} catch (error) {
  return res.status(401).json({ error: "Invalid token" });
}
```

### 4. Operações de Banco de Dados

**Supabase (Deno):**
```typescript
const { data, error } = await supabaseAdmin
  .from("profiles")
  .select("*")
  .eq("user_id", userId)
  .single();

await supabaseAdmin
  .from("generated_scripts")
  .insert({ user_id: userId, content: "..." });

await supabaseAdmin
  .from("user_credits")
  .update({ balance: newBalance })
  .eq("user_id", userId);
```

**Firebase (Node.js):**
```typescript
const db = admin.firestore();

// SELECT
const profileDoc = await db.collection("profiles").doc(userId).get();
const profile = profileDoc.data();

// INSERT
await db.collection("generated_scripts").add({
  user_id: userId,
  content: "...",
  created_at: admin.firestore.FieldValue.serverTimestamp(),
});

// UPDATE
await db.collection("user_credits").doc(userId).update({
  balance: newBalance,
  updated_at: admin.firestore.FieldValue.serverTimestamp(),
});
```

### 5. Storage

**Supabase (Deno):**
```typescript
const { data, error } = await supabaseAdmin.storage
  .from("images")
  .upload(`${userId}/image.png`, file, {
    contentType: "image/png",
  });

const { data: { publicUrl } } = supabaseAdmin.storage
  .from("images")
  .getPublicUrl(`${userId}/image.png`);
```

**Firebase (Node.js):**
```typescript
const bucket = admin.storage().bucket();

// Upload
await bucket.file(`images/${userId}/image.png`).save(buffer, {
  contentType: "image/png",
  metadata: { cacheControl: "public, max-age=31536000" },
});

// Get public URL
const [url] = await bucket.file(`images/${userId}/image.png`).getSignedUrl({
  action: "read",
  expires: "03-01-2030",
});
```

---

## 📦 Estrutura do Projeto Firebase

```
functions/
├── src/
│   ├── index.ts              # Exporta todas as functions
│   ├── config/
│   │   └── firebase.ts       # Configuração do Admin SDK
│   ├── utils/
│   │   ├── auth.ts           # Helpers de autenticação
│   │   ├── cors.ts           # Configuração CORS
│   │   ├── credits.ts        # Sistema de créditos
│   │   └── email.ts          # Helpers de email
│   ├── ai/
│   │   ├── assistant.ts      # ai-assistant
│   │   ├── generateImage.ts  # generate-image
│   │   ├── generateScenes.ts # generate-scenes
│   │   └── ...
│   ├── youtube/
│   │   ├── authUrl.ts        # youtube-auth-url
│   │   ├── callback.ts       # youtube-oauth-callback
│   │   └── ...
│   ├── stripe/
│   │   ├── webhook.ts        # stripe-webhook
│   │   ├── checkout.ts       # create-checkout
│   │   └── ...
│   ├── email/
│   │   ├── welcome.ts        # send-welcome-email
│   │   └── ...
│   └── scheduled/
│       ├── checkReminders.ts # Cron jobs
│       └── ...
├── package.json
├── tsconfig.json
└── .env.example
```

---

## 🔑 Configuração de Secrets

### Secrets Necessários

```bash
# AI APIs
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set GEMINI_API_KEY
firebase functions:secrets:set CLAUDE_API_KEY
firebase functions:secrets:set LAOZHANG_API_KEY
firebase functions:secrets:set ELEVENLABS_API_KEY

# Stripe
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET

# YouTube OAuth
firebase functions:secrets:set YOUTUBE_CLIENT_ID
firebase functions:secrets:set YOUTUBE_CLIENT_SECRET

# Email SMTP
firebase functions:secrets:set SMTP_HOST
firebase functions:secrets:set SMTP_PORT
firebase functions:secrets:set SMTP_USER
firebase functions:secrets:set SMTP_PASS

# WhatsApp
firebase functions:secrets:set WHATSAPP_API_TOKEN
firebase functions:secrets:set WHATSAPP_PHONE_ID
```

---

## 🔄 Exemplos de Conversão Completa

### Exemplo 1: send-welcome-email

**Antes (Supabase/Deno):**
```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import nodemailer from "npm:nodemailer";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const { email, fullName } = await req.json();
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Buscar template
  const { data: template } = await supabaseAdmin
    .from("email_templates")
    .select("*")
    .eq("template_type", "welcome")
    .single();

  // Enviar email
  const transporter = nodemailer.createTransport({...});
  await transporter.sendMail({...});

  return new Response(JSON.stringify({ success: true }), {...});
});
```

**Depois (Firebase/Node.js):**
```typescript
// functions/src/email/welcome.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";
import cors from "cors";
import { defineSecret } from "firebase-functions/params";

const smtpHost = defineSecret("SMTP_HOST");
const smtpUser = defineSecret("SMTP_USER");
const smtpPass = defineSecret("SMTP_PASS");

const corsHandler = cors({ origin: true });
const db = admin.firestore();

export const sendWelcomeEmail = functions
  .region("southamerica-east1")
  .runWith({ secrets: [smtpHost, smtpUser, smtpPass] })
  .https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
      try {
        if (req.method === "OPTIONS") {
          return res.status(204).send("");
        }

        const { email, fullName } = req.body;

        if (!email) {
          return res.status(400).json({ error: "Email é obrigatório" });
        }

        // Buscar template do Firestore
        const templateDoc = await db
          .collection("email_templates")
          .where("template_type", "==", "welcome")
          .where("is_active", "==", true)
          .limit(1)
          .get();

        if (templateDoc.empty) {
          throw new Error("Template não encontrado");
        }

        const template = templateDoc.docs[0].data();

        // Substituir variáveis
        let emailBody = template.body
          .replace(/\{\{nome\}\}/g, fullName || email.split("@")[0])
          .replace(/\{\{email\}\}/g, email);

        // Configurar transporter
        const transporter = nodemailer.createTransport({
          host: smtpHost.value(),
          port: 587,
          secure: false,
          auth: {
            user: smtpUser.value(),
            pass: smtpPass.value(),
          },
        });

        // Enviar email
        await transporter.sendMail({
          from: `"La Casa Dark Core" <${smtpUser.value()}>`,
          to: email,
          subject: template.subject,
          html: emailBody,
        });

        console.log(`Welcome email sent to ${email}`);
        res.status(200).json({ success: true });

      } catch (error: any) {
        console.error("Error sending welcome email:", error);
        res.status(500).json({ error: error.message });
      }
    });
  });
```

### Exemplo 2: stripe-webhook

**Depois (Firebase/Node.js):**
```typescript
// functions/src/stripe/webhook.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import { defineSecret } from "firebase-functions/params";

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

const db = admin.firestore();

export const stripeWebhook = functions
  .region("southamerica-east1")
  .runWith({ 
    secrets: [stripeSecretKey, stripeWebhookSecret],
    memory: "256MB"
  })
  .https.onRequest(async (req, res) => {
    const stripe = new Stripe(stripeSecretKey.value(), {
      apiVersion: "2023-10-16",
    });

    const signature = req.headers["stripe-signature"] as string;

    if (!signature) {
      return res.status(400).json({ error: "No signature" });
    }

    try {
      const event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        stripeWebhookSecret.value()
      );

      console.log(`Stripe event: ${event.type}`);

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const customerEmail = session.customer_email;

          // Buscar usuário pelo email
          const usersSnapshot = await db
            .collection("profiles")
            .where("email", "==", customerEmail)
            .limit(1)
            .get();

          if (!usersSnapshot.empty) {
            const userId = usersSnapshot.docs[0].id;
            
            // Atualizar role do usuário
            await db.collection("user_roles").doc(userId).set({
              role: "pro",
              updated_at: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });

            console.log(`User ${userId} upgraded to pro`);
          }
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const customer = await stripe.customers.retrieve(
            subscription.customer as string
          );

          if (!customer.deleted && customer.email) {
            const usersSnapshot = await db
              .collection("profiles")
              .where("email", "==", customer.email)
              .limit(1)
              .get();

            if (!usersSnapshot.empty) {
              const userId = usersSnapshot.docs[0].id;
              
              await db.collection("user_roles").doc(userId).set({
                role: "free",
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
              }, { merge: true });

              console.log(`User ${userId} downgraded to free`);
            }
          }
          break;
        }
      }

      res.status(200).json({ received: true });

    } catch (error: any) {
      console.error("Webhook error:", error);
      res.status(400).json({ error: error.message });
    }
  });
```

### Exemplo 3: ai-assistant (Parcial)

**Depois (Firebase/Node.js):**
```typescript
// functions/src/ai/assistant.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import cors from "cors";
import { defineSecret } from "firebase-functions/params";

const openaiKey = defineSecret("OPENAI_API_KEY");
const geminiKey = defineSecret("GEMINI_API_KEY");

const corsHandler = cors({ origin: true });
const db = admin.firestore();

// Sistema de créditos
async function checkAndDebitCredits(
  userId: string,
  creditsNeeded: number,
  operationType: string
): Promise<{ success: boolean; error?: string }> {
  const creditRef = db.collection("user_credits").doc(userId);
  
  return db.runTransaction(async (transaction) => {
    const creditDoc = await transaction.get(creditRef);
    const currentBalance = creditDoc.exists 
      ? creditDoc.data()?.balance || 0 
      : 0;

    if (currentBalance < creditsNeeded) {
      return {
        success: false,
        error: `Créditos insuficientes. Necessário: ${creditsNeeded}, Disponível: ${currentBalance}`,
      };
    }

    const newBalance = currentBalance - creditsNeeded;

    transaction.update(creditRef, {
      balance: newBalance,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Registrar uso
    const usageRef = db.collection("credit_usage").doc();
    transaction.set(usageRef, {
      user_id: userId,
      operation_type: operationType,
      credits_used: creditsNeeded,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  });
}

export const aiAssistant = functions
  .region("southamerica-east1")
  .runWith({
    secrets: [openaiKey, geminiKey],
    memory: "1GB",
    timeoutSeconds: 300,
  })
  .https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
      try {
        // Verificar autenticação
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userId = decodedToken.uid;

        const { type, prompt, model = "gpt-4o" } = req.body;

        // Verificar e debitar créditos
        const creditsNeeded = 5; // Calcular baseado no tipo
        const creditCheck = await checkAndDebitCredits(
          userId,
          creditsNeeded,
          type
        );

        if (!creditCheck.success) {
          return res.status(400).json({ error: creditCheck.error });
        }

        // Chamar AI API
        let response;
        if (model.includes("gemini")) {
          response = await callGemini(prompt, geminiKey.value());
        } else {
          response = await callOpenAI(prompt, openaiKey.value());
        }

        res.status(200).json({
          success: true,
          content: response,
          credits_used: creditsNeeded,
        });

      } catch (error: any) {
        console.error("AI Assistant error:", error);
        res.status(500).json({ error: error.message });
      }
    });
  });

// Helper functions
async function callOpenAI(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
```

---

## ⏰ Scheduled Functions (Cron Jobs)

**Supabase:** Usa pg_cron ou webhooks externos

**Firebase:** Usa Cloud Scheduler integrado

```typescript
// functions/src/scheduled/checkReminders.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

// Executa todos os dias às 8h (horário de Brasília)
export const checkScheduleReminders = functions
  .region("southamerica-east1")
  .pubsub.schedule("0 8 * * *")
  .timeZone("America/Sao_Paulo")
  .onRun(async (context) => {
    console.log("Checking schedule reminders...");

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Buscar agendamentos para amanhã
    const schedulesSnapshot = await db
      .collection("publication_schedule")
      .where("scheduled_date", ">=", today.toISOString().split("T")[0])
      .where("scheduled_date", "<=", tomorrow.toISOString().split("T")[0])
      .where("reminder_enabled", "==", true)
      .where("reminder_sent", "==", false)
      .get();

    for (const doc of schedulesSnapshot.docs) {
      const schedule = doc.data();
      
      // Enviar notificação push
      // Marcar reminder como enviado
      await doc.ref.update({ reminder_sent: true });
    }

    console.log(`Processed ${schedulesSnapshot.size} reminders`);
    return null;
  });
```

---

## 📋 Checklist de Migração

### Para cada função:

- [ ] Criar arquivo no diretório correto
- [ ] Converter imports de Deno para Node.js
- [ ] Substituir `Deno.env.get()` por `defineSecret()`
- [ ] Converter `serve()` para `functions.https.onRequest()`
- [ ] Adaptar operações de banco para Firestore
- [ ] Adicionar tratamento de erros adequado
- [ ] Testar localmente com emuladores
- [ ] Configurar secrets no Firebase
- [ ] Deploy e testar em produção

### Dependências NPM necessárias:

```json
{
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^4.5.0",
    "cors": "^2.8.5",
    "nodemailer": "^6.9.0",
    "stripe": "^14.0.0",
    "openai": "^4.0.0",
    "@google/generative-ai": "^0.2.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/cors": "^2.8.0",
    "@types/nodemailer": "^6.4.0"
  }
}
```

---

## 🚀 Deploy

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar projeto
firebase init functions

# Configurar secrets
firebase functions:secrets:set API_KEY

# Deploy apenas functions
firebase deploy --only functions

# Deploy função específica
firebase deploy --only functions:aiAssistant
```

---

## 📚 Recursos

- [Firebase Cloud Functions Docs](https://firebase.google.com/docs/functions)
- [Migrate from Supabase](https://firebase.google.com/docs/firestore/solutions/migrate-from-supabase)
- [Functions Secrets](https://firebase.google.com/docs/functions/config-env)
- [Scheduled Functions](https://firebase.google.com/docs/functions/schedule-functions)
