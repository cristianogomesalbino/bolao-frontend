# Plano de Implementação: Cards do Painel de Grupo

## Visão Geral

Implementação incremental dos cards do painel de detalhes de grupo, começando pelo backend (novo endpoint de atividade + campo sequência de pontuação), seguido pelos tipos e services do frontend, hooks customizados com TanStack Query, componentes de card individuais, e finalizando com a integração na página de detalhes do grupo.

## Tasks

- [ ] 1. Backend — Módulo de Atividade Recente
  - [ ] 1.1 Criar estrutura do módulo atividade e constantes
    - Criar `src/modules/atividade/atividade.module.ts` com imports dos repositórios necessários (PalpiteRepository, JogoRepository, GrupoUsuarioRepository, GrupoRepository, FaseRepository)
    - Criar `src/modules/atividade/atividade.constants.ts` com TAG, MENSAGENS e tipos de evento (PALPITES_FEITOS, SUBIU_RANKING, ACERTO_EM_CHEIO, LIDER_MUDOU)
    - Registrar o módulo no AppModule
    - _Requisitos: 6.1, 6.2_

  - [ ] 1.2 Implementar AtividadeService com lógica de computação on-the-fly
    - Criar `src/modules/atividade/services/atividade.service.ts`
    - Implementar método `obterAtividadeRecente(grupoId: string)` que computa eventos a partir de dados existentes
    - Lógica: PALPITES_FEITOS (palpites criados nas últimas 24h), SUBIU_RANKING (comparar ranking atual vs anterior), ACERTO_EM_CHEIO (pontuações recentes com acerto em cheio), LIDER_MUDOU (comparar líder atual vs anterior)
    - Ordenar por criadoEm descendente, limitar a 10 eventos
    - Injetar repositórios via tokens existentes (PalpiteRepository, JogoRepository, GrupoUsuarioRepository, GrupoRepository, FaseRepository)
    - _Requisitos: 6.1, 6.2, 6.3_

  - [ ]* 1.3 Escrever testes unitários do AtividadeService
    - Testar com InMemory repositories
    - Testar geração de cada tipo de evento
    - Testar ordenação e limite de 10 eventos
    - Testar retorno de array vazio quando não há atividade
    - _Requisitos: 6.1, 6.2, 6.3_

  - [ ] 1.4 Criar AtividadeController com endpoint GET /grupos/:grupoId/atividade-recente
    - Criar `src/modules/atividade/controllers/atividade.controller.ts`
    - Aplicar `@UseGuards(GroupRoleGuard)` e `@GroupRoles(GRUPO_ROLE.ADMIN, GRUPO_ROLE.MEMBER)`
    - Validar grupoId com ParseUUIDCustomPipe
    - Retornar array de eventos com campos: id, tipo, usuarioId, nomeUsuario, descricao, criadoEm
    - Tratar GrupoNaoEncontradoError (404)
    - Decorar com @ApiTags, @ApiOperation, @ApiResponse para Swagger
    - _Requisitos: 6.1, 6.3, 6.4, 6.5_

  - [ ]* 1.5 Escrever testes unitários do AtividadeController
    - Testar chamada ao service e retorno correto
    - Testar que guard está aplicado
    - _Requisitos: 6.4, 6.5_

- [ ] 2. Backend — Sequência de Pontuação no Ranking
  - [ ] 2.1 Adicionar cálculo de sequenciaPontuacao ao RankingService
    - Modificar `obterRankingGeral` para calcular sequência de pontuação por membro
    - Lógica: buscar rodadas da fase atual ordenadas da mais recente para a mais antiga, contar rodadas consecutivas com pontuação > 0
    - Adicionar campo `sequenciaPontuacao` na interface RankingEntry do backend
    - Atualizar RankingPresenter para incluir o novo campo
    - _Requisitos: 10.1, 10.2, 10.3_

  - [ ]* 2.2 Escrever testes unitários do cálculo de sequência
    - Testar sequência com rodadas consecutivas pontuando
    - Testar sequência = 0 quando rodada mais recente tem pontuação 0
    - Testar com apenas 1 rodada
    - _Requisitos: 10.1, 10.2, 10.3_

  - [ ]* 2.3 Escrever teste property-based para cálculo de sequência de pontuação
    - **Propriedade 12: Cálculo da sequência de pontuação**
    - Gerar sequências aleatórias de pontuação por rodada, verificar que a contagem de rodadas consecutivas da mais recente com pontuação > 0 está correta
    - **Valida: Requisitos 10.1, 10.2, 10.3**

