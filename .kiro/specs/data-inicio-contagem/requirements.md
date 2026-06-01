# Requirements Document

## Introduction

Implementação do campo `dataInicioContagem` no módulo de Grupos, permitindo que o admin configure a partir de qual rodada/fase os pontos do ranking serão contabilizados. O admin seleciona uma opção de um dropdown (rodada ou fase), e o sistema calcula automaticamente a `dataHora` do primeiro jogo dessa rodada/fase, persistindo como `dataInicioContagem` (DateTime nullable).

Quando definido, jogos finalizados com `dataHora` anterior à `dataInicioContagem` são excluídos do cálculo de ranking. Quando não definido (null), o comportamento atual é preservado — todos os jogos finalizados contam.

A feature abrange backend (Prisma schema, novo endpoint de opções, lógica de resolução, DTOs, Ranking Service, Repository, Presenter, Testes) e frontend (dropdowns nos formulários de criação/edição de grupo).

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
- **OpcaoInicioContagem**: Objeto que representa uma opção selecionável no dropdown (label + tipo + faseId + rodada)
- **Resolução**: Processo de converter a seleção do dropdown (tipo + faseId + rodada) em um DateTime concreto (MIN(dataHora) dos jogos daquela combinação)
- **Temporada**: Entidade pai que agrupa fases e está vinculada a um campeonato

## Requirements

### Requirement 1: Persistência do campo dataInicioContagem

**User Story:** Como admin de um grupo, quero que o campo dataInicioContagem seja armazenado no banco de dados, para que a configuração de data de corte do ranking seja persistida.

#### Acceptance Criteria

1. THE Sistema SHALL armazenar o campo dataInicioContagem como DateTime nullable no model Grupo do Prisma schema, com valor padrão null
2. WHEN o campo dataInicioContagem não é definido na criação do grupo, THE Sistema SHALL persistir o valor como null
3. WHEN o campo dataInicioContagem é definido como null na criação ou atualização do grupo, THE Sistema SHALL persistir o valor como null
4. WHEN o sistema resolve uma seleção de rodada/fase para uma data válida na criação ou atualização do grupo, THE Sistema SHALL persistir o valor DateTime resultante no campo dataInicioContagem
5. WHEN o campo dataInicioContagem não é enviado no body da requisição de atualização do grupo, THE Sistema SHALL manter o valor atual sem alteração

### Requirement 2: Validação do payload de seleção nos DTOs

**User Story:** Como admin de um grupo, quero poder selecionar uma rodada/fase no dropdown para configurar o início da contagem, para que o sistema calcule automaticamente a data de corte.

#### Acceptance Criteria

1. THE CriarGrupoDto SHALL aceitar um campo opcional `inicioContagem` como objeto com propriedades: `tipo` (enum: "RODADA" | "FASE"), `faseId` (UUID), e `rodada` (número inteiro opcional, obrigatório quando tipo = "RODADA")
2. THE UpdateGrupoDto SHALL aceitar um campo opcional `inicioContagem` como objeto (mesma estrutura do CriarGrupoDto) ou null (para remover a configuração)
3. IF o campo `inicioContagem` é enviado com `tipo` = "RODADA" sem o campo `rodada`, THEN THE Sistema SHALL retornar erro de validação com mensagem em português indicando que o campo rodada é obrigatório para tipo RODADA
4. IF o campo `inicioContagem` é enviado com `faseId` que não corresponde a um UUID válido, THEN THE Sistema SHALL retornar erro de validação com mensagem em português
5. WHEN o campo `inicioContagem` não é enviado no body de criação, THE Sistema SHALL persistir o grupo com dataInicioContagem igual a null
6. WHEN o campo `inicioContagem` não é enviado no body de atualização, THE Sistema SHALL manter o valor atual do campo sem alteração
7. WHEN o campo `inicioContagem` é enviado como null no body de atualização, THE Sistema SHALL atualizar o valor de dataInicioContagem para null (removendo a data de corte configurada anteriormente)

### Requirement 3: Filtragem de jogos no cálculo de ranking

**User Story:** Como admin de um grupo, quero que o ranking considere apenas jogos a partir da data configurada, para que eu possa iniciar a contagem de pontos em uma rodada/fase específica da temporada.

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

**User Story:** Como frontend, quero receber o campo dataInicioContagem e metadados da seleção na resposta da API ao buscar dados do grupo, para que eu possa exibir e editar a configuração.

#### Acceptance Criteria

1. THE GrupoPresenter SHALL incluir o campo dataInicioContagem como string ISO 8601 ou null no retorno do método toHttp
2. THE GrupoPresenter SHALL incluir o campo dataInicioContagem como string ISO 8601 ou null no retorno do método toHttpMembro
3. THE GrupoPresenter SHALL incluir o campo dataInicioContagem como string ISO 8601 ou null no retorno do método toHttpAdmin
4. WHEN o campo dataInicioContagem do grupo é null, THE GrupoPresenter SHALL retornar o campo dataInicioContagem com valor null em todos os métodos que o expõem
5. THE GrupoPresenter SHALL NOT incluir o campo dataInicioContagem no método toHttpBasico

