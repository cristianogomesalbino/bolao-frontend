# Tasks

## Task 1: Criar modelo Prisma e migration

- [ ] Adicionar enum `TipoStory` ao `schema.prisma` (ACERTOU_EM_CHEIO, UNICO_NA_MOSCA, SUBIU_RANKING, SEQUENCIA_MOSCA, SEQUENCIA_RESULTADO, NAO_PALPITOU, DOBROU_E_ACERTOU)
- [ ] Adicionar model `Story` com campos: id, grupoId, usuarioId, jogoId, rodada, tipo, dados (Json), titulo (String), contadorFs (Int default 0), criadoEm
- [ ] Adicionar model `StoryReacao` com campos: id, storyId, remetenteId, criadoEm. Constraint: @@unique([remetenteId, storyId])
- [ ] Adicionar model `StoryVisualizacao` com campos: id, storyId, usuarioId, visualizadoEm. Constraint: @@unique([storyId, usuarioId])
- [ ] Configurar relações: Story → Grupo (cascade), Story → Usuario (cascade), Story → Jogo (cascade), StoryReacao → Story (cascade), StoryVisualizacao → Story (cascade)
- [ ] Adicionar unique constraint `@@unique([grupoId, usuarioId, jogoId, tipo])` em Story
- [ ] Adicionar índices compostos: `@@index([grupoId, criadoEm])`, `@@index([grupoId, usuarioId])`, `@@index([grupoId, rodada])` em Story; `@@index([storyId])` em StoryReacao e StoryVisualizacao
- [ ] Criar enum `CategoriaRecorde` (MOSCA, RESULTADO)
- [ ] Criar model `RecordeSequencia` com campos: id, grupoId, temporadaId, categoria, valor (Int), criadoEm, atualizadoEm; unique (grupoId, temporadaId, categoria)
- [ ] Criar model `RecordeDetentor` com campos: id, recordeId, usuarioId, atingidoEm; unique (recordeId, usuarioId)
- [ ] Criar model `RankingSnapshot` com campos: id, grupoId, usuarioId, faseId, rodada (Int?), posicao (Int), pontuacao (Int), criadoEm; unique (grupoId, usuarioId, faseId, rodada); index (grupoId, faseId, rodada)
- [ ] Configurar relações: RecordeSequencia → Grupo (cascade), RecordeSequencia → Temporada (cascade), RecordeDetentor → RecordeSequencia (cascade), RankingSnapshot → Grupo (cascade)
- [ ] Adicionar relações inversas em Usuario (stories, storyReacoes, storyVisualizacoes), Grupo (stories, recordesSequencia, rankingSnapshots), Jogo (stories), Temporada (recordesSequencia)
- [ ] Adicionar valores `STORIES_GRUPO` e `RECEBEU_F` ao enum `TipoNotificacao`
- [ ] Adicionar campos `storiesGrupo Boolean @default(true)` e `recebeuF Boolean @default(true)` ao model `PreferenciaNotificacao`
- [ ] Gerar migration via `docker exec bolao-backend-dev npx prisma migrate dev --name add_stories_module`
- [ ] Verificar que `prisma generate` executa sem erros

### Requirements addressed
- Requisito 1 (AC 1-8)
- Requisito 8 (AC 5)

## Task 2: Criar estrutura base do módulo stories (constants, types, domain errors)

