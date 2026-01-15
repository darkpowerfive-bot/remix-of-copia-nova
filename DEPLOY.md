# 🚀 Deploy La Casa Dark CORE no EasyPanel

## 📋 Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Configuração do Servidor](#configuração-do-servidor)
3. [Deploy no EasyPanel](#deploy-no-easypanel)
4. [Configuração de Domínios](#configuração-de-domínios)
5. [Variáveis de Ambiente](#variáveis-de-ambiente)
6. [Modo Manutenção](#modo-manutenção)
7. [Verificação e Troubleshooting](#verificação-e-troubleshooting)

---

## 🎯 Domínios Configurados

| Domínio | Função |
|---------|--------|
| `www.canaisdarks.com.br` | Landing Page (pública) |
| `canaisdarks.com.br` | Redireciona para www |
| `app.canaisdarks.com.br` | Aplicação (requer login) |

---

## ✅ Pré-requisitos

- [ ] VPS com Ubuntu 20.04+ ou Debian 11+
- [ ] Mínimo 2GB RAM, 2 vCPU
- [ ] EasyPanel instalado
- [ ] Domínio configurado no provedor DNS
- [ ] Acesso SSH ao servidor

---

## 🖥️ Configuração do Servidor

### 1. Instalar EasyPanel (se ainda não tiver)

```bash
# Conecte via SSH no seu servidor
ssh root@seu-ip-do-servidor

# Instale o EasyPanel
curl -sSL https://get.easypanel.io | sh
```

### 2. Acessar EasyPanel

Após instalação, acesse:
```
https://seu-ip-do-servidor:3000
```

Crie sua conta de administrador no primeiro acesso.

---

## 🐳 Deploy no EasyPanel

### Passo 1: Criar Projeto

1. No EasyPanel, clique em **"+ New Project"**
2. Nome: `canaisdarks`
3. Clique em **"Create"**

### Passo 2: Criar Serviço (App)

1. Dentro do projeto, clique em **"+ New Service"**
2. Selecione **"App"**
3. Escolha o método de deploy:

#### Opção A: Via GitHub (Recomendado)
1. Conecte sua conta GitHub
2. Selecione o repositório
3. Branch: `main`
4. Build Command: deixe vazio (usa Dockerfile)
5. Dockerfile Path: `./Dockerfile`

#### Opção B: Via Git URL
1. Selecione **"Git URL"**
2. URL: `https://github.com/seu-usuario/seu-repo.git`
3. Branch: `main`
4. Dockerfile Path: `./Dockerfile`

### Passo 3: Configurar Build

Na aba **"Build"** do serviço:

```yaml
Dockerfile Path: ./Dockerfile
Build Context: .
```

### Passo 4: Adicionar Variáveis de Ambiente

Na aba **"Environment"**, adicione:

```env
NODE_ENV=production
VITE_SUPABASE_URL=https://kabnbvnephjifeazaiis.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=kabnbvnephjifeazaiis
```

> ⚠️ **Importante**: Substitua pelas suas credenciais reais do Supabase

### Passo 5: Deploy

1. Clique em **"Deploy"**
2. Aguarde o build completar (3-5 minutos)
3. Verifique se o status está **"Running"**

---

## 🌐 Configuração de Domínios

### No EasyPanel

Na aba **"Domains"** do serviço, adicione:

#### Domínio 1 - Landing (www)
```
Domain: www.canaisdarks.com.br
Port: 80
HTTPS: ✅ Enabled
Force HTTPS: ✅ Enabled
```

#### Domínio 2 - Landing (raiz)
```
Domain: canaisdarks.com.br
Port: 80
HTTPS: ✅ Enabled
Force HTTPS: ✅ Enabled
```

#### Domínio 3 - Aplicação
```
Domain: app.canaisdarks.com.br
Port: 80
HTTPS: ✅ Enabled
Force HTTPS: ✅ Enabled
```

### No Provedor de DNS (Cloudflare, GoDaddy, etc.)

Configure os seguintes registros DNS:

```
Tipo    Nome    Valor                      TTL
─────────────────────────────────────────────────
A       @       [IP do seu servidor]       Auto
A       www     [IP do seu servidor]       Auto
A       app     [IP do seu servidor]       Auto
```

**Exemplo prático** (se seu IP é 203.0.113.50):
```
A       @       203.0.113.50    Auto
A       www     203.0.113.50    Auto
A       app     203.0.113.50    Auto
```

> 📝 O IP do servidor aparece no painel EasyPanel em **Settings → Server**

### Verificar Propagação DNS

Use https://dnschecker.org para verificar se os registros propagaram.

---

## 🔐 Variáveis de Ambiente

### Build Args (durante build)

Estas variáveis são injetadas durante o build:

| Variável | Descrição |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública (anon) |
| `VITE_SUPABASE_PROJECT_ID` | ID do projeto |

### Como Configurar no EasyPanel

1. Vá no serviço → **Environment**
2. Adicione cada variável
3. Clique em **"Redeploy"** para aplicar

---

## 🔧 Modo Manutenção

### Antes de um Deploy

1. Acesse `https://app.canaisdarks.com.br/admin`
2. Vá na aba **"Manutenção Global"**
3. Ative o modo manutenção
4. Configure:
   - Mensagem personalizada
   - Previsão de retorno
   - Contador regressivo

### Durante o Deploy

- Usuários verão a página de manutenção
- Admins continuam navegando normalmente

### Após o Deploy

1. Volte ao painel admin
2. Desative o modo manutenção
3. Clique em **"Testar Notificação"** para avisar usuários conectados

---

## ✅ Verificação e Troubleshooting

### Checklist Pós-Deploy

- [ ] https://www.canaisdarks.com.br → Abre landing page
- [ ] https://canaisdarks.com.br → Redireciona para www
- [ ] https://app.canaisdarks.com.br → Abre aplicação
- [ ] https://app.canaisdarks.com.br/health → Retorna "OK"
- [ ] Login funciona corretamente
- [ ] HTTPS está ativo (cadeado verde)

### Comandos Úteis no Servidor

```bash
# Ver logs do container
docker logs canaisdarks-app-1 -f

# Reiniciar container
docker restart canaisdarks-app-1

# Ver uso de recursos
docker stats canaisdarks-app-1

# Acessar shell do container
docker exec -it canaisdarks-app-1 sh
```

### Problemas Comuns

#### ❌ Erro 502 Bad Gateway
```bash
# Verifique se o container está rodando
docker ps | grep canaisdarks

# Veja os logs
docker logs canaisdarks-app-1 --tail 100
```

#### ❌ SSL não funciona
- Aguarde até 48h para propagação DNS
- Verifique registros A no dnschecker.org
- No EasyPanel, clique em "Renew Certificate"

#### ❌ Página em branco
- Abra DevTools (F12) → Console
- Verifique se variáveis de ambiente estão corretas
- Limpe cache: Ctrl+Shift+R

#### ❌ Build falha
- Verifique se Dockerfile está no caminho correto
- Confira logs de build no EasyPanel
- Certifique-se que `npm ci` funciona localmente

---

## 📱 Comandos Docker (Desenvolvimento Local)

```bash
# Build da imagem
docker build -t canaisdarks .

# Rodar localmente
docker run -p 80:80 canaisdarks

# Com docker-compose
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar
docker-compose down

# Rebuild e restart
docker-compose up -d --build
```

---

## 🔄 Atualizando a Aplicação

### Via EasyPanel (Automático)

1. Push para branch `main` no GitHub
2. EasyPanel detecta e faz deploy automático

### Via EasyPanel (Manual)

1. Vá no serviço
2. Clique em **"Redeploy"**

### Via Webhook (Opcional)

Configure webhook no GitHub:
```
URL: https://easypanel.seu-ip/api/webhook/github
Secret: [gerado no EasyPanel]
```

---

## 📞 Suporte

- **Documentação EasyPanel**: https://easypanel.io/docs
- **Status do Supabase**: https://status.supabase.com

---

*Última atualização: Janeiro 2026*