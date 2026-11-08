# Tasks

## Estado da feature (fechado para ajustes de produto)

Wave 1 + polimento entregues. Decisões em vigor:

- `SEQUENCIA_MOSCA` não é gerada (enum pode existir; gerador remove/ignora).
- Rodada **Atual** do feed = maior rodada com jogo finalizado. Listagem padrão = só essa rodada; `?rodada=` e `rodadasDisponiveis` alimentam o filtro do FE (até 2 botões).
- `SEQUENCIA_RESULTADO`: mín. 3 jogos e 4 pontos; lookback 1 rodada; mesmo apito quebra se algum não pontuou; 1 card por pessoa/rodada (melhor sequência).
- Panelinha: 3+ `ACERTOU_EM_CHEIO` no mesmo jogo → 1 card coletivo (títulos próprios).
- Listagem: sync de `NAO_PALPITOU`, dedupe de `SUBIU_RANKING`/`NAO_PALPITOU`, seleção diversa por prioridade (round-robin).
- Títulos: `titleFeminino` + heurística pelo primeiro nome; `SUBIU_RANKING` usa emoji 🚀.
- FE: viewer inline no grupo + filtro de rodada; panelinha centralizada sem avatar; ranking em 2 colunas.

Itens abertos abaixo são dívida técnica / fora de escopo de produto (Postman, Presenter, Notification Actions no payload, testes de controller).

## Task 1: Criar modelo Prisma e migration

- [x] Adicionar enum `TipoDestaque` ao `schema.prisma` (ACERTOU_EM_CHEIO, UNICO_NA_MOSCA, SUBIU_RANKING, SEQUENCIA_MOSCA, SEQUENCIA_RESULTADO, NAO_PALPITOU, DOBROU_E_ACERTOU)
- [x] Adicionar model `Destaque` com campos: id, grupoId, usuarioId, jogoId, rodada, tipo, dados (Json), titulo (String), contadorFs (Int default 0), criadoEm
- [x] Adicionar model `DestaqueReacao` com campos: id, destaqueId, remetenteId, criadoEm. Constraint: @@unique([remetenteId, destaqueId])
- [x] Adicionar model `DestaqueVisualizacao` com campos: id, destaqueId, usuarioId, visualizadoEm. Constraint: @@unique([destaqueId, usuarioId])
- [x] Configurar relações: Destaque → Grupo (cascade), Destaque → Usuario (cascade), Destaque → Jogo (cascade), DestaqueReacao → Destaque (cascade), DestaqueVisualizacao → Destaque (cascade)
- [x] Adicionar unique constraint `@@unique([grupoId, usuarioId, jogoId, tipo])` em Destaque
- [x] Adicionar índices compostos: `@@index([grupoId, criadoEm])`, `@@index([grupoId, usuarioId])`, `@@index([grupoId, rodada])` em Destaque; `@@index([destaqueId])` em DestaqueReacao e DestaqueVisualizacao
- [x] Criar enum `CategoriaRecorde` (MOSCA, RESULTADO)
- [x] Criar model `RecordeSequencia` com campos: id, grupoId, temporadaId, categoria, valor (Int), criadoEm, atualizadoEm; unique (grupoId, temporadaId, categoria)
- [x] Criar model `RecordeDetentor` com campos: id, recordeId, usuarioId, atingidoEm; unique (recordeId, usuarioId)
- [x] Criar model `RankingSnapshot` com campos: id, grupoId, usuarioId, faseId, rodada (Int?), posicao (Int), pontuacao (Int), criadoEm; unique (grupoId, usuarioId, faseId, rodada); index (grupoId, faseId, rodada)
- [x] Configurar relações: RecordeSequencia → Grupo (cascade), RecordeSequencia → Temporada (cascade), RecordeDetentor → RecordeSequencia (cascade), RankingSnapshot → Grupo (cascade)
- [x] Adicionar relações inversas em Usuario (destaques, destaqueReacoes, destaqueVisualizacoes), Grupo (destaques, recordesSequencia, rankingSnapshots), Jogo (destaques), Temporada (recordesSequencia)
- [x] Adicionar valores `DESTAQUES_GRUPO` e `RECEBEU_F` ao enum `TipoNotificacao`
- [x] Adicionar campos `destaquesGrupo Boolean @default(true)` e `recebeuF Boolean @default(true)` ao model `PreferenciaNotificacao` — os dois nascem ligados; a tela de preferências e o mapa `TIPO_PARA_CAMPO` usam esses nomes
- [x] Gerar migration via `docker exec bolao-backend-dev npx prisma migrate dev --name add_destaques_module`
- [x] Verificar que `prisma generate` executa sem erros

