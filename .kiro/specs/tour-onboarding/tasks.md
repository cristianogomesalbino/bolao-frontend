# Implementation Plan: Tour de Onboarding

## Overview

Implementação de um sistema de tours interativos contextuais por página usando `react-joyride` no frontend e persistência de progresso no backend via campo `toursCompletos` no model Usuario. A implementação segue a ordem: backend (migration, repository, service, controller, testes) → frontend (tipos, service, hook, componentes, registry, integração nas páginas, testes). São 3 tours: Home (`/inicio`), Grupo (`/grupos/[grupoId]`), Palpites (`/palpites`). O ranking está integrado na página do grupo, não tem página separada.

## Tasks

- [ ] 1. Backend — Migration e Repository
  - [ ] 1.1 Criar migration Prisma adicionando campo `toursCompletos` ao model Usuario
    - Adicionar `toursCompletos String[] @default([])` ao model `Usuario` no `schema.prisma`
    - Rodar `sh dev npx prisma migrate dev --name adicionar_tours_completos_usuario`
    - Atualizar interface do repositório `UsuarioRepositoryInterface` para incluir `toursCompletos` no tipo `Usuario`
    - Atualizar `InMemoryUsuarioRepository` para suportar o novo campo
    - _Requirements: 5.2, 5.4_

  - [ ] 1.2 Adicionar constantes do módulo de tours no backend
    - Criar constante `TOURS_VALIDOS` em `src/modules/usuarios/usuarios.constants.ts` com os IDs válidos: `'tour-home' | 'tour-grupo' | 'tour-palpites'`
    - Adicionar mensagens de resposta (`MENSAGENS.TOUR_MARCADO_COMPLETO`, `MENSAGENS.TOUR_ID_INVALIDO`)
    - _Requirements: 5.5_

- [ ] 2. Backend — Service e Controller
  - [ ] 2.1 Implementar método `marcarTourCompleto` no UsuarioService
    - Adicionar método `marcarTourCompleto(usuarioId: string, tourId: string): Promise<void>`
    - Buscar usuário, verificar se tourId já está no array (idempotente — retornar sem modificar)
    - Se não está, adicionar ao array via `this.usuarioRepository.atualizar(usuarioId, { toursCompletos: [...atuais, tourId] })`
    - Lançar `UsuarioNaoEncontradoError` se usuário não existe
    - _Requirements: 5.2_

  - [ ] 2.2 Criar DTO `MarcarTourCompletoDto`
    - Criar `src/modules/usuarios/dto/marcar-tour-completo.dto.ts`
    - Campo `tourId` com `@IsIn(TOURS_VALIDOS)` e `@IsString({ message: 'tourId deve ser uma string' })`
    - Tipar como union type: `'tour-home' | 'tour-grupo' | 'tour-palpites'`
    - Decorar com `@ApiProperty`
    - _Requirements: 5.5_

  - [ ] 2.3 Adicionar endpoint PATCH `/usuarios/me/tours` no UsuarioController
    - Criar método `marcarTourCompleto(@CurrentUser() usuario, @Body() dto: MarcarTourCompletoDto)`
    - Chamar `this.usuarioService.marcarTourCompleto(usuario.id, dto.tourId)`
    - Retornar `{ mensagem: USUARIOS.MENSAGENS.TOUR_MARCADO_COMPLETO }`
    - Decorar com `@ApiOperation`, `@ApiResponse`
    - _Requirements: 5.1, 5.2, 5.5_

  - [ ] 2.4 Garantir que GET `/usuarios/me` retorna `toursCompletos` no presenter
    - Atualizar `UsuarioPresenter.toHttp()` para incluir campo `toursCompletos`
    - Verificar que o método `buscarPerfil` do service já retorna o campo do banco
    - _Requirements: 5.4_

  - [ ]* 2.5 Escrever testes unitários do backend (service + controller)
    - Testar `marcarTourCompleto` com InMemoryUsuarioRepository: adiciona ID ao array, é idempotente, lança erro para usuário inexistente
    - Testar controller: retorna 200 com mensagem correta, delega ao service
    - Testar DTO via validação: rejeita tourId inválido, aceita tourIds válidos
    - _Requirements: 5.2, 5.5_

  - [ ]* 2.6 Escrever property tests do backend (Properties 6 e 7)
    - **Property 6: Backend adiciona tourId ao array sem duplicatas e sem perda**
    - **Validates: Requirements 5.2**
    - Gerar arrays aleatórios de tourIds + novo tourId com fast-check
    - Verificar: resultado contém tourId exatamente uma vez, IDs prévios permanecem, tamanho ≤ anterior + 1
    - **Property 7: Backend rejeita tourId inválido**
    - **Validates: Requirements 5.5**
    - Gerar strings aleatórias fora do conjunto TOURS_VALIDOS
    - Verificar que service lança erro e array permanece inalterado

