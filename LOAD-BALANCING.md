# Load Balancing - Alta Disponibilidade

## Arquitetura

```
                    ┌─────────────────┐
                    │   Cloudflare    │
                    │      CDN        │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Nginx LB      │
                    │  (Entry Point)  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼───────┐   ┌───────▼───────┐   ┌───────▼───────┐
│    App #1     │   │    App #2     │   │    App #3     │
│  (Container)  │   │  (Container)  │   │  (Container)  │
└───────────────┘   └───────────────┘   └───────────────┘
```

## Deploy Rápido

### 1. Primeira vez (build + deploy)
```bash
docker-compose -f docker-compose.prod.yml up -d --build --scale app=3
```

### 2. Verificar status
```bash
docker-compose -f docker-compose.prod.yml ps
```

### 3. Ver logs
```bash
# Todos os containers
docker-compose -f docker-compose.prod.yml logs -f

# Apenas load balancer
docker-compose -f docker-compose.prod.yml logs -f nginx-lb

# Apenas apps
docker-compose -f docker-compose.prod.yml logs -f app
```

## Scaling

### Aumentar instâncias (alta demanda)
```bash
docker-compose -f docker-compose.prod.yml up -d --scale app=5
```

### Diminuir instâncias (baixa demanda)
```bash
docker-compose -f docker-compose.prod.yml up -d --scale app=2
```

### Scaling automático com cron (exemplo)
```bash
# Adicionar ao crontab para escalar baseado em horário
# Mais instâncias durante horário de pico (18h-23h)
0 18 * * * docker-compose -f /path/docker-compose.prod.yml up -d --scale app=5
0 23 * * * docker-compose -f /path/docker-compose.prod.yml up -d --scale app=2
```

## Zero-Downtime Deployment

### Atualizar código sem downtime
```bash
# 1. Build nova imagem
docker-compose -f docker-compose.prod.yml build app

# 2. Rolling update (uma instância por vez)
docker-compose -f docker-compose.prod.yml up -d --no-deps --scale app=3 app
```

### Rollback rápido
```bash
# Listar imagens anteriores
docker images | grep canaisdarks

# Restaurar versão anterior (tag específica)
docker-compose -f docker-compose.prod.yml up -d --scale app=3
```

## Health Checks

### Verificar saúde de todas as instâncias
```bash
# Via load balancer
curl http://localhost/health

# Instâncias individuais
docker-compose -f docker-compose.prod.yml exec app curl localhost/health
```

### Monitorar conexões ativas
```bash
docker-compose -f docker-compose.prod.yml exec nginx-lb \
  nginx -T 2>/dev/null | grep -A5 "upstream app_servers"
```

## Métricas de Performance

### Ver distribuição de requests
```bash
docker-compose -f docker-compose.prod.yml logs nginx-lb | \
  grep "upstream:" | \
  awk '{print $NF}' | \
  sort | uniq -c | sort -rn
```

### Monitorar uso de recursos
```bash
# Tempo real
docker stats

# Específico para apps
docker stats $(docker-compose -f docker-compose.prod.yml ps -q app)
```

## Troubleshooting

### Instância não responde
```bash
# Verificar logs da instância problemática
docker logs [CONTAINER_ID]

# Reiniciar instância específica
docker-compose -f docker-compose.prod.yml restart app
```

### Load balancer não distribui corretamente
```bash
# Verificar config do nginx
docker-compose -f docker-compose.prod.yml exec nginx-lb nginx -t

# Recarregar config sem downtime
docker-compose -f docker-compose.prod.yml exec nginx-lb nginx -s reload
```

### Limpar containers parados
```bash
docker-compose -f docker-compose.prod.yml down --remove-orphans
docker system prune -f
```

## Configurações Recomendadas

### Para 1000 usuários simultâneos
| Métrica | Valor |
|---------|-------|
| Instâncias app | 3 |
| CPUs por instância | 2 |
| RAM por instância | 1GB |
| Conexões por worker | 4096 |

### Para 5000 usuários simultâneos
| Métrica | Valor |
|---------|-------|
| Instâncias app | 5-6 |
| CPUs por instância | 2-4 |
| RAM por instância | 2GB |
| Conexões por worker | 8192 |

### Para 10000+ usuários
- Considere múltiplos servidores físicos
- Use Docker Swarm ou Kubernetes
- Configure Cloudflare Load Balancing (pago)

## SSL com Let's Encrypt

### Gerar certificados
```bash
# Instalar certbot
apt install certbot

# Gerar certificado
certbot certonly --standalone -d canaisdarks.com.br -d www.canaisdarks.com.br -d app.canaisdarks.com.br

# Copiar para pasta ssl/
cp /etc/letsencrypt/live/canaisdarks.com.br/fullchain.pem ./ssl/
cp /etc/letsencrypt/live/canaisdarks.com.br/privkey.pem ./ssl/
```

### Renovação automática
```bash
# Adicionar ao crontab
0 0 1 * * certbot renew --quiet && docker-compose -f docker-compose.prod.yml exec nginx-lb nginx -s reload
```

## Comparativo de Modos

| Modo | Arquivo | Instâncias | Uso |
|------|---------|------------|-----|
| Desenvolvimento | docker-compose.yml | 1 | Local/teste |
| Produção | docker-compose.prod.yml | 3+ | Produção |

## Checklist de Deploy

- [ ] Build da imagem concluído
- [ ] 3+ instâncias rodando
- [ ] Health checks passando
- [ ] Load balancer respondendo
- [ ] SSL configurado (se necessário)
- [ ] Cloudflare apontando para o servidor
- [ ] Logs sem erros críticos