- [ ] Criar `src/modules/stories/stories.constants.ts` com TAG, REPOSITORY_TOKEN, EVENT_SERVICE_TOKEN, LIMITES (EXPIRACAO_DIAS, SEQUENCIA_MOSCA_MINIMA, SEQUENCIA_RESULTADO_CONSULTA_RODADAS, ULTIMOS_JOGOS_SEQUENCIA, MAX_STORIES_LISTAGEM, MIN_STORIES_VIEWER, SUBIU_RANKING_MINIMO, SUBIU_RANKING_TOP), TIMER_POR_TIPO, PRIORIDADE_POR_TIPO, CRON, MENSAGENS e TEMPLATES
- [ ] Criar `src/modules/stories/types/story.types.ts` com interfaces: StoryTitle (id, title, emoji, rarity?), DadosAcertouEmCheio, DadosUnicoNaMosca, DadosSubiuRanking, DadosSequenciaMosca, DadosSequenciaResultado, DadosNaoPalpitou (consolidado por rodada com lista de jogos), DadosDobrouEAcertou, RecordeInfo, StoryComVisualizacao, JogoComTimes, GrupoBasico, MembroComUsuario
- [ ] Criar catálogo `src/modules/stories/stories.titulos.ts` com `STORY_TITULOS: Record<TipoStory, StoryTitle[]>` — todos os títulos por tipo com id, title, emoji
- [ ] Criar `src/common/errors/domain-errors/stories.errors.ts` com: StoryNaoEncontradoError, StoryExpiradoError, ReacaoApenasNaoPalpitouError, NaoPodeEnviarFParaSiMesmoError, UsuarioJaEnviouFError
- [ ] Exportar os novos domain errors no barrel `src/common/errors/domain-errors/index.ts`

### Requirements addressed
- Requisito 1 (suporte de tipos)
- Requisito 2 (AC 15 — StoryTitle)
- Requisito 4 (domain errors)

## Task 3: Criar repository interface e implementações (Prisma + InMemory)

- [ ] Criar `src/modules/stories/repositories/story.repository.interface.ts` com tipos e interface StoryRepository:
  - criar, criarVarios
  - buscarPorId (filtra rodadas não-visíveis)
  - buscarPorGrupoERodadas(grupoId, rodadaAtual, rodadaAnterior, limite) — ordenado por rodada DESC, criadoEm DESC, prioridade por tipo
  - buscarPorGrupoUsuario
  - incrementarContadorFs
  - existeReacao(remetenteId, storyId)
  - criarReacao
  - criarVisualizacoesBatch(storyIds, usuarioId)
  - verificarVisualizacoes(storyIds, usuarioId) — retorna Set de storyIds visualizados
  - removerAntigos(diasLimite)
- [ ] Criar `src/modules/stories/repositories/prisma-story.repository.ts` implementando StoryRepository
  - Implementar ORDER BY com CASE para prioridade por tipo (derivada, não campo)
- [ ] Criar `src/modules/stories/repositories/in-memory-story.repository.ts` para testes unitários
- [ ] Criar interface RecordeRepository: buscarRecorde, criarOuAtualizar, adicionarDetentor, limparDetentores
- [ ] Criar implementações Prisma e InMemory do RecordeRepository
- [ ] Criar interface RankingSnapshotRepository: buscarPorGrupoFaseRodada, upsertBatch
- [ ] Criar implementações Prisma e InMemory do RankingSnapshotRepository

### Requirements addressed
- Requisito 1 (AC 3, 4, 5, 8)
- Requisito 3 (AC 1, 7)
- Requisito 9 (AC 1)

## Task 4: Criar StoryGeneratorService (geração dos 7 tipos)