### Requirement 6: Formulário de criação de grupo no frontend (dropdown)

**User Story:** Como admin, quero poder selecionar a rodada/fase de início da contagem em um dropdown ao criar um grupo, para que o ranking já comece a contar a partir da rodada desejada.

#### Acceptance Criteria

1. THE Formulario_Criar_Grupo SHALL exibir um campo select/dropdown rotulado "Início da contagem de pontos" na seção de configurações avançadas, com as opções carregadas dinamicamente via endpoint de opções da temporada selecionada
2. WHEN o admin seleciona uma temporada no formulário de criação, THE Formulario_Criar_Grupo SHALL buscar as opções de início de contagem para aquela temporada via `GET /temporadas/:temporadaId/opcoes-inicio-contagem` e popular o dropdown
3. THE Formulario_Criar_Grupo SHALL exibir como primeira opção do dropdown o label "Todas as rodadas" representando o valor null (sem filtro de data)
4. WHEN o admin mantém a opção "Todas as rodadas" selecionada e submete o formulário, THE Formulario_Criar_Grupo SHALL enviar a requisição sem o campo `inicioContagem` no payload (comportamento padrão: ranking considera todos os jogos)
5. WHEN o admin seleciona uma opção específica (rodada ou fase) e submete o formulário, THE Formulario_Criar_Grupo SHALL enviar o campo `inicioContagem` no payload com a estrutura `{ tipo, faseId, rodada? }` correspondente à opção selecionada
6. WHILE as opções estão sendo carregadas (loading), THE Formulario_Criar_Grupo SHALL exibir o dropdown desabilitado com placeholder "Carregando opções..."
7. IF a requisição de opções falha, THEN THE Formulario_Criar_Grupo SHALL exibir mensagem de erro abaixo do dropdown e manter o campo desabilitado

### Requirement 7: Formulário de edição de grupo no frontend (dropdown)

**User Story:** Como admin, quero poder alterar a rodada/fase de início da contagem nas configurações do grupo, para que eu possa ajustar quando os pontos começam a contar mesmo após a criação.

#### Acceptance Criteria

1. THE Formulario_Editar_Grupo SHALL exibir um campo select/dropdown com label "Início da contagem de pontos", com as opções carregadas dinamicamente via endpoint de opções da temporada do grupo
2. THE Formulario_Editar_Grupo SHALL pré-selecionar a opção correspondente ao valor atual de dataInicioContagem do grupo, ou "Todas as rodadas" quando o valor atual for null
3. WHEN o admin seleciona uma nova opção no dropdown e submete o formulário, THE Formulario_Editar_Grupo SHALL enviar o campo `inicioContagem` com a estrutura `{ tipo, faseId, rodada? }` no payload da requisição PATCH de atualização do grupo
4. WHEN o admin seleciona "Todas as rodadas" e submete o formulário, THE Formulario_Editar_Grupo SHALL enviar o campo `inicioContagem` com valor null no payload para restaurar o comportamento padrão (contar todos os jogos)
5. THE Formulario_Editar_Grupo SHALL exibir, abaixo do dropdown, um texto auxiliar informando que jogos finalizados antes da rodada/fase selecionada não serão contabilizados no ranking do grupo
6. IF a requisição de atualização falha, THEN THE Formulario_Editar_Grupo SHALL exibir uma mensagem de erro no topo do formulário indicando a falha na atualização, preservando a seleção feita pelo admin

### Requirement 8: Testes unitários e de propriedade

**User Story:** Como desenvolvedor, quero que os cenários de dataInicioContagem estejam cobertos por testes, para garantir que a lógica de filtragem e resolução funciona corretamente.

#### Acceptance Criteria

1. THE Sistema SHALL ter teste do Ranking_Service (instanciação direta com InMemory repositories) que verifica: dado um grupo com dataInicioContagem definido e 2 jogos finalizados (um com dataHora anterior e outro com dataHora posterior à dataInicioContagem), o ranking retornado por obterRankingFase e obterRankingGeral SHALL contabilizar pontos apenas do jogo com dataHora posterior
2. THE Sistema SHALL ter teste do Ranking_Service que verifica: dado um grupo com dataInicioContagem null e jogos finalizados, o ranking retornado SHALL contabilizar pontos de todos os jogos finalizados independentemente de suas datas
3. THE Sistema SHALL ter teste do Ranking_Service que verifica: dado um grupo com dataInicioContagem definido e um jogo finalizado com dataHora null (jogo adiado finalizado sem data), o ranking SHALL incluir esse jogo no cálculo de pontos
4. THE Sistema SHALL ter teste do Ranking_Service que verifica: dado um grupo com dataInicioContagem definido e um jogo finalizado com dataHora exatamente igual à dataInicioContagem, o ranking SHALL incluir esse jogo no cálculo de pontos (condição de fronteira: igual é incluído)
5. THE Sistema SHALL ter teste do InicioContagemService que verifica: dado um faseId e rodada com jogos existentes, o service SHALL retornar a menor dataHora (MIN) dos jogos daquela combinação
6. THE Sistema SHALL ter teste do InicioContagemService que verifica: dado um faseId e rodada sem jogos ou com jogos sem dataHora, o service SHALL retornar null
7. THE Sistema SHALL ter teste do endpoint de opções que verifica: dado uma temporada do Brasileirão com 1 fase PONTOS_CORRIDOS, o endpoint SHALL retornar "Todas as rodadas" + opções de "Rodada 2" até "Rodada 38"
8. THE Sistema SHALL ter teste do endpoint de opções que verifica: dado uma temporada da Copa do Mundo com múltiplas fases, o endpoint SHALL retornar opções agrupadas por fase (rodadas de grupos + fases eliminatórias)