### Requirements addressed
- Requisito 1 (AC 1-8)
- Requisito 8 (AC 5)

## Task 2: Criar estrutura base do módulo destaques (constants, types, domain errors)

- [x] Criar `src/modules/destaques/destaques.constants.ts` com TAG, REPOSITORY_TOKEN, EVENT_SERVICE_TOKEN, LIMITES (EXPIRACAO_DIAS, SEQUENCIA_MOSCA_MINIMA, SEQUENCIA_RESULTADO_CONSULTA_RODADAS, ULTIMOS_JOGOS_SEQUENCIA, MAX_DESTAQUES_LISTAGEM, MIN_DESTAQUES_VIEWER, SUBIU_RANKING_MINIMO, SUBIU_RANKING_TOP), TIMER_POR_TIPO, PRIORIDADE_POR_TIPO, CRON, MENSAGENS e TEMPLATES
- [x] Criar `src/modules/destaques/types/destaque.types.ts` com interfaces: DestaqueTitle (id, title, emoji, rarity?), DadosAcertouEmCheio, DadosUnicoNaMosca, DadosSubiuRanking, DadosSequenciaMosca, DadosSequenciaResultado, DadosNaoPalpitou (consolidado por rodada com lista de jogos), DadosDobrouEAcertou, RecordeInfo, DestaqueComVisualizacao, JogoComTimes, GrupoBasico, MembroComUsuario
- [x] Criar catálogo `src/modules/destaques/destaques.titulos.ts` com `DESTAQUE_TITULOS: Record<TipoDestaque, DestaqueTitle[]>` — todos os títulos por tipo com id, title, emoji
- [x] Criar `src/common/errors/domain-errors/destaques.errors.ts` com: DestaqueNaoEncontradoError, DestaqueExpiradoError, ReacaoApenasNaoPalpitouError, NaoPodeEnviarFParaSiMesmoError, UsuarioJaEnviouFError — expirado virou `DestaqueForaDoEscopoError`
- [x] Exportar os novos domain errors no barrel `src/common/errors/domain-errors/index.ts`

### Requirements addressed
- Requisito 1 (suporte de tipos)
- Requisito 2 (AC 15 — DestaqueTitle)
- Requisito 4 (domain errors)

## Task 3: Criar repository interface e implementações (Prisma + InMemory)

- [x] Criar `src/modules/destaques/repositories/destaque.repository.interface.ts` com tipos e interface DestaqueRepository:
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
- [x] Criar `src/modules/destaques/repositories/prisma-destaque.repository.ts` implementando DestaqueRepository
  - Implementar ORDER BY com CASE para prioridade por tipo (derivada, não campo)
- [x] Criar `src/modules/destaques/repositories/in-memory-destaque.repository.ts` para testes unitários
- [x] Criar interface RecordeRepository: buscarRecorde, criarOuAtualizar, adicionarDetentor, limparDetentores
- [x] Criar implementações Prisma e InMemory do RecordeRepository
- [x] Criar interface RankingSnapshotRepository: buscarPorGrupoFaseRodada, upsertBatch
- [x] Criar implementações Prisma e InMemory do RankingSnapshotRepository

### Requirements addressed
- Requisito 1 (AC 3, 4, 5, 8)
- Requisito 3 (AC 1, 7)
- Requisito 9 (AC 1)

