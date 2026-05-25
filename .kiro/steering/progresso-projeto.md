---
inclusion: auto
---

# Progresso do Projeto — Bolão Frontend

## Status Atual

Branch ativa: `feature/grupos` (não mergeada ainda)
Última branch mergeada: `feature/perfil-usuario` → develop
Branch documentação: `feature/solicitacao-entrada-grupo` (spec completa, não implementada)

## Módulos Implementados

### 1. Autenticação ✅ (mergeado em develop)
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

### 2. Perfil / Minha Conta ✅ (mergeado em develop)
- Rota: `/minha-conta`
- Editar nome e email
- Alterar senha com indicador de força
- Excluir conta com confirmação em 2 passos
- Header sticky com blur
- Avatar com iniciais

### 3. Home ✅ (na branch feature/grupos)
- Header com "Olá, Cristiano 👋" + avatar com iniciais
- Card próximo jogo com escudos reais
- Card meus grupos (dados reais via `GET /grupos?membro=true`)
- Card ranking (mock com medalhas)
- Card próximos jogos (lista compacta)
- Bottom navigation (Home, Grupos, Jogos, Conta)

### 4. Grupos ✅ (na branch feature/grupos)

#### Listagem (`/grupos`)
- Cards com ícone temático (bola/escudo/troféu), participantes, rodada, status
- Borda verde vibrante (primaria-claro)
- Header: troféu com glow, título "Meus Grupos", badge contador, botão entrar/criar
- Subtítulo "Acompanhe seus bolões e dispute com seus amigos"
- Estado vazio, loading skeleton, tratamento de erro
- Formulário entrar por código de convite
- Dados reais via `GET /grupos?membro=true`

#### Detalhes do grupo (`/grupos/[grupoId]`)
- Header: avatar com inicial, nome + coroa, privado/membros, código de convite (copiar), engrenagem
- Card próximo jogo: escudos grandes, data (Hoje/Amanhã/data), horário, VS, rodada
  - Histórico últimos 5 jogos (V/E/D badges coloridos) — mock
  - Countdown "Fecha em" (1 min antes do jogo, tempo real)
  - Detecção de jogo adiado (status ADIADO): badge "Adiado", "--:--", "A definir"
  - Badge "⚠ ATRASADO" quando há jogos adiados na temporada
  - Botão "Fazer palpite" (esconde quando encerrado/adiado)
  - Colocação dos times (Xº colocado) — mock
- Banner "Há jogos atrasados • Ver todos >" → navega para `/grupos/[grupoId]/jogos-adiados`
- Card "Sua Posição": posição, pontos, pts atrás do líder (dados reais do ranking)
- Card "Ranking Geral": pódio top 3 + lista 4+, dropdown "Geral" (dados reais via `GET /grupos/:grupoId/ranking/geral`)
- Card "Atividade Recente" — mock
- Timezone: `America/Sao_Paulo` forçado na formatação de datas

#### Jogos adiados (`/grupos/[grupoId]/jogos-adiados`)
- Lista jogos com status ADIADO e AGENDADO
- Escudos, badge "Adiado", rodada original
- Contador no header

#### Palpites (`/grupos/[grupoId]/palpites`)
- Seletor de fase/rodada com setas ← →
- Lista de jogos: escudo, horário ou placar, status adiado
- Botão "Palpitar" para jogos agendados

#### Configurações (`/grupos/[grupoId]/configuracoes`)
- Editar grupo → navega para edição
- Gerar novo convite → navega para convite
- Membros inline: avatar, nome, badge Admin, status online, menu 3 pontinhos
  - Tornar admin / Remover admin / Remover membro
  - Endpoints: `PATCH /grupos/:grupoId/usuarios/:usuarioId/cargo` com `{ role: 'ADMIN' | 'MEMBER' }`
- Zona de perigo colapsável: excluir grupo com confirmação
- Validação de acesso: se não é membro, mostra "Você não tem acesso"

#### Editar grupo (`/grupos/[grupoId]/editar`)
- 4 seções em cards: Aparência, Participantes, Privacidade, Regras do bolão
- Seletor de ícone/avatar (12 emojis temáticos)
- Nome do grupo, stepper participantes (botões circulares)
- Toggle privado, toggles palpite automático/dobrado
- Botão "Salvar alterações" fixo no bottom
- Títulos de seção: uppercase, tracking largo, verde claro

#### Código de convite (`/grupos/[grupoId]/convite`)
- Código grande com borda gradiente verde
- Glow no canto superior esquerdo
- Botões copiar/compartilhar
- "Gerar novo código" com confirmação (`PATCH /grupos/:grupoId/regenerar-convite`)

#### Criar grupo (`/grupos/criar`)
- Hero cinematográfico com glow e imagem decorativa
- Card com borda gradiente
- Formulário: nome, temporada (select), stepper, toggle privado, config avançada

### 5. Admin (temporário)
- Rota: `/admin/importar`
- Importar jogos da API do GE

