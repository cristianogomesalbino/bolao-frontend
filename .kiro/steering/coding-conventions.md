---
inclusion: auto
description: Convenções de código, padrões de componentes, services, tipos, formulários e estilo do frontend.
---

# Convenções de Código — Frontend

## Regras Críticas (NUNCA violar)

- **NUNCA usar `any`** — tipar corretamente com interfaces, generics ou `unknown` + type guard. Código novo NUNCA deve introduzir `any`. Se precisar de tipo flexível, usar `unknown` com narrowing
- **NUNCA duplicar lógica entre componentes** — extrair em hooks ou utilitários
- **NUNCA fazer chamadas à API diretamente nos componentes** — usar services (`src/services/`)
- **NUNCA armazenar tokens em localStorage diretamente nos componentes** — usar o auth store
- **NUNCA usar classes CSS ou IDs para testes** — usar `data-testid` (ver steering testabilidade.md)
- **NUNCA fazer N requests individuais quando um batch ou endpoint consolidado resolve** — criar endpoint batch no backend ou consolidar chamadas no service. Se uma tela faz mais de 3-4 requests ao carregar, avaliar se pode ser reduzido com um endpoint dedicado
- **SEMPRE usar 'use client' em componentes que usam hooks, estado ou eventos**
- **SEMPRE validar formulários com Zod** — nunca validação manual
- **SEMPRE tratar erros de API com mensagens em português**
- **SEMPRE usar o `apiClient` de `src/lib/api-client.ts`** — nunca instanciar axios diretamente
- **SEMPRE usar `staleTime` adequado no React Query** — dados que mudam pouco (fases, temporadas, classificação): 5min+. Dados que mudam por ação do usuário (palpites): `Infinity` com invalidação manual. NUNCA `staleTime: 0` + `refetchOnWindowFocus: true` em queries pesadas

## Componentes

### Nomenclatura
- Arquivos: kebab-case (`formulario-login.tsx`, `card-proximo-jogo.tsx`)
- Componentes: PascalCase (`FormularioLogin`, `CardProximoJogo`)
- Props interface: `Props[NomeComponente]` (`PropsFormularioLogin`)
- Props devem ser `Readonly<>` quando possível

### Estrutura de um componente
```tsx
'use client'; // se necessário

import { ... } from 'react';
import { ... } from '@/components/ui/...';
import { ... } from '@/lib/...';

interface PropsNomeComponente {
  // props tipadas
}

export function NomeComponente({ prop1, prop2 }: Readonly<PropsNomeComponente>) {
  // estado local
  // handlers
  // return JSX
}
```

### Organização
- Componentes de UI reutilizáveis: `src/components/ui/`
- Componentes por feature: `src/components/[feature]/`
- Componentes de layout: `src/components/layout/`
- Páginas: `src/app/(grupo-rota)/[rota]/page.tsx`

## Hooks

- Prefixo `use` + nome descritivo em português: `useAuth`, `useUsuario`
- Um hook por arquivo
- Barrel file em `src/hooks/index.ts`

## Services

- Um arquivo por módulo do backend: `auth.service.ts`, `usuario.service.ts`, `jogo.service.ts`
- Funções exportadas individualmente (não classes)
- Sempre usar `apiClient` importado de `@/lib/api-client`
- Tipar retorno com interfaces de `src/types/`
- Barrel file em `src/services/index.ts`

## Types

- Um arquivo por entidade: `auth.types.ts`, `usuario.types.ts`, `jogo.types.ts`
- Interfaces (não types) para objetos
- Union types para enums: `'AGENDADO' | 'EM_ANDAMENTO' | 'FINALIZADO'`
- Barrel file em `src/types/index.ts`

## Stores (Zustand)

- Um store por domínio: `auth.store.ts`
- Interface do estado + ações no mesmo arquivo
- Selectors individuais nos componentes (não desestruturar o store inteiro)
```tsx
// ✅ Correto
const usuario = useAuthStore((state) => state.usuario);

// ❌ Errado
const { usuario, login, logout } = useAuthStore();
```

## Formulários

- React Hook Form + Zod resolver
- Schema Zod em `src/lib/validacoes.ts`
- Mensagens de erro em português
- `mode: 'onChange'` para validação em tempo real
- Botão desabilitado até form válido (`!isValid`)
- Loading state no botão durante submit

