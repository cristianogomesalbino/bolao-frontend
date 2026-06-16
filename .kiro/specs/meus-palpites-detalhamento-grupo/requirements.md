# Requirements Document

## Introduction

Feature "Meus Palpites - Detalhamento por Grupo" adiciona contexto de grupo na aba "Meus Palpites" do app de bolão. Quando o usuário participa de múltiplos grupos para o mesmo campeonato, o sistema exibe qual grupo está ativo e permite trocar. O chevron expandível dos cards de jogo revela informações dos membros do grupo conforme o estado do jogo (antes, durante e após). A pontuação segue um padrão visual unificado em todo o projeto.

## Glossary

- **Aba_Meus_Palpites**: Seção da tela de palpites que exibe o histórico de palpites finalizados do usuário logado, agrupados por rodada
- **Card_Jogo**: Componente visual que representa um jogo, contendo times, placar, horário e chevron de expansão
- **Chevron_Expandido**: Área que se revela ao clicar no ícone chevron do Card_Jogo, exibindo dados dos membros do grupo
- **Grupo_Favorito**: Grupo definido pelo usuário como padrão para exibição de dados quando participa de múltiplos grupos
- **Grupo_Ativo**: Grupo atualmente selecionado para visualização de palpites na aba "Meus Palpites"
- **Membro_Grupo**: Usuário que participa de um grupo de bolão
- **Status_Palpite_Membro**: Indicação se o membro já palpitou ("Palpitou") ou ainda não ("Pendente") para um jogo específico
- **Pontuacao_Padrao**: Formato visual unificado de exibição de pontos: "X ponto(s) {ícone}" onde 🎯 = acerto em cheio (3pts), ⚡ = acerto parcial (1pt), sem ícone = 0pts
- **Tela_Grupos**: Página de listagem/gerenciamento de grupos do usuário (`/grupos`)
- **Sistema_Frontend**: O aplicativo frontend Next.js do bolão

## Requirements

### Requirement 1: Detecção de Conflito de Múltiplos Grupos

**User Story:** Como usuário que participa de mais de um grupo para o mesmo campeonato, quero que o sistema identifique essa situação e exiba o grupo correto, para que meus palpites sejam contextualizados no grupo certo.

#### Acceptance Criteria

1. WHEN o usuário acessa a Aba_Meus_Palpites sem Grupo_Favorito definido e possui 2 ou mais grupos para o mesmo campeonato, THE Sistema_Frontend SHALL exibir um alerta informando que não há grupo favorito definido e redirecionar para a Tela_Grupos
2. WHEN o usuário acessa a Aba_Meus_Palpites com 2 ou mais grupos para o mesmo campeonato e possui Grupo_Favorito definido, THE Sistema_Frontend SHALL selecionar o Grupo_Favorito como Grupo_Ativo
3. WHILE o Grupo_Ativo está selecionado e existem 2 ou mais grupos para o mesmo campeonato, THE Sistema_Frontend SHALL exibir o label do nome do grupo ativo e um botão "Trocar grupo"
4. WHEN o usuário clica no botão "Trocar grupo", THE Sistema_Frontend SHALL exibir um dropdown com a lista de grupos disponíveis para o campeonato selecionado
5. WHEN o usuário seleciona um grupo diferente no dropdown, THE Sistema_Frontend SHALL atualizar o Grupo_Ativo e recarregar os dados de palpites para o novo grupo

### Requirement 2: Cores Padronizadas por Campeonato

**User Story:** Como usuário, quero que os elementos visuais da aba de palpites sigam as cores do campeonato correspondente, para ter uma experiência visual consistente e distinguir facilmente entre campeonatos.

#### Acceptance Criteria

