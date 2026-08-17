# Tasks

## Task 1: Criar modelo Prisma e migration

- [ ] Adicionar enum `TipoDestaque` ao `schema.prisma` (ACERTOU_EM_CHEIO, UNICO_NA_MOSCA, SUBIU_RANKING, SEQUENCIA_MOSCA, SEQUENCIA_RESULTADO, NAO_PALPITOU, DOBROU_E_ACERTOU)
- [ ] Adicionar model `Destaque` com campos: id, grupoId, usuarioId, jogoId, rodada, tipo, dados (Json), titulo (String), contadorFs (Int default 0), criadoEm
- [ ] Adicionar model `DestaqueReacao` com campos: id, destaqueId, remetenteId, criadoEm. Constraint: @@unique([remetenteId, destaqueId])
- [ ] Adicionar model `DestaqueVisualizacao` com campos: id, destaqueId, usuarioId, visualizadoEm. Constraint: @@unique([destaqueId, usuarioId])
- [ ] Configurar relações: Destaque → Grupo (cascade), Destaque → Usuario (cascade), Destaque → Jogo (cascade), DestaqueReacao → Destaque (cascade), DestaqueVisualizacao → Destaque (cascade)
- [ ] Adicionar unique constraint `@@unique([grupoId, usuarioId, jogoId, tipo])` em Destaque
- [ ] Adicionar índices compostos: `@@index([grupoId, criadoEm])`, `@@index([grupoId, usuarioId])`, `@@index([grupoId, rodada])` em Destaque; `@@index([destaqueId])` em DestaqueReacao e DestaqueVisualizacao
- [ ] Criar enum `CategoriaRecorde` (MOSCA, RESULTADO)
- [ ] Criar model `RecordeSequencia` com campos: id, grupoId, temporadaId, categoria, valor (Int), criadoEm, atualizadoEm; unique (grupoId, temporadaId, categoria)
- [ ] Criar model `RecordeDetentor` com campos: id, recordeId, usuarioId, atingidoEm; unique (recordeId, usuarioId)
- [ ] Criar model `RankingSnapshot` com campos: id, grupoId, usuarioId, faseId, rodada (Int?), posicao (Int), pontuacao (Int), criadoEm; unique (grupoId, usuarioId, faseId, rodada); index (grupoId, faseId, rodada)
- [ ] Configurar relações: RecordeSequencia → Grupo (cascade), RecordeSequencia → Temporada (cascade), RecordeDetentor → RecordeSequencia (cascade), RankingSnapshot → Grupo (cascade)
- [ ] Adicionar relações inversas em Usuario (destaques, destaqueReacoes, destaqueVisualizacoes), Grupo (destaques, recordesSequencia, rankingSnapshots), Jogo (destaques), Temporada (recordesSequencia)
- [ ] Adicionar valores `DESTAQUES_GRUPO` e `RECEBEU_F` ao enum `TipoNotificacao`
- [ ] Adicionar campos `destaquesGrupo Boolean @default(true)` e `recebeuF Boolean @default(true)` ao model `PreferenciaNotificacao`
- [ ] Gerar migration via `docker exec bolao-backend-dev npx prisma migrate dev --name add_destaques_module`
- [ ] Verificar que `prisma generate` executa sem erros

### Requirements addressed
- Requisito 1 (AC 1-8)
- Requisito 8 (AC 5)

## Task 2: Criar estrutura base do módulo destaques (constants, types, domain errors)