## Services e Endpoints

### grupo.service.ts
- `listarGrupos()` → `GET /grupos?membro=true`
- `listarGruposPublicos(busca?)` → `GET /grupos?privado=false&busca=...`
- `buscarGrupo(grupoId)` → `GET /grupos/:grupoId`
- `criarGrupo(dados)` → `POST /grupos`
- `atualizarGrupo(grupoId, dados)` → `PATCH /grupos/:grupoId`
- `excluirGrupo(grupoId)` → `DELETE /grupos/:grupoId`
- `entrarNoGrupo(codigoConvite)` → `POST /grupos/entrar`
- `listarMembros(grupoId)` → `GET /grupos/:grupoId/membros`
- `adicionarMembro(grupoId, email)` → `POST /grupos/:grupoId/adicionar`
- `sairDoGrupo(grupoId)` → `DELETE /grupos/:grupoId/sair`
- `removerMembro(grupoId, usuarioId)` → `DELETE /grupos/:grupoId/usuarios/:usuarioId`
- `gerarNovoConvite(grupoId)` → `PATCH /grupos/:grupoId/regenerar-convite`
- `promoverAdmin(grupoId, usuarioId)` → `PATCH /grupos/:grupoId/usuarios/:usuarioId/cargo` `{ role: 'ADMIN' }`
- `rebaixarMembro(grupoId, usuarioId)` → `PATCH /grupos/:grupoId/usuarios/:usuarioId/cargo` `{ role: 'MEMBER' }`
- `obterRankingGeral(grupoId)` → `GET /grupos/:grupoId/ranking/geral`
- `obterRankingFase(grupoId, faseId)` → `GET /grupos/:grupoId/ranking/fases/:faseId`

### jogo.service.ts
- `listarFases(temporadaId)` → `GET /temporadas/:temporadaId/fases`
- `listarJogosFase(faseId, rodada?, status?)` → `GET /fases/:faseId/jogos?rodada=&status=`
- `buscarProximoJogo(temporadaId)` — busca próximo jogo futuro ou adiado
- `contarJogosAdiados(temporadaId)` — conta jogos com status ADIADO
- `buscarProximosJogos()` — mock para agenda semanal

## Tipos Importantes

### grupo.types.ts
- `Grupo` (com totalParticipantes, palpitesRestantes, rodadaAtual, rodadaAberta)
- `MembroGrupo` (role: ADMIN | MEMBER, usuario?)
- `RankingEntry` (posicao, usuarioId, nomeUsuario, pontuacaoTotal, acertos...)

### jogo.types.ts
- `StatusJogo` = 'AGENDADO' | 'EM_ANDAMENTO' | 'FINALIZADO' | 'CANCELADO' | 'ADIADO'
- `Fase` (id, nome, tipo, ordem)
- `Jogo` (com timeCasa?, timeFora? incluindo nome, sigla, escudo)

## Infraestrutura

### Docker
- `docker-compose.yml` com profiles dev/prod
- Script `dev` (sh dev start-dev, stop, logs, npm, npx)
- Porta: 3003 (backend na 3002)

### PWA
- manifest.json (Bolão, standalone, verde)
- Ícones SVG placeholder

### Design System
- Tailwind CSS v4 (configuração via @theme no CSS)
- Paleta: fundo #0B1020, texto #f1f5f9, primaria #16a34a, primaria-claro #22d35e
- Cards: glassmorphism (bg-white/[0.03], backdrop-blur, border-white/[0.12])
- Botão principal: gradient verde, glow, hover lift
- Bottom nav: flutuante, rounded-2xl, backdrop-blur-2xl
- Ícones: Lucide React
- Animações: fadeIn, shake (definidas em globals.css)
- Timezone: sempre `America/Sao_Paulo` para datas de jogos

## Specs Documentadas (não implementadas)

### feature/solicitacao-entrada-grupo
- Branch: `feature/solicitacao-entrada-grupo`
- Requisitos: pesquisa grupos públicos, envio solicitação, aprovação/rejeição admin, notificação
- Design: endpoints backend + componentes frontend + testes
- Tasks: 17 grupos de tarefas (backend → frontend → testes)

## Problemas Conhecidos

- Horário dos jogos: backend salva BRT como UTC (3h a menos). Fix pendente na importação
- Escudos: qualidade depende da URL fonte (alguns são baixa resolução)
- Dados mock: colocação dos times, histórico V/E/D, atividade recente
- `[&_svg]:size-4` no Button component limita tamanho de ícones — usar `[&_svg]:size-X` para override

## Próximos Passos

1. Mergear feature/grupos em develop
2. Implementar tela de fazer palpite (formulário com placar)
3. Conectar dados reais: colocação times, histórico V/E/D, atividade recente
4. Implementar feature solicitação de entrada (branch separada)
5. Login com Google (OAuth)
6. Testes E2E com Playwright
