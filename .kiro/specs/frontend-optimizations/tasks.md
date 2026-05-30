# Implementation Plan: Frontend Optimizations

## Overview

Implementação incremental das otimizações de performance e qualidade de código do frontend do Bolão. As tarefas estão organizadas por domínio funcional, começando pela infraestrutura (configurações, correções de serviços) e progredindo para componentes de UI, hooks compartilhados e lazy loading. **Todas as tarefas possuem testes dedicados.**

## Tasks

- [ ] 1. Configuração e correções de infraestrutura
  - [ ] 1.1 Corrigir import dinâmico em classificacao.service.ts e padronizar tratamento de erros
    - Substituir `await import('@/lib/api-client')` por import estático top-level `import apiClient from '@/lib/api-client'`
    - Remover try/catch de `buscarClassificacao` para propagar erros ao caller
    - Atualizar `buscarMeuPalpite` em palpite.service.ts para capturar apenas 404 e re-lançar outros erros (usar `isAxiosError`)
    - Remover try/catch de `buscarDadosTemporada` e `contarJogosAdiadosRodada` em jogo.service.ts
    - Adicionar comentário documentando o fallback de `buscarMeuPalpite` (404 → null)
    - _Requisitos: 7.1, 7.2, 7.3, 7.4, 8.1, 8.4, 8.5, 8.6_

  - [ ] 1.2 Escrever testes para os services refatorados
    - Testar `buscarClassificacao`: sucesso retorna dados; erro propaga ao caller
    - Testar `buscarMeuPalpite`: 404 retorna null; outros erros (400, 500) propagam
    - Testar `buscarDadosTemporada`: sucesso retorna dados; erro propaga ao caller
    - Testar `contarJogosAdiadosRodada`: sucesso retorna número; erro propaga
    - Usar MSW (Mock Service Worker) para simular respostas HTTP
    - Arquivo: `src/services/__tests__/classificacao.service.test.ts`, `src/services/__tests__/jogo.service.test.ts`, `src/services/__tests__/palpite.service.test.ts`
    - _Requisitos: 7.3, 8.1, 8.4, 8.5, 8.6_

  - [ ] 1.3 Escrever teste de propriedade para buscarMeuPalpite (catching seletivo)
    - **Propriedade 3: Catching seletivo de erros em buscarMeuPalpite**
    - Para erro 404 → retorna null; para qualquer outro status (400, 401, 403, 500, 502, 503) → propaga erro (throw)
    - Usar fast-check com mínimo 100 iterações gerando status codes aleatórios
    - Arquivo: `src/services/__tests__/palpite.service.property.test.ts`
    - **Valida: Requisito 8.6**

  - [ ] 1.4 Atualizar configuração do Query Cache (query-client.ts)
    - Alterar `refetchOnWindowFocus` de `false` para `true`
    - Manter `staleTime: 5 * 60 * 1000` (5 minutos)
    - _Requisitos: 10.1, 10.2_

  - [ ] 1.5 Escrever teste para configuração do Query Cache
    - Verificar que `defaultOptions.queries.refetchOnWindowFocus` é `true`
    - Verificar que `defaultOptions.queries.staleTime` é `300000`
    - Arquivo: `src/lib/__tests__/query-client.test.ts`
    - _Requisitos: 10.1, 10.2_

  - [ ] 1.6 Adicionar otimizações de bundle ao next.config.ts
    - Adicionar `experimental: { optimizePackageImports: ['lucide-react'] }`
    - Adicionar `compiler: { removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['warn', 'error'] } : false }`
    - _Requisitos: 12.1, 12.2, 12.3, 12.4_

  - [ ] 1.7 Escrever teste para next.config.ts
    - Verificar que `experimental.optimizePackageImports` contém `'lucide-react'`
    - Verificar que `compiler.removeConsole` está configurado corretamente
    - Arquivo: `src/__tests__/next-config.test.ts`
    - _Requisitos: 12.1, 12.2_

  - [ ] 1.8 Corrigir Google Fonts não utilizadas
    - Substituir `font-family: Arial, Helvetica, sans-serif` no globals.css por `font-family: var(--font-geist-sans), sans-serif`
    - _Requisitos: 11.1, 11.2, 11.3_

  - [ ] 1.9 Escrever teste para verificação de fonts
    - Verificar que globals.css contém `var(--font-geist-sans)` e não contém `Arial, Helvetica, sans-serif` como font-family do body
    - Arquivo: `src/__tests__/fonts.test.ts`
    - _Requisitos: 11.1, 11.2_

  - [ ] 1.10 Remover código morto
    - Remover função `buscarProximosJogos` e tipo `JogoProximo` de jogo.service.ts (verificar zero referências)
    - Deletar `services/index.ts` se nenhum arquivo importar de `@/services` ou `@/services/index`
    - _Requisitos: 9.1, 9.2, 9.3, 9.5_

  - [ ] 1.11 Escrever teste de verificação de código morto
    - Verificar que `buscarProximosJogos` não é exportada de jogo.service.ts
    - Verificar que `services/index.ts` não existe ou não é importado em nenhum lugar
    - Arquivo: `src/__tests__/dead-code.test.ts`
    - _Requisitos: 9.1, 9.2, 9.5_