- [ ] Criar `src/modules/stories/services/story-generator.service.ts`
- [ ] Implementar método `gerarStoriesParaGrupo(jogo, grupo, membros)` que avalia cada membro contra todos os critérios
- [ ] Implementar lógica UNICO_NA_MOSCA: verificar se exatamente 1 membro acertou em cheio. Se sim, gerar UNICO_NA_MOSCA para ele (não gerar ACERTOU_EM_CHEIO)
- [ ] Implementar lógica ACERTOU_EM_CHEIO: gerar para membros que cravaram E não são o único (quando 2+ cravaram)
- [ ] Implementar lógica SUBIU_RANKING: ler posição anterior do RankingSnapshot (1 SELECT), comparar com posição atual. Gerar se subiu 2+ posições OU subiu 1 posição dentro do top 5
- [ ] Após calcular ranking atual, salvar RankingSnapshot em batch (upsert por unique grupoId+usuarioId+faseId+rodada)
- [ ] Implementar lógica SEQUENCIA_MOSCA: delegar para StorySequenciaService.calcularSequenciaMosca(). Gerar se 2+ acertos em cheio consecutivos na rodada (sem jogo entre eles que não foi na mosca, ordem por finalização)
- [ ] Implementar lógica SEQUENCIA_RESULTADO: delegar para StorySequenciaService.calcularSequenciaResultado(). Consulta até 3 rodadas anteriores. Gerar se sequência > 0. Gravar recorde.
- [ ] Implementar lógica NAO_PALPITOU consolidado: verificar se membro não palpitou em nenhum jogo da rodada que já finalizou. Gerar 1 story por rodada com lista de jogos esquecidos. Verificar se já existe story NAO_PALPITOU pra esse membro+grupo+rodada antes de criar.
- [ ] Implementar lógica DOBROU_E_ACERTOU: membro com PalpiteDobrado que acertou resultado (ACERTO_EM_CHEIO ou ACERTO_DE_RESULTADO)
- [ ] Implementar pickRandomTitle(tipo, ultimoTituloUsado) — seleciona StoryTitle sem repetição imediata. Persiste campo `titulo` no story.
- [ ] Persistir stories em batch via `storyRepo.criarVarios()` com deduplicação (try/catch em unique constraint)
- [ ] Garantir que falha em um membro não bloqueia os demais (try/catch por membro com log de erro)

### Requirements addressed
- Requisito 2 (AC 1-15)

## Task 5: Criar StorySequenciaService (cálculo de sequência + recorde)

- [ ] Criar `src/modules/stories/services/story-sequencia.service.ts`
- [ ] Implementar método `calcularSequenciaMosca(usuarioId, faseId, rodada, jogoAtualId)`:
  - Buscar jogos finalizados da mesma rodada, ordenados por horário de finalização
  - Buscar palpites do usuário para esses jogos
  - Contar acertos EM CHEIO consecutivos (sem jogo entre eles que não foi na mosca)
  - Retornar null se < 2 acertos consecutivos
  - Limitar ultimosJogos a 5 registros
- [ ] Implementar método `calcularSequenciaResultado(usuarioId, faseId, rodadaAtual, jogoAtualId)`:
  - Buscar jogos finalizados da rodada atual + até 3 rodadas/fases anteriores
  - Buscar palpites do usuário para esses jogos
  - Contar acertos de resultado (cheio + resultado) consecutivos cross-rodada
  - Retornar null se < 2 acertos
- [ ] Implementar método `atualizarRecorde(grupoId, temporadaId, categoria, usuarioId, novoValor)`:
  - Buscar RecordeSequencia existente para (grupoId, temporadaId, categoria)
  - Se não existe: criar com valor e detentor
  - Se novoValor > recorde.valor: atualizar valor, limpar detentores antigos, adicionar novo
  - Se novoValor === recorde.valor: adicionar detentor (manter existentes — empate)
  - Retornar { valor, detentores, ehNovoRecorde }

### Requirements addressed
- Requisito 2 (AC 5, 6, 13, 14, 16)

## Task 6: Criar StoryEventService (orquestrador)

- [ ] Criar `src/modules/stories/services/story-event.service.ts`
- [ ] Implementar `processarJogoFinalizado(jogoId)`: buscar jogo com times, buscar fase → temporada → grupos, iterar por grupo chamando StoryGeneratorService + StoryNotificacaoService
- [ ] Envolver tudo em try/catch com logger.error (nunca lançar exceção para cima — fire-and-forget)
- [ ] Para cada grupo, buscar membros via GrupoUsuarioRepository.listarPorGrupoComUsuario()
- [ ] Documentar known limitation: concorrência em SEQUENCIA_MOSCA se 2 jogos finalizam simultaneamente (AC 16)

### Requirements addressed
- Requisito 2 (AC 1, 9, 10, 16)

## Task 7: Criar StoryReactionService (Mandar um F)

