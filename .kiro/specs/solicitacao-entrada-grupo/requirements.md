# Requirements Document

## Introduction

Este documento define os requisitos para a funcionalidade de solicitação de entrada em grupo com aprovação do administrador no aplicativo Bolão. Atualmente, usuários entram em grupos apenas via código de convite. A nova funcionalidade permite que usuários não-membros pesquisem grupos públicos, enviem solicitações de entrada, e aguardem aprovação ou rejeição por parte do administrador do grupo.

## Glossary

- **Sistema_Frontend**: A aplicação frontend Next.js do Bolão que gerencia a interface do usuário
- **Solicitante**: Usuário autenticado que não é membro de um grupo e deseja entrar nele
- **Admin_Grupo**: Usuário com role ADMIN dentro de um grupo específico
- **Solicitacao**: Pedido de entrada em um grupo, contendo status (PENDENTE, APROVADA, REJEITADA)
- **Grupo_Publico**: Grupo com a propriedade `privado` definida como `false`
- **Lista_Solicitacoes**: Tela acessível ao Admin_Grupo que exibe todas as solicitações pendentes
- **Card_Grupo_Pesquisa**: Componente de card exibido nos resultados de pesquisa de grupos

## Requirements

### Requirement 1: Pesquisa de Grupos Públicos

**User Story:** Como Solicitante, eu quero pesquisar grupos públicos disponíveis, para que eu possa encontrar grupos do meu interesse e solicitar entrada.

#### Acceptance Criteria

1. WHEN o Solicitante acessar a tela de grupos, THE Sistema_Frontend SHALL exibir uma opção de pesquisa de grupos públicos
2. WHEN o Solicitante digitar um termo de busca com pelo menos 3 caracteres, THE Sistema_Frontend SHALL exibir uma lista de grupos públicos cujo nome contenha o termo pesquisado
3. THE Sistema_Frontend SHALL exibir cada resultado de pesquisa como um Card_Grupo_Pesquisa contendo nome do grupo, quantidade de membros e indicador de grupo público
4. WHILE o Solicitante não for membro de um grupo exibido nos resultados, THE Sistema_Frontend SHALL ocultar detalhes internos do grupo (ranking, atividade, membros, código de convite)
5. IF a pesquisa não retornar resultados, THEN THE Sistema_Frontend SHALL exibir uma mensagem informando que nenhum grupo foi encontrado

### Requirement 2: Envio de Solicitação de Entrada

**User Story:** Como Solicitante, eu quero enviar um pedido de entrada em um grupo, para que o administrador possa avaliar e aprovar minha participação.

#### Acceptance Criteria

1. WHEN o Solicitante visualizar um Card_Grupo_Pesquisa de um grupo do qual não é membro, THE Sistema_Frontend SHALL exibir um botão "Solicitar Entrada"
2. WHEN o Solicitante clicar no botão "Solicitar Entrada", THE Sistema_Frontend SHALL enviar a Solicitacao para a API e exibir feedback visual de carregamento
3. WHEN a API confirmar o envio da Solicitacao, THE Sistema_Frontend SHALL exibir uma mensagem de sucesso e alterar o estado do botão para "Solicitação Enviada" (desabilitado)
4. WHILE uma Solicitacao do Solicitante para um grupo específico estiver com status PENDENTE, THE Sistema_Frontend SHALL exibir o botão no estado "Solicitação Enviada" (desabilitado) ao invés de "Solicitar Entrada"
5. IF o envio da Solicitacao falhar, THEN THE Sistema_Frontend SHALL exibir uma mensagem de erro descritiva e manter o botão "Solicitar Entrada" habilitado
6. WHILE uma Solicitacao do Solicitante para um grupo específico tiver sido REJEITADA, THE Sistema_Frontend SHALL permitir o reenvio de uma nova Solicitacao

### Requirement 3: Visualização de Solicitações Pendentes pelo Admin

**User Story:** Como Admin_Grupo, eu quero visualizar todas as solicitações de entrada pendentes no meu grupo, para que eu possa avaliar e decidir sobre cada uma.

#### Acceptance Criteria