- [ ] Criar `src/modules/destaques/destaques.constants.ts` com TAG, REPOSITORY_TOKEN, EVENT_SERVICE_TOKEN, LIMITES (EXPIRACAO_DIAS, SEQUENCIA_MOSCA_MINIMA, SEQUENCIA_RESULTADO_CONSULTA_RODADAS, ULTIMOS_JOGOS_SEQUENCIA, MAX_DESTAQUES_LISTAGEM, MIN_DESTAQUES_VIEWER, SUBIU_RANKING_MINIMO, SUBIU_RANKING_TOP), TIMER_POR_TIPO, PRIORIDADE_POR_TIPO, CRON, MENSAGENS e TEMPLATES
- [ ] Criar `src/modules/destaques/types/destaque.types.ts` com interfaces: DestaqueTitle (id, title, emoji, rarity?), DadosAcertouEmCheio, DadosUnicoNaMosca, DadosSubiuRanking, DadosSequenciaMosca, DadosSequenciaResultado, DadosNaoPalpitou (consolidado por rodada com lista de jogos), DadosDobrouEAcertou, RecordeInfo, DestaqueComVisualizacao, JogoComTimes, GrupoBasico, MembroComUsuario
- [ ] Criar catálogo `src/modules/destaques/destaques.titulos.ts` com `DESTAQUE_TITULOS: Record<TipoDestaque, DestaqueTitle[]>` — todos os títulos por tipo com id, title, emoji
- [ ] Criar `src/common/errors/domain-errors/destaques.errors.ts` com: DestaqueNaoEncontradoError, DestaqueExpiradoError, ReacaoApenasNaoPalpitouError, NaoPodeEnviarFParaSiMesmoError, UsuarioJaEnviouFError
- [ ] Exportar os novos domain errors no barrel `src/common/errors/domain-errors/index.ts`

### Requirements addressed
- Requisito 1 (suporte de tipos)
- Requisito 2 (AC 15 — DestaqueTitle)
- Requisito 4 (domain errors)

## Task 3: Criar repository interface e implementações (Prisma + InMemory)

- [ ] Criar `src/modules/destaques/repositories/destaque.repository.interface.ts` com tipos e interface DestaqueRepository:
  - criar, criarVarios
  - buscarPorId (filtra rodadas não-visíveis)
  - buscarPorGrupoERodadas(grupoId, rodadaAtual, rodadaAnterior, limite) — ordenado por rodada DESC, criadoEm DESC, prioridade por tipo
  - buscarPorGrupoUsuario
  - incrementarContadorFs
  - existeReacao(remetenteId, destaqueId)
  - criarReacao
  - criarVisualizacoesBatch(destaqueIds, usuarioId)
  - verificarVisualizacoes(destaqueIds, usuarioId) — retorna Set de destaqueIds visualizados
  - removerAntigos(diasLimite)
- [ ] Criar `src/modules/destaques/repositories/prisma-destaque.repository.ts` implementando DestaqueRepository
  - Implementar ORDER BY com CASE para prioridade por tipo (derivada, não campo)
- [ ] Criar `src/modules/destaques/repositories/in-memory-destaque.repository.ts` para testes unitários
- [ ] Criar interface RecordeRepository: buscarRecorde, criarOuAtualizar, adicionarDetentor, limparDetentores
- [ ] Criar implementações Prisma e InMemory do RecordeRepository
- [ ] Criar interface RankingSnapshotRepository: buscarPorGrupoFaseRodada, upsertBatch
- [ ] Criar implementações Prisma e InMemory do RankingSnapshotRepository

### Requirements addressed
- Requisito 1 (AC 3, 4, 5, 8)
- Requisito 3 (AC 1, 7)
- Requisito 9 (AC 1)

## Task 4: Criar DestaqueGeneratorService (geração dos 7 tipos)

