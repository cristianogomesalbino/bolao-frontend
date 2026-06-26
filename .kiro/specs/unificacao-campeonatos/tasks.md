# Tarefas — Unificação de Campeonatos

## Fase 1 — Backend: Schema + Endpoint

### Task 1: Migration Prisma — Campeonato e Fase
- [ ] Adicionar campos ao model `Campeonato`: `slug` (String, @unique), `externoId` (String?), `tipo` (enum TipoCampeonato: LIGA/COPA), `tema` (Json?), `status` (enum StatusCampeonato: ATIVO/EM_BREVE/ENCERRADO)
- [ ] Adicionar campos ao model `Fase`: `slugExterno` (String?), `maxRodadas` (Int, @default(38))
- [ ] Criar enums `TipoCampeonato` e `StatusCampeonato`
- [ ] Adicionar `@@index` em `Campeonato.slug`
- [ ] Gerar migration: `npx prisma migrate dev --name add_campeonato_config_fields`
- [ ] Verificar que migration não quebra dados existentes (campos opcionais com defaults)

### Task 2: Seed — Popular campos dos campeonatos existentes
- [ ] Criar script de seed que popula:
  - Brasileirão: `slug='brasileirao'`, `externoId='d1a37fa4-e948-43a6-ba53-ab24ab3a45b1'`, `tipo=LIGA`, `status=ATIVO`
  - Copa 2026: `slug='copa-do-mundo'`, `externoId='b5ff9c28-476e-4816-a699-7645acc94cd0'`, `tipo=COPA`, `status=ENCERRADO`
- [ ] Popular `slugExterno` nas Fases existentes (mapear pelo nome atual da fase)
- [ ] Popular `maxRodadas` nas Fases existentes (38 para Brasileirão, 3 para grupos Copa, etc.)
- [ ] Executar seed no banco de dev via Docker

### Task 3: Criar estrutura de config local
- [ ] Criar `src/config/campeonatos/types.ts` com interfaces: `TemaConfig`, `FaseConfig`, `BracketEntry`, `BracketConfig`, `CampeonatoLocalConfig`
- [ ] Criar `src/config/campeonatos/brasileirao/config.ts` — metadados
- [ ] Criar `src/config/campeonatos/brasileirao/fases.ts` — definição de fases
- [ ] Criar `src/config/campeonatos/brasileirao/tema.ts` — cores
- [ ] Criar `src/config/campeonatos/copa-do-mundo/config.ts` — metadados
- [ ] Criar `src/config/campeonatos/copa-do-mundo/fases.ts` — definição de fases
- [ ] Criar `src/config/campeonatos/copa-do-mundo/tema.ts` — cores e efeitos
- [ ] Criar `src/config/campeonatos/copa-do-mundo/bracket.ts` — mover `COPA_CHAVEAMENTO_16AVOS`, `COPA_BRACKET_*` para cá
- [ ] Criar `src/config/campeonatos/copa-do-mundo/alocacao-terceiros.ts` — mover `TABELA_ALOCACAO_TERCEIROS`
- [ ] Criar `src/config/campeonatos/index.ts` — registry com `obterConfigLocal()` e `obterBracketConfig()`
- [ ] Verificar getDiagnostics — 0 errors

### Task 4: Atualizar CampeonatoRepository interface
- [ ] Adicionar tipos na interface: `CampeonatoComFases`, `BuscarComFasesFiltro`
- [ ] Adicionar método `buscarComFases(filtro)` à interface
- [ ] Implementar em `prisma-campeonato.repository.ts`
- [ ] Implementar em `in-memory-campeonato.repository.ts`
- [ ] Atualizar `CampeonatoRepository` para usar tipos próprios (eliminar `any`)

### Task 5: Criar endpoint GET /campeonatos/config
- [ ] Criar `CampeonatoConfigPresenter` em `src/common/presenters/` com método `toHttp()`
- [ ] Adicionar método `buscarConfig(incluirEncerrados: boolean)` no `CampeonatosService`
- [ ] Adicionar rota `@Public() @Get('config')` no `CampeonatosController`
- [ ] Decorar com `@ApiOperation`, `@ApiResponse` para Swagger
- [ ] Criar teste unitário do service
- [ ] Criar teste unitário do controller
- [ ] Verificar getDiagnostics — 0 errors
- [ ] Verificar build Docker — BUILD_OK

---

## Fase 2 — Backend: Refatorar Services

