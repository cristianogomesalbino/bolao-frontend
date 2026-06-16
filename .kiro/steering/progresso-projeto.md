---
inclusion: auto
description: Registro do progresso do projeto, módulos implementados, endpoints utilizados e próximos passos.
---

# Progresso do Projeto — Bolão Frontend

## Status Atual

Branch ativa: `develop` (mergeada em main)
Deploy: Vercel (branch main)

## Módulos Implementados

### 1. Autenticação ✅
- Login com email/senha (React Hook Form + Zod)
- Cadastro de usuário
- Esqueci senha / Resetar senha
- Token management (access em memória, refresh em localStorage)
- API client com interceptors (refresh automático em 401)
- Guard de rotas protegidas
- Redirect: `/` → `/login` ou `/inicio`
- Validação em tempo real (mode: 'onChange')
- Mostrar/ocultar senha
- Shake no card ao errar login
- Agenda semanal na tela de login (mock)
- Tratamento de erro: "Servidor indisponível" quando backend está fora (statusCode 0)

### 2. Perfil / Minha Conta ✅
- Rota: `/minha-conta`
- Editar nome e email
- Alterar senha com indicador de força
- Excluir conta com confirmação em 2 passos
- Header sticky com blur
- Avatar com iniciais

### 3. Home ✅ (Redesenhada — Sessão Atual)
- Header: "Olá, Cristiano 👋" com nome em verde + avatar com borda/glow verde
- Ícone notificação com badge verde pulsante
- Botão logout discreto (cinza → vermelho no hover)
- Sem badge de campeonato no header (removido)

**Card Próximo Jogo (`card-proximo-jogo.tsx`):**
- Dados reais via `buscarDadosTemporada` (endpoint otimizado)
- Escudos 56px com glow branco (`blur-lg`)
- Countdown estilo grupo page: `⏱ Encerra em HH:MM:SS` (encerra 1min antes do jogo)
- Total palpites real via `buscarEstatisticasPalpite` → "X palpitaram" (ícone Users)
- Palpite do usuário via `buscarMeuPalpite` → "Você já palpitou ✓" ou "• Sem palpite"
- Botão "PALPITAR >" com glow verde
- **Tema Copa:** fundo verde escuro/amarelo, borda amarela sólida, textos amarelos, countdown laranja
- **Tema Brasileirão:** fundo superfície, borda verde vibrante, textos brancos/verdes

**Card Meus Grupos (`card-meus-grupos.tsx`):**
- Dados reais via `listarGrupos`
- Mostra **todos** os grupos (sem limite)
- Ícone temático baseado no campo `icone` do grupo (mapa: bola→⚽, trofeu→🏆, bandeira→🏁, etc.)
- Estrela ⭐ ao lado do nome do grupo favorito
- Espaçamentos compactos (p-3, separadores border-b)
- Link "Ver todos" com ChevronRight
- Borda verde vibrante sólida + glow

**Card Ranking (`card-ranking.tsx`):**
- Dados reais via `obterRankingGeral(grupoId)`
- **Filtro dropdown customizado** ao lado do título "RANKING" (menu flutuante, fecha ao clicar fora)
- Muda ranking dinamicamente ao trocar grupo no filtro
- **Pódio visual:** top 3 em barras lado a lado (2º | 1º | 3º)
  - Avatares com glow na cor da posição
  - Bordas vibrantes (cinza/dourado/laranja, 80-90% opacidade)
  - Posição colorida (1º dourado, 2º prata, 3º bronze)
  - Stats compactos (Target + Zap) dentro da barra
  - Coroa no 1º lugar
- **Lista 4º e 5º:** com badges coloridos (cheio verde, parcial âmbar, feitos neutro, esquecidos vermelho)
- Pontos em destaque grande à direita com "pts" abaixo
- **Motivação:** "Faltam X pts para o 1º lugar!" ou "🔥 Você está na liderança!"
- **Legenda desempate:** ícones coloridos (Target cheio → Zap parcial → CircleDot feitos)
- **Tema Copa:** borda amarela sólida, fundo verde/amarelo, título amarelo
- **Tema Brasileirão:** borda verde sólida + glow
- Critérios de ordenação: pontuação → acertos em cheio → acertos parciais → total palpites feitos
- Quando pontuação zerada: posição por ordem de entrada no grupo

**Regras de Ranking (frontend):**
- Pódio sempre com os 3 primeiros
- Mostra até 5º (2 posições fora do pódio em lista)
- Pontuação zerada → ordem de chegada (mantém ordem do backend)
- Com jogos: 1º pontuação, 2º acertos em cheio, 3º acertos parciais, 4º total palpites feitos
- Se usuário fora do top 5, mostra posição separada

