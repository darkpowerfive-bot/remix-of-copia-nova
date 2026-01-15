# 🔥 Configuração do Sistema de Detecção de Vídeos Virais

Este guia explica como configurar o workflow n8n para detectar automaticamente vídeos virais no YouTube.

## 📋 Pré-requisitos

1. **n8n** (Cloud ou Self-hosted)
2. **YouTube Data API v3** habilitada no Google Cloud
3. **Supabase** configurado com a Edge Function `viral-webhook`

---

## 🔧 Variáveis de Ambiente no n8n

Configure as seguintes variáveis no n8n:

| Variável | Descrição |
|----------|-----------|
| `SUPABASE_URL` | URL do seu projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key do Supabase |
| `TARGET_USER_ID` | UUID do usuário que receberá os alertas |
| `SEARCH_NICHE` | (Opcional) Nicho para buscar, ex: "dark channel" |

> ⚠️ **Nota**: A chave da API do YouTube é obtida automaticamente das configurações do usuário (`user_api_settings.youtube_api_key`)

---

## 📥 Importar o Workflow

1. Acesse seu n8n
2. Clique em **Import from file**
3. Selecione o arquivo `n8n-viral-detection-workflow.json`
4. Configure as credenciais do Google API
5. Ative o workflow

---

## 🎯 Como Funciona

### Fluxo de Execução

```
Schedule (1h) → Busca YouTube → Parse Vídeos → Estatísticas → Calcula Score → Webhook
```

### Cálculo do Viral Score

```javascript
viral_score = views / hours_since_published
```

- **Threshold padrão**: 1000 views/hora
- Apenas vídeos acima do threshold são enviados

### Filtros Aplicados

- Vídeos publicados nos últimos 7 dias
- Ordenados por visualizações
- Top 50 resultados por busca

---

## 🔄 Personalização

### Alterar Nicho de Busca

No nó **Schedule Trigger**, adicione um campo `niche`:

```json
{
  "niche": "dark psychology"
}
```

### Ajustar Threshold de Viralidade

No nó **Calculate Viral Score**, altere:

```javascript
const VIRAL_THRESHOLD = 1000; // Altere para seu valor
```

### Múltiplos Nichos

Clone o workflow para cada nicho ou use um nó **SplitInBatches** com array de nichos:

```javascript
const niches = [
  'dark channel',
  'dark psychology', 
  'self improvement',
  'stoicism'
];
```

---

## 📡 Endpoint da Edge Function

### URL
```
POST {SUPABASE_URL}/functions/v1/viral-webhook
```

### Headers
```
Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}
Content-Type: application/json
```

### Body (Vídeo Único)
```json
{
  "user_id": "uuid-do-usuario",
  "video_id": "dQw4w9WgXcQ",
  "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "title": "Título do Vídeo",
  "thumbnail_url": "https://i.ytimg.com/vi/xxx/hqdefault.jpg",
  "channel_name": "Nome do Canal",
  "channel_url": "https://www.youtube.com/channel/xxx",
  "views": 1500000,
  "likes": 50000,
  "comments": 3000,
  "published_at": "2024-01-10T14:00:00Z",
  "viral_score": 12500,
  "niche": "dark channel"
}
```

### Body (Múltiplos Vídeos)
```json
{
  "videos": [
    { ... },
    { ... }
  ]
}
```

---

## 🔔 Notificações

O sistema envia notificações push automáticas quando um novo vídeo viral é detectado (se o usuário tiver push configurado).

---

## 🐛 Troubleshooting

### Erro 401 no Webhook
- Verifique se o `SUPABASE_SERVICE_ROLE_KEY` está correto
- Confirme que a Edge Function está deployada

### Nenhum Vídeo Detectado
- Reduza o `VIRAL_THRESHOLD`
- Verifique se o nicho tem vídeos recentes
- Confirme quota da YouTube API

### Quota Excedida YouTube
- Reduza frequência do schedule (2h, 4h)
- Reduza `maxResults` de 50 para 25

---

## 📊 Monitoramento

Os vídeos virais são salvos na tabela `viral_videos` e exibidos na aba **🔥 Viralizando** em Canais Monitorados.

### Campos da Tabela

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `video_id` | text | ID único do YouTube |
| `viral_score` | integer | Views por hora |
| `detected_at` | timestamp | Quando foi detectado |
| `is_read` | boolean | Se foi visualizado |