## Tratamento de Erros

- Erros da API são transformados em `ErroApi` pelo interceptor
- Componentes exibem `error.mensagem` em Alert
- Mensagens sempre em português e amigáveis
- Nunca expor detalhes técnicos ao usuário

## Imports

- Path alias `@/` para `src/`
- Ordem: react → next → libs externas → componentes → hooks → services → types → lib
- Preferir named imports

## Git

- Branches: `feature/nome-feature`, `fix/nome-fix`
- Merge com `--no-ff` para manter histórico
- Commits em português: `[modulo] - Descrição curta`

## Testes

- Framework: Vitest + React Testing Library
- Property tests: fast-check
- Rodar: `npm test` ou `npm run test:watch`
- Arquivos: `[componente].test.tsx` no mesmo diretório ou em `__tests__/`

## Páginas

- Páginas (`page.tsx`) devem ter no máximo ~200 linhas
- Se ultrapassar, extrair seções em componentes de feature: `src/components/[feature]/card-[nome].tsx`
- Página orquestra layout e estado, componentes cuidam da renderização
- Queries (useQuery) ficam na página, dados passam como props para componentes filhos

## React Query

- Chaves de query: `['entidade', id, 'sub-recurso', filtros...]`
- `staleTime` para dados que mudam pouco (classificação: 1h, ranking: 0)
- `enabled` para queries dependentes de dados anteriores
- Mutations com `onSuccess` para invalidar/atualizar cache local
- Usar `queryClient.setQueryData` para updates otimistas quando possível
- **NUNCA fazer N requests individuais quando um batch resolve** — criar endpoint batch e popular cache individual via `setQueryData`
- Queries de estatísticas/detalhes: usar `enabled` com flag de visibilidade (ex: `expandido`) para lazy loading
- Key de query batch: usar identificadores estáveis (ex: `faseId + rodadaAtual`) em vez de listas de IDs que mudam

## Performance / Otimização de Requests

- **Batch over individual**: se precisa buscar dados para N itens, criar endpoint `POST /recurso/por-ids` e popular cache individual
- **Lazy loading**: dados secundários (estatísticas, detalhes expandidos) só carregam quando visíveis
- **Auth store**: `inicializar()` deve verificar `estaAutenticado` antes de refazer refresh — evita requests duplicadas após login
- **staleTime: Infinity** para dados que só mudam por ação do usuário (ex: palpites) — invalidar manualmente no `onSuccess` da mutation

## Tailwind / Estilo

- Nunca usar cores hardcoded repetidas — usar variáveis do tema (`text-primaria`, `bg-fundo`)
- Exceção: gradientes e sombras específicas podem usar hex (`from-[#16a34a] to-[#22c55e]`)
- Breakpoints: mobile-first, max-width 480px para conteúdo principal
- Glassmorphism: `bg-white/[0.03] backdrop-blur-xl border border-white/[0.12]`
- Glow em escudos/ícones: `drop-shadow-[0_0_Xpx_rgba(...)]` ou `bg-white/30 blur-lg` (glow branco atrás de escudos)
- Timezone em datas: sempre `{ timeZone: 'America/Sao_Paulo' }` no `toLocaleString`
- Cards de jogo: borda verde sólida (`border-primaria`), escudos com glow branco (`bg-white/30 blur-lg`)
- Seletor de placar: caixas escuras (`bg-black/60 border-white/[0.12]`) com setas laterais (ChevronDown rotacionado) com borda
- Textos de data/hora e nomes de times: `text-texto/80` e `text-texto` (branco vivo, não opaco)
- Skeleton loading: usar `animate-pulse` com blocos que imitam o layout real da página

## Dados Externos (APIs de terceiros)

- Chamadas a APIs externas NUNCA no frontend (CORS) — sempre via endpoint do backend
- Backend faz fetch e expõe endpoint próprio
- Sempre ter fallback gracioso (retornar `[]` ou `null` se API falhar)
- Cache no frontend via `staleTime` do React Query
- Dados de classificação/estatísticas: buscar do backend, nunca direto do ge.globo.com

## Tema Dinâmico (Copa vs Brasileirão)

