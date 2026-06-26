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

### 3. Home ✅ (Redesenhada)
- Header: "Olá, Cristiano" com nome em verde + avatar com borda/glow verde
- Botão logout discreto (cinza → vermelho no hover)
- Sem badge de campeonato no header (removido)
- **Card Avisos (`card-avisos.tsx`):** avisos do admin com expiração, dispensáveis via localStorage

**Card Próximo Jogo (`card-proximo-jogo.tsx`):**
- Dados reais via `buscarDadosTemporada` (endpoint otimizado)
- Escudos 56px com glow branco (`blur-lg`)
- Countdown estilo grupo page: `⏱ Encerra em HH:MM:SS` (encerra 1min antes do jogo)
- Total palpites real via `buscarEstatisticasPalpite` → "X palpitaram" (ícone Users)
- Palpite do usuário via `buscarMeuPalpite` → "Você já palpitou ✓" ou "• Sem palpite"
- Botão "PALPITAR >" com glow verde
- Header sem emojis (apenas texto "Próximo jogo")
- **Tema Copa:** fundo verde escuro/amarelo, borda amarela sólida, textos amarelos, countdown laranja
- **Tema Brasileirão:** fundo superfície, borda verde vibrante, textos brancos/verdes

**Card Meus Grupos (`card-meus-grupos.tsx`):**
- Dados reais via `listarGrupos`
- Mostra **todos** os grupos (sem limite)
- Sem ícone à esquerda (emojis removidos)
- Exibe campeonato + ano abaixo da contagem de membros (ex: "4 membros • Copa do Mundo 2026")
- Estrela ⭐ ao lado do nome do grupo favorito
- Espaçamentos compactos (p-3, separadores border-b)
- Header: apenas texto "Meus grupos" (sem ícone Users)
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
- **Motivação:** "Faltam X pts para o 1º lugar!" ou "Você está na liderança! Continue assim!" (sem emojis)
- **Legenda desempate:** ícones coloridos (Target cheio → Zap parcial → Clock hora do palpite)
- Header: apenas texto "Ranking" (sem emoji 🏅)
- **Tema Copa:** borda amarela sólida, fundo verde/amarelo, título amarelo
- **Tema Brasileirão:** borda verde sólida + glow
- Critérios de ordenação: pontuação → acertos em cheio → acertos parciais → hora do palpite
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
- Header: nome do grupo (sem avatar com inicial, sem emoji do ícone), privado/membros, código de convite (copiar), engrenagem
- **Modo Copa:** 3 abas sem emojis: "Dashboard" | "Classificação" | "Meus Palpites"
- **Modo Copa:** cards com borda amarela padronizada (`border-[#ffdf00] shadow-[0_0_24px_rgba(255,223,0,0.3)]`)
- Card "Sua Posição": posição + pontos + "Você é o líder!" (sem emoji 🏆)
- Card "Ranking": sem emoji 🏅 no título

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

### `src/components/palpites/lista-palpites-membros.tsx` ✅ (novo)
- Componente compartilhado para exibir lista de palpites dos membros no chevron expandido
- Usado em: `card-jogo-palpite.tsx`, `card-proximo-jogo-copa.tsx`, `aba-meus-palpites-copa.tsx`
- Props: `detalhamento`, `statusJogo`, `temaCopa`
- Mostra: avatar iniciais, nome, placar, pontuação (com cor por categoria)
- Cores adaptativas por tema (Copa: verde/amarelo, Padrão: primaria/texto)

### `src/components/palpites/modal-escolher-grupo.tsx` ✅ (novo)
- Modal obrigatório: aparece quando favorito do usuário não pertence ao campeonato ativo e há 2+ grupos
- Só fecha ao definir favorito (sem botão "Pular")
- Salva via `PATCH /usuarios/me/grupo-favorito` e atualiza auth store
- Visual: card com lista de opções selecionáveis + botão "Definir como favorito"