- [ ] 2. Checkpoint — Verificar compilação
  - Executar `npx tsc --noEmit`, `npm run build` e `npm run test` para garantir que as correções de infraestrutura não introduziram erros
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Componente Countdown isolado
  - [ ] 3.1 Criar componente Countdown em src/components/ui/countdown.tsx
    - Implementar interface `CountdownProps` com `targetDate: string` (ISO 8601) e `onExpire?: () => void`
    - Exportar função pura `formatCountdown(diffMs: number): string` que formata milissegundos em "HH:MM:SS"
    - Usar `useState` + `useEffect` com `setInterval(1000ms)` para atualizar apenas o estado interno
    - Exibir "Encerrado" e invocar `onExpire` uma vez quando countdown chegar a zero ou data alvo estiver no passado
    - Limpar intervalo no cleanup do useEffect (prevenir memory leak)
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ] 3.2 Escrever teste de propriedade para formatCountdown
    - **Propriedade 1: Formatação do Countdown produz HH:MM:SS válido**
    - Para qualquer inteiro positivo (0 < diffMs ≤ 999_999_999), `formatCountdown` deve produzir string no padrão `^\d{2,}:\d{2}:\d{2}$` com minutos 00-59, segundos 00-59
    - Usar fast-check com mínimo 100 iterações
    - Arquivo: `src/components/ui/__tests__/countdown.property.test.ts`
    - **Valida: Requisito 1.3**

  - [ ] 3.3 Escrever testes unitários para Countdown
    - Testar: monta com data futura → exibe HH:MM:SS; data passada → "Encerrado"; unmount → clearInterval; onExpire invocado uma vez
    - Testar: atualiza a cada segundo (fake timers); não causa re-render no pai
    - Arquivo: `src/components/ui/__tests__/countdown.test.tsx`
    - _Requisitos: 1.1, 1.4, 1.5, 1.6, 1.7_