- Cards e componentes que mudam de visual baseado no campeonato recebem prop `temaCopa?: boolean`
- Detecção: `campeonato.nome.toLowerCase().includes('copa')`
- Usar objeto `cores` com todas as variantes para evitar ternários espalhados no JSX
- Padrão:
```tsx
const cores = temaCopa
  ? { border: '...', titulo: '...', ... }
  : { border: '...', titulo: '...', ... };
```
- NUNCA usar ternários aninhados no `className` — extrair em variável ou objeto

## React Keys

- **NUNCA usar campos de dados que podem duplicar** como key em `.map()` (ex: `posicao`, `status`, `tipo`)
- **SEMPRE usar combinações únicas**: `${index}-${nome}`, `${id}`, ou `podio-${i}-${entrada.nome}`
- Se o dado tem `id` do backend, usar `id` como key
- Se não tem `id`, combinar `index` + campo descritivo para garantir unicidade
- Keys devem ser estáveis entre re-renders (evitar `Math.random()` ou `Date.now()`)

## Dropdowns Customizados

- Usar `useRef` + `useEffect` com `mousedown` listener para fechar ao clicar fora
- Animação de abertura: `animate-[fadeIn_0.15s_ease-out]`
- Menu flutuante: `absolute z-50` com `backdrop-blur-xl` e sombra forte
- Trigger: botão com `ChevronDown` que rotaciona (`rotate-180`) ao abrir
- Item selecionado: fundo sutil + ícone `Check`
- Padrão reutilizável para filtros inline em headers de cards

## Ranking / Gamificação

- Pódio visual para top 3: barras de alturas diferentes (2º | 1º | 3º)
- Avatares com iniciais: `obterIniciais(nome)` — pega primeiras letras dos 2 primeiros nomes
- Stats de palpites em badges coloridos: verde (cheio), âmbar (parcial), neutro (feitos), vermelho (esquecidos)
- Mensagem motivacional contextual: distância do líder ou parabéns pela liderança
- Critérios de desempate explícitos no rodapé com ícones (Target, Zap, CircleDot)
- Ordenação no frontend: pontução → cheio → parcial → total palpites → ordem original

## Ícones de Grupo (Mapa)

Mapa de ícones do banco → emoji visual:
```typescript
const ICONES_GRUPO: Record<string, string> = {
  bola: '⚽', trofeu: '🏆', coroa: '👑', chuteira: '👟',
  medalha: '🥇', bandeira: '🏁', estrela: '⭐', campo: '🏟️',
  luva: '🧤', apito: '📣', escudo: '🛡️', fogo: '🔥',
};
```
- Fallback: `'⚽'` quando `icone` é `null`
- Mesmo mapa usado no grupo page e na home

## Fallback de Valores Numéricos

- Campos do ranking (`acertosEmCheio`, `errosTotais`, etc.) podem vir `undefined` do backend
- **SEMPRE usar `?? 0`** ao somar ou exibir valores numéricos do ranking
- Previne `NaN` em cálculos e na UI

## Redução Gradual de Dívida Técnica (Regra dos 15%)

- **Sempre que editar um arquivo .tsx/.ts existente**, corrigir pelo menos **15% dos erros de lint/Sonar pré-existentes** nesse arquivo (arredondando pra cima, mínimo 1)
- Prioridade de correção:
  1. Erros de Prettier (formatação)
  2. Ambiguous spacing (S6772) — envolver texto solto em `<span>`
  3. Leaked values (S6439) — converter condicional em boolean explícito
  4. Ternários aninhados (S3358) — extrair em variável ou componente
  5. Array index keys (S6479) — usar combinação única como key
  6. Props não Readonly (S6759) — adicionar `Readonly<>`
  7. Complexidade cognitiva > 15 (S3776) — extrair sub-componentes
- **Cálculo:** se o arquivo tem 20 issues Sonar, corrigir pelo menos 3 ao editá-lo. Se tem 4, corrigir pelo menos 1.
- **Não quebrar funcionalidade** — rodar build após correções
- **Documentar no commit** — mencionar "redução de dívida técnica" quando aplicável
- **Meta:** zero issues Sonar em código novo. Código legado deve ser corrigido ao ser editado.