1. WHEN o Admin_Grupo acessar a página de configurações do grupo, THE Sistema_Frontend SHALL exibir uma seção "Solicitações Pendentes" com a contagem de solicitações aguardando aprovação
2. WHEN existirem solicitações pendentes, THE Sistema_Frontend SHALL exibir um badge numérico indicando a quantidade na seção de configurações
3. THE Sistema_Frontend SHALL exibir cada Solicitacao pendente com o nome do Solicitante, email e data do envio
4. IF não existirem solicitações pendentes, THEN THE Sistema_Frontend SHALL exibir uma mensagem informando que não há solicitações no momento

### Requirement 4: Aprovação de Solicitação pelo Admin

**User Story:** Como Admin_Grupo, eu quero aprovar solicitações de entrada, para que novos membros possam participar do grupo.

#### Acceptance Criteria

1. WHEN o Admin_Grupo clicar no botão "Aprovar" de uma Solicitacao, THE Sistema_Frontend SHALL enviar a aprovação para a API e exibir feedback de carregamento
2. WHEN a API confirmar a aprovação, THE Sistema_Frontend SHALL remover a Solicitacao da lista de pendentes e atualizar a contagem de membros do grupo
3. IF a aprovação falhar porque o grupo atingiu o limite máximo de participantes, THEN THE Sistema_Frontend SHALL exibir uma mensagem informando que o grupo está cheio
4. IF a aprovação falhar por outro motivo, THEN THE Sistema_Frontend SHALL exibir uma mensagem de erro descritiva

### Requirement 5: Rejeição de Solicitação pelo Admin

**User Story:** Como Admin_Grupo, eu quero rejeitar solicitações de entrada, para que eu possa controlar quem participa do grupo.

#### Acceptance Criteria

1. WHEN o Admin_Grupo clicar no botão "Rejeitar" de uma Solicitacao, THE Sistema_Frontend SHALL exibir um modal de confirmação antes de processar a rejeição
2. WHEN o Admin_Grupo confirmar a rejeição, THE Sistema_Frontend SHALL enviar a rejeição para a API e exibir feedback de carregamento
3. WHEN a API confirmar a rejeição, THE Sistema_Frontend SHALL remover a Solicitacao da lista de pendentes
4. IF a rejeição falhar, THEN THE Sistema_Frontend SHALL exibir uma mensagem de erro descritiva

### Requirement 6: Notificação de Resposta ao Solicitante

**User Story:** Como Solicitante, eu quero ser informado sobre a decisão do administrador, para que eu saiba se fui aceito ou não no grupo.

#### Acceptance Criteria

1. WHEN a Solicitacao do Solicitante for aprovada, THE Sistema_Frontend SHALL exibir o grupo na lista "Meus Grupos" do Solicitante
2. WHEN a Solicitacao do Solicitante for rejeitada, THE Sistema_Frontend SHALL atualizar o estado do Card_Grupo_Pesquisa para indicar que a solicitação foi rejeitada
3. WHEN o Solicitante acessar a tela de grupos, THE Sistema_Frontend SHALL refletir o status atualizado de todas as suas solicitações (aprovadas ou rejeitadas)

### Requirement 7: Listagem de Minhas Solicitações

**User Story:** Como Solicitante, eu quero ver o status das minhas solicitações enviadas, para que eu possa acompanhar quais foram aprovadas, rejeitadas ou ainda estão pendentes.

#### Acceptance Criteria

1. WHEN o Solicitante acessar a seção "Minhas Solicitações", THE Sistema_Frontend SHALL exibir uma lista de todas as solicitações enviadas com seus respectivos status (PENDENTE, APROVADA, REJEITADA)
2. THE Sistema_Frontend SHALL exibir cada solicitação com o nome do grupo, data de envio e status atual
3. WHEN uma solicitação estiver com status REJEITADA, THE Sistema_Frontend SHALL exibir um botão "Solicitar Novamente" ao lado da solicitação
4. WHEN o Solicitante clicar em "Solicitar Novamente", THE Sistema_Frontend SHALL criar uma nova Solicitacao e atualizar o status para PENDENTE
