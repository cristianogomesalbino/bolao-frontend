# Implementation Plan: Hints Independentes

## Overview

Substituição completa do sistema de onboarding sequencial (react-joyride) por beacons com hints sob demanda. A implementação é dividida entre backend (novos endpoints + migração de dados) e frontend (novo store, provider, componentes visuais e remoção do sistema antigo).

## Tasks

- [ ] 1. Backend — Novos endpoints e schema para hints
  - [ ] 1.1 Adicionar campos `hintsDispensados` e `toastDescobrilidadeVisto` ao schema Prisma e criar migration
    - Adicionar `hintsDispensados String[] @default([])` ao model Usuario
    - Adicionar `toastDescobrilidadeVisto Boolean @default(false) @map("toast_descobrilidade_visto")`
    - Gerar migration via `prisma migrate dev`
    - _Requirements: 4.2, 9.3_

  - [ ] 1.2 Criar DTO `DispensarHintDto` e constantes do módulo de hints
    - Criar `src/modules/usuarios/dto/dispensar-hint.dto.ts` com validação `@IsString` + `@IsNotEmpty`
    - Atualizar `usuarios.constants.ts` com novas mensagens: `HINT_DISPENSADO`, `HINTS_RESETADOS`, `HINT_ID_OBRIGATORIO`
    - _Requirements: 4.1, 4.3_

  - [ ] 1.3 Implementar métodos `dispensarHint` e `resetarHints` no `UsuariosService`
    - `dispensarHint(usuarioId, hintId)`: idempotente — adiciona hintId ao array sem duplicar
    - `resetarHints(usuarioId)`: limpa array `hintsDispensados` e seta `toastDescobrilidadeVisto = false`
    - _Requirements: 4.2, 4.3, 7.2_

  - [ ]* 1.4 Escrever property test para idempotência do backend (Property 6)
    - **Property 6: Idempotência do backend**
    - Gerar hintIds aleatórios, chamar `dispensarHint` N vezes com o mesmo hintId, verificar que array contém o hintId exatamente uma vez
    - **Validates: Requirements 4.3**

  - [ ] 1.5 Adicionar endpoints `PATCH /usuarios/me/hints` e `DELETE /usuarios/me/hints` ao controller
    - `PATCH`: recebe `DispensarHintDto`, chama `dispensarHint`, retorna mensagem de sucesso
    - `DELETE`: sem body, chama `resetarHints`, retorna mensagem de sucesso
    - Ambos usam `@CurrentUser()` para obter o usuário autenticado
    - _Requirements: 4.1, 7.2_

  - [ ]* 1.6 Escrever testes unitários do UsuariosService para hints
    - Testar caminho feliz de dispensar hint
    - Testar idempotência (dispensar mesmo hintId duas vezes)
    - Testar resetar quando array já está vazio
    - Testar resetar com hints existentes
    - _Requirements: 4.2, 4.3, 7.1, 7.2_

- [ ] 2. Backend — Atualizar Presenter e migração de dados
  - [ ] 2.1 Atualizar `UsuarioPresenter` para incluir `hintsDispensados` e `toastDescobrilidadeVisto` na resposta
    - Adicionar campos ao método `toHttp()` do presenter
    - Garantir que `GET /usuarios/me` retorna os novos campos
    - _Requirements: 4.4, 9.3_

  - [ ] 2.2 Criar script de migração de dados `toursCompletos` → `hintsDispensados`
    - Criar arquivo `prisma/migrations/data-migration-tours-to-hints.ts`
    - Definir mapeamento: cada tourId → lista de hintIds correspondentes (baseado no registry)
    - Para cada usuário com toursCompletos preenchido, popular hintsDispensados com os hintIds mapeados
    - Não duplicar hintIds já existentes em hintsDispensados
    - _Requirements: 10.1, 10.2_

  - [ ]* 2.3 Escrever property test para migração tours → hints (Property 15)
    - **Property 15: Migração converte tours em hints**
    - Gerar combinações aleatórias de toursCompletos, aplicar migração, verificar que todos os hintIds mapeados estão em hintsDispensados sem duplicatas
    - **Validates: Requirements 10.2**

