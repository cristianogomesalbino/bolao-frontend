# Requirements Document

## Introduction

Implementação do campo `dataInicioContagem` no módulo de Grupos, permitindo que o admin configure a partir de qual data os pontos do ranking serão contabilizados. Quando definido, jogos finalizados com `dataHora` anterior à `dataInicioContagem` são excluídos do cálculo de ranking. Quando não definido (null), o comportamento atual é preservado — todos os jogos finalizados contam.

A feature abrange backend (Prisma schema, DTOs, Ranking Service, Repository, Presenter, Testes, Postman) e frontend (formulários de criação/edição de grupo, exibição nas configurações).

## Glossary

- **Sistema**: A aplicação Bolão (backend NestJS + frontend Next.js)
- **Grupo**: Entidade que representa um bolão de apostas vinculado a uma temporada de campeonato
- **Admin_do_Grupo**: Usuário com role ADMIN dentro de um grupo específico
- **Ranking_Service**: Serviço responsável pelo cálculo on-the-fly de pontuação e ranking dos membros
- **dataInicioContagem**: Campo DateTime opcional no model Grupo que define a data de corte para contabilização de pontos no ranking
- **Jogo_Finalizado**: Jogo com status FINALIZADO e placar definido
- **GrupoPresenter**: Classe responsável por transformar dados do Grupo para resposta HTTP
- **CreateGrupoDto**: DTO de validação para criação de grupo
- **UpdateGrupoDto**: DTO de validação para atualização de grupo
- **Formulario_Criar_Grupo**: Componente frontend do formulário de criação de grupo
- **Formulario_Editar_Grupo**: Componente frontend do formulário de edição de grupo

## Requirements

### Requirement 1: Persistência do campo dataInicioContagem

**User Story:** Como admin de um grupo, quero que o campo dataInicioContagem seja armazenado no banco de dados, para que a configuração de data de corte do ranking seja persistida.

#### Acceptance Criteria

1. THE Sistema SHALL armazenar o campo dataInicioContagem como DateTime nullable no model Grupo do Prisma schema, com valor padrão null
2. WHEN o campo dataInicioContagem não é enviado no body da requisição de criação do grupo, THE Sistema SHALL persistir o valor como null
3. WHEN o campo dataInicioContagem é enviado como null no body da requisição de criação ou atualização do grupo, THE Sistema SHALL persistir o valor como null
4. WHEN o campo dataInicioContagem é enviado com uma data válida no formato ISO 8601 (ex: "2025-03-01T00:00:00.000Z") na criação ou atualização do grupo, THE Sistema SHALL persistir o valor como DateTime no banco de dados
5. WHEN o campo dataInicioContagem não é enviado no body da requisição de atualização do grupo, THE Sistema SHALL manter o valor atual sem alteração

### Requirement 2: Validação do campo nos DTOs

**User Story:** Como admin de um grupo, quero poder definir ou alterar a dataInicioContagem na criação ou edição do grupo, para que eu tenha flexibilidade de configurar quando os pontos começam a contar.

#### Acceptance Criteria

1. THE CriarGrupoDto SHALL aceitar o campo dataInicioContagem como opcional, decorado com @IsOptional e @IsDateString, validando formato ISO 8601 (exemplo: "2025-06-01T00:00:00.000Z")
2. THE UpdateGrupoDto SHALL aceitar o campo dataInicioContagem como opcional, decorado com @IsOptional e @IsDateString, validando formato ISO 8601 (exemplo: "2025-06-01T00:00:00.000Z")
3. IF o campo dataInicioContagem é enviado com valor que não corresponde ao formato ISO 8601 (ex: "01/06/2025", "abc", número), THEN THE Sistema SHALL retornar erro de validação no formato padrão do projeto com campo "dataInicioContagem" e mensagem em português indicando que deve ser uma data válida no formato ISO 8601
4. WHEN o campo dataInicioContagem não é enviado no body de criação, THE Sistema SHALL persistir o grupo com dataInicioContagem igual a null
5. WHEN o campo dataInicioContagem não é enviado no body de atualização, THE Sistema SHALL manter o valor atual do campo sem alteração
6. WHEN o campo dataInicioContagem é enviado como null no body de atualização, THE Sistema SHALL atualizar o valor para null (removendo a data de corte configurada anteriormente)

### Requirement 3: Filtragem de jogos no cálculo de ranking

**User Story:** Como admin de um grupo, quero que o ranking considere apenas jogos a partir da data configurada, para que eu possa iniciar a contagem de pontos em uma data específica da temporada.

#### Acceptance Criteria