### Task 6: Refatorar SincronizacaoAutomaticaService
- [ ] Alterar query em `buscarFasesParaSincronizar()` para incluir `campeonato.slug` via relação
- [ ] Usar `fase.slugExterno` diretamente em vez de `resolverFaseSlug()`
- [ ] Remover método `resolverCampeonatoSlug()`
- [ ] Remover método `resolverFaseSlug()`
- [ ] Remover método `resolverFaseSlugCopa()`
- [ ] Filtrar fases: só sincroniza se `slugExterno` não é null
- [ ] Atualizar testes unitários
- [ ] Verificar getDiagnostics — 0 errors

### Task 7: Refatorar ChaveamentoService
- [ ] Alterar `preencherProximaFaseEliminatoria()` para receber `campeonatoSlug` em vez de `config: CampeonatoConfig`
- [ ] Usar `obterBracketConfig(slug)` de `src/config/campeonatos/` para obter dados de bracket
- [ ] Remover imports diretos de `COPA_CHAVEAMENTO_16AVOS`, `COPA_BRACKET_*`, `TABELA_ALOCACAO_TERCEIROS` do `jogos.constants.ts`
- [ ] Generalizar métodos para operar sobre `BracketConfig` genérico
- [ ] Atualizar testes unitários
- [ ] Verificar getDiagnostics — 0 errors

### Task 8: Refatorar FutebolApiService
- [ ] `buscarClassificacao()` recebe `externoId` e `faseSlug` como params em vez de usar constantes
- [ ] Quem chama passa os dados vindos do banco (via campeonato.externoId + fase.slugExterno)
- [ ] Remover import de `BRASILEIRAO_CAMPEONATO_ID` onde possível
- [ ] Atualizar testes unitários
- [ ] Verificar getDiagnostics — 0 errors

### Task 9: Limpar jogos.constants.ts
- [ ] Remover `CAMPEONATO_CONFIGS` (substituído por banco + config local)
- [ ] Remover `BRASILEIRAO_CAMPEONATO_ID`, `COPA_DO_MUNDO_CAMPEONATO_ID` (migram para banco)
- [ ] Remover `COPA_FASES`, `COPA_FASES_ELIMINATORIAS` (migram para `config/campeonatos/copa-do-mundo/`)
- [ ] Remover `COPA_CHAVEAMENTO_16AVOS`, `COPA_BRACKET_*`, `TABELA_ALOCACAO_TERCEIROS` (migram para config)
- [ ] Manter: `GE_BASE_URL`, `SYNC`, `JOGOS` (constantes de infra/módulo)
- [ ] Manter: `obterCampeonatoConfig()` redireciona para `obterConfigLocal()` durante transição (ou remover se ninguém mais usa)
- [ ] Atualizar todos os arquivos que importavam as constantes removidas
- [ ] Rodar testes — 0 falhas
- [ ] Verificar build — BUILD_OK

### Task 10: Atualizar DTOs de importação/sincronização
- [ ] `ImportarJogosDto`: validação de `campeonatoSlug` via query ao banco em vez de `@IsIn(CAMPEONATO_SLUGS)`
- [ ] Ou manter validação estática lendo do registry local (`obterConfigLocal`)
- [ ] Atualizar testes
- [ ] Verificar getDiagnostics — 0 errors

---

## Fase 3 — Frontend: Config + Temas

### Task 11: Criar sistema de temas
- [ ] Criar `src/config/temas/types.ts` com interface `TemaConfig`
- [ ] Criar `src/config/temas/default.ts` com `TEMA_DEFAULT`
- [ ] Criar `src/config/temas/copa.ts` com `TEMA_COPA` (centralizar TODAS as cores espalhadas)
- [ ] Criar `src/config/temas/index.ts` com `obterTema(slug)` e re-export de types
- [ ] Criar `src/config/temas/TemaProvider.tsx` com Context + hook `useTema()`
- [ ] Verificar getDiagnostics — 0 errors

### Task 12: Criar hook useCampeonatosConfig
- [ ] Criar `src/hooks/useCampeonatosConfig.ts`
- [ ] Definir tipo `CampeonatoConfigResponse` para a resposta
- [ ] Implementar com React Query (staleTime: 1h, gcTime: 24h)
- [ ] Adicionar função de service `buscarCampeonatosConfig()` em `src/services/jogo.service.ts` (ou novo `campeonato.service.ts`)
- [ ] Verificar getDiagnostics — 0 errors

### Task 13: Remover CAMPEONATOS hardcoded + ehCampeonatoCopa
- [ ] Remover array `CAMPEONATOS` de `src/types/jogo.types.ts`
- [ ] Remover type `CampeonatoSlug` union hardcoded (vira `string`)
- [ ] Remover interfaces `FaseSlugConfig`, `CampeonatoConfig` locais (vem do hook agora)
- [ ] Remover `ehCampeonatoCopa()` de `src/lib/jogo-helpers.ts`
- [ ] Substituir usos de `ehCampeonatoCopa(nome)` por `campeonato.tipo === 'COPA'` ou `campeonato.slug === 'copa-do-mundo'`
- [ ] Atualizar imports em todos os arquivos afetados
- [ ] Verificar getDiagnostics — 0 errors

