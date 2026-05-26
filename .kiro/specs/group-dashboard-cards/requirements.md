# Requirements Document

## Introduction

Este documento define os requisitos para os cards do painel de detalhes de grupo no aplicativo de bolão esportivo. O objetivo é melhorar os cards existentes (Ranking e Sua Posição) e criar novos cards (Atividade Recente, Rival Direto, Status da Rodada e Aproveitamento) para aumentar o engajamento, competitividade e experiência visual dos usuários na página de detalhes do grupo.

## Glossary

- **Card_Ranking**: Componente visual que exibe a classificação dos membros do grupo com pódio top 3 e lista compacta dos demais participantes
- **Card_Posicao**: Componente visual que exibe a posição atual do usuário logado no ranking do grupo com destaque visual
- **Card_Atividade**: Componente visual que exibe um feed compacto de atividades recentes dos membros do grupo
- **Card_Rival**: Componente visual que exibe a comparação direta entre o usuário logado e o rival imediatamente acima no ranking
- **Card_Status_Rodada**: Componente visual que exibe o progresso da rodada atual com contagem de jogos e countdown
- **Card_Aproveitamento**: Componente visual que exibe as estatísticas de desempenho do usuário (acertos, erros, percentual)
- **Sistema_Frontend**: A aplicação Next.js que renderiza os cards consumindo dados da API REST
- **API_Backend**: A API NestJS que fornece os dados de ranking, jogos, palpites e atividades
- **Usuario_Logado**: O membro autenticado que está visualizando a página de detalhes do grupo
- **Ranking_Entry**: Objeto retornado pela API contendo posicao, usuarioId, nomeUsuario, pontuacaoTotal, acertosEmCheio, acertosDeResultado, acertosDeGolsUmTime, errosTotais
- **Variacao_Posicao**: Diferença entre a posição do usuário na rodada anterior e a posição atual (positivo = subiu, negativo = desceu)
- **Sequencia_Pontuacao**: Número de rodadas consecutivas em que o usuário obteve pontos

## Requirements

### Requirement 1: Card Ranking — Destaque do Usuário Logado

**User Story:** As a membro do grupo, I want to ver minha posição destacada no ranking, so that I can quickly identify where I stand among other members.

#### Acceptance Criteria

1. WHEN the Card_Ranking renders the ranking list, THE Sistema_Frontend SHALL highlight the Usuario_Logado entry with a distinct glow border, background differentiation, and a "Você" badge
2. WHEN the Usuario_Logado is not in the visible top entries, THE Sistema_Frontend SHALL display the Usuario_Logado entry in a fixed position below the visible list with the same highlight treatment
3. THE Card_Ranking SHALL display the distance in points between the Usuario_Logado and the leader in the format "{N} pts atrás do líder"
4. WHEN the Usuario_Logado is the leader, THE Card_Ranking SHALL display "Você é o líder! 🏆" instead of the distance text
5. THE Card_Ranking SHALL display a real-time update note "Pontuação atualizada em tempo real" at the bottom of the card

### Requirement 2: Card Ranking — Pódio Visual Aprimorado

**User Story:** As a membro do grupo, I want to see an engaging podium visualization for the top 3, so that the competitive aspect feels more exciting.

#### Acceptance Criteria

1. THE Card_Ranking SHALL display the top 3 members in a podium layout with the 1st place avatar larger (56x56px) than 2nd and 3rd place avatars (48x48px)
2. THE Card_Ranking SHALL display medal emojis for the top 3 positions: 🥇 for 1st, 🥈 for 2nd, 🥉 for 3rd
3. THE Card_Ranking SHALL display circular avatars with the first letter of the user name, points total, and Variacao_Posicao indicator (↑ +N in green, ↓ -N in red) for each podium entry
4. WHEN the ranking has fewer than 3 members, THE Card_Ranking SHALL skip the podium visualization and display all members in the compact list format

### Requirement 3: Card Ranking — Lista Compacta com Variação

**User Story:** As a membro do grupo, I want to see position changes for all ranked members, so that I can track movement in the group.

#### Acceptance Criteria