- [ ] 3. Checkpoint — Backend pronto
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Frontend — Hint Registry e tipos
  - [ ] 4.1 Criar tipos de hint em `src/types/hint.types.ts`
    - Definir `ConfiguracaoHint` com campos: hintId, target, titulo, conteudo, placement, prioridade, pagina
    - Definir `EstadoHint = 'inedito' | 'exibido' | 'dispensado'`
    - _Requirements: 6.1_

  - [ ] 4.2 Criar `src/lib/hint-registry.ts` com registro declarativo de todos os hints
    - Mapear cada step do `tour-registry.ts` existente para um hint com formato `hint-{pagina}-{identificador}`
    - Trocar seletores `[data-tour="x"]` para `[data-hint="x"]`
    - Incluir campo `prioridade` (1-5) para cada hint
    - Agrupar hints por página/rota
    - Implementar `getHintsPorPagina(pathname)` com filtragem
    - Exportar constante `MAPEAMENTO_TOUR_HINTS` (tourId → hintIds[]) para uso na migração
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 10.1_

  - [ ]* 4.3 Escrever property tests para hint-registry (Properties 8, 9, 10)
    - **Property 8: Validade estrutural do registry**
    - Verificar que todas as entradas possuem campos obrigatórios não-vazios e prioridade entre 1 e 5
    - **Property 9: Filtragem por página**
    - Para qualquer pathname, getHintsPorPagina retorna apenas hints com pagina correspondente
    - **Property 10: Ordenação por prioridade na fila**
    - Hints com menor prioridade devem vir primeiro na ordenação
    - **Validates: Requirements 6.1, 6.2, 6.4**

- [ ] 5. Frontend — Hints Store (Zustand)
  - [ ] 5.1 Criar `src/stores/hints.store.ts` com gerenciamento de estado dos hints
    - Implementar state: `hintsDispensados` (Set), `hintsExibidos` (Set), `hintAtivo` (string|null), `filaAutoExibicao` (string[])
    - Implementar actions: `inicializar`, `dispensarHint`, `marcarComoExibido`, `abrirHint`, `fecharHint`, `enfileirar`, `desenfileirar`, `resetarTodos`, `obterEstado`
    - `dispensarHint` deve chamar service + fallback localStorage
    - `resetarTodos` deve chamar API de reset + limpar estado local
    - `obterEstado` retorna 'dispensado' | 'exibido' | 'inedito' baseado nos Sets
    - _Requirements: 1.4, 1.5, 2.6, 3.2, 7.1_

  - [ ]* 5.2 Escrever property tests para hints.store (Properties 1, 2, 3, 5, 11)
    - **Property 1: Dispensar marca como dispensado**
    - **Property 2: Fechar sem dispensar marca como exibido**
    - **Property 3: Fila — max 1 ativo por vez**
    - **Property 5: Toque beacon abre tooltip correto**
    - **Property 11: Reset limpa todos**
    - **Validates: Requirements 1.2, 1.4, 1.5, 2.5, 7.1**

- [ ] 6. Frontend — Service e Sync offline
  - [ ] 6.1 Criar `src/services/hint.service.ts` com chamadas HTTP
    - `dispensarHint(hintId)`: PATCH /usuarios/me/hints com body { hintId }
    - `resetarHints()`: DELETE /usuarios/me/hints
    - _Requirements: 4.1, 7.2_

  - [ ] 6.2 Criar `src/lib/hint-sync.ts` com mecanismo de fallback offline
    - Constante `HINT_STORAGE_KEY = 'hints-pendentes'`
    - `salvarHintPendente(hintId)`: salva no localStorage
    - `sincronizarHintsPendentes()`: tenta enviar cada pendente via API, remove os bem-sucedidos
    - Chamar `sincronizarHintsPendentes` na inicialização da app (login/refresh)
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 6.3 Escrever property test para sync offline (Property 7)
    - **Property 7: Resiliência offline — round trip de sincronização**
    - Gerar conjunto de hintIds pendentes, simular API success/failure, verificar que apenas os bem-sucedidos são removidos da lista
    - **Validates: Requirements 5.1, 5.3, 5.4**