- [ ] 3. Checkpoint — Backend completo
  - Garantir que todos os testes passam no backend (`sh dev npx vitest run`), perguntar ao usuário se há dúvidas.

- [ ] 4. Frontend — Tipos e Services
  - [ ] 4.1 Criar tipos de atividade e estender RankingEntry
    - Criar `src/types/atividade.types.ts` com TipoAtividade e EventoAtividade
    - Estender RankingEntry em `src/types/grupo.types.ts` adicionando interface RankingComSequencia com campo sequenciaPontuacao
    - _Requisitos: 5.2, 5.3, 6.3, 10.1_

  - [ ] 4.2 Criar atividade.service.ts
    - Criar `src/services/atividade.service.ts` com função `buscarAtividadeRecente(grupoId: string): Promise<EventoAtividade[]>`
    - Usar apiClient existente para chamar `GET /grupos/:grupoId/atividade-recente`
    - _Requisitos: 5.6, 6.1_

  - [ ] 4.3 Atualizar grupo.service.ts para suportar RankingComSequencia
    - Atualizar tipo de retorno de `obterRankingGeral` para `RankingComSequencia[]`
    - _Requisitos: 10.1, 4.5_

- [ ] 5. Frontend — Hooks Customizados
  - [ ] 5.1 Criar hook useRankingGrupo
    - Criar `src/hooks/useRankingGrupo.ts`
    - Centralizar dados de ranking para múltiplos cards: ranking, minhaPosicao, lider, rival, variacao, sequenciaPontuacao
    - Usar TanStack Query com staleTime de 60s
    - Calcular variação de posição comparando ranking atual vs ranking anterior (já existente na page)
    - Calcular rival direto (membro imediatamente acima ou abaixo se líder)
    - _Requisitos: 1.1, 1.3, 4.2, 7.1, 7.5, 11.7, 12.1_

  - [ ] 5.2 Criar hook useAtividadeRecente
    - Criar `src/hooks/useAtividadeRecente.ts`
    - Retornar eventos[], isLoading, error
    - Usar TanStack Query com staleTime de 30s
    - _Requisitos: 5.6, 11.7, 12.1_

  - [ ] 5.3 Criar hook usePainelRodada
    - Criar `src/hooks/usePainelRodada.ts`
    - Combinar dados de painel-rodada e jogos da fase
    - Retornar jogos[], jogosFinalizados, totalJogos, proximoFechamento, progresso
    - Usar TanStack Query com staleTime de 30s
    - _Requisitos: 8.1, 8.2, 8.6, 11.7, 12.1_