1. THE Card_Ranking SHALL display members ranked 4th and below in a compact list with: small avatar (28x28px), name, points, and Variacao_Posicao indicator
2. WHEN a member has a positive Variacao_Posicao, THE Card_Ranking SHALL display a green upward arrow with the number of positions gained (e.g., "↑ 2")
3. WHEN a member has a negative Variacao_Posicao, THE Card_Ranking SHALL display a red downward arrow with the number of positions lost (e.g., "↓ 1")
4. WHEN a member has zero Variacao_Posicao, THE Card_Ranking SHALL display a neutral dash indicator
5. THE Card_Ranking SHALL avoid administrative table styling, excess horizontal lines, and excessive empty space

### Requirement 4: Card Sua Posição — Visual Aprimorado

**User Story:** As a membro do grupo, I want to see my position with more visual impact and context, so that I feel motivated to compete.

#### Acceptance Criteria

1. THE Card_Posicao SHALL display the current position as a large prominent number (text-5xl or equivalent)
2. THE Card_Posicao SHALL display total points, distance from leader in points, and a progress bar comparing the Usuario_Logado points with the leader points
3. WHEN the progress bar renders, THE Card_Posicao SHALL fill it proportionally as (usuario_pontos / lider_pontos * 100) percent with green color
4. THE Card_Posicao SHALL display the Variacao_Posicao for the current round (e.g., "↑ +2 subiu 2 posições" or "↓ -1 desceu 1 posição")
5. THE Card_Posicao SHALL display the Sequencia_Pontuacao with a fire emoji (e.g., "🔥 5 rodadas pontuando")
6. WHEN the Usuario_Logado has zero Sequencia_Pontuacao, THE Card_Posicao SHALL omit the streak indicator

### Requirement 5: Card Atividade Recente — Feed de Atividades

**User Story:** As a membro do grupo, I want to see recent social activity in my group, so that I feel connected and engaged with other members.

#### Acceptance Criteria

1. THE Card_Atividade SHALL display a compact feed of recent group events in chronological order (most recent first)
2. THE Card_Atividade SHALL support the following event types: member made predictions, member rose in ranking, member got exact score, leader changed
3. WHEN displaying an event, THE Card_Atividade SHALL show: small avatar (24x24px), contextual icon per event type, descriptive text in Portuguese, and relative time (e.g., "há 2h", "há 15min")
4. THE Card_Atividade SHALL display a maximum of 5 events to maintain compact vertical space
5. WHEN no recent activity exists, THE Card_Atividade SHALL display a placeholder message "Nenhuma atividade recente"
6. THE Card_Atividade SHALL consume data from a new backend endpoint `GET /grupos/:grupoId/atividade-recente`

### Requirement 6: Card Atividade Recente — Endpoint Backend

**User Story:** As a developer, I want a backend endpoint that provides recent group activity, so that the frontend can display real activity data.

#### Acceptance Criteria

1. THE API_Backend SHALL expose a `GET /grupos/:grupoId/atividade-recente` endpoint that returns the 10 most recent activity events for the group
2. THE API_Backend SHALL track the following event types: PALPITES_FEITOS (member made predictions), SUBIU_RANKING (member rose in ranking), ACERTO_EM_CHEIO (member got exact score), LIDER_MUDOU (leader changed)
3. WHEN the endpoint is called, THE API_Backend SHALL return events with: id, tipo, usuarioId, nomeUsuario, descricao, criadoEm fields
4. THE API_Backend SHALL restrict access to the endpoint to authenticated group members (ADMIN or MEMBER role)
5. IF the grupoId does not exist, THEN THE API_Backend SHALL return a 404 error with GrupoNaoEncontradoError

### Requirement 7: Card Rival Direto

**User Story:** As a membro do grupo, I want to see a direct comparison with my closest rival, so that I feel motivated by the competition.

#### Acceptance Criteria

1. THE Card_Rival SHALL display the Usuario_Logado and the rival immediately above in the ranking in a VS confrontation layout
2. THE Card_Rival SHALL display large avatars (48x48px) for both users with a "VS" indicator in the center
3. THE Card_Rival SHALL display the point difference between the rival and the Usuario_Logado (e.g., "Lucas está 3 pts na frente")
4. THE Card_Rival SHALL use a sporty, competitive visual style with bold typography and confrontation-oriented layout
5. WHEN the Usuario_Logado is in 1st place, THE Card_Rival SHALL display the rival immediately below with the text "N pts atrás de você"
6. WHEN the group has only 1 member, THE Card_Rival SHALL not render