- [ ] 7. Frontend — Componentes visuais
  - [ ] 7.1 Criar `src/components/hints/hint-beacon.tsx` — bolinha pulsante
    - 8px de diâmetro com animação pulse (scale 1→1.4)
    - Cor primária (#16a34a)
    - Área de toque 44x44px via padding invisível
    - Posição absolute no canto superior direito do elemento-alvo
    - Props: hintId, elementoAlvo (HTMLElement)
    - Ao tocar, chama `abrirHint(hintId)` do store
    - _Requirements: 2.1, 2.3, 2.4, 2.5_

  - [ ] 7.2 Criar `src/components/hints/hint-tooltip.tsx` — tooltip informativo
    - Exibe título (font-semibold), descrição (font-normal, text/70), botão "Entendi" (cor primária)
    - Max-width 280px, não transborda viewport 320px+
    - Glassmorphism: `bg-[#0f1a2e]/95 backdrop-blur-2xl border border-white/[0.12]`
    - `role="tooltip"`, dismissível via Escape
    - Recalcula posição se placement causa transbordo
    - Props: hintId, titulo, conteudo, placement, elementoAlvo, aoDispensar, aoFechar
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 7.3 Escrever property tests para tooltip (Properties 12, 13)
    - **Property 12: Tooltip renderiza todos os campos configurados**
    - **Property 13: Tooltip não transborda viewport**
    - **Validates: Requirements 8.1, 8.3**

  - [ ]* 7.4 Escrever testes unitários para HintBeacon e HintTooltip
    - Beacon: renderiza com classes corretas, área de toque, animação
    - Tooltip: role="tooltip", Escape dismisses, botão "Entendi" chama callback
    - _Requirements: 2.3, 2.4, 8.1, 8.4_

- [ ] 8. Frontend — HintsProvider (orquestrador)
  - [ ] 8.1 Criar `src/components/hints/hints-provider.tsx` — componente de orquestração
    - Filtra hints por pathname atual via `getHintsPorPagina`
    - Cria IntersectionObserver para cada `[data-hint]` presente na página
    - Quando elemento com hint inédito fica visível: enfileira para auto-exibição
    - Auto-exibição sequencial: um por vez, 500ms de intervalo após dispensar cada um
    - Renderiza HintBeacon em elementos com hint no estado 'exibido' (já auto-exibido, não dispensado)
    - Renderiza HintTooltip quando hintAtivo está definido no store
    - Ao dispensar: marca como dispensado no store (remove beacon + tooltip)
    - Ao fechar sem dispensar: marca como 'exibido' (tooltip some, beacon aparece)
    - Usa MutationObserver para detectar elementos que aparecem depois do mount
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 2.1, 2.2, 3.1, 3.4_

  - [ ]* 8.2 Escrever property test para renderização determinística (Property 4)
    - **Property 4: Mapeamento estado → renderização**
    - Para qualquer hintId, o comportamento de renderização segue deterministicamente o estado (dispensado → nada, exibido → beacon, inedito → auto-exibição ou beacon temporário)
    - **Validates: Requirements 2.1, 2.6, 3.3**

- [ ] 9. Frontend — Integração com AuthStore e toast de descobrilidade
  - [ ] 9.1 Integrar HintsStore com AuthStore para carregar hintsDispensados no login
    - No `auth.store.ts`, após login/refresh, chamar `hintsStore.inicializar(usuario.hintsDispensados)`
    - Chamar `sincronizarHintsPendentes()` após inicialização
    - Atualizar tipo `Usuario` em `src/types/usuario.types.ts` com `hintsDispensados: string[]` e `toastDescobrilidadeVisto: boolean`
    - _Requirements: 4.4, 5.2_

  - [ ] 9.2 Implementar toast de descobrilidade para novos usuários
    - Exibir toast "Procure as bolinhas verdes para dicas sobre cada funcionalidade" quando: nenhum hint dispensado E nenhum tour completo E toastDescobrilidadeVisto === false
    - Desaparece após 5 segundos ou ao ser dismissado
    - Ao exibir, marcar `toastDescobrilidadeVisto = true` no backend (PATCH /usuarios/me com flag)
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ]* 9.3 Escrever property test para toast (Property 14)
    - **Property 14: Toast exibido no máximo uma vez**
    - Para qualquer usuário com toastDescobrilidadeVisto === true, o toast nunca é renderizado
    - **Validates: Requirements 9.3**