- [ ] 3. Checkpoint — Backend completo
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Frontend — Tipos e Service
  - [ ] 4.1 Criar tipos do tour (`tour.types.ts`)
    - Criar `src/types/tour.types.ts` com: `TourId`, `TOURS_VALIDOS`, `StepTour`, `ConfiguracaoTour`
    - `TourId = 'tour-home' | 'tour-grupo' | 'tour-palpites'`
    - Exportar no barrel file `src/types/index.ts`
    - _Requirements: 6.1, 7.5_

  - [ ] 4.2 Atualizar interface `Usuario` para incluir `toursCompletos`
    - Adicionar `toursCompletos: TourId[]` à interface `Usuario` em `src/types/usuario.types.ts`
    - _Requirements: 5.4_

  - [ ] 4.3 Criar tour service (`tour.service.ts`)
    - Criar `src/services/tour.service.ts` com função `marcarTourCompleto(tourId: TourId): Promise<void>`
    - Usar `apiClient.patch('/usuarios/me/tours', { tourId })`
    - Exportar no barrel file `src/services/index.ts`
    - _Requirements: 5.1_

- [ ] 5. Frontend — Hook useTour
  - [ ] 5.1 Implementar hook `useTour`
    - Criar `src/hooks/use-tour.ts`
    - Aceitar `UseTourOptions` (`tourId`, `steps`)
    - Retornar `UseTourRetorno` (`tourAtivo`, `steps`, `stepAtual`, `aguardando`, `handleCallback`, `iniciarTour`, `avancar`, `retroceder`, `encerrar`)
    - Consultar `toursCompletos` do auth store via `useAuthStore`
    - Enquanto `toursCompletos === undefined` → `aguardando=true`, `tourAtivo=false`
    - Se `tourId` não está em `toursCompletos` e dados disponíveis → `tourAtivo=true` automaticamente
    - `handleCallback` escuta `STATUS.FINISHED` e `STATUS.SKIPPED` → chama `encerrar()` + `marcarTourCompleto(tourId)`
    - Persistência otimista com fallback localStorage (`tours-pendentes`) em caso de falha de rede
    - Exportar no barrel file `src/hooks/index.ts`
    - _Requirements: 1.1, 1.2, 1.5, 2.3, 2.5, 5.1, 5.3, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 5.2 Escrever property tests do hook useTour (Properties 1, 2, 3, 5, 10, 11)
    - **Property 1: Tour ativa quando ID ausente do array de completos**
    - **Validates: Requirements 1.1, 6.3**
    - **Property 2: Tour permanece inativo quando ID presente no array de completos**
    - **Validates: Requirements 1.2, 6.6**
    - **Property 3: Tour aguarda carregamento dos dados do usuário**
    - **Validates: Requirements 1.5, 6.2**
    - **Property 5: Conclusão ou skip encerra tour e invoca persistência**
    - **Validates: Requirements 2.3, 2.5, 5.1, 6.5**
    - **Property 10: Refazer tour inicia no step 0**
    - **Validates: Requirements 4.4**
    - **Property 11: Hook retorna interface completa**
    - **Validates: Requirements 6.1, 6.4**

