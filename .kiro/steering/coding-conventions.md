---
inclusion: auto
---

# Convenções de Código — Frontend

## Regras Críticas (NUNCA violar)

- **NUNCA usar `any` em tipos expostos** — tipar corretamente interfaces, props e retornos de funções
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