- [ ] 10. Checkpoint — Novo sistema funcional
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Frontend — Migração: substituir atributos e remover sistema antigo
  - [ ] 11.1 Renomear atributos `data-tour` para `data-hint` em todos os componentes de página
    - Buscar em todo o projeto ocorrências de `data-tour=` e substituir por `data-hint=`
    - Manter atributos `data-testid` inalterados
    - _Requirements: 10.5_

  - [ ] 11.2 Substituir `TourPageWrapper` e `TourRefazerBotao` pelo `HintsProvider` no layout
    - Montar `HintsProvider` no layout principal (root layout ou layout autenticado)
    - Remover imports e uso de `TourPageWrapper` de todas as pages
    - Remover imports e uso de `TourRefazerBotao` dos headers
    - _Requirements: 10.3_

  - [ ] 11.3 Alterar botão "?" de "Refazer tour" para "Resetar dicas"
    - Manter o botão "?" existente na interface
    - Alterar funcionalidade para chamar `resetarTodos()` do HintsStore
    - Alterar label/tooltip para "Resetar dicas"
    - Disponibilizar também na página Minha Conta
    - _Requirements: 7.3, 7.4, 10.4_

  - [ ] 11.4 Remover dependência react-joyride e componentes do sistema antigo
    - Remover `react-joyride` do `package.json`
    - Deletar arquivos: `tour-registry.ts`, `tour-provider.tsx`, `tour-page-wrapper.tsx`, `botao-refazer-tour.tsx`, `tooltip-tour.tsx`, `tour-sync.ts`, `tour.service.ts`, `tour.types.ts`
    - Remover imports órfãos em qualquer componente
    - _Requirements: 10.3_

- [ ] 12. Final checkpoint — Tudo integrado
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document (15 properties total)
- Unit tests validate specific examples and edge cases
- Backend tasks (1-2) can be executed independently before frontend tasks
- The migration script (2.2) should be run AFTER the frontend hint-registry is created (4.2), since it depends on the tour→hints mapping
- Frontend tasks 4-8 build the new system; task 11 removes the old system — this allows parallel operation during development

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "4.1"] },
    { "id": 1, "tasks": ["1.2", "4.2"] },
    { "id": 2, "tasks": ["1.3", "4.3", "6.1"] },
    { "id": 3, "tasks": ["1.4", "1.5", "5.1", "6.2"] },
    { "id": 4, "tasks": ["1.6", "5.2", "6.3", "2.1"] },
    { "id": 5, "tasks": ["2.2", "7.1", "7.2"] },
    { "id": 6, "tasks": ["2.3", "7.3", "7.4", "8.1"] },
    { "id": 7, "tasks": ["8.2", "9.1"] },
    { "id": 8, "tasks": ["9.2", "9.3"] },
    { "id": 9, "tasks": ["11.1"] },
    { "id": 10, "tasks": ["11.2", "11.3"] },
    { "id": 11, "tasks": ["11.4"] }
  ]
}
```