- [ ] 6. Frontend — Componentes de Tour
  - [ ] 6.1 Implementar TooltipTour (`tooltip-tour.tsx`)
    - Criar `src/components/tour/tooltip-tour.tsx`
    - Renderizar container com glassmorphism (`bg-white/[0.04] backdrop-blur-2xl border border-white/[0.12] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]`)
    - Título com `font-semibold text-texto`, corpo com `text-sm text-texto/80`
    - Indicador de progresso: `"{index + 1} de {size}"`
    - Botão "Pular" (ghost, sempre visível)
    - Botão "Anterior" (outline, visível quando `index > 0`)
    - Botão "Próximo" ou "Concluir" (primário, baseado em `isLastStep`)
    - Acessibilidade: `role="dialog"`, `aria-label`, navegação via teclado
    - _Requirements: 2.1, 2.2, 2.4, 2.6, 2.8, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 6.2 Escrever property test do TooltipTour (Property 4)
    - **Property 4: Botões de navegação corretos por índice de step**
    - **Validates: Requirements 2.1, 2.2, 2.4, 2.8**
    - Gerar `stepIndex ∈ [0, N-1]` e `totalSteps ∈ [1, 20]`
    - Verificar presença/ausência correta dos botões e indicador de progresso

  - [ ] 6.3 Implementar BotaoRefazerTour (`botao-refazer-tour.tsx`)
    - Criar `src/components/tour/botao-refazer-tour.tsx`
    - Renderizar ícone `HelpCircle` (lucide-react) no header
    - Se `toursDisponiveis.length === 0` → desabilitado (`opacity-50 cursor-not-allowed`)
    - Se `toursDisponiveis.length === 1` → click inicia tour diretamente
    - Se `toursDisponiveis.length > 1` → click abre dropdown (usar DropdownMenu do shadcn/ui)
    - Atributo `data-tour="botao-refazer-tour"`
    - _Requirements: 3.1, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 6.4 Escrever unit tests dos componentes de tour
    - Testar TooltipTour: renderiza com glassmorphism, botões corretos por índice, acessibilidade
    - Testar BotaoRefazerTour: desabilitado sem tours, click direto com 1, dropdown com 2+
    - _Requirements: 4.1, 4.2, 4.3, 4.6, 8.1_

- [ ] 7. Frontend — Tour Registry
  - [ ] 7.1 Criar tour-registry com configuração de todos os tours
    - Criar `src/lib/tour-registry.ts`
    - Definir `TOURS: ConfiguracaoTour[]` com 3 tours: `tour-home`, `tour-grupo`, `tour-palpites`
    - Cada tour com steps usando seletores `[data-tour="nome"]`
    - Último step de cada tour aponta para `[data-tour="botao-refazer-tour"]`
    - Exportar helper `getToursPorPagina(pathname: string): ConfiguracaoTour[]`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 7.2 Escrever property tests do tour-registry (Properties 8 e 9)
    - **Property 8: Todos os steps usam seletores data-tour**
    - **Validates: Requirements 7.6**
    - Iterar sobre todos os tours e steps, verificar formato `[data-tour="<nome>"]`
    - **Property 9: Último step de cada tour aponta para botão refazer**
    - **Validates: Requirements 3.1**
    - Verificar que último step de cada tour tem `target === '[data-tour="botao-refazer-tour"]'`