- [ ] Criar `src/modules/destaques/services/destaque-generator.service.ts`
- [ ] Implementar método `gerarDestaquesParaGrupo(jogo, grupo, membros)` que avalia cada membro contra todos os critérios
- [ ] Implementar lógica UNICO_NA_MOSCA: verificar se exatamente 1 membro acertou em cheio. Se sim, gerar UNICO_NA_MOSCA para ele (não gerar ACERTOU_EM_CHEIO)
- [ ] Implementar lógica ACERTOU_EM_CHEIO: gerar para membros que cravaram E não são o único (quando 2+ cravaram)
- [ ] Implementar lógica SUBIU_RANKING: ler posição anterior do RankingSnapshot (1 SELECT), comparar com posição atual. Gerar se subiu 2+ posições OU subiu 1 posição dentro do top 5
- [ ] Após calcular ranking atual, salvar RankingSnapshot em batch (upsert por unique grupoId+usuarioId+faseId+rodada)
- [ ] Implementar lógica SEQUENCIA_MOSCA: delegar para DestaqueSequenciaService.calcularSequenciaMosca(). Gerar se 2+ acertos em cheio consecutivos na rodada (sem jogo entre eles que não foi na mosca, ordem por finalização)
- [ ] Implementar lógica SEQUENCIA_RESULTADO: delegar para DestaqueSequenciaService.calcularSequenciaResultado(). Consulta até 3 rodadas anteriores. Gerar se sequência > 0. Gravar recorde.
- [ ] Implementar lógica NAO_PALPITOU consolidado: verificar se membro não palpitou em nenhum jogo da rodada que já finalizou. Gerar 1 destaque por rodada com lista de jogos esquecidos. Verificar se já existe destaque NAO_PALPITOU pra esse membro+grupo+rodada antes de criar.
- [ ] Implementar lógica DOBROU_E_ACERTOU: membro com PalpiteDobrado que acertou resultado (ACERTO_EM_CHEIO ou ACERTO_DE_RESULTADO)
- [ ] Implementar pickRandomTitle(tipo, ultimoTituloUsado) — seleciona DestaqueTitle sem repetição imediata. Persiste campo `titulo` no destaque.
- [ ] Persistir destaques em batch via `destaqueRepo.criarVarios()` com deduplicação (try/catch em unique constraint)
- [ ] Garantir que falha em um membro não bloqueia os demais (try/catch por membro com log de erro)

### Requirements addressed
- Requisito 2 (AC 1-15)

## Task 5: Criar DestaqueSequenciaService (cálculo de sequência + recorde)

- [ ] Criar `src/modules/destaques/services/destaque-sequencia.service.ts`
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

## Task 6: Criar DestaqueEventService (orquestrador)

- [ ] Criar `src/modules/destaques/services/destaque-event.service.ts`
- [ ] Implementar `processarJogoFinalizado(jogoId)`: buscar jogo com times, buscar fase → temporada → grupos, iterar por grupo chamando DestaqueGeneratorService + DestaqueNotificacaoService
- [ ] Envolver tudo em try/catch com logger.error (nunca lançar exceção para cima — fire-and-forget)
- [ ] Para cada grupo, buscar membros via GrupoUsuarioRepository.listarPorGrupoComUsuario()
- [ ] Documentar known limitation: concorrência em SEQUENCIA_MOSCA se 2 jogos finalizam simultaneamente (AC 16)

### Requirements addressed
- Requisito 2 (AC 1, 9, 10, 16)

## Task 7: Criar DestaqueReactionService (Mandar um F)

- [ ] Criar `src/modules/destaques/services/destaque-reaction.service.ts`
- [ ] Implementar `mandarF(destaqueId, remetenteId, grupoId)` com todas as validações:
  - Destaque existe e rodada é atual ou anterior → DestaqueNaoEncontradoError
  - destaque.tipo === NAO_PALPITOU → ReacaoApenasNaoPalpitouError
  - destaque.usuarioId !== remetenteId → NaoPodeEnviarFParaSiMesmoError
  - Não existe DestaqueReacao com unique(remetenteId, destaqueId) → UsuarioJaEnviouFError
- [ ] Criar DestaqueReacao + incrementar destaque.contadorFs
- [ ] Disparar notificação push fire-and-forget para o autor do destaque (tipo RECEBEU_F, respeitando preferência recebeuF)
- [ ] Agrupar notificações: se múltiplos Fs no mesmo destaque, consolidar em "X pessoas mandaram um F"
- [ ] Retornar novo contadorFs

### Requirements addressed
- Requisito 4 (AC 1-9)