### Requirement 8: Card Status da Rodada

**User Story:** As a membro do grupo, I want to see the current round progress at a glance, so that I know how the round is evolving.

#### Acceptance Criteria

1. THE Card_Status_Rodada SHALL display the current round number and its status (em andamento, encerrada, or aguardando)
2. THE Card_Status_Rodada SHALL display the count of finished games vs total games in the round (e.g., "24/38 jogos encerrados")
3. THE Card_Status_Rodada SHALL display a horizontal progress bar representing (jogos_finalizados / total_jogos * 100) percent with green fill and soft glow
4. THE Card_Status_Rodada SHALL display a countdown timer to the next game closing time in the format "HH:MM:SS"
5. WHEN all games in the round are finished, THE Card_Status_Rodada SHALL display status "Encerrada" and hide the countdown
6. THE Card_Status_Rodada SHALL combine data from the existing `GET /grupos/:grupoId/painel-rodada/:faseId` and `GET /fases/:faseId/jogos` endpoints

### Requirement 9: Card Aproveitamento

**User Story:** As a membro do grupo, I want to see my performance statistics, so that I can track my prediction accuracy over time.

#### Acceptance Criteria

1. THE Card_Aproveitamento SHALL display the hit percentage calculated as ((acertosEmCheio + acertosDeResultado + acertosDeGolsUmTime) / total_jogos_com_palpite * 100) percent
2. THE Card_Aproveitamento SHALL display individual counts for: exact scores (acertosEmCheio), correct results (acertosDeResultado), partial hits (acertosDeGolsUmTime), and errors (errosTotais)
3. THE Card_Aproveitamento SHALL display a simple circular chart (donut/ring) representing the hit percentage with green fill
4. THE Card_Aproveitamento SHALL use data from the existing ranking endpoint (Ranking_Entry fields) for the Usuario_Logado
5. WHEN the Usuario_Logado has no predictions yet, THE Card_Aproveitamento SHALL display "0%" with a message "Faça palpites para ver seu aproveitamento"

### Requirement 10: Sequência de Pontuação — Endpoint Backend

**User Story:** As a developer, I want the backend to calculate the scoring streak, so that the frontend can display consecutive rounds with points.

#### Acceptance Criteria

1. THE API_Backend SHALL expose scoring streak data as part of the ranking or a dedicated endpoint that returns the number of consecutive recent rounds where the Usuario_Logado scored points
2. THE API_Backend SHALL calculate the streak by checking each round from the most recent backwards, counting consecutive rounds with pontuacaoTotal > 0
3. WHEN the Usuario_Logado scored zero points in the most recent round, THE API_Backend SHALL return a streak of 0
4. THE API_Backend SHALL restrict access to authenticated group members (ADMIN or MEMBER role)

### Requirement 11: Design System Compliance

**User Story:** As a designer, I want all cards to follow the established design system, so that the UI remains consistent and polished.

#### Acceptance Criteria

1. THE Sistema_Frontend SHALL render all cards with dark mode glassmorphism style: bg-white/[0.03] background with backdrop-blur
2. THE Sistema_Frontend SHALL use the primary green color (#16a34a) for highlights, progress bars, and active states
3. THE Sistema_Frontend SHALL use Lucide React icons for all iconography within the cards
4. THE Sistema_Frontend SHALL render all cards within a mobile-first layout with max-width of 480px
5. THE Sistema_Frontend SHALL use font-semibold or font-bold for card headers and text-sm for body content
6. THE Sistema_Frontend SHALL display all UI text in Portuguese Brazilian
7. THE Sistema_Frontend SHALL use TanStack Query for all data fetching with appropriate staleTime and caching strategies

### Requirement 12: Data Integrity

**User Story:** As a user, I want to see real data from the API in all cards, so that I can trust the information displayed.

#### Acceptance Criteria

1. THE Sistema_Frontend SHALL consume real data from the API_Backend for all cards without using mock or hardcoded data
2. WHEN an API request fails, THE Sistema_Frontend SHALL display a graceful error state within the affected card without crashing the page
3. WHEN data is loading, THE Sistema_Frontend SHALL display skeleton loading states within each card
4. THE Sistema_Frontend SHALL use TanStack Query cache invalidation to keep ranking and activity data fresh