### `src/components/home/card-avisos.tsx` ✅ (novo)
- Exibe avisos não lidos do admin na home
- Avisos definidos em `src/lib/avisos.ts` (array estático com `expiraEm`)
- Dispensáveis individualmente (salva no localStorage)
- Não reaparece após dispensar ou após data de expiração
- Visual: card amarelo com ícone Megaphone, botão X para dispensar
- Suporta quebra de linha (`\n`) via `whitespace-pre-line`

### `src/lib/avisos.ts` ✅ (novo)
- Array `AVISOS` com interface: `{ id, titulo, mensagem, criadoEm, expiraEm }`
- Funções: `obterAvisosNaoLidos()`, `marcarAvisoComoLido(id)`, `obterAvisosLidos()`
- Persistência: localStorage (key: `avisos-lidos`)

### `src/lib/pontuacao-formatada.ts` ✅ (novo)
- `formatarPontuacao(pontos)` → "0 ponto", "1 ponto", "3 pontos"
- Regra: singular para ≤1, plural para >1 (português correto)
- Sem emojis, sem "+", sem "pts"
- Usado por todos os componentes de palpites

### Componente removido: `src/components/palpites/seletor-grupo-palpites.tsx`
- Substituído pelo modal obrigatório + lógica de favorito no hook

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
- Header: ícone bola de futebol customizado + "Palpites"
- Seletor de campeonato: "Brasileirão" | "Copa do Mundo" (sem emojis)
- 2 abas: "Próximos Jogos" | "Meus palpites"
- **Aba Próximos Jogos:** mostra apenas jogos AGENDADO + EM_ANDAMENTO (finalizados excluídos)
- **Aba Meus Palpites:** mostra apenas jogos EM_ANDAMENTO + FINALIZADO (ordem decrescente por data)
- Mostra 2 rodadas (atual + próxima) com separador "Rodada X"
- Loading skeleton
- **Modal obrigatório** (`modal-escolher-grupo.tsx`): aparece quando usuário tem 2+ grupos no campeonato ativo e o favorito não pertence a ele. Só fecha ao definir favorito via API
- **Detecção automática de campeonato:** abre na aba do campeonato com próximo jogo mais próximo
- Contador de palpites reflete a rodada toda (incluindo finalizados)
- Barra de progresso: bloquinhos por jogo da rodada inteira

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

## Sessão 4 — Pipeline de Qualidade (Frontend + Backend)

### Objetivo
Rodar pipeline de qualidade focando em: Sonar, princípios SOLID, remoção de código morto, reaproveitamento de código e melhoria de logs.

---

### Frontend — Código Morto Removido

| Arquivo | Motivo |
|---------|--------|
| `components/home/card-proximo-jogo.tsx` | ❌ Deletado — substituído por `card-proximos-jogos.tsx`, não importado |
| `components/auth/agenda-semanal.tsx` | ❌ Deletado — componente nunca importado em nenhuma tela |
| `services/jogo.service.ts` → `contarJogosAdiadosRodada()` | Removida — nunca chamada |
| `services/jogo.service.ts` → `buscarProximosJogos()` | Removida — única consumidora era agenda-semanal |
| `types/jogo.types.ts` → `interface JogoProximo` | Removida — órfã |
| `hooks/useHomeData.ts` → query `estatisticas` + import | Removido — `totalPalpites` não existia na interface do card |

### Frontend — Utilitário Compartilhado Criado

**Novo:** `src/lib/jogo-helpers.ts`
- `calcularCountdown(dataHora)` — countdown HH:MM:SS com flag `encerrado`
- `calcularTempoJogo(dataHora)` — minutos ao vivo ("35'", "45+", "Intervalo", "90+")
- `ehCampeonatoCopa(nome?)` — detecção dinâmica usando label do CAMPEONATOS config