### Task 14: Prefetch da config no layout protegido
- [ ] No layout `(protegido)/layout.tsx`, adicionar prefetch do `useCampeonatosConfig`
- [ ] Garantir que quando palpites/page.tsx monta, os dados já estão no cache
- [ ] Verificar getDiagnostics — 0 errors

---

## Fase 4 — Frontend: Componentes

### Task 15: Refatorar página de palpites com TemaProvider
- [ ] Envolver conteúdo da página com `<TemaProvider slug={campeonato}>`
- [ ] Substituir todas as classes hardcoded de Copa (bg-[#003d1a], border-[#009c3b], etc.) por uso do `useTema()`
- [ ] Remover variável `ehCopaMundo` — usar `tema.efeitos.glow` para efeitos e `tema.corFundo` para cores
- [ ] Gerar abas de campeonato dinamicamente via `useCampeonatosConfig()`
- [ ] Verificar getDiagnostics — 0 errors

### Task 16: Criar componente unificado ListaJogos
- [ ] Criar `src/components/palpites/lista-jogos.tsx`
- [ ] Implementar lógica de decisão: 1 fase PC → `ListaRodadas`, múltiplas fases → `ListaFasesComTabs`
- [ ] Criar sub-componente `ListaRodadas` (absorve lógica de `AbaTodosJogos`)
- [ ] Criar sub-componente `ListaFasesComTabs` (absorve lógica de `AbaJogosCopa`)
- [ ] Ambos recebem `tema` via `useTema()` (Context)
- [ ] Extrair lógica de chaveamento (labels TBD) para `src/lib/bracket-helpers.ts`
- [ ] Verificar getDiagnostics — 0 errors

### Task 17: Integrar ListaJogos na página de palpites
- [ ] Substituir uso de `<AbaJogosCopa>` e `<AbaTodosJogos>` por `<ListaJogos>`
- [ ] Remover a condicional `ehCopaMundo ? <AbaJogosCopa> : <AbaTodosJogos>`
- [ ] Passar fases, grupoId, temporadaId para ListaJogos
- [ ] Verificar renderização para Brasileirão (1 fase, navegação rodada)
- [ ] Verificar renderização para Copa-style (múltiplas fases, tabs)
- [ ] Verificar getDiagnostics — 0 errors

### Task 18: Refatorar página de grupo com tema genérico
- [ ] Substituir `ehCopa` (detecção por nome) por `campeonato.tipo === 'COPA'`
- [ ] Usar `useTema()` para cores em vez de hardcoded
- [ ] Componentes Copa-específicos (`AbaDashboardCopa`, `AbaClassificacaoCopa`, `AbaMeusPalpitesCopa`) recebem tema via context
- [ ] Renomear para nomes genéricos: `AbaDashboard`, `AbaClassificacao`, `AbaMeusPalpites` (se a lógica é reutilizável)
- [ ] Verificar getDiagnostics — 0 errors

### Task 19: Refatorar página admin/importar
- [ ] Substituir `CAMPEONATOS.find(c => c.slug === ...)` por `useCampeonatosConfig()`
- [ ] Remover `temporadaCopa` / `temporadaBrasileiro` (detecção por nome) — usar `slug`
- [ ] Gerar seletor de campeonato dinamicamente
- [ ] Gerar seletor de fases a partir da config do backend
- [ ] Verificar getDiagnostics — 0 errors

### Task 20: Refatorar usePalpitesData e useHomeData
- [ ] `usePalpitesData`: substituir `ehCampeonatoCopa()` por comparação de slug
- [ ] `usePalpitesData`: usar `useCampeonatosConfig()` para resolver temporada por slug
- [ ] `useHomeData`: substituir detecção de Copa por nome por slug/tipo
- [ ] Remover import de `ehCampeonatoCopa` nesses arquivos
- [ ] Verificar getDiagnostics — 0 errors

### Task 21: Remover código morto
- [ ] Deletar `src/components/palpites/aba-jogos-copa.tsx`
- [ ] Deletar `src/components/palpites/aba-todos-jogos.tsx`
- [ ] Deletar `ehCampeonatoCopa` de `jogo-helpers.ts` (se ainda existir)
- [ ] Deletar imports não utilizados em todos os arquivos tocados
- [ ] Rodar `npx next lint` — 0 errors
- [ ] Rodar `npx tsc --noEmit` — 0 errors
- [ ] Verificar build — sucesso
