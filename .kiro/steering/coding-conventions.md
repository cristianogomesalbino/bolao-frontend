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
- **SEMPRE usar 'use client' em componentes que usam hooks, estado ou eventos**
- **SEMPRE validar formulários com Zod** — nunca validação manual
- **SEMPRE tratar erros de API com mensagens em português**
- **SEMPRE usar o `apiClient` de `src/lib/api-client.ts`** — nunca instanciar axios diretamente

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

## Tailwind / Estilo

- Nunca usar cores hardcoded repetidas — usar variáveis do tema (`text-primaria`, `bg-fundo`)
- Exceção: gradientes e sombras específicas podem usar hex (`from-[#16a34a] to-[#22c55e]`)
- Breakpoints: mobile-first, max-width 480px para conteúdo principal
- Glassmorphism: `bg-white/[0.03] backdrop-blur-xl border border-white/[0.12]`
- Glow em escudos/ícones: `drop-shadow-[0_0_Xpx_rgba(...)]`
- Timezone em datas: sempre `{ timeZone: 'America/Sao_Paulo' }` no `toLocaleString`

## Dados Externos (APIs de terceiros)

- Chamadas a APIs externas NUNCA no frontend (CORS) — sempre via endpoint do backend
- Backend faz fetch e expõe endpoint próprio
- Sempre ter fallback gracioso (retornar `[]` ou `null` se API falhar)
- Cache no frontend via `staleTime` do React Query
- Dados de classificação/estatísticas: buscar do backend, nunca direto do ge.globo.com