**Consumidores atualizados:**
- `card-proximos-jogos.tsx` — removeu helpers inline, importa de `jogo-helpers`
- `useHomeData.ts` — removeu lógica de Copa inline, importa `ehCampeonatoCopa`
- `usePalpitesData.ts` — substituiu `ehGrupoCopa` por `ehCampeonatoCopa` compartilhado

### Frontend — Issues Sonar Corrigidas (7)

| Rule | Arquivo | Correção |
|------|---------|----------|
| S3776 (complexidade 16→15) | `palpites/page.tsx` | 2 useEffects unificados em 1 |
| S3358 (ternário aninhado) | `grupos/[grupoId]/palpites/page.tsx` | IIFE |
| S3358 (ternário aninhado) | `palpite-inline-form.tsx` | Função `obterTextoBotao()` |
| S3358 (ternário aninhado) | `formulario-alterar-senha.tsx` | IIFE |
| S6479 (array index keys) | `grupos/[grupoId]/page.tsx` | Prefixo `skeleton-ranking-` |
| S6759 (props não Readonly) | `palpite-inline-form.tsx` | `Readonly<>` adicionado |
| `as any` + `!` assertions | `palpite-inline-form.tsx`, `card-proximos-jogos.tsx` | Tipagem correta + guards |

### Frontend — Erro de Compilação Corrigido
- `inicio/page.tsx` passava prop `totalPalpites` inexistente na interface `PropsCardProximosJogos`

---

### Backend — Duplicações Eliminadas (3 padrões)

| Padrão | Arquivo | Solução |
|--------|---------|---------|
| Validação palpitável `!== AGENDADO && !== ADIADO` (4×) | `palpite.service.ts` | `private validarJogoAceitaPalpites(jogo)` |
| `membros.map(m => m.usuarioId)` (4×) | `ranking.service.ts` | `private extrairUsuarioIds(membros)` |
| "buscar token → se não existe → criar" (4×) | `ranking.service.ts` | `private concederTokenSeNaoExiste(usuarioId, grupoId, motivo, referenciaId)` |

### Backend — Logging Consolidado (Sincronização)

**Antes (7 linhas por sync):**
```
[SYNC] Iniciando sincronização: fase=xxx...
[SYNC] Fases para sincronizar: 12 (Grupo A, ...)
[SYNC] rodadaAtual=3, limiteRodada=4, jogosParaSync=29
[SYNC] API respondeu em 221ms...
[SYNC] 🏁 JOR 1 x 2 AGL → FINALIZADO
[SYNC] Processamento de 29 jogos em 111ms...
[SYNC] Sincronização completa em 787ms
```

**Depois (1-2 linhas):**
```
[SYNC] copa-do-mundo-2026 R3 | 1/29 atualizados | Grupo A, Grupo B, ... | API 221ms | Total 787ms | JOR 1x2 AGL (🏁)
```

### Backend — Erro de Compilação Corrigido
- `ranking.service.ts` → `concederTokenSeNaoExiste` tipado com union `'PALPITES_COMPLETOS' | 'ACERTO_EM_CHEIO' | 'ULTIMO_RANKING' | 'PRIMEIRO_RANKING'`

---

### Documentação Gerada

| Arquivo | Conteúdo |
|---------|----------|
| `bolao-frontend/docs/code-review/code-review-pipeline-qualidade.md` | Code review frontend |
| `bolao-backend/docs/code-review/code-review-pipeline-qualidade.md` | Code review backend |
| `bolao-backend/docs/code-review/code-review-pipeline-qualidade-consolidado.md` | Visão consolidada front+back |
| `bolao-backend/docs/tasks/task-otimizacao-n-plus-1.md` | Task de performance + SRP |

---

### Próximos Passos (dessa pipeline)