## Task 4: Criar DestaqueGeneratorService (geração dos 7 tipos)

- [x] Criar `src/modules/destaques/services/destaque-generator.service.ts`
- [x] Implementar método `gerarDestaquesParaGrupo(jogo, grupo, membros)` que avalia cada membro contra todos os critérios
- [x] Implementar lógica UNICO_NA_MOSCA: verificar se exatamente 1 membro acertou em cheio. Se sim, gerar UNICO_NA_MOSCA para ele (não gerar ACERTOU_EM_CHEIO)
- [x] Implementar lógica ACERTOU_EM_CHEIO: gerar para membros que cravaram E não são o único (quando 2+ cravaram)
- [x] Implementar lógica SUBIU_RANKING: ler posição anterior do RankingSnapshot (1 SELECT), comparar com posição atual. Gerar se subiu 2+ posições OU subiu 1 posição dentro do top 5
- [x] Após calcular ranking atual, salvar RankingSnapshot em batch (upsert por unique grupoId+usuarioId+faseId+rodada)
- [ ] Implementar lógica SEQUENCIA_MOSCA: delegar para DestaqueSequenciaService.calcularSequenciaMosca(). Gerar se 2+ acertos em cheio consecutivos na rodada (sem jogo entre eles que não foi na mosca, ordem por finalização) — fora da regra atual
- [x] Implementar lógica SEQUENCIA_RESULTADO: delegar para DestaqueSequenciaService.calcularSequenciaResultado(). Consulta até 3 rodadas anteriores. Gerar se sequência > 0. Gravar recorde. Regra atual: só gera com pelo menos 4 pontos
- [x] Implementar lógica NAO_PALPITOU consolidado: verificar se membro não palpitou em nenhum jogo da rodada que já finalizou. Gerar 1 destaque por rodada com lista de jogos esquecidos. Verificar se já existe destaque NAO_PALPITOU pra esse membro+grupo+rodada antes de criar.
- [x] Implementar lógica DOBROU_E_ACERTOU: membro com PalpiteDobrado que acertou resultado (ACERTO_EM_CHEIO ou ACERTO_DE_RESULTADO)
- [x] Implementar pickRandomTitle(tipo, ultimoTituloUsado) — seleciona DestaqueTitle sem repetição imediata. Persiste campo `titulo` no destaque.
- [x] Persistir destaques em batch via `destaqueRepo.criarVarios()` com deduplicação (try/catch em unique constraint)
- [x] Garantir que falha em um membro não bloqueia os demais (try/catch por membro com log de erro)

### Requirements addressed
- Requisito 2 (AC 1-15)

## Task 5: Criar DestaqueSequenciaService (cálculo de sequência + recorde)

- [x] Criar `src/modules/destaques/services/destaque-sequencia.service.ts`
- [ ] Implementar método `calcularSequenciaMosca(usuarioId, faseId, rodada, jogoAtualId)`:
  - Buscar jogos finalizados da mesma rodada, ordenados por horário de finalização
  - Buscar palpites do usuário para esses jogos
  - Contar acertos EM CHEIO consecutivos (sem jogo entre eles que não foi na mosca)
  - Retornar null se < 2 acertos consecutivos
  - Limitar ultimosJogos a 5 registros
- [x] Implementar método `calcularSequenciaResultado(usuarioId, faseId, rodadaAtual, jogoAtualId)`:
  - Buscar jogos finalizados da rodada atual + até 3 rodadas/fases anteriores
  - Buscar palpites do usuário para esses jogos
  - Contar acertos de resultado (cheio + resultado) consecutivos cross-rodada
  - Retornar null se < 2 acertos
- [x] Implementar método `atualizarRecorde(grupoId, temporadaId, categoria, usuarioId, novoValor)`:
  - Buscar RecordeSequencia existente para (grupoId, temporadaId, categoria)
  - Se não existe: criar com valor e detentor
  - Se novoValor > recorde.valor: atualizar valor, limpar detentores antigos, adicionar novo
  - Se novoValor === recorde.valor: adicionar detentor (manter existentes — empate)
  - Retornar { valor, detentores, ehNovoRecorde }

