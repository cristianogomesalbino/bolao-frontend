# Requirements Document

## Introduction

Tour de onboarding interativo para guiar novos usuários pelo app de bolão. A feature utiliza tours contextuais por página (Dashboard, Grupo, Palpites, Ranking) com a biblioteca react-joyride, persistência de progresso no backend via array de IDs de tours completos, e possibilidade de refazer tours a qualquer momento através de um botão acessível no header.

## Glossary

- **Sistema_Tour**: Módulo frontend responsável por orquestrar a exibição, controle de estado e interação dos tours de onboarding usando react-joyride.
- **Servico_Tour_Backend**: Endpoint do backend responsável por persistir e retornar o progresso de tours completados pelo usuário (campo `toursCompletos` no model Usuario).
- **Tour**: Sequência de steps interativos que guiam o usuário por funcionalidades de uma página específica do app.
- **Step**: Elemento individual dentro de um tour que destaca um componente da interface e exibe instrução contextual.
- **Tour_ID**: Identificador único de cada tour contextual (ex: `tour-dashboard`, `tour-grupo`, `tour-palpites`, `tour-ranking`).
- **Tours_Completos**: Array de Tour_IDs armazenado no perfil do usuário indicando quais tours já foram visualizados.
- **Hook_useTour**: Hook customizado React que gerencia o ciclo de vida de um tour específico (verificação de conclusão, início, controle de steps, marcação como completo).
- **Botao_Refazer_Tour**: Elemento de interface acessível no header das páginas protegidas que permite ao usuário reiniciar tours.

## Requirements

### Requirement 1: Exibição automática do tour no primeiro acesso

**User Story:** Como um novo usuário, eu quero ser guiado automaticamente pelas funcionalidades da página ao acessá-la pela primeira vez, para que eu entenda como usar o app sem precisar de ajuda externa.

#### Acceptance Criteria

1. WHEN o usuário acessa uma página que possui tour configurado AND o Tour_ID correspondente não está presente no array Tours_Completos, THE Sistema_Tour SHALL exibir o tour automaticamente após a renderização completa da página (elementos-alvo presentes no DOM).
2. WHEN o usuário acessa uma página que possui tour configurado AND o Tour_ID correspondente está presente no array Tours_Completos, THE Sistema_Tour SHALL não exibir o tour automaticamente.
3. WHILE o tour está sendo exibido, THE Sistema_Tour SHALL destacar o elemento alvo de cada step com overlay escurecido ao redor, deixando apenas o elemento-alvo visível sem escurecimento.
4. WHILE o tour está sendo exibido, THE Sistema_Tour SHALL exibir um tooltip estilizado com o design system do app (glassmorphism, paleta de cores) posicionado adjacente ao elemento-alvo.
5. IF os dados do usuário (array Tours_Completos) ainda não foram carregados quando a página renderiza, THEN THE Sistema_Tour SHALL aguardar o carregamento antes de decidir se exibe o tour.

### Requirement 2: Navegação e controle dentro do tour

**User Story:** Como um usuário, eu quero navegar entre os steps do tour e poder encerrá-lo a qualquer momento, para que eu tenha controle sobre a experiência de onboarding.

#### Acceptance Criteria

1. WHILE o tour está ativo, THE Sistema_Tour SHALL exibir um botão "Próximo" em todos os steps exceto o último, e um botão "Anterior" em todos os steps exceto o primeiro.
2. WHILE o tour está ativo, THE Sistema_Tour SHALL exibir um botão "Pular" em todos os steps que permite encerrar o tour antes de completá-lo.
3. WHEN o usuário clica em "Pular", THE Sistema_Tour SHALL remover o overlay e o tooltip da interface, restaurar o foco ao elemento que estava ativo antes do tour, e marcar o Tour_ID como completo no array Tours_Completos.
4. WHEN o usuário chega ao último step do tour, THE Sistema_Tour SHALL exibir um botão "Concluir" em vez de "Próximo".
5. WHEN o usuário clica em "Concluir" no último step, THE Sistema_Tour SHALL remover o overlay e o tooltip da interface, restaurar o foco ao elemento que estava ativo antes do tour, e marcar o Tour_ID como completo no array Tours_Completos.
6. WHILE o tour está ativo, THE Sistema_Tour SHALL permitir navegação entre steps e acionamento dos botões via teclado (Tab para foco, Enter/Space para ativar, Escape para encerrar o tour).
7. IF o elemento alvo de um step não está visível ou não existe no DOM, THEN THE Sistema_Tour SHALL avançar automaticamente para o próximo step disponível, ou encerrar o tour caso não haja mais steps válidos.
8. WHILE o tour está ativo, THE Sistema_Tour SHALL exibir um indicador de progresso mostrando o step atual e o total de steps do tour (ex: "2 de 5").