| Item | Prioridade | Impacto |
|------|-----------|---------|
| Batch queries N+1 (ranking Copa 12→1 query) | Alta | ~1.2s → ~150ms |
| Dividir `JogoService` (1087 linhas → 4 services) | Média | Manutenibilidade |
| Extrair `ProcessamentoPontuacaoService` do `RankingService` | Média | SRP |
| Tipar interfaces de repository (remover `any`) | Média | Type safety |
| Refatorar `grupos/[grupoId]/page.tsx` (complexidade 45) | Média | Sonar |
| Unificar `card-proximo-jogo-copa` com `card-proximos-jogos` | Baixa | DRY |

### Validação
- ✅ 487 testes backend passando (`npx vitest run`)
- ✅ `tsc --noEmit` sem erros (frontend)
- ✅ Diagnostics limpos em todos arquivos editados


## Sessão 6 — Mata-Mata Copa do Mundo 2026

### Objetivo
Preparar a ferramenta para as fases eliminatórias da Copa. Implementar navegação por fase, preenchimento automático de chaveamento e palpites bloqueados para jogos sem times definidos.

---

### Backend — ChaveamentoService (novo)

**Arquivo:** `src/modules/jogos/services/chaveamento.service.ts`

Responsabilidade única: preencher automaticamente os times nos jogos de fases eliminatórias conforme os grupos são finalizados.

**Fluxo:**
1. Sync finaliza jogo de grupo → detecta que status mudou para FINALIZADO
2. `JogoService.sincronizarPlacares` dispara `chaveamentoService.preencherProximaFaseEliminatoria()`
3. `ChaveamentoService` busca jogos com time "TBD" (1 query otimizada)
4. Tenta preencher via API do GE (match por horário)
5. Fallback: calcula classificação dos grupos finalizados e resolve posições do chaveamento FIFA

**Métodos públicos:**
- `preencherProximaFaseEliminatoria(temporadaId, config)` — genérico, funciona para qualquer fase

**Logs consolidados:**
```
[ChaveamentoService] 🔄 16 Avos de Final: 15 jogos pendentes
[ChaveamentoService] 📊 Grupos completos: Grupo A, Grupo B, Grupo C, Grupo E
[ChaveamentoService] 🏆 R1: AFS x CAN | R2: BRA x 2ºF | R3: ALE x 3º ABCDF | R5: CDM x 2ºI | ...
```

### Backend — Constantes novas

**`COPA_CHAVEAMENTO_16AVOS`** — mapa fixo do chaveamento FIFA (rodada → posição casa/fora)
**`COPA_FASES_ELIMINATORIAS`** — metadata de cada fase (nome, slug, totalJogos, origem)
**`COPA_FASES.SEGUNDA_FASE`** — slug correto da API do GE (`segunda-fase-copa-do-mundo-2026`)

### Backend — Alterações no JogoService

- Adicionada injeção do `ChaveamentoService`
- Pós-sync: se algum jogo foi finalizado, dispara `preencherProximaFaseEliminatoria`
- `processarJogoSync`: lógica de match por horário para jogos sem `externoId` (criados manualmente)
- `detectarEAtualizarTimes`: atualiza `timeCasaId`/`timeForaId` quando API substitui placeholder por time real
- `buscarPendentesSync`: removido filtro `externoId: { not: null }` para incluir jogos manuais

### Backend — Novo método no repositório

- `buscarJogosComTimePlaceholder(temporadaId, placeholderTimeId)` — 1 query com `include: { fase: true, timeCasa: true, timeFora: true }`, ordenado por `fase.ordem`

### Backend — Renomeações

| Antes | Depois | Motivo |
|-------|--------|--------|
| `32 Avos de Final` | `16 Avos de Final` | Copa 2026 tem 32 times na fase eliminatória = 16 jogos |
| `TRINTA_E_DOIS_AVOS` | `SEGUNDA_FASE` | Slug da API do GE é `segunda-fase-copa-do-mundo-2026` |
| `32avos-de-final-copa-do-mundo-2026` | `segunda-fase-copa-do-mundo-2026` | Alinhamento com API |