1. WHILE o campo dataInicioContagem do grupo é null, THE Ranking_Service SHALL considerar todos os jogos finalizados no cálculo de ranking sem aplicar filtro de data
2. WHILE o campo dataInicioContagem do grupo possui um valor definido, THE Ranking_Service SHALL excluir do cálculo de pontuação todos os jogos finalizados cuja dataHora seja estritamente anterior (comparação DateTime com precisão de milissegundos) à dataInicioContagem, de modo que palpites desses jogos não gerem pontos no ranking
3. WHEN um jogo finalizado possui dataHora igual ou posterior à dataInicioContagem (comparação >=), THE Ranking_Service SHALL incluir o jogo no cálculo de ranking e pontuar os palpites normalmente (acerto em cheio: 3pts, acerto de resultado: 1pt, erro: 0pts, multiplicado por 2 se palpite dobrado)
4. IF um jogo finalizado possui dataHora null (jogo adiado finalizado sem data definida) e o grupo possui dataInicioContagem definido, THEN THE Ranking_Service SHALL incluir o jogo no cálculo de ranking independentemente do valor de dataInicioContagem
5. THE Ranking_Service SHALL aplicar o filtro de dataInicioContagem nos métodos obterRankingFase e obterRankingGeral, mas não no método obterDetalhamentoJogo (que exibe pontuação de um jogo específico independentemente do filtro)
6. THE Ranking_Service SHALL aplicar o filtro de dataInicioContagem em fases do tipo PONTOS_CORRIDOS e MATA_MATA de forma idêntica
7. WHEN o admin altera o valor de dataInicioContagem do grupo, THE Ranking_Service SHALL refletir o novo filtro na próxima consulta de ranking sem necessidade de reprocessamento (cálculo on-the-fly)

### Requirement 4: Repositório retorna o campo dataInicioContagem

**User Story:** Como desenvolvedor, quero que o repositório de Grupo retorne o campo dataInicioContagem nas consultas, para que os services possam utilizá-lo na lógica de negócio.

#### Acceptance Criteria

1. THE interface GrupoRepository SHALL incluir o campo dataInicioContagem do tipo Date | null no parâmetro data do método criar
2. THE interface GrupoRepository SHALL incluir o campo dataInicioContagem do tipo Date | null no tipo Partial do parâmetro data do método atualizar
3. THE implementação PrismaGrupoRepository SHALL persistir e retornar o campo dataInicioContagem nos métodos criar, buscarPorId, buscarPorIdSimples e atualizar, delegando ao Prisma Client sem transformação adicional
4. THE implementação InMemoryGrupoRepository SHALL armazenar o campo dataInicioContagem com valor null quando não informado na criação, e retorná-lo nos métodos buscarPorId, buscarPorIdSimples e atualizar
5. WHEN o método atualizar recebe dataInicioContagem com valor null, THE Sistema SHALL persistir null substituindo qualquer valor anterior
6. WHEN o método atualizar não recebe o campo dataInicioContagem no objeto data, THE Sistema SHALL manter o valor existente sem alteração

### Requirement 5: Exposição do campo na API via Presenter

**User Story:** Como frontend, quero receber o campo dataInicioContagem na resposta da API ao buscar dados do grupo, para que eu possa exibir e editar a configuração.

#### Acceptance Criteria

1. THE GrupoPresenter SHALL incluir o campo dataInicioContagem como string ISO 8601 ou null no retorno do método toHttp
2. THE GrupoPresenter SHALL incluir o campo dataInicioContagem como string ISO 8601 ou null no retorno do método toHttpMembro
3. THE GrupoPresenter SHALL incluir o campo dataInicioContagem como string ISO 8601 ou null no retorno do método toHttpAdmin
4. WHEN o campo dataInicioContagem do grupo é null, THE GrupoPresenter SHALL retornar o campo dataInicioContagem com valor null em todos os métodos que o expõem
5. THE GrupoPresenter SHALL NOT incluir o campo dataInicioContagem no método toHttpBasico

### Requirement 6: Formulário de criação de grupo no frontend

**User Story:** Como admin, quero poder definir a data de início da contagem ao criar um grupo, para que o ranking já comece a contar a partir da data desejada.

#### Acceptance Criteria

1. THE Formulario_Criar_Grupo SHALL exibir um campo de data opcional rotulado "Data de início da contagem" na seção de configurações avançadas, com placeholder no formato dd/mm/aaaa
2. WHEN o admin não preenche o campo dataInicioContagem e submete o formulário, THE Formulario_Criar_Grupo SHALL enviar a requisição sem o campo dataInicioContagem no payload (comportamento padrão: ranking considera todos os jogos)
3. WHEN o admin preenche o campo dataInicioContagem com uma data válida e submete o formulário, THE Formulario_Criar_Grupo SHALL enviar o valor no formato ISO 8601 date-only (YYYY-MM-DD) no campo dataInicioContagem do payload de criação
4. IF o admin preenche o campo dataInicioContagem com uma data futura (posterior à data atual), THEN THE Formulario_Criar_Grupo SHALL exibir mensagem de erro de validação abaixo do campo e impedir o envio do formulário
5. THE Formulario_Criar_Grupo SHALL restringir o campo dataInicioContagem para aceitar apenas datas entre 01/01/2020 e a data atual (inclusive)