## Task 8: Criar DestaqueNotificacaoService (push consolidado)

- [ ] Criar `src/modules/destaques/services/destaque-notificacao.service.ts`
- [ ] Implementar `notificarNovosDestaques(grupo, jogoId, quantidade)`: deduplicar via existeNotificacao (tipo DESTAQUES_GRUPO, grupoId, jogoId), buscar membros com push ativo + preferência destaquesGrupo habilitada, criar notificações em batch, enviar push
- [ ] Implementar `notificarRecebeuF(destaqueAutorId, remetenteNome, grupoNome)`: verificar preferência recebeuF do autor, criar notificação, enviar push. Agrupar se múltiplos Fs.
- [ ] Para destaques NAO_PALPITOU, incluir payload com campos extras (destaqueId, grupoId, tipo) para Notification Actions no frontend

### Requirements addressed
- Requisito 8 (AC 1-4)
- Requisito 4 (AC 6, 7)

## Task 9: Criar DestaqueCronService (limpeza)

- [ ] Criar `src/modules/destaques/services/destaque-cron.service.ts`
- [ ] Implementar cron job `@Cron('0 5 * * *')` que deleta destaques com criadoEm < 30 dias
- [ ] Cascade de DestaqueReacao e DestaqueVisualizacao já garantido pelo onDelete: Cascade no schema
- [ ] Envolver em try/catch com logger.error (nunca interromper aplicação)
- [ ] Logar quantidade de destaques removidos

### Requirements addressed
- Requisito 9 (AC 2-5)

## Task 10: Criar DestaqueController e endpoints

- [ ] Criar `src/modules/destaques/controllers/destaque.controller.ts` com:
  - `GET /grupos/:grupoId/destaques` — listagem cronológica do grupo (Guard: GroupRoleGuard ADMIN + MEMBER), mín 5 / máx 20, rodada atual + anterior, ORDER BY com prioridade por tipo
  - `POST /grupos/:grupoId/destaques/:destaqueId/mandar-f` — enviar F (Guard: GroupRoleGuard ADMIN + MEMBER)
  - `POST /grupos/:grupoId/destaques/visualizar` — batch de visualização (body: { destaqueIds: string[] })
- [ ] Na listagem: calcular rodada atual, filtrar por rodada, incluir campo `visualizado` e `jaEnviouF` por destaque para o membro autenticado
- [ ] Na listagem: retornar dados do autor (usuarioId, nome, avatar) em cada destaque item (timeline cronológica, não agrupado)
- [ ] Criar Presenter (DestaquePresenter.toHttp) com campos: id, tipo, titulo, dados, jogoId, rodada, criadoEm, contadorFs, jaEnviouF, visualizado, autor (id, nome, avatar)
- [ ] Decorar com @ApiTags(DESTAQUES.TAG), @ApiOperation, @ApiResponse
- [ ] Usar @CurrentUser() para obter usuário autenticado
- [ ] Usar ParseUUIDCustomPipe para validar UUIDs nos params

### Requirements addressed
- Requisito 3 (AC 1-7)
- Requisito 4 (AC 1, 8, 9)

## Task 11: Criar DestaquesModule e integrar com JogoService

- [ ] Criar `src/modules/destaques/destaques.module.ts` registrando todos os services, repositories e controllers
- [ ] Exportar DestaqueEventService e DESTAQUES.EVENT_SERVICE_TOKEN
- [ ] Adicionar import do DestaquesModule no AppModule
- [ ] Em JogoService: injetar DestaqueEventService via `@Optional() @Inject(DESTAQUES.EVENT_SERVICE_TOKEN)`
- [ ] Em JogoService: criar `dispararDestaquesJogoFinalizado(jogoId)` fire-and-forget
- [ ] Chamar `dispararDestaquesJogoFinalizado()` em `finalizar()` e no loop de jogos finalizados em `sincronizarPlacares()`

### Requirements addressed
- Requisito 2 (AC 9)