- [ ] Criar `src/modules/stories/services/story-reaction.service.ts`
- [ ] Implementar `mandarF(storyId, remetenteId, grupoId)` com todas as validações:
  - Story existe e rodada é atual ou anterior → StoryNaoEncontradoError
  - story.tipo === NAO_PALPITOU → ReacaoApenasNaoPalpitouError
  - story.usuarioId !== remetenteId → NaoPodeEnviarFParaSiMesmoError
  - Não existe StoryReacao com unique(remetenteId, storyId) → UsuarioJaEnviouFError
- [ ] Criar StoryReacao + incrementar story.contadorFs
- [ ] Disparar notificação push fire-and-forget para o autor do story (tipo RECEBEU_F, respeitando preferência recebeuF)
- [ ] Agrupar notificações: se múltiplos Fs no mesmo story, consolidar em "X pessoas mandaram um F"
- [ ] Retornar novo contadorFs

### Requirements addressed
- Requisito 4 (AC 1-9)

## Task 8: Criar StoryNotificacaoService (push consolidado)

- [ ] Criar `src/modules/stories/services/story-notificacao.service.ts`
- [ ] Implementar `notificarNovosStories(grupo, jogoId, quantidade)`: deduplicar via existeNotificacao (tipo STORIES_GRUPO, grupoId, jogoId), buscar membros com push ativo + preferência storiesGrupo habilitada, criar notificações em batch, enviar push
- [ ] Implementar `notificarRecebeuF(storyAutorId, remetenteNome, grupoNome)`: verificar preferência recebeuF do autor, criar notificação, enviar push. Agrupar se múltiplos Fs.
- [ ] Para stories NAO_PALPITOU, incluir payload com campos extras (storyId, grupoId, tipo) para Notification Actions no frontend

### Requirements addressed
- Requisito 8 (AC 1-4)
- Requisito 4 (AC 6, 7)

## Task 9: Criar StoryCronService (limpeza)

- [ ] Criar `src/modules/stories/services/story-cron.service.ts`
- [ ] Implementar cron job `@Cron('0 5 * * *')` que deleta stories com criadoEm < 30 dias
- [ ] Cascade de StoryReacao e StoryVisualizacao já garantido pelo onDelete: Cascade no schema
- [ ] Envolver em try/catch com logger.error (nunca interromper aplicação)
- [ ] Logar quantidade de stories removidos

### Requirements addressed
- Requisito 9 (AC 2-5)

## Task 10: Criar StoryController e endpoints

- [ ] Criar `src/modules/stories/controllers/story.controller.ts` com:
  - `GET /grupos/:grupoId/stories` — listagem cronológica do grupo (Guard: GroupRoleGuard ADMIN + MEMBER), mín 5 / máx 20, rodada atual + anterior, ORDER BY com prioridade por tipo
  - `POST /grupos/:grupoId/stories/:storyId/mandar-f` — enviar F (Guard: GroupRoleGuard ADMIN + MEMBER)
  - `POST /grupos/:grupoId/stories/visualizar` — batch de visualização (body: { storyIds: string[] })
- [ ] Na listagem: calcular rodada atual, filtrar por rodada, incluir campo `visualizado` e `jaEnviouF` por story para o membro autenticado
- [ ] Na listagem: retornar dados do autor (usuarioId, nome, avatar) em cada story item (timeline cronológica, não agrupado)
- [ ] Criar Presenter (StoryPresenter.toHttp) com campos: id, tipo, titulo, dados, jogoId, rodada, criadoEm, contadorFs, jaEnviouF, visualizado, autor (id, nome, avatar)
- [ ] Decorar com @ApiTags(STORIES.TAG), @ApiOperation, @ApiResponse
- [ ] Usar @CurrentUser() para obter usuário autenticado
- [ ] Usar ParseUUIDCustomPipe para validar UUIDs nos params

### Requirements addressed
- Requisito 3 (AC 1-7)
- Requisito 4 (AC 1, 8, 9)

## Task 11: Criar StoriesModule e integrar com JogoService