- [ ] 4. Memoização do CardJogoPalpite e hook usePalpiteMutation
  - [ ] 4.1 Implementar função areCardPropsEqual e aplicar React.memo ao CardJogoPalpite
    - Criar e exportar `areCardPropsEqual(prev, next)` comparando: jogo.id, jogo.status, jogo.golsCasa, jogo.golsFora, jogo.dataHora, palpitavel, grupoId, ativo
    - Excluir `onFoco` da comparação
    - Envolver componente com `React.memo(CardJogoPalpiteInternal, areCardPropsEqual)`
    - _Requisitos: 2.1, 2.2, 2.3, 2.4_

  - [ ] 4.2 Escrever teste de propriedade para areCardPropsEqual
    - **Propriedade 2: Corretude da função de comparação do CardJogoPalpite**
    - Para quaisquer dois objetos com campos iguais → retorna true independente de onFoco; com pelo menos um campo diferente → retorna false
    - Usar fast-check com mínimo 100 iterações
    - Arquivo: `src/components/jogos/__tests__/card-jogo-palpite.property.test.ts`
    - **Valida: Requisitos 2.3, 2.4**

  - [ ] 4.3 Escrever teste unitário para memoização do CardJogoPalpite
    - Testar: re-render do pai com mesmas props → CardJogoPalpite não re-renderiza
    - Testar: mudança em onFoco (nova referência) → CardJogoPalpite não re-renderiza
    - Testar: mudança em jogo.status → CardJogoPalpite re-renderiza
    - Usar React Testing Library + renderCount ou spy no render
    - Arquivo: `src/components/jogos/__tests__/card-jogo-palpite.memo.test.tsx`
    - _Requisitos: 2.1, 2.2_

  - [ ] 4.4 Criar hook usePalpiteMutation em src/hooks/use-palpite-mutation.ts
    - Aceitar `jogoId`, `palpiteId?` e `onSuccess?` como opções
    - Usar `useMutation` do TanStack React Query
    - Determinar criar (POST) vs atualizar (PATCH) baseado na presença de `palpiteId`
    - Atualizar cache `['meu-palpite', jogoId]` no onSuccess
    - Expor `mutate`, `isPending`, `isSuccess`, `error`
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.7_

  - [ ] 4.5 Escrever testes unitários para usePalpiteMutation
    - Testar: fluxo de criação (sem palpiteId) → chama POST, atualiza cache, invoca onSuccess
    - Testar: fluxo de atualização (com palpiteId) → chama PATCH, atualiza cache, invoca onSuccess
    - Testar: estados isPending durante mutação
    - Testar: erro na API → expõe error state
    - Arquivo: `src/hooks/__tests__/use-palpite-mutation.test.tsx`
    - _Requisitos: 3.1, 3.2, 3.3, 3.4_

  - [ ] 4.6 Migrar PalpiteInlineForm e CardJogoPalpite para usar usePalpiteMutation
    - Substituir lógica inline de `useMutation` em `palpite-inline-form.tsx` pelo hook compartilhado
    - Substituir lógica inline em `card-jogo-palpite.tsx` pelo hook compartilhado
    - Remover query individual redundante de `['meu-palpite', jogoId]` no palpite-inline-form.tsx (batch já popula cache)
    - Deletar arquivo obsoleto `components/palpites/card-jogo-palpite.tsx`
    - _Requisitos: 3.5, 3.6, 10.3_

  - [ ] 4.7 Escrever teste de integração para cache batch de palpites
    - Testar: batch popula cache → componente filho lê do cache sem request individual
    - Testar: refetch on window focus atualiza dados após staleTime expirar
    - Testar: mutação via usePalpiteMutation atualiza cache local imediatamente
    - Usar React Testing Library + fake timers + MSW
    - Arquivo: `src/components/jogos/__tests__/palpite-cache-integration.test.tsx`
    - _Requisitos: 10.1, 10.2, 10.3, 10.4_

- [ ] 5. Checkpoint — Verificar testes e compilação
  - Executar `npm run test` e `npx tsc --noEmit`
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Error Boundaries e refatoração de páginas
  - [ ] 6.1 Criar componente ErrorBoundary em src/components/ui/error-boundary.tsx
    - Implementar como class component com `componentDidCatch`
    - Aceitar props: `sectionName`, `children`, `fallbackClassName?`
    - Exibir fallback: "Erro ao carregar {sectionName}" + botão "Tentar novamente"
    - Logar `console.error(error.message, componentStack)` ao capturar erro
    - Retry: resetar `hasError` state para re-render dos children
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 6.2 Escrever testes unitários para ErrorBoundary
    - Testar: erro em filho → exibe fallback com nome da seção
    - Testar: retry → re-render dos children
    - Testar: erro repetido após retry → exibe fallback novamente
    - Testar: log no console.error com mensagem e stack
    - Testar: seções irmãs não afetadas (renderizar 2 ErrorBoundaries, erro em um não afeta outro)
    - Arquivo: `src/components/ui/__tests__/error-boundary.test.tsx`
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 6.3 Refatorar grupos/[grupoId]/page.tsx em sub-componentes
    - Extrair `SecaoProximoJogo` para `src/components/grupo/secao-proximo-jogo.tsx`
    - Extrair `SecaoRanking` para `src/components/grupo/secao-ranking.tsx`
    - Substituir lógica de countdown pelo novo componente `Countdown`
    - Reduzir arquivo principal para ≤200 linhas
    - Envolver cada seção com ErrorBoundary independente
    - _Requisitos: 5.1, 5.3, 5.4, 4.1_

  - [ ] 6.4 Escrever testes para sub-componentes extraídos
    - Testar `SecaoProximoJogo`: renderiza escudos, nomes, horário, countdown
    - Testar `SecaoRanking`: renderiza pódio, filtros geral/rodada, lista expandível
    - Verificar que página principal ≤200 linhas (teste de lint/contagem)
    - Arquivo: `src/components/grupo/__tests__/secao-proximo-jogo.test.tsx`, `src/components/grupo/__tests__/secao-ranking.test.tsx`
    - _Requisitos: 5.1, 5.4_

  - [ ] 6.5 Refatorar grupos/[grupoId]/configuracoes/page.tsx em sub-componentes
    - Extrair pelo menos 2 sub-componentes (ex: `SecaoMembros`, `ZonaPerigo`)
    - Colocar em `src/components/grupo/`
    - Reduzir arquivo principal para ≤200 linhas
    - Envolver seções query-dependent com ErrorBoundary
    - _Requisitos: 5.2, 5.3, 5.4, 4.1_

  - [ ] 6.6 Escrever testes para sub-componentes de configurações
    - Testar `SecaoMembros`: renderiza lista, ações de promover/rebaixar/remover
    - Testar `ZonaPerigo`: renderiza botão excluir, confirmação em 2 passos
    - Arquivo: `src/components/grupo/__tests__/secao-membros.test.tsx`
    - _Requisitos: 5.2, 5.4_

  - [ ] 6.7 Verificar e refatorar palpites/page.tsx se exceder 200 linhas
    - Verificar tamanho do arquivo; se >200 linhas, decompor em sub-componentes
    - Escrever testes para sub-componentes extraídos se aplicável
    - _Requisitos: 5.5_