## Task 12: Testes unitários do backend

- [ ] Criar testes para DestaqueGeneratorService:
  - Testar cada tipo de destaque individualmente
  - Testar prioridade UNICO_NA_MOSCA > ACERTOU_EM_CHEIO (quando único, não gera ambos)
  - Testar SUBIU_RANKING com critério 2+ posições e 1 posição no top 5
  - Testar NAO_PALPITOU consolidado por rodada
  - Testar deduplicação (não gerar duplicatas)
  - Testar múltiplos destaques para o mesmo membro
  - Testar falha individual sem interromper batch
  - Testar pickRandomTitle sem repetição imediata
- [ ] Criar testes para DestaqueSequenciaService:
  - Testar SEQUENCIA_MOSCA: 2, 3, 5 acertos consecutivos na rodada
  - Testar SEQUENCIA_MOSCA: quebra quando jogo entre eles não é na mosca
  - Testar SEQUENCIA_RESULTADO: cross-rodada (até 3 rodadas atrás)
  - Testar atualização de recorde (novo, empate, superação)
- [ ] Criar testes para DestaqueReactionService (happy path + cada domain error)
- [ ] Criar testes para DestaqueEventService (mock dos services delegados, error handling)
- [ ] Criar testes para DestaqueController (mock do service, validação de guards, batch visualização)
- [ ] Usar InMemory repositories + vi.fn() mocks (padrão Vitest do projeto)

### Requirements addressed
- Todos os requisitos backend (validação de lógica)

## Task 13: Frontend — Service de API e tipos

- [ ] Criar `src/services/destaques.service.ts` com funções:
  - `buscarDestaquesGrupo(grupoId)` — GET /grupos/:grupoId/destaques
  - `mandarF(grupoId, destaqueId)` — POST /grupos/:grupoId/destaques/:destaqueId/mandar-f
  - `marcarVisualizados(grupoId, destaqueIds)` — POST /grupos/:grupoId/destaques/visualizar
- [ ] Criar `src/types/destaques.types.ts` com interfaces: DestaqueListagemResponse, DestaqueItem (com autor, visualizado, jaEnviouF), TipoDestaque

### Requirements addressed
- Requisito 3 (suporte frontend)
- Requisito 4 (suporte frontend)

## Task 14: Frontend — Destaque Carousel

- [ ] Criar `src/components/destaques/destaque-carousel.tsx` (client component)
- [ ] Buscar destaques via service com TanStack Query (key por grupoId)
- [ ] Extrair avatares únicos dos destaques (deduplica por autor)
- [ ] Ordenar: não-visualizados primeiro (borda colorida), depois vistos (borda cinza). Dentro de cada grupo, por data do destaque mais recente.
- [ ] Renderizar avatares circulares em scroll horizontal com ícone do tipo mais recente sobre cada avatar
- [ ] Ao clicar em avatar: abrir Destaque Viewer no primeiro destaque não-visualizado daquele membro na timeline
- [ ] Ocultar componente enquanto loading, erro ou lista vazia
- [ ] Posicionar entre abas e card "Próximo Jogo" na page do grupo
- [ ] Versão Home: usar destaques do grupo favorito + aviso textual "Grupo favorito: [Nome]..."
- [ ] Adicionar data-testid para E2E

### Requirements addressed
- Requisito 5 (AC 1-10)

## Task 15: Frontend — Destaque Viewer (fullscreen overlay)