### Requirements addressed
- Requisito 2 (AC 5, 6, 13, 14, 16)

## Task 6: Criar DestaqueEventService (orquestrador)

- [x] Criar `src/modules/destaques/services/destaque-event.service.ts`
- [x] Implementar `processarJogoFinalizado(jogoId)`: buscar jogo com times, buscar fase → temporada → grupos, iterar por grupo chamando DestaqueGeneratorService + DestaqueNotificacaoService
- [x] Envolver tudo em try/catch com logger.error (nunca lançar exceção para cima — fire-and-forget)
- [x] Para cada grupo, buscar membros via GrupoUsuarioRepository.listarPorGrupoComUsuario()
- [ ] Documentar known limitation: concorrência em SEQUENCIA_MOSCA se 2 jogos finalizam simultaneamente (AC 16) — não se aplica enquanto o tipo não é gerado

### Requirements addressed
- Requisito 2 (AC 1, 9, 10, 16)

## Task 7: Criar DestaqueReactionService (Mandar um F)

- [x] Criar `src/modules/destaques/services/destaque-reaction.service.ts`
- [x] Implementar `mandarF(destaqueId, remetenteId, grupoId)` com todas as validações:
  - Destaque existe e rodada é atual ou anterior → DestaqueNaoEncontradoError
  - destaque.tipo === NAO_PALPITOU → ReacaoApenasNaoPalpitouError
  - destaque.usuarioId !== remetenteId → NaoPodeEnviarFParaSiMesmoError
  - Não existe DestaqueReacao com unique(remetenteId, destaqueId) → UsuarioJaEnviouFError
- [x] Criar DestaqueReacao + incrementar destaque.contadorFs
- [x] Disparar notificação push fire-and-forget para o autor do destaque (tipo RECEBEU_F, respeitando preferência recebeuF)
- [x] Agrupar notificações: se múltiplos Fs no mesmo destaque, consolidar em "X pessoas mandaram um F" — enquanto o aviso segue não lido no grupo
- [x] Retornar novo contadorFs

### Requirements addressed
- Requisito 4 (AC 1-9)

## Task 8: Criar DestaqueNotificacaoService (push consolidado)

- [x] Criar `src/modules/destaques/services/destaque-notificacao.service.ts`
- [x] Implementar `notificarNovosDestaques(grupo, jogoId, quantidade)`: deduplicar via existeNotificacao (tipo DESTAQUES_GRUPO, grupoId, jogoId), buscar membros com push ativo + preferência destaquesGrupo habilitada, criar notificações em batch, enviar push
- [x] Implementar `notificarRecebeuF(destaqueAutorId, remetenteNome, grupoNome)`: verificar preferência recebeuF do autor, criar notificação, enviar push. Agrupar se múltiplos Fs.
- [ ] Para destaques NAO_PALPITOU, incluir payload com campos extras (destaqueId, grupoId, tipo) para Notification Actions no frontend

### Requirements addressed
- Requisito 8 (AC 1-4)
- Requisito 4 (AC 6, 7)

## Task 9: Criar DestaqueCronService (limpeza)

- [x] Criar `src/modules/destaques/services/destaque-cron.service.ts`
- [x] Implementar cron job `@Cron('0 5 * * *')` que deleta destaques com criadoEm < 30 dias
- [x] Cascade de DestaqueReacao e DestaqueVisualizacao já garantido pelo onDelete: Cascade no schema
- [x] Envolver em try/catch com logger.error (nunca interromper aplicação)
- [x] Logar quantidade de destaques removidos

### Requirements addressed
- Requisito 9 (AC 2-5)

## Task 10: Criar DestaqueController e endpoints