1. WHILE o campeonato selecionado é Brasileirão Série A, THE Sistema_Frontend SHALL aplicar o tema padrão (bordas verdes, textos com cor primária)
2. WHILE o campeonato selecionado é Copa do Mundo, THE Sistema_Frontend SHALL aplicar o tema Copa (bordas douradas #ffdf00, textos em verde #009c3b e dourado)
3. THE Sistema_Frontend SHALL aplicar as cores do campeonato no label do grupo, no botão "Trocar grupo" e nos separadores de rodada da Aba_Meus_Palpites

### Requirement 3: Chevron Expandido — Pré-Jogo

**User Story:** Como participante de um grupo de bolão, quero ver quem já palpitou e quem está pendente antes do jogo começar, sem revelar os placares, para acompanhar o engajamento do grupo.

#### Acceptance Criteria

1. WHEN o usuário expande o chevron de um Card_Jogo com status AGENDADO ou ADIADO, THE Sistema_Frontend SHALL exibir a lista de membros do Grupo_Ativo com Status_Palpite_Membro (Palpitou ou Pendente) para cada membro
2. WHILE o jogo possui status AGENDADO ou ADIADO, THE Chevron_Expandido SHALL ocultar os valores de gols dos palpites de todos os membros (incluindo do próprio usuário)
3. WHEN o usuário expande o chevron de um Card_Jogo pré-jogo, THE Sistema_Frontend SHALL buscar os dados de status dos membros via endpoint de estatísticas do grupo utilizando lazy loading (query habilitada apenas quando expandido)

### Requirement 4: Chevron Expandido — Jogo em Andamento

**User Story:** Como participante de um grupo, quero ver os palpites de todos os membros durante o jogo, para acompanhar quem está mais perto de acertar.

#### Acceptance Criteria

1. WHEN o usuário expande o chevron de um Card_Jogo com status EM_ANDAMENTO, THE Sistema_Frontend SHALL exibir os palpites de todos os membros do Grupo_Ativo com os valores de gols visíveis (golsCasa x golsFora)
2. WHILE o jogo possui status EM_ANDAMENTO, THE Chevron_Expandido SHALL exibir o nome do membro e seu palpite no formato "golsCasa x golsFora"
3. WHEN os dados do Chevron_Expandido são carregados para um jogo EM_ANDAMENTO, THE Sistema_Frontend SHALL buscar os palpites completos dos membros via endpoint de palpites do grupo

### Requirement 5: Chevron Expandido — Jogo Finalizado

**User Story:** Como participante de um grupo, quero ver os palpites de todos com a pontuação obtida após o jogo finalizar, para comparar meu desempenho com o do grupo.

#### Acceptance Criteria

1. WHEN o usuário expande o chevron de um Card_Jogo com status FINALIZADO, THE Sistema_Frontend SHALL exibir os palpites de todos os membros do Grupo_Ativo com valores de gols visíveis e a Pontuacao_Padrao de cada membro
2. WHILE o jogo possui status FINALIZADO, THE Chevron_Expandido SHALL calcular a pontuação de cada membro comparando o palpite com o resultado real do jogo
3. THE Chevron_Expandido SHALL ordenar os membros por pontuação decrescente (acertos em cheio primeiro, depois parciais, depois erros)

### Requirement 6: Padrão Visual de Pontuação

**User Story:** Como usuário, quero que a pontuação seja exibida de forma padronizada em todo o app, para reconhecer rapidamente o tipo de acerto sem confusão.

#### Acceptance Criteria

1. THE Sistema_Frontend SHALL exibir pontuação no formato "X ponto(s) {ícone}" onde X é o valor numérico dos pontos obtidos
2. WHEN a pontuação é 3 (acerto em cheio), THE Sistema_Frontend SHALL exibir o ícone 🎯 após o texto de pontos
3. WHEN a pontuação é 1 (acerto parcial), THE Sistema_Frontend SHALL exibir o ícone ⚡ após o texto de pontos
4. WHEN a pontuação é 0 (erro), THE Sistema_Frontend SHALL exibir o texto "0 pontos" sem ícone adicional
5. THE Sistema_Frontend SHALL utilizar o componente de Pontuacao_Padrao em todas as telas que exibem pontuação: Chevron_Expandido finalizado, Card_Palpite_Historico e Card_Ranking

### Requirement 7: Alerta de Grupo Favorito Ausente

**User Story:** Como usuário sem grupo favorito definido, quero ser informado e redirecionado para resolver a situação, para que minha experiência na aba de palpites funcione corretamente.

#### Acceptance Criteria

1. WHEN o usuário acessa a Aba_Meus_Palpites sem Grupo_Favorito definido e possui apenas 1 grupo, THE Sistema_Frontend SHALL selecionar automaticamente o único grupo como Grupo_Ativo sem exibir alerta
2. WHEN o usuário acessa a Aba_Meus_Palpites sem Grupo_Favorito definido e possui 0 grupos, THE Sistema_Frontend SHALL exibir um estado vazio convidando o usuário a entrar em um grupo
3. WHEN o alerta de grupo favorito ausente é exibido, THE Sistema_Frontend SHALL apresentar um botão que redireciona para a Tela_Grupos com mensagem explicativa "Defina seu grupo favorito para ver seus palpites"