### Backend — Sincronização automática

- Agora detecta jogos da fase "16 Avos de Final" (sem `externoId`) e tenta parear com API do GE por horário
- Quando a API do GE publicar os jogos, vincula `externoId` automaticamente para syncs futuras
- Resolução de mapeamento: nome "16 avos" no banco → slug "segunda-fase" na API

### Backend — Testes

**Novo:** `test/modules/jogos/chaveamento.service.spec.ts` (7 testes)
1. ✅ Não faz nada sem fase eliminatória
2. ✅ Não faz nada se todos os times já estão definidos
3. ✅ Preenche 1º do grupo via classificação
4. ✅ Preenche 2º do grupo via classificação
5. ✅ Não preenche se grupo incompleto (< 6 jogos)
6. ✅ Prioriza API do GE antes da classificação
7. ✅ Fallback para classificação quando API falha

---

### Frontend — AbaJogosCopa (reescrito)

**Arquivo:** `src/components/palpites/aba-jogos-copa.tsx`

**Antes:** Navegação fixa por rodada (1, 2, 3) — só funcionava para fase de grupos.

**Depois:** Navegação por fase ativa com 2 modos:
- **Fase de grupos**: navegação por rodada (← 1 | 2 | 3 →) + barra de progresso
- **Fase eliminatória**: lista de todos os jogos da fase + barra de progresso

**Lógica de fases ativas:**
- Detecta automaticamente quais fases têm jogos
- Fase de grupos aparece se tem jogos não finalizados
- Fases eliminatórias aparecem se têm jogos importados
- Próxima fase aparece como "em breve" quando a anterior já tem finalizados

**Palpites bloqueados:**
- Jogos de mata-mata com time "TBD": input desabilitado (bloqueado)
- Sem overlay/blur — card visível normalmente, só input travado

**Labels de posição (em vez de "TBD"):**
- Quando time é placeholder, mostra posição do chaveamento: "1ºC", "2ºF", "3º ABCDF"
- Nome do time: "A definir"
- Mapa `CHAVEAMENTO_16AVOS` no frontend resolve rodada → posição

**Barra de progresso:**
- Baseada em TODOS os jogos da rodada/fase (incluindo finalizados)
- Não diminui conforme jogos terminam
- Mostra `X/24` para grupos ou `X/16` para eliminatórias

### Frontend — Types atualizados

- `jogo.types.ts`: slug da fase 16 avos atualizado para `segunda-fase-copa-do-mundo-2026`, `maxRodadas: 16`

---

### Banco de dados

| Alteração | Descrição |
|-----------|-----------|
| Fase renomeada | "32 Avos de Final" → "16 Avos de Final" |
| Time placeholder criado | id: `00000000-...0001`, sigla: "TBD", nome: "A Definir" |
| 16 jogos criados | Fase "16 Avos de Final" com datas/horários da FIFA, times definidos + TBD |

### Jogos criados (16 Avos):

| R | Casa | Fora | Data (BRT) |
|---|------|------|------------|
| 1 | AFS | CAN | 28/06 16h |
| 2 | BRA | TBD (2ºF) | 29/06 14h |
| 3 | ALE | TBD (3º) | 29/06 17:30 |
| 4 | TBD (1ºF) | MAR | 29/06 22h |
| 5 | CDM* | TBD (2ºI) | 30/06 14h |
| 6-16 | ... | ... | 30/06 - 04/07 |

*CDM preenchido automaticamente pelo chaveamento (2ºE = Costa do Marfim)

---

### Steering atualizado

**`coding-conventions.md`** — Seção "Qualidade de Código" reforçada:
- Zero errors obrigatório (não "corrigir corrigíveis")
- NUNCA aninhar ifs (regra explícita)
- getDiagnostics ANTES de declarar pronto
- Protocolo de Validação em 5 passos obrigatório em toda entrega