- [ ] Criar `src/modules/stories/stories.module.ts` registrando todos os services, repositories e controllers
- [ ] Exportar StoryEventService e STORIES.EVENT_SERVICE_TOKEN
- [ ] Adicionar import do StoriesModule no AppModule
- [ ] Em JogoService: injetar StoryEventService via `@Optional() @Inject(STORIES.EVENT_SERVICE_TOKEN)`
- [ ] Em JogoService: criar `dispararStoriesJogoFinalizado(jogoId)` fire-and-forget
- [ ] Chamar `dispararStoriesJogoFinalizado()` em `finalizar()` e no loop de jogos finalizados em `sincronizarPlacares()`

### Requirements addressed
- Requisito 2 (AC 9)

## Task 12: Testes unitários do backend

- [ ] Criar testes para StoryGeneratorService:
  - Testar cada tipo de story individualmente
  - Testar prioridade UNICO_NA_MOSCA > ACERTOU_EM_CHEIO (quando único, não gera ambos)
  - Testar SUBIU_RANKING com critério 2+ posições e 1 posição no top 5
  - Testar NAO_PALPITOU consolidado por rodada
  - Testar deduplicação (não gerar duplicatas)
  - Testar múltiplos stories para o mesmo membro
  - Testar falha individual sem interromper batch
  - Testar pickRandomTitle sem repetição imediata
- [ ] Criar testes para StorySequenciaService:
  - Testar SEQUENCIA_MOSCA: 2, 3, 5 acertos consecutivos na rodada
  - Testar SEQUENCIA_MOSCA: quebra quando jogo entre eles não é na mosca
  - Testar SEQUENCIA_RESULTADO: cross-rodada (até 3 rodadas atrás)
  - Testar atualização de recorde (novo, empate, superação)
- [ ] Criar testes para StoryReactionService (happy path + cada domain error)
- [ ] Criar testes para StoryEventService (mock dos services delegados, error handling)
- [ ] Criar testes para StoryController (mock do service, validação de guards, batch visualização)
- [ ] Usar InMemory repositories + vi.fn() mocks (padrão Vitest do projeto)

### Requirements addressed
- Todos os requisitos backend (validação de lógica)

## Task 13: Frontend — Service de API e tipos

- [ ] Criar `src/services/stories.service.ts` com funções:
  - `buscarStoriesGrupo(grupoId)` — GET /grupos/:grupoId/stories
  - `mandarF(grupoId, storyId)` — POST /grupos/:grupoId/stories/:storyId/mandar-f
  - `marcarVisualizados(grupoId, storyIds)` — POST /grupos/:grupoId/stories/visualizar
- [ ] Criar `src/types/stories.types.ts` com interfaces: StoryListagemResponse, StoryItem (com autor, visualizado, jaEnviouF), TipoStory

### Requirements addressed
- Requisito 3 (suporte frontend)
- Requisito 4 (suporte frontend)

## Task 14: Frontend — Story Carousel

- [ ] Criar `src/components/stories/story-carousel.tsx` (client component)
- [ ] Buscar stories via service com TanStack Query (key por grupoId)
- [ ] Extrair avatares únicos dos stories (deduplica por autor)
- [ ] Ordenar: não-visualizados primeiro (borda colorida), depois vistos (borda cinza). Dentro de cada grupo, por data do story mais recente.
- [ ] Renderizar avatares circulares em scroll horizontal com ícone do tipo mais recente sobre cada avatar
- [ ] Ao clicar em avatar: abrir Story Viewer no primeiro story não-visualizado daquele membro na timeline
- [ ] Ocultar componente enquanto loading, erro ou lista vazia
- [ ] Posicionar entre abas e card "Próximo Jogo" na page do grupo
- [ ] Versão Home: usar stories do grupo favorito + aviso textual "Grupo favorito: [Nome]..."
- [ ] Adicionar data-testid para E2E

### Requirements addressed
- Requisito 5 (AC 1-10)

## Task 15: Frontend — Story Viewer (fullscreen overlay)