**Componente removido:**
- `card-proximos-jogos.tsx` — substituído pelo card principal mais rico

- Bottom navigation (Home, Grupos, Palpites, Conta)

### 4. Grupos ✅

#### Listagem (`/grupos`)
- Cards com ícone temático, participantes, rodada, status
- Header: troféu com glow, título "Meus Grupos", badge contador, botão entrar/criar
- Estado vazio, loading skeleton, tratamento de erro
- Formulário entrar por código de convite

#### Detalhes do grupo (`/grupos/[grupoId]`)
- Header: avatar com inicial, nome + coroa, privado/membros, código de convite (copiar), engrenagem

**Card Próximo Jogo:**
- Escudos grandes sem fundo circular, com glow forte (drop-shadow 24px, saturação 1.2)
- Data (Hoje/Amanhã/data) alinhada com topo dos escudos
- Horário + VS empurrados para baixo (mt-5)
- Alerta "Há jogos atrasados • Ver todos" como texto simples dentro do card
- Tag "⚠ ATRASADO" só aparece se `jogo.foiAdiado === true`
- Countdown "Fecha em" com card subido (-mt-4)
- Colocação dos times (Xº colocado) via API externa de classificação
- Últimos 5 jogos (V/E/D) via recentForm da classificação real
- Lógica: só mostra jogos AGENDADOS futuros (>60s), nunca adiados/em andamento
- Busca com `?status=AGENDADO` para pegar todas as rodadas