- [ ] Criar `src/components/destaques/destaque-viewer.tsx` (client component, overlay fullscreen)
- [ ] Receber lista de destaques como timeline cronológica (não filtrada por membro)
- [ ] Avatar do autor muda conforme cada destaque é exibido
- [ ] Implementar auto-advance com timer variável por tipo (5-8s conforme TIMER_POR_TIPO)
- [ ] Implementar barra de progresso segmentada animada (preenche gradualmente, linear, por tipo)
- [ ] Implementar long press para pausar timer e animação
- [ ] Implementar navegação: swipe horizontal + tap zones (metade direita = próximo, metade esquerda = anterior)
- [ ] stopPropagation em botões interativos (Mandar F) — tap no botão não avança destaque
- [ ] Botão X no canto superior direito + swipe-down para fechar
- [ ] Mínimo 5, máximo 20 destaques. Complementar com rodada anterior se necessário.
- [ ] No último destaque: indicador visual de "fim", fechar manual (não fecha automático)
- [ ] No primeiro destaque: tap/swipe pra trás não faz nada
- [ ] Ao fechar viewer: enviar batch de visualização (destaqueIds exibidos) via POST /grupos/:grupoId/destaques/visualizar

### Requirements addressed
- Requisito 6 (AC 1-14)

## Task 16: Frontend — Cards de destaque por tipo

- [ ] Criar `src/components/destaques/destaque-card-acertou.tsx` — ACERTOU_EM_CHEIO (título, placar X×Y, escudos, nomes times, emoji 🎯, fundo verde)
- [ ] Criar `src/components/destaques/destaque-card-unico.tsx` — UNICO_NA_MOSCA (título, texto "único a cravar", placar, rodada, emoji 🦄, fundo roxo)
- [ ] Criar `src/components/destaques/destaque-card-ranking.tsx` — SUBIU_RANKING (título, posição anterior→nova, top 5, emoji 📈, fundo azul)
- [ ] Criar `src/components/destaques/destaque-card-sequencia-mosca.tsx` — SEQUENCIA_MOSCA (título, quantidade, linha visual 🎯/❌ últimos 5 jogos, recorde + detentores, badge "🏆 Novo recorde!", emoji 🔥, fundo laranja)
- [ ] Criar `src/components/destaques/destaque-card-sequencia-resultado.tsx` — SEQUENCIA_RESULTADO (título, quantidade cross-rodada, linha visual ✅/❌, recorde + detentores, badge novo recorde, emoji 🔥, fundo laranja)
- [ ] Criar `src/components/destaques/destaque-card-nao-palpitou.tsx` — NAO_PALPITOU consolidado (título, lista de jogos esquecidos na rodada, contador Fs, botão "Mandar F" / "Já mandou", emoji 😴, fundo cinza)
- [ ] Criar `src/components/destaques/destaque-card-dobrou.tsx` — DOBROU_E_ACERTOU (título, placar, escudos, pontos dobrados, destaque dourado, emoji 💎, fundo dourado)
- [ ] Cada card: gradiente de fundo por tipo (paleta definida no design)
- [ ] Rodapé consistente: TimeCasa × TimeFora · Rodada X · DD/MM · HH:MM
- [ ] Integrar botão "Mandar um F" com mutation (optimistic update no contador)

### Requirements addressed
- Requisito 7 (AC 1-9)

## Task 17: Frontend — Notification Actions no Service Worker

- [ ] Atualizar `worker/index.ts` push handler para detectar payload com `tipo === 'NAO_PALPITOU'` e adicionar actions ["Mandar F", "Ver Destaque"]
- [ ] Atualizar `worker/index.ts` notificationclick handler para detectar `event.action === 'mandar-f'` e disparar fetch POST para `/api/grupos/:grupoId/destaques/:destaqueId/mandar-f`
- [ ] Implementar fallback: se fetch falhar, abrir app no URL do destaque
- [ ] Para notificações sem action específico, abrir/focar janela no URL do destaque (padrão existente)

### Requirements addressed
- Requisito 4 (progressive enhancement via push)
- Design: Notification Actions

## Task 18: Atualizar Postman Collection e documentação

- [ ] Adicionar endpoints ao `postman_collection.json`: GET destaques, POST mandar-f, POST visualizar
- [ ] Atualizar `README.md` com novos endpoints, módulo destaques e regras de domínio
- [ ] Atualizar steering `project-overview.md` com módulo destaques, endpoints, regras e tipos

### Requirements addressed
- Documentação (convenção do projeto)