- [ ] Criar `src/components/stories/story-viewer.tsx` (client component, overlay fullscreen)
- [ ] Receber lista de stories como timeline cronológica (não filtrada por membro)
- [ ] Avatar do autor muda conforme cada story é exibido
- [ ] Implementar auto-advance com timer variável por tipo (5-8s conforme TIMER_POR_TIPO)
- [ ] Implementar barra de progresso segmentada animada (preenche gradualmente, linear, por tipo)
- [ ] Implementar long press para pausar timer e animação
- [ ] Implementar navegação: swipe horizontal + tap zones (metade direita = próximo, metade esquerda = anterior)
- [ ] stopPropagation em botões interativos (Mandar F) — tap no botão não avança story
- [ ] Botão X no canto superior direito + swipe-down para fechar
- [ ] Mínimo 5, máximo 20 stories. Complementar com rodada anterior se necessário.
- [ ] No último story: indicador visual de "fim", fechar manual (não fecha automático)
- [ ] No primeiro story: tap/swipe pra trás não faz nada
- [ ] Ao fechar viewer: enviar batch de visualização (storyIds exibidos) via POST /grupos/:grupoId/stories/visualizar

### Requirements addressed
- Requisito 6 (AC 1-14)

## Task 16: Frontend — Cards de story por tipo

- [ ] Criar `src/components/stories/story-card-acertou.tsx` — ACERTOU_EM_CHEIO (título, placar X×Y, escudos, nomes times, emoji 🎯, fundo verde)
- [ ] Criar `src/components/stories/story-card-unico.tsx` — UNICO_NA_MOSCA (título, texto "único a cravar", placar, rodada, emoji 🦄, fundo roxo)
- [ ] Criar `src/components/stories/story-card-ranking.tsx` — SUBIU_RANKING (título, posição anterior→nova, top 5, emoji 📈, fundo azul)
- [ ] Criar `src/components/stories/story-card-sequencia-mosca.tsx` — SEQUENCIA_MOSCA (título, quantidade, linha visual 🎯/❌ últimos 5 jogos, recorde + detentores, badge "🏆 Novo recorde!", emoji 🔥, fundo laranja)
- [ ] Criar `src/components/stories/story-card-sequencia-resultado.tsx` — SEQUENCIA_RESULTADO (título, quantidade cross-rodada, linha visual ✅/❌, recorde + detentores, badge novo recorde, emoji 🔥, fundo laranja)
- [ ] Criar `src/components/stories/story-card-nao-palpitou.tsx` — NAO_PALPITOU consolidado (título, lista de jogos esquecidos na rodada, contador Fs, botão "Mandar F" / "Já mandou", emoji 😴, fundo cinza)
- [ ] Criar `src/components/stories/story-card-dobrou.tsx` — DOBROU_E_ACERTOU (título, placar, escudos, pontos dobrados, destaque dourado, emoji 💎, fundo dourado)
- [ ] Cada card: gradiente de fundo por tipo (paleta definida no design)
- [ ] Rodapé consistente: TimeCasa × TimeFora · Rodada X · DD/MM · HH:MM
- [ ] Integrar botão "Mandar um F" com mutation (optimistic update no contador)

### Requirements addressed
- Requisito 7 (AC 1-9)

## Task 17: Frontend — Notification Actions no Service Worker

- [ ] Atualizar `worker/index.ts` push handler para detectar payload com `tipo === 'NAO_PALPITOU'` e adicionar actions ["Mandar F", "Ver Story"]
- [ ] Atualizar `worker/index.ts` notificationclick handler para detectar `event.action === 'mandar-f'` e disparar fetch POST para `/api/grupos/:grupoId/stories/:storyId/mandar-f`
- [ ] Implementar fallback: se fetch falhar, abrir app no URL do story
- [ ] Para notificações sem action específico, abrir/focar janela no URL do story (padrão existente)

### Requirements addressed
- Requisito 4 (progressive enhancement via push)
- Design: Notification Actions

## Task 18: Atualizar Postman Collection e documentação

- [ ] Adicionar endpoints ao `postman_collection.json`: GET stories, POST mandar-f, POST visualizar
- [ ] Atualizar `README.md` com novos endpoints, módulo stories e regras de domínio
- [ ] Atualizar steering `project-overview.md` com módulo stories, endpoints, regras e tipos

### Requirements addressed
- Documentação (convenção do projeto)
