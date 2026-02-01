
# Plano: Garantir que Agentes Virais sigam rigorosamente Memória, Instruções, Gatilhos e Arquivos

## Resumo do Problema

O usuário relatou que os **Agentes Virais** não estão seguindo rigorosamente a memória, instruções, gatilhos mentais e arquivos configurados. A análise do código revelou:

1. **Memória, Instruções e Gatilhos** - São enviados à IA, mas o prompt não enfatiza suficientemente que devem ser seguidos à risca
2. **Arquivos do Agente** - Não são carregados nem enviados para o contexto da IA

---

## Mudanças Necessárias

### 1. Carregar e incluir arquivos do agente no chat

**Arquivo:** `src/components/agents/AgentChatModal.tsx`

- Adicionar estado para armazenar os arquivos do agente
- Carregar arquivos quando o modal abrir (`useEffect`)
- Para arquivos de texto (.txt, .md, .json), baixar e incluir o conteúdo no prompt
- Enviar lista de arquivos no `agentData` para a edge function

### 2. Reforçar o System Prompt para seguir instruções à risca

**Arquivo:** `src/components/agents/AgentChatModal.tsx`

Modificar a função `buildSystemPrompt()` para:
- Adicionar seção explícita de **REGRAS OBRIGATÓRIAS**
- Enfatizar que memória, instruções e gatilhos são **obrigatórios e não opcionais**
- Incluir conteúdo dos arquivos de texto anexados
- Usar formatação que deixe claro a hierarquia de prioridade

### 3. Atualizar o backend para processar arquivos

**Arquivo:** `supabase/functions/ai-assistant/index.ts`

No caso `agent_chat`:
- Processar o campo `agentData.files` quando presente
- Incluir conteúdo dos arquivos no contexto do sistema prompt

### 4. Melhorar o prompt de geração de roteiros

**Arquivo:** `src/components/agents/AgentChatModal.tsx`

Na função `handleGenerateScript()`:
- Carregar arquivos do agente
- Incluir conteúdo dos arquivos de texto no prompt
- Reforçar no prompt que deve seguir exatamente a fórmula/instruções/gatilhos

---

## Detalhes Técnicos

### Novo System Prompt (estrutura proposta)

```
⚠️ REGRAS ABSOLUTAS - VOCÊ DEVE SEGUIR À RISCA:

1. MEMÓRIA DO AGENTE (CONTEXTO OBRIGATÓRIO):
[conteúdo da memória]

2. INSTRUÇÕES DO AGENTE (SIGA EXATAMENTE):
[conteúdo das instruções/fórmula]

3. GATILHOS MENTAIS (USE TODOS OBRIGATORIAMENTE):
[lista de gatilhos]

4. ARQUIVOS DE REFERÊNCIA (INFORMAÇÕES CRÍTICAS):
[conteúdo dos arquivos de texto]

🚨 ATENÇÃO: Todas as informações acima são OBRIGATÓRIAS.
Não ignore nenhuma instrução. Não improvise. Siga o contexto fornecido.
```

### Carregamento de arquivos

```typescript
// Carregar arquivos do agente
const loadAgentFiles = async () => {
  const { data } = await supabase
    .from('agent_files')
    .select('*')
    .eq('agent_id', agent.id);
  
  // Para arquivos de texto, baixar conteúdo
  const textFiles = data?.filter(f => 
    f.file_type?.includes('text') || 
    f.file_name.endsWith('.txt') || 
    f.file_name.endsWith('.md')
  );
  
  // Incluir no contexto
  return textFiles;
};
```

---

## Benefícios

1. **Consistência** - O agente sempre seguirá as configurações definidas pelo usuário
2. **Contexto rico** - Arquivos anexados serão usados como base de conhecimento
3. **Controle total** - Usuário terá a garantia de que suas instruções serão respeitadas

---

## Arquivos a serem modificados

| Arquivo | Modificação |
|---------|-------------|
| `src/components/agents/AgentChatModal.tsx` | Carregar arquivos, reforçar prompts |
| `supabase/functions/ai-assistant/index.ts` | Processar arquivos no `agent_chat` |