**Palpite Inline (dentro do card):**
- Sem palpite → alerta "⚠️ Você ainda não palpitou" + botão "Fazer palpite"
- Clicou → controles +/- (botões h-9 w-9, contorno verde #22c55e, ícones 16px) + "Confirmar palpite"
- Já palpitou → placar centralizado (× alinhado com VS, flex-1 simétrico) + "Editar" (absolute right-0 bottom-0)
- "Meu palpite" acima do ×
- Nomes dos times em verde (text-primaria-claro)
- Encerrado → placar em modo leitura com 🔒

**Card Ranking:**
- Filtros "Geral" e "Rodada" ao lado do título
- Seletor de rodada: setas verdes (20px) + texto clicável que abre dropdown
- Dropdown: grid 4 colunas com números, rodada selecionada em verde, limitado até rodada atual
- Ao clicar "Rodada", já vem com rodada atual selecionada
- Ranking por rodada via `GET /ranking/fases/:faseId?rodada=N`
- Variação de posição (↑↓) comparando ranking geral com `?ateRodada=N-1`
- Pódio top 3 + lista 4+ com variação

- Card "Sua Posição": posição, pontos, pts atrás do líder
- Card "Atividade Recente" — mock
- Banner "Há jogos atrasados" → `/grupos/[grupoId]/jogos-adiados`

#### Jogos adiados (`/grupos/[grupoId]/jogos-adiados`)
- Lista jogos com status ADIADO e AGENDADO
- Escudos, badge "Adiado", rodada original

#### Palpites (`/grupos/[grupoId]/palpites`)
- Seletor de fase/rodada com setas ← →
- Lista de jogos: escudo, horário ou placar, status

#### Configurações (`/grupos/[grupoId]/configuracoes`)
- Editar grupo, gerar convite, membros inline
- Tornar admin / Remover admin / Remover membro
- Zona de perigo: excluir grupo

#### Editar grupo (`/grupos/[grupoId]/editar`)
- 4 seções: Aparência, Participantes, Privacidade, Regras

#### Código de convite (`/grupos/[grupoId]/convite`)
- Código grande com glow, copiar/compartilhar, gerar novo

#### Criar grupo (`/grupos/criar`)
- Hero cinematográfico, formulário completo

### 5. Admin (temporário)
- Rota: `/admin/importar` — importar jogos da API do GE
- Seleção de campeonato (Brasileirão / Copa do Mundo 2026)
- Seleção de fase (Fase de Grupos, 32 Avos, Oitavas, etc.)
- Importação por rodada ou "Todas"
- **Sincronização:** ao selecionar "Fase de Grupos" da Copa, o frontend envia o `faseId` do primeiro grupo (Grupo A), mas o backend sincroniza automaticamente TODOS os 12 grupos de uma vez
- Para fases eliminatórias: precisa selecionar a fase destino específica no banco
- `faseBancoEfetiva`: para Copa grupos e Brasileirão, auto-seleciona a primeira fase `PONTOS_CORRIDOS`

## Services e Endpoints Utilizados

### grupo.service.ts
- `listarGrupos()` → `GET /grupos?membro=true`
- `listarGruposPublicos(busca?)` → `GET /grupos?privado=false&busca=...`
- `buscarGrupo(grupoId)` → `GET /grupos/:grupoId`
- `criarGrupo(dados)` → `POST /grupos`
- `atualizarGrupo(grupoId, dados)` → `PATCH /grupos/:grupoId`
- `excluirGrupo(grupoId)` → `DELETE /grupos/:grupoId`
- `entrarNoGrupo(codigoConvite)` → `POST /grupos/entrar`
- `listarMembros(grupoId)` → `GET /grupos/:grupoId/membros`
- `sairDoGrupo(grupoId)` → `DELETE /grupos/:grupoId/sair`
- `removerMembro(grupoId, usuarioId)` → `DELETE /grupos/:grupoId/usuarios/:usuarioId`
- `gerarNovoConvite(grupoId)` → `PATCH /grupos/:grupoId/regenerar-convite`
- `promoverAdmin(grupoId, usuarioId)` → `PATCH /.../cargo` `{ role: 'ADMIN' }`
- `rebaixarMembro(grupoId, usuarioId)` → `PATCH /.../cargo` `{ role: 'MEMBER' }`
- `obterRankingGeral(grupoId)` → `GET /grupos/:grupoId/ranking/geral`
- `obterRankingFase(grupoId, faseId, rodada?, ateRodada?)` → `GET /grupos/:grupoId/ranking/fases/:faseId?rodada=&ateRodada=`

### jogo.service.ts
- `listarFases(temporadaId)` → `GET /temporadas/:temporadaId/fases`
- `listarJogosFase(faseId, rodada?, status?)` → `GET /fases/:faseId/jogos`
- `buscarProximoJogo(temporadaId)` — busca próximo jogo AGENDADO futuro
- `contarJogosAdiados(temporadaId)` — conta jogos ADIADO na temporada
- `contarJogosAdiadosRodada(faseId, rodada)` — conta adiados de uma rodada

### palpite.service.ts ✅ (novo)
- `criarPalpite(jogoId, dados)` → `POST /jogos/:jogoId/palpites`
- `atualizarPalpite(palpiteId, dados)` → `PATCH /palpites/:id`
- `excluirPalpite(palpiteId)` → `DELETE /palpites/:id`
- `buscarMeuPalpite(jogoId)` → `GET /jogos/:jogoId/meu-palpite`

### classificacao.service.ts ✅ (novo)
- `buscarClassificacao(season?)` → `GET /classificacao?season=`
- `obterPosicaoTime(classificacao, nomeTime)` — retorna posição do time
- `obterUltimosJogos(classificacao, nomeTime)` — retorna recentForm em V/E/D

## Backend — Alterações nesta sessão

### Endpoint novo: `GET /classificacao`
- Controller: `jogo.controller.ts`
- Service: `FutebolApiService.buscarClassificacao(season)`
- Duas fontes com fallback:
  1. API do ge.globo.com (endpoint classificação)
  2. Pacote `campeonato-brasileiro-api` (scraping)
- Retorna: posicao, timeId, nome, sigla, escudo, pontos, jogos, V/E/D, saldoGols, recentForm

### Ranking acumulativo: `?ateRodada=N`
- `RankingService.obterRankingFase` aceita `ateRodada` (ranking até rodada X inclusive)
- `buscarPorFaseAteRodada` adicionado nos 3 repositórios (interface + Prisma + InMemory)
- Controller expõe `@Query('ateRodada')`

### Pacote instalado: `campeonato-brasileiro-api`
- Usado como fallback para classificação no backend

## Tipos

### palpite.types.ts ✅ (novo)
- `Palpite` (id, golsCasa, golsFora, jogoId, usuarioId, dataCriacao, atualizadoEm)
- `DadosCriarPalpite` (golsCasa, golsFora)
- `DadosAtualizarPalpite` (golsCasa, golsFora)

### jogo.types.ts (atualizado)
- Adicionado `foiAdiado?: boolean` ao tipo `Jogo`

### classificacao.service.ts (tipos)
- `ClassificacaoTime` (posicao, timeId, nome, sigla, recentForm?)

## Componentes Novos

### `src/components/palpite/palpite-inline-form.tsx`
- Props: jogoId, timeCasaNome, timeForaNome, disabled
- Estados: aberto, editando, salvo
- Usa React Query para buscar/criar/atualizar palpite
- Botões +/- com contorno verde, tamanho h-9 w-9

## Infraestrutura / Deploy

### Vercel
- Branch: main (deploy automático)
- Fixes aplicados:
  - Removido `skipWaiting` do `next.config.ts` (não suportado na versão do PWA)
  - Removida pasta `bolao-frontend/` aninhada do repositório
  - Deletado `(protegido)/page.tsx` redundante (causava erro de manifest)
  - Removido `campeonato-brasileiro-api` do package.json do frontend
  - Removido `bolao-frontend.code-workspace` de dentro de rota

### ESLint config
- `@typescript-eslint/no-explicit-any`: off (dívida técnica existente)
- `@typescript-eslint/no-unused-vars`: warn (argsIgnorePattern: ^_)
- `prefer-const`: warn

### .gitignore
- Adicionado `bolao-frontend/` e `bolao-frontend.code-workspace`

## Scripts de Seed (banco)

### `scripts/seed-palpites.sql`
- Gera palpites aleatórios (0-3 gols) para todos os membros do grupo "Cristiano" em jogos finalizados sem palpite

### `scripts/seed-palpites-variacao.sql`
- Dá acertos em cheio para Cristiano (6), Fernanda (5), João (4), Bruno (3)
- Faz Lucas Silva e Pedro Oliveira errarem tudo
- Causa variação visível no ranking geral

## Endpoints NÃO utilizados no frontend (24 de 44)

- **Palpite Dobrado** (6) — módulo inteiro
- **Jogos admin** (7) — criar, atualizar, finalizar, importar, sincronizar, resetar fonte
- **Campeonatos** (2) — criar/listar
- **Temporadas** (2) — criar/listar
- **Palpites** (3) — lote, listar por grupo/jogo, meus palpites
- **Ranking** (2) — detalhamento por jogo, processar pontuação
- **Painel Rodada** (1)
- **Grupos** (1) — alterar status
- **Usuarios** (1) — buscar por ID

## Próximos Passos

1. ~~Criar tela `/jogos` (aba da bottom nav)~~ ✅ → renomeada para `/palpites`
2. Implementar palpite em lote (botão "Salvar todos")
3. Conectar painel da rodada
4. Implementar palpite dobrado (fichas)
5. Atividade recente com dados reais
6. Login com Google (OAuth)
7. Resolver dívida técnica: substituir `any` por tipos corretos
8. Testes E2E com Playwright
9. Refatorar page do grupo (extrair componentes — está com ~500 linhas)
10. Corrigir jogos AGENDADO sem data no banco (devem ser ADIADO) — SQL: `UPDATE "Jogo" SET status = 'ADIADO' WHERE "dataHora" IS NULL AND status = 'AGENDADO'`

## Sessão 3 — Palpites + Performance

### Seletor de placar redesenhado
- Estilo: caixas escuras (`bg-black/60`) com número grande + setas laterais (ChevronDown) com borda
- Setas ao lado da caixa (não acima/abaixo), `size={24}`, com `border border-white/[0.12] rounded p-1`
- "x" no meio separando os dois placares
- Escudos aumentados para `h-14 w-14` com glow branco (`bg-white/30 blur-lg`)
- Nomes dos times: `text-xs text-texto font-medium`
- Data/hora: `text-[11px] text-texto/80`
- Borda do card: `border-primaria` (verde sólido)
- Botão "Editar": `text-xs` com ícone Pencil
- Placar do palpite feito: `text-3xl font-bold text-primaria-claro`

### Jogos adiados — regras de exibição
- Jogos sem data (`dataHora: null`): mostram "JOGO ADIADO - DATA A DEFINIR" no topo (onde fica a data)
- Jogos adiados são palpitáveis (backend aceita `AGENDADO` e `ADIADO`)
- Quando jogo adiado recebe data → volta para `AGENDADO` com `foiAdiado = true`
- Campo `foiAdiado` é o indicador permanente de que o jogo foi adiado
- Jogos palpitáveis ficam no topo da lista (sort por status)

### Barra de estatísticas (expandível)
- Ao expandir card (seta inferior): mostra barra de distribuição de palpites do grupo
- Verde (esquerda): % vitória time casa
- Cinza (meio): % empate
- Vermelho (direita): % vitória time fora
- Total de palpites exibido abaixo
- Lazy loading: só busca ao expandir (`enabled: expandido`)
- Atualiza ao salvar palpite (`invalidateQueries`)

### Endpoint novo: `GET /grupos/:grupoId/jogos/:jogoId/palpites/estatisticas`
- Retorna: `{ total, vitoriaCasa, empate, vitoriaFora, percentualCasa, percentualEmpate, percentualFora }`
- Guard: `GroupRoleGuard` (ADMIN, MEMBER)
- Service: `PalpiteService.buscarEstatisticasPorJogo`

### Endpoint novo: `POST /meus-palpites/por-jogos`
- Body: `{ jogoIds: string[] }`
- Retorna: array de palpites do usuário para os jogos informados
- Substitui N requests individuais de `GET /jogos/:id/meu-palpite`
- Frontend: query batch na page popula cache individual via `setQueryData`

### Otimização de performance — Login → Home
- `inicializar()` verifica `estaAutenticado` antes de refazer refresh (evita 2 requests extras)
- Guard de autenticação: skeleton da home (header + cards pulsando) em vez de spinner genérico
- Root page: spinner maior + texto "Carregando..."

### Otimização de requests — Palpites
- Antes: N requests `GET /jogos/:id/meu-palpite` (1 por jogo, muitas 404)
- Depois: 1 request `POST /meus-palpites/por-jogos` com todos os IDs
- Card lê do cache (sem queryFn própria), populado pelo batch
- Key estável: `['meus-palpites-batch', faseId, rodadaAtual]`

### palpite.service.ts (atualizado)
- `buscarMeusPalpitesPorJogos(jogoIds)` → `POST /meus-palpites/por-jogos`
- `buscarEstatisticasPalpite(grupoId, jogoId)` → `GET /grupos/:grupoId/jogos/:jogoId/palpites/estatisticas`

### Backend — palpite.service.ts (atualizado)
- `buscarMeusPalpitesPorJogos(jogoIds, usuarioId)` — usa `buscarPorUsuarioEJogos` (batch)
- `buscarEstatisticasPorJogo(jogoId, grupoId)` — conta vitória casa/empate/fora dos membros
- Validação de palpite aceita `AGENDADO` e `ADIADO`

## Sessão 2 — Continuação

### Tela `/palpites` (nova — aba da bottom nav)
- Rota: `/palpites` (renomeada de `/jogos`)
- Header: ícone bola de futebol customizado + "Palpites" + subtítulo
- Card da rodada: número da rodada, badge "Em andamento"/"Agendada", barra de progresso de palpites
- 3 abas: "Todos os jogos" | "Meus palpites" | "Ao vivo" (com bolinha pulsante)
- Mostra 2 rodadas (atual + próxima) com separador "Rodada X"
- Jogos agendados + em andamento + finalizados da rodada
- Loading skeleton

### Componente `CardJogoPalpite` (refatorado)
- Data/hora centralizada no topo
- Indicação de status: "AO VIVO" (bolinha vermelha pulsante), "ENCERRADO"
- Escudos + nome dos times nas laterais
- Centro: placar final (se finalizado/ao vivo) ou controles +/- (se agendado)
- Inversão: placar final no destaque, "Meu palpite: X × Y" abaixo
- Pontuação "+10 pts" quando jogo finalizado
- Seta no rodapé para expandir/retrair detalhes
- Sem estrela
- Botão "Editar" no palpite já feito

### Bottom Nav
- Aba renomeada: "Jogos" → "Palpites"
- Rota: `/jogos` → `/palpites`
- Ícone customizado: bola de futebol SVG (`src/components/icons/icon-palpite.tsx`)
- Todos os ícones aumentados para 24px

### Ícone customizado `IconPalpite`
- SVG puro: bola de futebol com pentágono central e gomos
- Props: size, color, strokeWidth, className
- Estilo Lucide (round caps/joins, monocromático)
- Arquivo: `src/components/icons/icon-palpite.tsx`

### Fixes nesta sessão
- `JogosResponse` tipo atualizado com `rodadaAtual: number | null`
- Ranking: grupos com <3 membros mostram lista direto (sem pódio)
- Ranking: "Ver todos" / "Ver menos" (expande inline, limita a 5 por padrão)
- Removido card "Atividade Recente" (mock) da tela do grupo
- Alerta "Há jogos atrasados" movido para fora do card de próximo jogo (aparece sempre)
- Contagem de adiados inclui jogos com `foiAdiado=true` e status AGENDADO
- Steerings: adicionado `description` em todos os front-matters
- Steering coding-conventions: adicionadas seções Páginas, React Query, Tailwind, Dados Externos
- ESLint: `no-explicit-any: off`, `no-unused-vars: warn`, `prefer-const: warn`
- Build Vercel: removido `skipWaiting`, pasta aninhada, `(protegido)/page.tsx`