- [ ] 6. Frontend — Funções utilitárias de cálculo
  - [ ] 6.1 Criar funções utilitárias para cálculos dos cards
    - Criar funções puras para: calcularDistanciaLider, calcularVariacaoPosicao, calcularProgressoPosicao, calcularAproveitamento, selecionarRival, derivarStatusRodada, calcularProgressoRodada, formatarTempoRelativo, encontrarProximoFechamento
    - Essas funções serão usadas pelos hooks e componentes
    - _Requisitos: 1.3, 2.3, 4.3, 5.3, 7.1, 8.1, 8.2, 9.1_

  - [ ]* 6.2 Escrever teste property-based para distância do líder
    - **Propriedade 1: Cálculo da distância para o líder**
    - Gerar arrays de RankingEntry aleatórios, verificar que distância = lider.pontuacaoTotal - usuario.pontuacaoTotal e >= 0
    - **Valida: Requisitos 1.3, 1.4**

  - [ ]* 6.3 Escrever teste property-based para indicador de variação
    - **Propriedade 2: Indicador de variação de posição**
    - Gerar inteiros aleatórios, verificar mapeamento correto (positivo → verde/cima, negativo → vermelho/baixo, zero → neutro)
    - **Valida: Requisitos 2.3, 3.2, 3.3, 3.4, 4.4**

  - [ ]* 6.4 Escrever teste property-based para barra de progresso
    - **Propriedade 3: Cálculo da barra de progresso (posição vs líder)**
    - Gerar pares de pontuação (usuario, lider) onde lider >= usuario >= 0 e lider > 0, verificar percentual = (usuario/lider)*100 no intervalo [0, 100]
    - **Valida: Requisitos 4.2, 4.3**

  - [ ]* 6.5 Escrever teste property-based para seleção do rival
    - **Propriedade 7: Seleção do rival direto**
    - Gerar rankings aleatórios com posição do usuário, verificar que rival correto é selecionado e diferença de pontos está correta
    - **Valida: Requisitos 7.1, 7.3, 7.5**

  - [ ]* 6.6 Escrever teste property-based para cálculo de aproveitamento
    - **Propriedade 11: Cálculo do percentual de aproveitamento**
    - Gerar RankingEntry aleatórios, verificar que percentual = ((acertos) / total) * 100
    - **Valida: Requisito 9.1**

  - [ ]* 6.7 Escrever teste property-based para progresso da rodada
    - **Propriedade 9: Cálculo do progresso da rodada**
    - Gerar arrays de jogos com status aleatórios, verificar contagem de finalizados e percentual
    - **Valida: Requisitos 8.2, 8.3**

  - [ ]* 6.8 Escrever teste property-based para derivação de status da rodada
    - **Propriedade 8: Derivação do status da rodada**
    - Gerar conjuntos de jogos com status aleatórios, verificar que status derivado está correto (Encerrada, Em andamento, Aguardando)
    - **Valida: Requisito 8.1**

  - [ ]* 6.9 Escrever teste property-based para countdown
    - **Propriedade 10: Countdown aponta para o próximo jogo a fechar**
    - Gerar jogos AGENDADOS com datas futuras aleatórias, verificar que countdown aponta para o jogo com menor dataHora
    - **Valida: Requisito 8.4**

  - [ ]* 6.10 Escrever teste property-based para ordenação de eventos
    - **Propriedade 4: Ordenação cronológica de eventos de atividade**
    - Gerar arrays de eventos com timestamps aleatórios, verificar ordem decrescente e máximo de 5 exibidos
    - **Valida: Requisitos 5.1, 5.4**

  - [ ]* 6.11 Escrever teste property-based para formatação de tempo relativo
    - **Propriedade 5: Formatação de tempo relativo**
    - Gerar timestamps passados aleatórios, verificar formato correto em português ("há Xmin", "há Xh", "há Xd")
    - **Valida: Requisito 5.3**

- [ ] 7. Checkpoint — Hooks e utilitários prontos
  - Garantir que todos os testes passam, perguntar ao usuário se há dúvidas.