---

### Teste real (validação em produção local)

**Às 19:14 BRT** a sync automática detectou:
```
[SYNC] copa-do-mundo-2026 R3 | 1/17 atualizados | EQU 2x1 ALE (🏁)
[SYNC] 🏆 1 jogo(s) finalizado(s) — disparando preenchimento de chaveamento
[ChaveamentoService] 📊 Grupos completos: Grupo A, Grupo B, Grupo C, Grupo E
[ChaveamentoService] ✅ Jogo R5 atualizado no banco
```

Resultado: R5 preenchido com CDM (2º do Grupo E) automaticamente.

---

### Validação final

| Check | Resultado |
|-------|-----------|
| getDiagnostics (10 arquivos) | ✅ 0 errors |
| Testes backend | ✅ 45 suites, 494 testes |
| Frontend TSC | ✅ 0 erros |
| Container Docker | ✅ Rodando com sync ativa |
| Ifs aninhados | ✅ Zero nos arquivos criados |
| Tipagem | ✅ ChaveamentoService 100% tipado |

---

### Próximos passos (mata-mata)

1. Quando todos os grupos terminarem → 3ºs colocados serão definidos pela API do GE
2. Quando API do GE publicar jogos de `segunda-fase` → sync vincula `externoId` e atualiza times
3. Criar jogos de Oitavas de Final quando os 16 avos começarem a finalizar
4. Dividir `JogoService` em services menores (dívida técnica — 1000+ linhas)
5. Tipar interfaces de repository (remover `any` herdado)

### Regra de negócio: Visibilidade de palpites por status do jogo

**Antes do jogo iniciar** (AGENDADO/ADIADO):
- Palpites dos membros do grupo: mostrar apenas "Palpitou ✓" ou "Não palpitou" (sem revelar placar)
- Palpite do próprio usuário: visível nos inputs editáveis
- Badge "Meu Palpite: X × Y" abaixo do countdown: removido (redundante com inputs)

**Depois do jogo iniciar** (EM_ANDAMENTO/FINALIZADO):
- Placares de todos os membros são revelados
- Placar real do jogo substitui os inputs
- Badge "Meu Palpite: X × Y" reaparece (já que inputs não existem mais)

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `lista-palpites-membros.tsx` | Adicionado `jogoIniciado` — mostra placar só quando jogo começou, senão mostra badge "Palpitou ✓" |
| `card-proximos-jogos.tsx` | Badge "Meu Palpite" abaixo do countdown: só aparece quando `aoVivo` |
| `card-proximos-jogos.tsx` | Batch de palpites via `buscarMeusPalpitesPorJogos` para todos os jogos simultâneos |
| `card-proximos-jogos.tsx` | `JogoSimultaneo` recebe `meuPalpite` via prop (do batch) em vez de `null` fixo |
| `usePalpiteCard.ts` | Adicionado `useQuery` interno — busca palpite do servidor quando `palpiteInicial === undefined` |
| `usePalpiteCard.ts` | Distinção: `undefined` = buscar, `null` = não existe, objeto = usar direto |
| `useHomeData.ts` | Home mostra todos os jogos simultâneos (removido filtro `EM_ANDAMENTO` only) |
| `aba-dashboard-copa.tsx` | Mensagem "Nenhum jogo agendado" condicionada a `!carregandoDados` |
| `secao-copa-do-mundo.tsx` | Tab "Jogos" condicionada a `!carregandoJogos` (evita flash de empty state) |

### Padrões documentados no steering `coding-conventions.md`

- **Visibilidade de Palpites** — regra completa de quando revelar/esconder placares
- **Estados Vazios** — NUNCA mostrar empty state antes de finalizar requests
- **Hook `usePalpiteCard`** — semântica de `undefined` vs `null` vs objeto para `palpiteInicial`
- **Jogos Simultâneos na Home** — mostrar todos + batch de palpites