- [x] Criar `src/modules/destaques/controllers/destaque.controller.ts` com:
  - `GET /grupos/:grupoId/destaques` — listagem cronológica do grupo (Guard: GroupRoleGuard ADMIN + MEMBER), mín 5 / máx 20, rodada atual + anterior, ORDER BY com prioridade por tipo
  - `POST /grupos/:grupoId/destaques/:destaqueId/mandar-f` — enviar F (Guard: GroupRoleGuard ADMIN + MEMBER)
  - `POST /grupos/:grupoId/destaques/visualizar` — batch de visualização (body: { destaqueIds: string[] })
- [x] Na listagem: calcular rodada atual, filtrar por rodada, incluir campo `visualizado` e `jaEnviouF` por destaque para o membro autenticado. `?rodada=` fica de propósito até a aprovação da publicação
- [x] Na listagem: retornar dados do autor (usuarioId, nome, avatar) em cada destaque item (timeline cronológica, não agrupado) — avatar vai `null` porque o usuário não tem esse campo
- [ ] Criar Presenter (DestaquePresenter.toHttp) com campos: id, tipo, titulo, dados, jogoId, rodada, criadoEm, contadorFs, jaEnviouF, visualizado, autor (id, nome, avatar) — o JSON sai direto do controller
- [x] Decorar com @ApiTags(DESTAQUES.TAG), @ApiOperation, @ApiResponse
- [x] Usar @CurrentUser() para obter usuário autenticado
- [x] Usar ParseUUIDCustomPipe para validar UUIDs nos params

### Requirements addressed
- Requisito 3 (AC 1-7)
- Requisito 4 (AC 1, 8, 9)

## Task 11: Criar DestaquesModule e integrar com JogoService

- [x] Criar `src/modules/destaques/destaques.module.ts` registrando todos os services, repositories e controllers
- [x] Exportar DestaqueEventService e DESTAQUES.EVENT_SERVICE_TOKEN
- [x] Adicionar import do DestaquesModule no AppModule
- [x] Em JogoService: injetar DestaqueEventService via `@Optional() @Inject(DESTAQUES.EVENT_SERVICE_TOKEN)`
- [x] Em JogoService: criar `dispararDestaquesJogoFinalizado(jogoId)` fire-and-forget
- [x] Chamar `dispararDestaquesJogoFinalizado()` em `finalizar()` e no loop de jogos finalizados em `sincronizarPlacares()`

### Requirements addressed
- Requisito 2 (AC 9)

## Task 12: Testes unitários do backend

- [x] Criar testes para DestaqueGeneratorService:
  - Testar cada tipo de destaque individualmente
  - Testar prioridade UNICO_NA_MOSCA > ACERTOU_EM_CHEIO (quando único, não gera ambos)
  - Testar SUBIU_RANKING com critério 2+ posições e 1 posição no top 5
  - Testar NAO_PALPITOU consolidado por rodada
  - Testar deduplicação (não gerar duplicatas)
  - Testar múltiplos destaques para o mesmo membro
  - Testar falha individual sem interromper batch
  - Testar pickRandomTitle sem repetição imediata
- [x] Criar testes para DestaqueSequenciaService: resultado e recorde. Os casos de SEQUENCIA_MOSCA não se aplicam
  - Testar SEQUENCIA_MOSCA: 2, 3, 5 acertos consecutivos na rodada
  - Testar SEQUENCIA_MOSCA: quebra quando jogo entre eles não é na mosca
  - Testar SEQUENCIA_RESULTADO: cross-rodada (até 3 rodadas atrás)
  - Testar atualização de recorde (novo, empate, superação)
- [x] Criar testes para DestaqueReactionService (happy path + cada domain error)
- [x] Criar testes para DestaqueEventService (mock dos services delegados, error handling)
- [ ] Criar testes para DestaqueController (mock do service, validação de guards, batch visualização)
- [x] Usar InMemory repositories + vi.fn() mocks (padrão Vitest do projeto)

### Requirements addressed
- Todos os requisitos backend (validação de lógica)

## Task 13: Frontend — Service de API e tipos