- [ ] 8. Frontend — Componentes de Card
  - [ ] 8.1 Criar CardRanking com pódio visual e destaque do usuário
    - Criar `src/components/grupo/cards/card-ranking.tsx`
    - Implementar pódio top 3 com avatares (56x56 líder, 48x48 demais), emojis de medalha (🥇🥈🥉), variação de posição
    - Implementar lista compacta (4+) com avatar 28x28, nome, pontos, variação
    - Destacar usuário logado com glow border, background diferenciado e badge "Você"
    - Exibir distância do líder ou "Você é o líder! 🏆"
    - Nota "Pontuação atualizada em tempo real" no rodapé
    - Skeleton loading: 3 blocos de pódio + 5 linhas de lista
    - Usar glassmorphism (bg-white/[0.03] backdrop-blur), Lucide icons, Tailwind CSS
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 12.3_

  - [ ] 8.2 Criar CardPosicao com visual aprimorado
    - Criar `src/components/grupo/cards/card-posicao.tsx`
    - Posição como número grande (text-5xl), pontos totais, distância do líder
    - Barra de progresso proporcional (usuario_pontos / lider_pontos * 100) com cor verde
    - Variação de posição da rodada atual (↑/↓ com texto descritivo)
    - Sequência de pontuação com emoji 🔥 (omitir se zero)
    - Skeleton loading: bloco de número + barra de progresso
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 11.1, 11.2, 11.5, 12.3_

  - [ ] 8.3 Criar CardAtividade com feed de atividades
    - Criar `src/components/grupo/cards/card-atividade.tsx`
    - Feed compacto com máximo 5 eventos, ordenados por criadoEm descendente
    - Cada evento: avatar 24x24, ícone contextual por tipo, texto descritivo em português, tempo relativo
    - Placeholder "Nenhuma atividade recente" quando vazio
    - Skeleton loading: 3 linhas de evento
    - Usar hook useAtividadeRecente
    - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5, 11.1, 11.3, 11.6, 12.2, 12.3_

  - [ ] 8.4 Criar CardRival com layout de confronto VS
    - Criar `src/components/grupo/cards/card-rival.tsx`
    - Layout VS com avatares grandes (48x48) e indicador "VS" central
    - Diferença de pontos (ex: "Lucas está 3 pts na frente")
    - Quando líder: exibir rival abaixo com "N pts atrás de você"
    - Não renderizar quando grupo tem 1 membro
    - Estilo esportivo/competitivo com tipografia bold
    - Skeleton loading: 2 avatares + texto
    - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 11.1, 11.5, 12.3_

  - [ ] 8.5 Criar CardStatusRodada com progresso e countdown
    - Criar `src/components/grupo/cards/card-status-rodada.tsx`
    - Número da rodada e status (em andamento, encerrada, aguardando)
    - Contagem de jogos finalizados vs total (ex: "24/38 jogos encerrados")
    - Barra de progresso horizontal com fill verde e soft glow
    - Countdown timer (HH:MM:SS) para próximo jogo a fechar
    - Esconder countdown quando rodada encerrada
    - Skeleton loading: barra de progresso + texto
    - Usar hook usePainelRodada
    - _Requisitos: 8.1, 8.2, 8.3, 8.4, 8.5, 11.1, 11.2, 12.3_

  - [ ] 8.6 Criar CardAproveitamento com estatísticas e gráfico circular
    - Criar `src/components/grupo/cards/card-aproveitamento.tsx`
    - Percentual de aproveitamento calculado: ((acertosEmCheio + acertosDeResultado + acertosDeGolsUmTime) / totalJogosComPalpite * 100)
    - Contadores individuais: acertos em cheio, acertos de resultado, acertos parciais, erros
    - Gráfico circular (donut/ring) com fill verde representando o percentual
    - Mensagem "Faça palpites para ver seu aproveitamento" quando sem palpites
    - Skeleton loading: círculo + 4 contadores
    - _Requisitos: 9.1, 9.2, 9.3, 9.4, 9.5, 11.1, 11.2, 11.3, 12.3_

- [ ] 9. Frontend — Integração na Página de Detalhes
  - [ ] 9.1 Refatorar DetalhesGrupoPage para usar novos componentes e hooks
    - Substituir lógica inline de ranking pelo hook useRankingGrupo
    - Substituir card de ranking inline pelo componente CardRanking
    - Substituir card "Sua Posição" inline pelo componente CardPosicao
    - Adicionar CardAtividade, CardRival, CardStatusRodada, CardAproveitamento na página
    - Manter layout mobile-first com max-width 480px
    - Manter estados de erro graceful por card (sem crash da página)
    - _Requisitos: 1.1, 11.4, 12.1, 12.2, 12.4_

  - [ ]* 9.2 Escrever testes unitários dos componentes de card
    - Testar renderização de cada card com dados mockados
    - Testar estados de loading (skeleton)
    - Testar estados de erro
    - Testar edge cases: ranking vazio, 1 membro, usuário é líder
    - _Requisitos: 12.2, 12.3_

- [ ] 10. Checkpoint final — Garantir integração completa
  - Garantir que todos os testes passam (frontend e backend), perguntar ao usuário se há dúvidas.

## Notas

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada task referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Testes property-based validam propriedades universais de corretude
- Testes unitários validam exemplos específicos e edge cases
- O backend usa Docker — todos os comandos via `sh dev npm/npx`
- O frontend usa TypeScript, TanStack Query, Tailwind CSS v4, Lucide React