### Requirement 7: Formulário de edição de grupo no frontend

**User Story:** Como admin, quero poder alterar a data de início da contagem nas configurações do grupo, para que eu possa ajustar quando os pontos começam a contar mesmo após a criação.

#### Acceptance Criteria

1. THE Formulario_Editar_Grupo SHALL exibir um campo de seleção de data do tipo date input com label "Data de início da contagem", preenchido com o valor atual do grupo no formato dd/MM/yyyy, ou vazio quando o valor atual for null
2. WHEN o admin seleciona uma nova data no campo dataInicioContagem e submete o formulário, THE Formulario_Editar_Grupo SHALL enviar o valor no formato ISO 8601 (YYYY-MM-DD) no payload da requisição PATCH de atualização do grupo
3. WHEN o admin limpa o campo dataInicioContagem (removendo a data selecionada) e submete o formulário, THE Formulario_Editar_Grupo SHALL enviar o valor null no campo dataInicioContagem para restaurar o comportamento padrão (contar todos os jogos)
4. THE Formulario_Editar_Grupo SHALL exibir, abaixo do campo dataInicioContagem, um texto auxiliar informando que jogos finalizados antes da data selecionada não serão contabilizados no ranking do grupo
5. IF a requisição de atualização falha, THEN THE Formulario_Editar_Grupo SHALL exibir uma mensagem de erro no topo do formulário indicando a falha na atualização, preservando os valores preenchidos pelo admin no formulário

### Requirement 8: Testes unitários

**User Story:** Como desenvolvedor, quero que os cenários de dataInicioContagem estejam cobertos por testes, para garantir que a lógica de filtragem funciona corretamente.

#### Acceptance Criteria

1. THE Sistema SHALL ter teste do Ranking_Service (instanciação direta com InMemory repositories) que verifica: dado um grupo com dataInicioContagem definido e 2 jogos finalizados (um com dataHora anterior e outro com dataHora posterior à dataInicioContagem), o ranking retornado por obterRankingFase e obterRankingGeral SHALL contabilizar pontos apenas do jogo com dataHora posterior
2. THE Sistema SHALL ter teste do Ranking_Service que verifica: dado um grupo com dataInicioContagem null e jogos finalizados, o ranking retornado SHALL contabilizar pontos de todos os jogos finalizados independentemente de suas datas
3. THE Sistema SHALL ter teste do Ranking_Service que verifica: dado um grupo com dataInicioContagem definido e um jogo finalizado com dataHora null (jogo adiado finalizado sem data), o ranking SHALL incluir esse jogo no cálculo de pontos
4. THE Sistema SHALL ter teste do Ranking_Service que verifica: dado um grupo com dataInicioContagem definido e um jogo finalizado com dataHora exatamente igual à dataInicioContagem, o ranking SHALL incluir esse jogo no cálculo de pontos (condição de fronteira: igual é incluído)
5. THE Sistema SHALL ter teste do controller de Grupos (instanciação direta com mock service) que verifica: quando o DTO de criação ou atualização contém o campo dataInicioContagem, o controller SHALL repassar o campo ao service sem alteração

### Requirement 9: Documentação Postman

**User Story:** Como desenvolvedor, quero que a collection do Postman reflita o novo campo, para que eu possa testar os endpoints manualmente.

#### Acceptance Criteria

1. THE Sistema SHALL incluir o campo "dataInicioContagem" no body de exemplo (propriedade "raw") do endpoint "Criar Grupo" (método POST, path /grupos) dentro da folder "Grupos" no arquivo postman_collection.json, com valor de exemplo no formato ISO 8601 (ex: "2025-03-01T00:00:00.000Z")
2. THE Sistema SHALL incluir o campo "dataInicioContagem" no body de exemplo (propriedade "raw") do endpoint "Atualizar Grupo" (método PATCH, path /grupos/{{grupoId}}) dentro da folder "Grupos" no arquivo postman_collection.json, com valor de exemplo no formato ISO 8601 (ex: "2025-03-01T00:00:00.000Z")
3. WHEN o arquivo postman_collection.json for importado no Postman, THE Sistema SHALL manter a estrutura válida no formato Postman Collection v2.1 sem erros de parsing