- [x] Criar `src/services/destaques.service.ts` com funções:
  - `buscarDestaquesGrupo(grupoId)` — GET /grupos/:grupoId/destaques
  - `mandarF(grupoId, destaqueId)` — POST /grupos/:grupoId/destaques/:destaqueId/mandar-f
  - `marcarVisualizados(grupoId, destaqueIds)` — POST /grupos/:grupoId/destaques/visualizar
- [x] Criar `src/types/destaques.types.ts` com interfaces: DestaqueListagemResponse, DestaqueItem (com autor, visualizado, jaEnviouF), TipoDestaque

### Requirements addressed
- Requisito 3 (suporte frontend)
- Requisito 4 (suporte frontend)

## Task 14: Frontend — Destaque Carousel

- [x] Criar `src/components/destaques/destaque-carousel.tsx` (client component)
- [ ] Buscar destaques via service com TanStack Query (key por grupoId) — a busca usa `useEffect`, não React Query
- [ ] Extrair avatares únicos dos destaques (deduplica por autor)
- [ ] Ordenar: não-visualizados primeiro (borda colorida), depois vistos (borda cinza). Dentro de cada grupo, por data do destaque mais recente.
- [ ] Renderizar avatares circulares em scroll horizontal com ícone do tipo mais recente sobre cada avatar
- [ ] Ao clicar em avatar: abrir Destaque Viewer no primeiro destaque não-visualizado daquele membro na timeline
- [ ] Ocultar componente enquanto loading, erro ou lista vazia
- [ ] Posicionar entre abas e card "Próximo Jogo" na page do grupo
- [ ] Versão Home: usar destaques do grupo favorito + aviso textual "Grupo favorito: [Nome]..."
- [x] Adicionar data-testid para E2E

### Requirements addressed
- Requisito 5 (AC 1-10)

## Task 15: Frontend — Destaque Viewer (fullscreen overlay)

- [x] Criar `src/components/destaques/destaque-viewer.tsx` (client component, overlay fullscreen) — entregue inline no grupo, não como overlay
- [x] Receber lista de destaques como timeline cronológica (não filtrada por membro)
- [x] Avatar do autor muda conforme cada destaque é exibido
- [x] Implementar auto-advance com timer variável por tipo (5-8s conforme TIMER_POR_TIPO)
- [x] Implementar barra de progresso segmentada animada (preenche gradualmente, linear, por tipo)
- [x] Implementar long press para pausar timer e animação
- [x] Implementar navegação: swipe horizontal + tap zones (metade direita = próximo, metade esquerda = anterior)
- [x] stopPropagation em botões interativos (Mandar F) — tap no botão não avança destaque
- [ ] Botão X no canto superior direito + swipe-down para fechar — não existe porque o viewer é inline
- [x] Mínimo 5, máximo 20 destaques. Complementar com rodada anterior se necessário.
- [x] No último destaque: indicador visual de "fim", fechar manual (não fecha automático)
- [x] No primeiro destaque: tap/swipe pra trás não faz nada
- [x] Ao fechar viewer: enviar batch de visualização (destaqueIds exibidos) via POST /grupos/:grupoId/destaques/visualizar — o envio acontece ao desmontar o viewer

### Requirements addressed
- Requisito 6 (AC 1-14)

## Task 16: Frontend — Cards de destaque por tipo