### Requirement 3: Step final com referência ao botão de refazer

**User Story:** Como um usuário, eu quero saber onde fica o botão para refazer o tour, para que eu possa revisitar as instruções quando precisar.

#### Acceptance Criteria

1. THE Sistema_Tour SHALL incluir como último step de cada tour um step cujo target é o Botao_Refazer_Tour no header, com tooltip informando que o usuário pode clicar nesse botão para refazer o tour a qualquer momento.
2. WHEN o último step é exibido, THE Sistema_Tour SHALL aplicar o spotlight do react-joyride sobre o Botao_Refazer_Tour, utilizando o mesmo mecanismo de overlay escurecido dos demais steps.
3. IF o Botao_Refazer_Tour não estiver visível no DOM quando o último step for ativado, THEN THE Sistema_Tour SHALL aguardar até 3 segundos pela renderização do elemento antes de avançar para o encerramento do tour sem exibir o step final.

### Requirement 4: Botão de refazer tour

**User Story:** Como um usuário, eu quero poder refazer tours a qualquer momento, para que eu possa relembrar funcionalidades que esqueci.

#### Acceptance Criteria

1. THE Sistema_Tour SHALL exibir o Botao_Refazer_Tour no header das páginas protegidas com ícone de ajuda (?).
2. WHEN o usuário clica no Botao_Refazer_Tour e a página atual possui mais de um tour disponível, THE Sistema_Tour SHALL exibir uma lista com os nomes dos tours disponíveis para a página atual em até 500ms.
3. WHEN o usuário clica no Botao_Refazer_Tour e a página atual possui exatamente um tour disponível, THE Sistema_Tour SHALL iniciar esse tour diretamente desde o primeiro step sem exibir menu de seleção.
4. WHEN o usuário seleciona um tour para refazer, THE Sistema_Tour SHALL reiniciar o tour selecionado desde o primeiro step, independente de já estar marcado como completo.
5. WHILE o tour está sendo refeito, THE Sistema_Tour SHALL apresentar os mesmos steps na mesma ordem, com os mesmos elementos-alvo destacados e as mesmas opções de navegação (avançar, voltar, fechar) da primeira execução.
6. IF a página atual não possui nenhum tour disponível, THEN THE Sistema_Tour SHALL manter o Botao_Refazer_Tour em estado desabilitado visualmente com indicação de que não há tours disponíveis.

### Requirement 5: Persistência de progresso no backend

**User Story:** Como um usuário, eu quero que meu progresso de tours seja salvo no servidor, para que eu não veja tours repetidos ao acessar o app em outro dispositivo.

#### Acceptance Criteria

1. WHEN o tour é concluído ou pulado, THE Sistema_Tour SHALL enviar requisição PATCH para `/usuarios/me/tours` com o corpo `{ tourId: "<Tour_ID>" }` correspondente ao tour finalizado.
2. WHEN a requisição PATCH é recebida com um Tour_ID válido, THE Servico_Tour_Backend SHALL adicionar o Tour_ID ao array Tours_Completos do usuário sem remover IDs já existentes e sem criar duplicatas caso o mesmo Tour_ID já esteja presente no array.
3. IF a requisição PATCH falhar por erro de rede ou timeout (sem resposta em até 5 segundos), THEN THE Sistema_Tour SHALL marcar o tour como completo no armazenamento local do dispositivo e retentar a sincronização automaticamente na próxima requisição bem-sucedida ao backend (qualquer chamada GET ou PATCH que retorne status 2xx).
4. WHEN o perfil do usuário é carregado via `GET /usuarios/me`, THE Servico_Tour_Backend SHALL retornar o array Tours_Completos no payload de resposta.
5. IF a requisição PATCH for recebida com um Tour_ID que não corresponde a nenhum tour cadastrado no sistema, THEN THE Servico_Tour_Backend SHALL rejeitar a requisição com erro indicando que o Tour_ID é inválido, sem modificar o array Tours_Completos do usuário.

### Requirement 6: Hook customizado useTour