### Requirement 9: Documentação Postman

**User Story:** Como desenvolvedor, quero que a collection do Postman reflita os novos campos e endpoints, para que eu possa testar manualmente.

#### Acceptance Criteria

1. THE Sistema SHALL incluir o campo "inicioContagem" no body de exemplo do endpoint "Criar Grupo" (POST /grupos) com valor de exemplo `{ "tipo": "RODADA", "faseId": "uuid", "rodada": 5 }`
2. THE Sistema SHALL incluir o campo "inicioContagem" no body de exemplo do endpoint "Atualizar Grupo" (PATCH /grupos/{{grupoId}}) com valor de exemplo `{ "tipo": "FASE", "faseId": "uuid" }`
3. THE Sistema SHALL incluir o endpoint "Opções de Início de Contagem" (GET /temporadas/{{temporadaId}}/opcoes-inicio-contagem) na folder "Temporadas" do arquivo postman_collection.json
4. WHEN o arquivo postman_collection.json for importado no Postman, THE Sistema SHALL manter a estrutura válida no formato Postman Collection v2.1 sem erros de parsing

### Requirement 10: Endpoint de opções de início de contagem por temporada

**User Story:** Como frontend, quero um endpoint que retorne as opções disponíveis de início de contagem para uma temporada, para que o dropdown seja populado dinamicamente.

#### Acceptance Criteria

1. THE Sistema SHALL expor o endpoint `GET /temporadas/:temporadaId/opcoes-inicio-contagem` que retorna um array de opções de início de contagem
2. WHEN a temporada possui uma única fase do tipo PONTOS_CORRIDOS com N rodadas (ex: Brasileirão, 38 rodadas), THE endpoint SHALL retornar: primeira opção `{ "label": "Todas as rodadas", "valor": null }`, seguida de opções `{ "label": "Rodada X", "tipo": "RODADA", "faseId": "<uuid>", "rodada": X }` para X de 2 até N
3. WHEN a temporada possui múltiplas fases PONTOS_CORRIDOS (grupos da Copa) e fases MATA_MATA, THE endpoint SHALL retornar: primeira opção `{ "label": "Todas as rodadas", "valor": null }`, seguida de opções de rodadas das fases de grupos (`"1ª rodada fase de grupos"`, `"2ª rodada fase de grupos"`, etc.) e opções de fases eliminatórias (`"16 Avos"`, `"Oitavas de Final"`, etc.) usando tipo "FASE"
4. IF a temporadaId não corresponde a uma temporada existente, THEN THE endpoint SHALL retornar 404 Not Found
5. THE endpoint SHALL ser acessível por qualquer usuário autenticado (sem restrição de role)
6. WHEN uma fase do tipo MATA_MATA é retornada como opção, THE endpoint SHALL usar `tipo: "FASE"` e incluir apenas o `faseId`, sem campo `rodada`

### Requirement 11: Lógica de resolução (converter seleção em DateTime)

**User Story:** Como sistema, quero converter a seleção do admin (tipo + faseId + rodada) em uma data concreta, para que o campo dataInicioContagem armazene o DateTime correto.

#### Acceptance Criteria

1. WHEN o admin seleciona uma opção com `tipo: "RODADA"` e `rodada: N`, THE Sistema SHALL buscar todos os jogos da fase informada com rodada = N e calcular MIN(dataHora) como o valor de dataInicioContagem
2. WHEN o admin seleciona uma opção com `tipo: "FASE"` (fase mata-mata), THE Sistema SHALL buscar todos os jogos da fase informada (independente de rodada) e calcular MIN(dataHora) como o valor de dataInicioContagem
3. IF não existem jogos para a combinação faseId + rodada informada, THEN THE Sistema SHALL persistir dataInicioContagem como null e logar um warning indicando que não há jogos disponíveis para a resolução
4. IF todos os jogos da combinação faseId + rodada possuem dataHora null (jogos futuros sem data definida), THEN THE Sistema SHALL persistir dataInicioContagem como null e logar um warning
5. THE lógica de resolução SHALL ser encapsulada em um service dedicado (`InicioContagemService`) que recebe `{ tipo, faseId, rodada? }` e retorna `Date | null`
6. WHEN a faseId informada não corresponde a uma fase existente, THE Sistema SHALL retornar erro 404 (FaseNaoEncontradaError)
7. WHEN a faseId informada não pertence à temporada do grupo, THE Sistema SHALL retornar erro 400 com mensagem indicando que a fase não pertence à temporada do grupo