- [ ] 7. Lazy loading com next/dynamic
  - [ ] 7.1 Implementar lazy loading para modais
    - Converter imports de `ModalConfirmacao` para `next/dynamic` com `{ ssr: false }`
    - Adicionar placeholder de loading (skeleton/spinner ≤48x48px) com mesmas dimensões do modal
    - _Requisitos: 6.1, 6.3, 6.4_

  - [ ] 7.2 Implementar lazy loading para conteúdo de abas secundárias
    - Identificar componentes renderizados condicionalmente (ex: conteúdo de filtro "Rodada" no ranking)
    - Converter para `next/dynamic` com placeholder de loading
    - Garantir CLS ≤ 0.1 mantendo dimensões reservadas
    - _Requisitos: 6.2, 6.3, 6.4_

  - [ ] 7.3 Implementar tratamento de erro para dynamic imports
    - Adicionar fallback de erro inline com mensagem e botão retry quando import falhar
    - _Requisitos: 6.5_

  - [ ] 7.4 Escrever testes para lazy loading
    - Testar: placeholder exibido durante carregamento do componente dinâmico
    - Testar: componente renderiza corretamente após carregamento
    - Testar: erro de rede → exibe mensagem de erro + botão retry
    - Testar: retry após erro → tenta carregar novamente
    - Usar mocks de `next/dynamic` e simulação de falha de import
    - Arquivo: `src/components/__tests__/lazy-loading.test.tsx`
    - _Requisitos: 6.1, 6.3, 6.5_

- [ ] 8. Checkpoint final — Build de produção e testes completos
  - Executar `npm run test`, `npx tsc --noEmit`, `npm run build` e `npm run lint`
  - Verificar que o bundle de produção inclui apenas ícones lucide-react importados
  - Verificar que todos os testes passam (unitários, propriedade, integração)
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Todas as tarefas possuem testes dedicados — nenhuma é opcional
- Cada task referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Testes de propriedade validam propriedades universais de corretude (fast-check, 100+ iterações)
- Testes unitários validam exemplos específicos e edge cases
- Testes de integração validam fluxos completos (cache, refetch, error propagation)
- O requisito 9.4 (remover mocks do inicio/page.tsx) será implementado quando endpoints reais estiverem disponíveis — não incluído neste plano

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.4", "1.6", "1.8", "1.10"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.5", "1.7", "1.9", "1.11"] },
    { "id": 2, "tasks": ["3.1", "4.1", "4.4", "6.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "4.2", "4.3", "4.5", "6.2"] },
    { "id": 4, "tasks": ["4.6", "4.7"] },
    { "id": 5, "tasks": ["6.3", "6.5", "6.7"] },
    { "id": 6, "tasks": ["6.4", "6.6"] },
    { "id": 7, "tasks": ["7.1", "7.2", "7.3"] },
    { "id": 8, "tasks": ["7.4"] }
  ]
}
```