- [x] Criar `src/components/destaques/destaque-card-acertou.tsx` — ACERTOU_EM_CHEIO (título, placar X×Y, escudos, nomes times, emoji 🎯, fundo verde) — layout em `destaque-card.tsx`, fundo em foto
- [x] Criar `src/components/destaques/destaque-card-unico.tsx` — UNICO_NA_MOSCA (título, texto "único a cravar", placar, rodada, emoji 🦄, fundo roxo) — layout em `destaque-card.tsx`
- [x] Criar `src/components/destaques/destaque-card-ranking.tsx` — SUBIU_RANKING (título, posição anterior→nova, top 5, emoji 📈, fundo azul) — layout em `destaque-card.tsx`
- [ ] Criar `src/components/destaques/destaque-card-sequencia-mosca.tsx` — SEQUENCIA_MOSCA (título, quantidade, linha visual 🎯/❌ últimos 5 jogos, recorde + detentores, badge "🏆 Novo recorde!", emoji 🔥, fundo laranja) — fora da regra atual
- [x] Criar `src/components/destaques/destaque-card-sequencia-resultado.tsx` — SEQUENCIA_RESULTADO (título, quantidade cross-rodada, linha visual ✅/❌, recorde + detentores, badge novo recorde, emoji 🔥, fundo laranja) — layout em `destaque-card.tsx`
- [x] Criar `src/components/destaques/destaque-card-nao-palpitou.tsx` — NAO_PALPITOU consolidado (título, lista de jogos esquecidos na rodada, contador Fs, botão "Mandar F" / "Já mandou", emoji 😴, fundo cinza) — layout em `destaque-card-nao-palpitou.tsx`. Falha do F mostra "Não foi possível mandar o F"
- [x] Criar `src/components/destaques/destaque-card-dobrou.tsx` — DOBROU_E_ACERTOU (título, placar, escudos, pontos dobrados, destaque dourado, emoji 💎, fundo dourado) — layout em `destaque-card.tsx`
- [x] Cada card: gradiente de fundo por tipo (paleta definida no design) — fundo distinto por foto em `/destaques/fundos`
- [ ] Rodapé consistente: TimeCasa × TimeFora · Rodada X · DD/MM · HH:MM — hoje só sai "Rodada N"
- [ ] Integrar botão "Mandar um F" com mutation (optimistic update no contador) — o contador atualiza depois da resposta, sem mensagem se falhar

### Requirements addressed
- Requisito 7 (AC 1-9)

## Task 17: Frontend — Notification Actions no Service Worker

- [x] Atualizar `worker/index.ts` push handler para detectar payload com `tipo === 'NAO_PALPITOU'` e adicionar actions ["Mandar F", "Ver Destaque"] — o backend ainda não manda esse payload
- [x] Atualizar `worker/index.ts` notificationclick handler para detectar `event.action === 'mandar-f'` e disparar fetch POST para `/api/grupos/:grupoId/destaques/:destaqueId/mandar-f`
- [x] Implementar fallback: se fetch falhar, abrir app no URL do destaque
- [x] Para notificações sem action específico, abrir/focar janela no URL do destaque (padrão existente)

### Requirements addressed
- Requisito 4 (progressive enhancement via push)
- Design: Notification Actions

## Task 18: Atualizar Postman Collection e documentação

- [ ] Adicionar endpoints ao `postman_collection.json`: GET destaques, POST mandar-f, POST visualizar
- [x] Atualizar `README.md` com novos endpoints, módulo destaques e regras de domínio
- [x] Atualizar steering `project-overview.md` / `visao-geral` / specs com regra em vigor (sequência, panelinha, filtro de rodada, títulos)

### Requirements addressed
- Documentação (convenção do projeto)

## Task 19: Polimento de produto (sequência, feed, panelinha, UI)

- [x] Ajustar cálculo de `SEQUENCIA_RESULTADO` (lookback 1, mín. jogos/pontos, mesmo apito, melhor sequência por pessoa)
- [x] Extrair helpers de listagem/seleção (`sequencia-listagem`, `destaque-selecao`, `sequencia-resultado.calculo`)
- [x] Panelinha (3+ no mesmo placar), dedupe e seleção diversa na listagem
- [x] Sync de `NAO_PALPITOU` obsoleto na listagem/geração
- [x] Preferência `destaquesGrupo` (rename) + push abre o grupo
- [x] FE: filtro de rodada (botões), card panelinha centralizado, ranking 2 colunas, emoji 🚀 em SUBIU
- [x] Flexão de títulos por gênero via primeiro nome (`titleFeminino`)
- [x] Testes unitários dos helpers novos (seleção, sequência, títulos)

### Requirements addressed
- Requisito 2 (AC atualizados: sequência, panelinha, títulos)
- Requisito 3 (rodada Atual = última finalizada; filtro)
- Requisito 7 (layouts panelinha / ranking / emoji)