**User Story:** Como um desenvolvedor, eu quero um hook reutilizável para gerenciar tours, para que eu possa adicionar novos tours facilmente sem duplicar lógica.

#### Acceptance Criteria

1. THE Hook_useTour SHALL aceitar um Tour_ID e um array de Steps como parâmetros e retornar um objeto contendo: flag booleana indicando se o tour está ativo, o array de steps, o índice numérico do step atual (iniciando em 0), e uma função de callback compatível com o parâmetro `callback` do react-joyride.
2. WHEN o Hook_useTour é inicializado e os dados do usuário ainda não foram carregados, THE Hook_useTour SHALL manter o tour inativo (não iniciar automaticamente) até que o array Tours_Completos esteja disponível.
3. WHEN o Hook_useTour é inicializado e os dados do usuário estão disponíveis e o Tour_ID não está presente no array Tours_Completos, THE Hook_useTour SHALL ativar o tour automaticamente a partir do primeiro step.
4. THE Hook_useTour SHALL expor funções para: iniciar o tour (definir ativo como true e step atual como 0), avançar para o próximo step, retroceder para o step anterior, e encerrar o tour (definir ativo como false).
5. WHEN o callback do react-joyride recebe um evento com status FINISHED ou SKIPPED, THE Hook_useTour SHALL encerrar o tour e invocar a chamada de persistência ao Servico_Tour_Backend com o Tour_ID correspondente.
6. IF o Tour_ID já está presente no array Tours_Completos quando o hook é inicializado, THEN THE Hook_useTour SHALL manter o tour inativo sem invocar persistência ao backend.

### Requirement 7: Tours contextuais por página

**User Story:** Como um usuário, eu quero tours específicos para cada seção do app, para que as instruções sejam relevantes ao contexto que estou visualizando.

#### Acceptance Criteria

1. THE Sistema_Tour SHALL disponibilizar um tour para a página Dashboard (tour-dashboard) com steps cobrindo: boas-vindas ao app, lista de grupos do usuário, e botão de criar novo grupo.
2. THE Sistema_Tour SHALL disponibilizar um tour para a página Grupo (tour-grupo) com steps cobrindo: link/botão de convidar amigos, seção de jogos da rodada atual, e navegação entre rodadas.
3. THE Sistema_Tour SHALL disponibilizar um tour para a página Palpites (tour-palpites) com steps cobrindo: como escolher placar de um jogo, como ativar o palpite dobrado, e como salvar palpites.
4. THE Sistema_Tour SHALL disponibilizar um tour para a página Ranking (tour-ranking) with steps cobrindo: posição do usuário no ranking, tabela de pontuação, e filtro por fase.
5. WHEN um novo tour é adicionado ao sistema, THE Sistema_Tour SHALL operar independentemente dos tours existentes sem necessidade de resetar dados de outros tours.
6. THE Sistema_Tour SHALL utilizar atributos `data-tour` nos elementos-alvo de cada step para referenciá-los de forma estável, independente de mudanças de estilo ou estrutura do DOM.

### Requirement 8: Estilização dos tooltips com design system

**User Story:** Como um usuário, eu quero que o tour tenha aparência visual coerente com o app, para que a experiência seja imersiva e profissional.

#### Acceptance Criteria

1. THE Sistema_Tour SHALL estilizar o container dos tooltips do tour usando o padrão glassmorphism do design system (bg-white/[0.04], backdrop-blur-2xl, border border-white/[0.12], rounded-2xl, shadow-[0_4px_24px_rgba(0,0,0,0.3)]).
2. THE Sistema_Tour SHALL usar a cor primária do design system nos botões de ação do tour (fundo primária para botão principal, borda primária para botão secundário), e a cor texto (#f1f5f9) para títulos e corpo do tooltip.
3. THE Sistema_Tour SHALL usar tipografia consistente com o design system (font-semibold para títulos, text-sm para corpo, text-texto para cor do texto).
4. THE Sistema_Tour SHALL garantir que todo texto dentro dos tooltips atinja ratio de contraste mínimo de 4.5:1 (texto normal) e 3:1 (texto grande, acima de 18px) conforme WCAG 2.1 AA, em relação ao fundo do tooltip.
5. THE Sistema_Tour SHALL renderizar um overlay escurecido por trás do tooltip com opacidade mínima de 50% (bg-black/50 ou superior) para destacar o elemento alvo e garantir separação visual entre o tooltip e o conteúdo de fundo.
