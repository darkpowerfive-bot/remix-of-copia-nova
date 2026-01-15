# Configuração do Cloudflare CDN

## 1. Criar Conta e Adicionar Site

1. Acesse [Cloudflare](https://dash.cloudflare.com/sign-up) e crie uma conta
2. Clique em "Add a Site" e digite `canaisdarks.com.br`
3. Selecione o plano **Free** (suficiente para 1000+ usuários)
4. Cloudflare vai escanear seus registros DNS automaticamente

## 2. Configurar DNS

Adicione os seguintes registros DNS:

| Tipo | Nome | Conteúdo | Proxy |
|------|------|----------|-------|
| A | @ | [IP do seu VPS] | ✅ Proxied (nuvem laranja) |
| A | www | [IP do seu VPS] | ✅ Proxied |
| A | app | [IP do seu VPS] | ✅ Proxied |

> ⚠️ **Importante**: A nuvem deve estar **laranja** (Proxied) para o CDN funcionar!

## 3. Configurar SSL/TLS

Em **SSL/TLS > Overview**:
- Selecione: **Full (strict)**

Em **SSL/TLS > Edge Certificates**:
- ✅ Always Use HTTPS: ON
- ✅ Automatic HTTPS Rewrites: ON
- ✅ Minimum TLS Version: 1.2

## 4. Configurar Cache (Speed > Caching)

### Cache Level
- **Standard** (recomendado)

### Browser Cache TTL
- **Respect Existing Headers** (o Nginx já configura isso)

### Caching Rules (Rules > Caching Rules)

Criar regra para assets estáticos:
```
Se: URI Path termina com .js OR .css OR .woff2 OR .png OR .jpg OR .webp
Então: Cache Level = Cache Everything, Edge TTL = 1 month
```

## 5. Configurar Page Rules (Rules > Page Rules)

### Regra 1: Cache de Assets (Prioridade Alta)
```
URL: *canaisdarks.com.br/assets/*
Cache Level: Cache Everything
Edge Cache TTL: 1 month
```

### Regra 2: Bypass Cache para API
```
URL: *canaisdarks.com.br/api/*
Cache Level: Bypass
```

### Regra 3: Bypass Cache para Auth
```
URL: *canaisdarks.com.br/auth*
Cache Level: Bypass
```

## 6. Otimizações Adicionais (Speed)

### Speed > Optimization

#### Content Optimization
- ✅ Auto Minify: JavaScript, CSS, HTML
- ✅ Brotli: ON (compressão 30% melhor que gzip)
- ✅ Early Hints: ON
- ✅ Rocket Loader: OFF (pode quebrar SPAs React)

#### Image Optimization (Pro, opcional)
- Polish: Lossless ou Lossy
- WebP: ON

### Speed > Mobile
- ✅ Mobile Redirect: OFF (o app é responsivo)

## 7. Segurança (Security)

### Security > Settings
- Security Level: **Medium**
- Challenge Passage: 30 minutes
- Browser Integrity Check: ON

### Security > WAF (Web Application Firewall)
- ✅ Managed Ruleset: ON

### Security > Bots
- Bot Fight Mode: ON

## 8. Verificar Funcionamento

Após configurar, teste:

```bash
# Verificar headers do Cloudflare
curl -I https://canaisdarks.com.br

# Deve mostrar:
# cf-ray: [ID do request]
# cf-cache-status: HIT (para assets em cache)
```

## 9. Métricas e Analytics

Acesse **Analytics & Logs > Traffic** para ver:
- Requests salvos pelo cache
- Bandwidth economizada
- Ameaças bloqueadas
- Performance por país

## Checklist Final

- [ ] DNS configurado com proxy ativado (nuvem laranja)
- [ ] SSL/TLS em "Full (strict)"
- [ ] Auto Minify ativado
- [ ] Brotli compression ON
- [ ] Page Rules configuradas
- [ ] Bot Fight Mode ON
- [ ] Testado acesso aos domínios

## Resultado Esperado

Com Cloudflare configurado:
- ⚡ **Latência reduzida**: CDN global com 300+ POPs
- 📦 **70-90% cache hit**: Assets servidos do edge
- 🔒 **DDoS protection**: Proteção automática contra ataques
- 🌐 **SSL grátis**: Certificados gerenciados automaticamente
- 📊 **Analytics**: Visibilidade de tráfego e ameaças