- [ ] 8. Checkpoint — Componentes e registry completos
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Frontend — Integração nas páginas
  - [ ] 9.1 Adicionar atributos `data-tour` nos elementos-alvo das páginas
    - Home (`/inicio`): `data-tour="boas-vindas"`, `data-tour="proximos-jogos"`, `data-tour="lista-grupos"`, `data-tour="card-ranking"`
    - Grupo (`/grupos/[grupoId]`): `data-tour="convidar-amigos"`, `data-tour="jogos-rodada"`, `data-tour="ranking-grupo"`, `data-tour="navegacao-rodadas"`
    - Palpites (`/palpites`): `data-tour="escolher-placar"`, `data-tour="palpite-dobrado"`, `data-tour="salvar-palpites"`
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

  - [ ] 9.2 Integrar BotaoRefazerTour no header de cada página com tour
    - Adicionar `BotaoRefazerTour` no header da página Home (`/inicio`) ao lado do `SinoNotificacoes`
    - Adicionar `BotaoRefazerTour` no header da página Grupo (`/grupos/[grupoId]`)
    - Adicionar `BotaoRefazerTour` no header da página Palpites (`/palpites`)
    - Usar `getToursPorPagina` para determinar tours disponíveis na página atual
    - Atributo `data-tour="botao-refazer-tour"` no botão
    - Nota: não há layout global com header — cada página tem seu próprio header inline
    - _Requirements: 4.1, 3.1_

  - [ ] 9.3 Integrar react-joyride e useTour nas páginas com tour
    - Em cada página com tour (Home `/inicio`, Grupo `/grupos/[grupoId]`, Palpites `/palpites`): importar `useTour` + steps do registry
    - Renderizar `<Joyride>` com `tooltipComponent={TooltipTour}`, `callback={handleCallback}`, `run={tourAtivo}`, `stepIndex={stepAtual}`, `steps={steps}`
    - Configurar `continuous`, `showSkipButton`, `disableOverlayClose`, `spotlightClicks`
    - Configurar overlay escurecido com `styles.overlay: { backgroundColor: 'rgba(0,0,0,0.5)' }`
    - _Requirements: 1.1, 1.3, 1.4, 2.6, 2.7, 8.5_

  - [ ] 9.4 Implementar mecanismo de retry de tours pendentes
    - No auth store ou providers.tsx: ao inicializar, verificar `localStorage.getItem('tours-pendentes')`
    - Se existir, enviar cada tourId via `tourService.marcarTourCompleto`
    - Remover do localStorage ao sucesso
    - _Requirements: 5.3_

- [ ] 10. Frontend — Testes de integração
  - [ ]* 10.1 Escrever testes de integração das páginas com tour
    - Testar que tour inicia automaticamente quando tourId não está em toursCompletos
    - Testar que tour não inicia quando tourId já está em toursCompletos
    - Testar fluxo completo: avançar steps, pular, concluir
    - Testar mecanismo de retry com localStorage
    - _Requirements: 1.1, 1.2, 2.3, 2.5, 5.3_

- [ ] 11. Final checkpoint — Todos os testes passando
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Backend commands via Docker: `sh dev npx vitest run` para testes, `sh dev npx prisma migrate dev` para migrations
- Frontend usa fast-check (já instalado) para property-based tests
- Todos os tours terminam apontando para `[data-tour="botao-refazer-tour"]` (Property 9)
- O app não tem header global — cada página tem seu próprio header inline. O BotaoRefazerTour é adicionado individualmente em cada página com tour
- Não existe página de ranking separada; o ranking está integrado na página do grupo (`/grupos/[grupoId]`)
- A página de palpites é `/palpites` (flat, com seleção de campeonato via query params), não uma rota aninhada

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.2", "4.1"] },
    { "id": 2, "tasks": ["2.3", "2.4", "4.2", "4.3"] },
    { "id": 3, "tasks": ["2.5", "2.6", "5.1"] },
    { "id": 4, "tasks": ["5.2", "6.1", "6.3", "7.1"] },
    { "id": 5, "tasks": ["6.2", "6.4", "7.2"] },
    { "id": 6, "tasks": ["9.1", "9.2"] },
    { "id": 7, "tasks": ["9.3", "9.4"] },
    { "id": 8, "tasks": ["10.1"] }
  ]
}
```
